// Loads each chart specification from /specs, patches in a few runtime values (latest year, map centroids,
// container width) and wires up the sliders / drop-downs. All data comes from /data (cleaned by tools/prepare_data.py).
(async function () {
  const $ = (id) => document.getElementById(id);
  const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
  const CHARTS = [
    ["map-total", "specs/01-map-total.json"], ["top-total", "specs/02-selected-dumbbell.json"],
    ["global-trend", "specs/03-global-trend.json"], ["waffle", "specs/06-waffle-share.json"],
    ["map-capita", "specs/04-map-per-capita.json"], ["top-capita", "specs/05-violin-per-capita.json"],
    ["map-change", "specs/07-map-change.json"], ["increasers", "specs/08-largest-increases.json"],
    ["reducers", "specs/09-largest-reductions.json"], ["heatmap", "specs/10-country-heatmap.json"],
    ["regions", "specs/11-region-stream.json"], ["cumulative", "specs/12-cumulative.json"],
    ["sector-treemap", "specs/13-sector-treemap.json"], ["connected", "specs/14-connected-scatter.json"],
  ];
  const views = {};
  const getJSON = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + " " + r.status); return r.json(); });

  // ---- facts -> text -------------------------------------------------------------------
  function fillFacts(facts) {
    document.querySelectorAll("[data-fact]").forEach((el) => {
      const v = el.dataset.fact.split(".").reduce((o, k) => (o == null ? o : o[k]), facts);
      if (v == null) { el.textContent = "n/a"; return; }
      if (typeof v !== "number") { el.textContent = v; return; }
      const isYear = /year$/.test(el.dataset.fact);
      let s = isYear ? String(v) : v.toLocaleString("en-AU", { maximumFractionDigits: 1 });
      if (el.dataset.sign) s = (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toLocaleString("en-AU");
      el.textContent = s;
    });
  }

  // ---- map centroids: centre of each country's largest polygon -------------------------
  async function loadCentroids() {
    const topo = await getJSON(TOPO_URL);
    const feats = topojson.feature(topo, topo.objects.countries).features;
    const out = [];
    for (const f of feats) {
      if (f.id == null || !f.geometry) continue;
      const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates]
        : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [];
      let best = null, bestArea = -1;
      for (let p of polys) {
        let a = d3.geoArea({ type: "Polygon", coordinates: p });
        if (a > 2 * Math.PI) { p = p.map((r) => r.slice().reverse()); a = d3.geoArea({ type: "Polygon", coordinates: p }); } // fix winding
        if (a > bestArea) { bestArea = a; best = p; }
      }
      if (!best) continue;
      const c = d3.geoCentroid({ type: "Polygon", coordinates: best });
      out.push({ id: String(f.id).padStart(3, "0"), lon: +c[0].toFixed(2), lat: +c[1].toFixed(2) });
    }
    return out;
  }

  function showError(id, e) {
    console.error(id, e);
    $(id).innerHTML = '<div class="error">This chart could not load (' + String(e.message || e).slice(0, 120) +
      "). Open the page through GitHub Pages or a local web server, not directly as a file.</div>";
  }

  async function draw(id, specUrl, patch) {
    try {
      const spec = await getJSON(specUrl);
      if (patch) patch(spec);
      const el = $(id);
      el.innerHTML = "";
      el.setAttribute("role", "img");
      if (spec.description) el.setAttribute("aria-label", spec.description);
      const res = await vegaEmbed("#" + id, spec, { actions: { export: true, source: false, compiled: false, editor: false }, renderer: "canvas" });
      views[id] = res.view;
      return res.view;
    } catch (e) { showError(id, e); return null; }
  }

  // ---- start ---------------------------------------------------------------------------
  const [meta, facts] = await Promise.all([getJSON("data/meta.json"), getJSON("data/facts.json")]);
  fillFacts(facts);
  const LATEST = meta.latest_year;

  document.querySelectorAll(".year-slider").forEach((s) => { s.max = LATEST; s.value = LATEST; $(s.id + "-out").textContent = LATEST; });
  const yEnd = $("year-end");
  yEnd.innerHTML = [LATEST, 2020, 2015, 2010].filter((v, i, a) => a.indexOf(v) === i).map((y) => `<option>${y}</option>`).join("");

  let centroids = [];
  try { centroids = await loadCentroids(); } catch (e) { console.error("centroids", e); }

  const patches = {
    "map-total": (s) => { s.params[0].value = LATEST; s.datasets = { centroids }; },
    "map-capita": (s) => { s.params[0].value = LATEST; },
    "connected": (s) => { s.params.find((p) => p.name === "yEnd").value = LATEST; },
    "sector-treemap": (s) => {
      s.signals.find((x) => x.name === "edgarYear").value = meta.edgar_year;
      s.width = treemapWidth(); s.height = s.width < 520 ? 300 : 360;
    },
  };
  function treemapWidth() { return Math.max(280, Math.min(1100, $("sector-treemap").clientWidth - 20)); }

  await Promise.all(CHARTS.map(([id, url]) => draw(id, url, patches[id])));

  // ---- interaction wiring ------------------------------------------------------------------
  document.querySelectorAll(".year-slider").forEach((s) => {
    s.addEventListener("input", () => {
      $(s.id + "-out").textContent = s.value;
      const v = views[s.dataset.chart];
      if (v) v.signal("selYear", +s.value).run();
    });
  });
  const setRange = () => {
    const a = +$("year-start").value, b = +$("year-end").value, v = views["connected"];
    if (v) v.signal("yStart", Math.min(a, b)).signal("yEnd", Math.max(a, b)).run();
  };
  $("year-start").addEventListener("change", setRange);
  $("year-end").addEventListener("change", setRange);

  try {
    const rows = await d3.csv("data/sectors.csv");
    const seen = new Map(rows.map((r) => [r.iso, r.country]));
    const opts = [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    const sel = $("sector-country");
    sel.innerHTML = opts.map(([iso, name]) => `<option value="${iso}">${name}</option>`).join("");
    sel.value = "AUS";
    sel.addEventListener("change", () => { const v = views["sector-treemap"]; if (v) v.signal("iso", sel.value).run(); });
  } catch (e) { console.error("country list", e); }

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => { const v = views["sector-treemap"]; if (v) { const w = treemapWidth(); v.width(w).height(w < 520 ? 300 : 360).run(); } }, 200);
  });
})();
