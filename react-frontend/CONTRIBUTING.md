# Code Structure Guide

Welcome to the LittleCam React Frontend! This document provides an overview of the architecture and code structure.

## Folder Architecture

The `react-frontend` directory is structured as follows:

- **`src/pages/`**: Contains the main route components (e.g., `Dashboard.jsx`, `HotspotDetails.jsx`). These act as containers that fetch data via Context and pass it down to presentational components.
- **`src/components/`**: Reusable UI components.
  - **`dashboard/`**: Specific components for the Dashboard (e.g., `KPIGrid.jsx`, `ChartsPanel.jsx`).
  - **`hotspot/`**: Specific components for Hotspot Details (e.g., `TrendCharts.jsx`, `ScoreExplanationPanel.jsx`).
  - **`ui/`**: Generic, highly reusable base components (e.g., `button.jsx`, `globe.jsx`).
- **`src/context/`**: React Context providers for global state management.
  - `DataContext.jsx`: Loads the pre-computed JSON files from `public/data/` and provides them to the app.
  - `LanguageContext.jsx`: Handles translation state.
  - `ThemeContext.jsx`: Handles dark/light mode toggling.
- **`src/config/`**: Configuration constants, theme tokens, and business logic thresholds.
  - `severity.js`: Defines the thresholds for Critical, High, Medium, Low severity scores.
  - `colors.js`: Standardized color palettes for charts and UI elements.

## Data Flow

Because this is an offline-first hackathon prototype, there is no active backend server.
1. The Python pipeline pre-computes intelligence and outputs static JSON files.
2. These JSON files reside in `react-frontend/public/data/`.
3. The `DataContext.jsx` uses `fetch` to load these JSONs when the app mounts.
4. Pages access this data via the `useData()` custom hook.

## Linting and Formatting

The project uses ESLint and Prettier to ensure consistent code style.
- **Linting**: Run `npm run lint` to check for code quality issues.
- **Auto-Fix**: Run `npm run lint -- --fix` to automatically format files and fix minor issues.
- Note: Google Maps API components (`GoogleTrafficMap.jsx` and `PatrolRouteMap.jsx`) are intentionally ignored from strict linting due to their third-party script loading requirements.

## Creating New Components

When creating new components:
1. Use **PascalCase** for the filename (e.g., `NewFeature.jsx`).
2. If the component exceeds 200 lines, extract its sub-sections into a subfolder.
3. Provide JSDoc-style block comments explaining complex props and logic.
4. (Optional but recommended) Provide `PropTypes` for robust prop validation.
