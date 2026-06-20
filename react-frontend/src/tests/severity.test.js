import { describe, it, expect } from 'vitest';
import { getSeverity } from '../config/severity';

describe('getSeverity utility', () => {
  it('returns CRITICAL for scores 70 and above', () => {
    expect(getSeverity(70).label).toBe('Critical');
    expect(getSeverity(100).label).toBe('Critical');
  });

  it('returns HIGH for scores between 55 and 69.9', () => {
    expect(getSeverity(55).label).toBe('High');
    expect(getSeverity(69.9).label).toBe('High');
  });

  it('returns MEDIUM for scores between 40 and 54.9', () => {
    expect(getSeverity(40).label).toBe('Medium');
    expect(getSeverity(54.9).label).toBe('Medium');
  });

  it('returns LOW for scores below 40', () => {
    expect(getSeverity(39.9).label).toBe('Low');
    expect(getSeverity(0).label).toBe('Low');
  });

  it('handles edge cases gracefully', () => {
    expect(getSeverity(-10).label).toBe('Low');
    expect(getSeverity(NaN).label).toBe('Low');
  });
});
