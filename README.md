# Who is driving carbon emissions? — FIT3179 Data Visualisation 2

Single scrolling page (Vega-Lite / Vega) for GitHub Pages. Topic: carbon emissions by country, with Australia and Malaysia highlighted.

## Folders
- `index.html`, `js/main.js` — the page. It loads each chart from `specs/` and the cleaned data from `data/`.
- `specs/` — the 14 chart specifications as JSON (3 map idioms: symbol map, two choropleths).
- `data/` — cleaned, chart-ready files (about 0.5 MB). Do not edit by hand.
- `tools/prepare_data.py` — cleans the raw downloads into `data/`. `tools/make_specs.py` regenerates `specs/`.
- `raw/` — raw downloads (OWID CSVs). The EDGAR workbook `IEA_EDGAR_CO2_1970_2025.xlsx` goes here too but is **not** committed (see licence).

## Data sources
1. Our World in Data — annual CO₂, CO₂ per capita, cumulative CO₂ (Global Carbon Budget, CC BY).
2. EDGAR_2026_GHG — IEA-EDGAR CO₂ (v5), sheet "IPCC 2006" (CO₂ by country and IPCC sector, Gg).
3. Map shapes — world-atlas (Natural Earth), loaded from jsDelivr.

## What the cleaning does
- Renames columns, drops regions/income groups/`OWID_*` rows from country tables (regions are kept only for the streamgraph and world trend).
- Tonnes → million tonnes (Mt); EDGAR Gg → Mt; 2024 EDGAR values grouped from 23 IPCC codes into 8 sectors.
- Adds ISO numeric ids so countries join to the map shapes. Population = total CO₂ ÷ CO₂ per person (derived).
- Per-person rankings only include countries over 1 million people. Change maps ignore countries under 1 Mt in 2000.
- Cross-check: EDGAR and OWID 2024 totals agree within about 7% for the eight largest emitters.

## Re-run
```
pip install pandas openpyxl
python3 tools/prepare_data.py     # raw/ -> data/
python3 tools/make_specs.py       # optional: regenerate specs/
python3 -m http.server 8000       # open http://localhost:8000
```

## Publish on GitHub Pages
1. New public repository → upload `index.html`, `README.md`, `js/`, `specs/`, `data/`, `tools/` (not the EDGAR `.xlsx`).
2. Settings → Pages → Deploy from branch `main`, folder `/ (root)`.
3. Open the public URL and check every chart loads.

## Licence note
The IEA-EDGAR CO₂ component is CC BY-NC-ND 4.0 (non-commercial, no derivatives; the file says to contact the IEA for permission). Use here is non-commercial coursework with attribution; the raw workbook is not redistributed. The page states the changes made.

October 26 revision: 15-country selected dumbbell (13 top absolute changes + Australia and Malaysia); continent-level violin distribution; chart 11 restored to original connected scatterplot; banner photo in the right hero column; expanded methodology.
