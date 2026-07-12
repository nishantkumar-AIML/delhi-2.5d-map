# delhi-2.5d-map

Concise guide to run the React map app and the distance-matrix generator `delhi.py` on your machine.

Contents
- React app: a Vite + React project that visualizes Delhi POIs and shows optimized routes using precomputed data or live routing.
- `delhi.py`: a Python script that queries a routing service (OSRM) to compute pairwise driving distances and durations between ~120 Delhi locations and saves results to Excel.

Requirements
- Node.js (v16+ recommended) and npm for the React app.
- Python 3.8+ and `pip` for running `delhi.py`.

1) Run the React app (development)

```bash
# from project root
npm install
npm run dev
```

Open the URL shown by Vite (typically http://localhost:5173).

2) Generate the distance matrix with `delhi.py`

This script calls the public OSRM demo server to compute routes between every pair of locations. It produces `Delhi_Distance_Matrix.xlsx` (final) and `Delhi_Distance_Matrix_Progress.xlsx` (periodic saves).

Suggested safe steps to run:

```bash
# create and activate a virtual environment (macOS / Linux)
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install requests openpyxl

cd delhi-2.5d-map
npm install
npm run dev
```

Outputs
- `Delhi_Distance_Matrix.xlsx` — final workbook with rows: `From`, `To`, `Distance (km)`, `Time (min)`.
- `Delhi_Distance_Matrix_Progress.xlsx` — incremental saves (useful if the script is interrupted).

Usage ideas
- Convert the Excel to CSV/JSON and serve it to the React app so routing UI can use precomputed distances without repeated network calls.
- Feed the matrix into route optimization algorithms (TSP, VRP) to compute optimal tours.

Important cautions and improvements
- The script performs roughly N*(N-1) routing calls (≈ 14k for 120 points). The public OSRM demo server is not intended for bulk automated use — you may be rate-limited or blocked. Consider:
	- Running the script in batches (subset of pairs) and pausing between batches.
	- Self-hosting an OSRM server or using a commercial routing API (Mapbox, HERE, Google) for large-scale queries.
- Recommended improvements to `delhi.py` before heavy runs:
	- Add retries with exponential backoff on network errors.
	- Export CSV/JSON alongside Excel for easier consumption.
	- Add CLI flags to limit which pairs to compute and to resume partial runs.

-----------------------------------------------
-----------------------------------------------

**`src/App.jsx` — file-by-file explanation**

This section explains how `src/App.jsx` works and how to adapt it.

- Purpose: renders an interactive Leaflet map with ~120 Delhi POIs, allows the user to add stops by clicking markers, auto-optimizes the stop order using a nearest-neighbour heuristic, and draws the driving route using Leaflet Routing Machine (OSRM).

- Key imports and libs:
	- `react`, React hooks: `useState`, `useMemo`, `useEffect`.
	- `react-leaflet` components: `MapContainer`, `TileLayer`, `Marker`, `Popup`, and `useMap`.
	- `leaflet` for map utilities and icons.
	- `leaflet-routing-machine` to draw routes on the map using OSRM.

- Icon fix (top of file):
	- Leaflet's default icon URLs are replaced with CDN URLs to avoid missing marker images in many bundlers.

- Utility: `getDistance(lat1, lon1, lat2, lon2)`
	- Implements the Haversine formula to compute great-circle distance (in km) between two lat/lon points. Used by the optimizer as a cheap metric.

- Optimizer: `optimizeRoute(points)`
	- A simple nearest-neighbour heuristic:
		1. Keep the first point as start.
		2. Repeatedly append the nearest unvisited point to the route.
	- Complexity: O(n^2) per optimization call. Works well for small-to-medium lists but is not optimal for global TSP.

- Routing UI: `RoutingMachine` component
	- Uses `useMap()` to access the Leaflet map instance.
	- When `points` prop has 2+ stops, it converts them to `L.latLng` waypoints and creates a `L.Routing.control` with `L.Routing.osrmv1` pointing to `https://router.project-osrm.org/route/v1`.
	- `mode` prop toggles profile: `driving` (default), `bike` → `bike`, `walking` → `foot`.
	- The control is removed on cleanup to avoid duplicates when waypoints change.

