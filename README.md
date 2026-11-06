# HOLLY GRACE – Interactive Campus Navigation Map

An interactive, responsive 2D campus navigation web application built with **React**, **Vite**, **TypeScript**, and **SVG overlays**, powered entirely by high-resolution campus drone photography without external map providers (no Google Maps, Mapbox, or OSM tiles).

---

## 🚀 Key Features

1. **Drone Aerial Map Experience**
   - Uses the campus drone photograph (`Pasted 04-11-2026 at 20.17.50.png`) as the true 2D ground map.
   - Smooth pan (drag / touch swipe), zoom (mouse wheel / pinch-to-zoom / buttons), and fit-to-screen controls.
   - SVG overlay mapped to normalized coordinate space (native 1280 × 774) ensuring 100% pixel-perfect marker and route alignment at any zoom or screen size.

2. **Accurate Campus Positions (1–8)**
   - All 8 physical positions accurately centered on the physical badges:
     - **Position 1**: South-West Complex (`(481, 586)`)
     - **Position 2**: Main Academic Block – Central (`(794, 382)`)
     - **Position 3**: South-East Annex (`(819, 492)`)
     - **Position 4**: Festival Amphitheater & Ground (`(821, 262)`)
     - **Position 5**: Central Pavilion & Plaza (`(601, 251)`)
     - **Position 6**: North Curved Academic Wing (`(656, 189)`)
     - **Position 7**: West Hillcrest Pavilion (`(337, 155)`)
     - **Position 8**: North Hilltop Complex (`(472, 94)`)

3. **Complete 31-Stage Mapping & Rules**
   - **Position 1**: Stages 12, 13, 14
   - **Position 2**: Stages 1, 2, 3, 4, 5, 6, 7
   - **Position 3**: Stage 8
   - **Position 4**: Stages 9, 11
   - **Position 5**: Stage 10
   - **Position 6**: Stages 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28
   - **Position 7**: Stages 30, 31, 32
   - **Position 8**: Stage 29 (*Exclusively Position 8, never Position 6*)
   - **Stage 15 Exclusion**: Stage 15 is off-campus and excluded across the entire application.
   - **Shared Route Rule**: Stages sharing a physical position share the identical road path.

4. **Graph-Based Road & Walking-Path Network**
   - Traced directly from visible campus asphalt roads, paved courtyards, and covered pergolas.
   - Dijkstra / A* shortest pathfinding algorithm.
   - Animated dotted navigation route with glowing high-contrast outline for legibility over vegetation and buildings.
   - Optional diagnostic toggle (`Workflow` icon in top-right) to visualize the mapped road graph.

5. **Current Location & Dual Mode (GPS + Test Mode)**
   - **Simulated Test Mode**: Click the crosshair icon, then click anywhere on the campus map to place or drag a simulated user location pin. Clearly flagged with a "TEST MODE" badge.
   - **Live GPS Tracking**: Uses `navigator.geolocation.watchPosition` with high accuracy. Displays a live blue marker with an accuracy radius.
   - **Map Calibration Foundation**: Built-in 2D affine coordinate transformation solver using least-squares regression over reference ground control points. Live GPS is only projected after calibration, preventing fabricated positioning.
   - **Metric Scale Calibration**: Calibrate meters per pixel to compute real walking distance (meters) and walking ETA (minutes at 1.25 m/s). Shows uncalibrated indicators when scale is unset.

6. **Production-Ready Image Replacement**
   - The map configuration in `src/config/mapConfig.ts` points to the image asset.
   - When the clean unnumbered drone photo is ready, place it into `public/campus_map_dev.png` or configure the path. Coordinates and SVG overlays remain valid as long as framing and aspect ratio match.

---

## 🛠️ Project Structure

```
HOLLY_GRACE_MAP/
├── Pasted 04-11-2026 at 20.17.50.png   # Original drone photograph (preserved)
├── public/
│   └── campus_map_dev.png              # Served campus image asset
├── src/
│   ├── components/
│   │   ├── calibration/
│   │   │   └── CalibrationMode.tsx     # Admin GPS & scale calibration modal
│   │   ├── map/
│   │   │   ├── CampusMap.tsx           # Master interactive map viewport
│   │   │   ├── MapControls.tsx         # Zoom, GPS, Test Mode & Admin toggles
│   │   │   ├── MapImage.tsx            # Base image renderer
│   │   │   ├── MapMarkers.tsx          # 8 campus position SVG badges
│   │   │   ├── RouteOverlay.tsx        # Animated dotted SVG route line
│   │   │   └── UserLocationMarker.tsx  # GPS blue ring & Test Mode orange pin
│   │   └── navigation/
│   │       ├── DestinationSelector.tsx # Stage search & browser
│   │       ├── RouteInformation.tsx    # Distance, ETA, stage details panel
│   │       └── StageList.tsx           # Filtered list of stage cards
│   ├── config/
│   │   ├── campusPositions.ts          # Centralized 8 positions data
│   │   ├── mapConfig.ts                # Image dimensions & coordinate transforms
│   │   ├── roadNetwork.ts              # Traced road graph nodes & edges
│   │   └── stageMapping.ts             # Exact 31-stage configuration
│   ├── hooks/
│   │   ├── useGeolocation.ts           # Browser Geolocation API hook
│   │   └── useMapTransform.ts          # Pan, wheel zoom, pinch-to-zoom
│   ├── services/
│   │   ├── coordinateTransform.ts      # Affine least-squares GPS solver
│   │   └── routingService.ts           # Dijkstra / A* road routing service
│   ├── types/
│   │   └── campus.ts                   # Core TypeScript domain models
│   ├── App.tsx                         # Main state coordinator & UI layout
│   ├── index.css                       # Modern Tailwind & SVG animation styles
│   └── main.tsx                        # React application entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run production build & TypeScript validation
npm run build
```

Open `http://localhost:5173` in any browser or on a mobile device on the local network.

