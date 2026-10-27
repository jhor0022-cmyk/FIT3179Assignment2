# Carbon Emissions by Country? — FIT3179 Data Visualisation 2

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

## Licence note
The IEA-EDGAR CO₂ component is CC BY-NC-ND 4.0 (non-commercial, no derivatives; the file says to contact the IEA for permission). Use here is non-commercial coursework with attribution; the raw workbook is not redistributed. The page states the changes made.