- Main component: default `App()`
	- State:
		- `routePoints` — an array of chosen stops (objects with `{name, lat, lon}`).
		- `transportMode` — `'car' | 'bike' | 'walking'`, passed to `RoutingMachine`.
	- `locations` — a `useMemo` list of ~120 POIs used to render markers.
	- `optimizedRoute` — memoized result of `optimizeRoute(routePoints)` and recomputed when `routePoints` changes.
	- `handleAddStop(loc)` — adds a stop if not already present.

- UI behavior:
	- Top bar shows the optimized route as a simple arrow-separated list of names.
	- A `<select>` chooses transport mode (car/bike/walking) and a `Clear Tour` button resets `routePoints`.
	- Map markers: clicking a marker opens a popup with an `Add Stop` button.
	- The `RoutingMachine` draws the actual route between points using OSRM. The drawn route follows roads (unlike the Haversine heuristic which is straight-line distance).

- How to use precomputed distances instead of live OSRM calls
	- The app currently calls OSRM only via the Routing Machine (client-side). If you want to avoid live routing or speed up UI for many users, precompute pairwise distances using `delhi.py` and:
		1. Export a compact JSON mapping `{from: [{to, distance_km, time_min}, ...], ...}`.
		2. Host that JSON and fetch it in the app (e.g., `useEffect` on mount) and use it to compute optimized routes client-side without calling OSRM for every step.
		3. Use a routing backend only to draw the final route geometry (or generate geometries server-side and store them).

- Notes & tips for customization
	- To change the POI list, edit `locations` in `src/App.jsx` or load JSON from `public/` and `fetch()` them.
	- Replace the nearest-neighbour `optimizeRoute` with more powerful solvers (e.g., `jsprit`, `concorde`, OR-Tools via an API) for better routes.
	- If you see missing marker images, ensure the icon fix at the top of the file remains.
	- For heavy usage, avoid client-side OSRM calls to the public server — either self-host or use a paid routing API.

If you'd like, I can now:
- add a small JSON loader so `locations` come from `public/locations.json`, or
- implement precomputed-matrix based optimization using `delhi.py` output and a fast client-side optimizer.
Tell me which and I'll implement it next.

Platform-specific setup (macOS / Linux / Windows)

Prerequisites: `git`, Node.js v16+ (npm), and Python 3.8+.

macOS / Linux (Unix-like)

1. Install Node (recommended via nvm):

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
nvm use --lts
```

2. Install project dependencies and run the React app:

```bash
cd delhi-2.5d-map
npm install
npm run dev
```

3. (Optional) Generate distance matrix with Python:

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install requests openpyxl
python delhi.py
deactivate
```

Windows (PowerShell / CMD)

1. Install Node (use `winget` or Chocolatey or nvm-windows):

PowerShell (winget):
```powershell
winget install OpenJS.NodeJS.LTS
```

Or Chocolatey (admin CMD/PowerShell):
```powershell
choco install nodejs-lts
```

2. Install dependencies and run the React app:

```powershell
cd "delhi-2.5d-map"
npm install
npm run dev
```

3. (Optional) Generate distance matrix with Python (PowerShell):

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1   # PowerShell
# or for CMD: .\venv\Scripts\activate
pip install --upgrade pip
pip install requests openpyxl
python delhi.py
deactivate
```

Notes & tips
- Ensure Python and Node are on your `PATH` before running commands.
- `delhi.py` makes many routing requests — see README above for OSRM usage cautions and consider running only subsets or using a hosted/paid routing API for large runs.
- If `npm run dev` fails because of port or permission issues, try changing the port or run with elevated privileges only when necessary.

Clone from GitHub and push changes (easy steps)

If a user wants to install this project from your GitHub account and push changes back, follow these steps.

Clone the repo (everyone):

```bash
git clone https://github.com/nishantkumar-AIML/delhi-2.5d-map.git
cd delhi-2.5d-map
```

Make changes, then commit and push (existing repo):

```bash
# after editing files
git add .
git commit -m "Describe your change"
git push origin main
```

# add your GitHub remote and push
git remote add origin https://github.com/nishantkumar-AIML/delhi-2.5d-map.git
git branch -M main
git push -u origin main
```

Windows notes (PowerShell): use the same commands; ensure `git` is installed (Git for Windows).


