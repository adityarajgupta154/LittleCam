import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from '../context/DataContext';
import { ThemeProvider } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';

// Import components to test routing without triggering full map loads
import Landing from '../pages/Landing';
import Dashboard from '../pages/Dashboard';
import EnforcementWorklist from '../pages/EnforcementWorklist';

// Mock the GoogleTrafficMap and PatrolRouteMap to avoid loading actual maps in test
vi.mock('../components/GoogleTrafficMap', () => ({
  default: () => <div data-testid="mock-google-map">Map Placeholder</div>
}));
vi.mock('../components/PatrolRouteMap', () => ({
  default: () => <div data-testid="mock-patrol-map">Patrol Map Placeholder</div>
}));

vi.mock('../context/DataContext', () => ({
  DataProvider: ({ children }) => <div>{children}</div>,
  useData: () => ({
    loading: false,
    error: null,
    data: {
      hotspots: [],
      summary: {},
      patrols: [],
      worklist: [],
      trends: {}
    }
  })
}));

describe('App Routing Smoke Tests', () => {
  const renderWithProviders = (ui, initialRoute = '/') => {
    return render(
      <ThemeProvider>
        <LanguageProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            {ui}
          </MemoryRouter>
        </LanguageProvider>
      </ThemeProvider>
    );
  };

  it('renders Landing page on initial load', async () => {
    renderWithProviders(<Routes><Route path="/" element={<Landing />} /></Routes>);
    // We expect the Landing page to have the hero text
    expect(await screen.findByText(/Data-Driven Traffic Intelligence/i)).toBeInTheDocument();
  });

  it('renders Dashboard page without crashing', async () => {
    renderWithProviders(<Routes><Route path="/dashboard" element={<Dashboard />} /></Routes>, '/dashboard');
    expect(await screen.findByText(/Critical Hotspots/i)).toBeInTheDocument();
  });
});
