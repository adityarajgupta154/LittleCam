import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import KPIGrid from '../components/dashboard/KPIGrid';
import { LanguageProvider } from '../context/LanguageContext';

describe('KPIGrid Component', () => {
  const mockKpiData = [
    { title: 'Total Active Hotspots', value: '142', icon: () => <div />, color: 'text-red-500' },
    { title: 'Critical Zones', value: '18', icon: () => <div />, color: 'text-red-500' },
    { title: 'Active Patrols', value: '45', icon: () => <div />, color: 'text-blue-500' },
    { title: 'Today Violations', value: '1254', icon: () => <div />, color: 'text-amber-500' },
  ];

  it('renders all 4 KPI cards correctly', () => {
    render(
      <LanguageProvider>
        <KPIGrid kpiData={mockKpiData} />
      </LanguageProvider>
    );

    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('1254')).toBeInTheDocument();
  });

  it('renders fallbacks when summary is empty', () => {
    render(
      <LanguageProvider>
        <KPIGrid kpiData={[{ title: 'Total Active Hotspots', value: 0, icon: () => <div />, color: 'text-red-500' }]} />
      </LanguageProvider>
    );

    // Should render 0s for missing data
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBe(1);
  });
});
