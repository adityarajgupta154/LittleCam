# Testing Guide

Welcome to the testing documentation for LittleCam. The project utilizes **Vitest** and **React Testing Library** for fast, reliable, Vite-native automated testing.

## Running Tests

To run the full test suite once:
```bash
npm run test
```

To run the tests in interactive watch mode (useful during active development):
```bash
npm run test:watch
```

## What is Covered?

The test suite is located in the `src/tests/` directory and covers three main pillars:

### 1. Utility & Logic Functions
- **`severity.test.js`**: Validates the `getSeverity` function to ensure impact scores (0-100) are correctly mapped to Critical, High, Medium, or Low categories.
- **`utils.test.js`**: Tests pure functions for data parsing, impact score calculations, and time formatting.

### 2. UI Components
- **`ScoreExplanationPanel.test.jsx`**: Confirms that the Hotspot explanation grid renders safely without crashing, specifically validating that AI impact factors (e.g., density, landmark proximity) render properly or gracefully fallback when data is missing.
- **`KPIGrid.test.jsx`**: Validates the main dashboard stat cards, ensuring total violations, critical zones, and active patrols render with proper mock JSON data.

### 3. Smoke & Routing Tests
- **`App.smoke.test.jsx`**: Ensures the root `AppContent` mounts successfully. It validates the `MemoryRouter` to ensure core routes like `/dashboard` and `/` load without throwing fatal React runtime errors.
- **Note**: The heavy `GoogleTrafficMap` and `PatrolRouteMap` components are deliberately mocked in testing to prevent async Google API loader errors and keep the test suite lightweight and offline-capable.
