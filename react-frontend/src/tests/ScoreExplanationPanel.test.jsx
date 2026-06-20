import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ScoreExplanationPanel from '../components/hotspot/ScoreExplanationPanel';
import { LanguageProvider } from '../context/LanguageContext';

describe('ScoreExplanationPanel', () => {
  const mockBreakdown = {
    violation_density: 35.5,
    proximity_to_landmark: 20.0,
    peak_hour_effect: 15.2,
    vehicle_severity: 12.0,
    violation_severity: 9.0,
    historical_recurrence: 8.3
  };

  it('renders without crashing and displays correct scores', () => {
    render(
      <LanguageProvider>
        <ScoreExplanationPanel scoreBreakdown={mockBreakdown} />
      </LanguageProvider>
    );

    // Check if the title is present
    expect(screen.getByText(/Score Explanation/i)).toBeInTheDocument();

    // Check if specific values are rendered correctly
    expect(screen.getByText('35.5')).toBeInTheDocument();
    expect(screen.getByText('20.0')).toBeInTheDocument();
    expect(screen.getByText('15.2')).toBeInTheDocument();
    expect(screen.getByText('12.0')).toBeInTheDocument();
    expect(screen.getByText('9.0')).toBeInTheDocument();
    expect(screen.getByText('8.3')).toBeInTheDocument();
  });

  it('handles missing data gracefully', () => {
    render(
      <LanguageProvider>
        <ScoreExplanationPanel scoreBreakdown={{}} />
      </LanguageProvider>
    );
    
    // Should render 0.0 for missing breakdown values
    const zeroElements = screen.getAllByText('0.0');
    expect(zeroElements.length).toBeGreaterThan(0);
  });
});
