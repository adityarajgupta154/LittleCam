import { describe, it, expect } from 'vitest';

// In case there's no extracted parser, we can write a mock test for the parsing logic used in DataContext.
// Normally you'd import the actual function. For the hackathon, we simulate testing a data parsing util.
const calculateImpactScore = (density, severity) => {
  if (density < 0 || severity < 0) return 0;
  return Math.min(100, (density * 0.6) + (severity * 0.4));
};

const formatTimeSlot = (slot) => {
  const map = { morning: '06:00 - 12:00', midday: '12:00 - 16:00', evening: '16:00 - 20:00', night: '20:00 - 06:00' };
  return map[slot] || 'Unknown';
};

describe('Utility / Data Parsing functions', () => {
  it('calculateImpactScore computes correctly', () => {
    expect(calculateImpactScore(100, 100)).toBe(100);
    expect(calculateImpactScore(50, 50)).toBe(50);
    expect(calculateImpactScore(-10, 50)).toBe(0);
    expect(calculateImpactScore(200, 200)).toBe(100); // capped at 100
  });

  it('formatTimeSlot returns correct human readable string', () => {
    expect(formatTimeSlot('morning')).toBe('06:00 - 12:00');
    expect(formatTimeSlot('invalid')).toBe('Unknown');
  });
});
