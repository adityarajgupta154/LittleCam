/**
 * @module severity
 * @description Centralized severity classification for Congestion Impact Scores.
 *
 * Used by Dashboard, EnforcementWorklist, RiskBrief, and HotspotDetails
 * to ensure consistent risk labeling across the entire platform.
 *
 * These thresholds align with the scoring methodology in process_data.py
 * where the Impact Score is a 0–100 composite of six weighted components.
 */

/** Score thresholds for each severity tier. */
export const SEVERITY_THRESHOLDS = {
  CRITICAL: { min: 70, label: 'Critical', key: 'critical' },
  HIGH:     { min: 55, label: 'High',     key: 'high' },
  MEDIUM:   { min: 40, label: 'Medium',   key: 'medium' },
  LOW:      { min: 0,  label: 'Low',      key: 'low' },
};

/**
 * Determines the severity level for a given impact score.
 * @param {number} score - The congestion impact score (0–100).
 * @returns {{ min: number, label: string, key: string }} The severity classification.
 */
export function getSeverity(score) {
  if (score >= SEVERITY_THRESHOLDS.CRITICAL.min) return SEVERITY_THRESHOLDS.CRITICAL;
  if (score >= SEVERITY_THRESHOLDS.HIGH.min)     return SEVERITY_THRESHOLDS.HIGH;
  if (score >= SEVERITY_THRESHOLDS.MEDIUM.min)   return SEVERITY_THRESHOLDS.MEDIUM;
  return SEVERITY_THRESHOLDS.LOW;
}

/**
 * Tailwind class mappings for each severity level.
 * Includes light and dark mode variants for text, background, and border.
 */
export const SEVERITY_STYLES = {
  critical: {
    text: 'text-[#DC2626] dark:text-red-400',
    bg: 'bg-[#FEF2F2] dark:bg-red-900/20',
    border: 'border-[#FECACA] dark:border-red-900',
    badge: 'bg-[#FEF2F2] dark:bg-red-900/20 text-[#DC2626] dark:text-red-400 border-[#FECACA] dark:border-red-900',
  },
  high: {
    text: 'text-[#EA580C] dark:text-orange-400',
    bg: 'bg-[#FFF7ED] dark:bg-orange-900/20',
    border: 'border-[#FED7AA] dark:border-orange-900',
    badge: 'bg-[#FFF7ED] dark:bg-orange-900/20 text-[#EA580C] dark:text-orange-400 border-[#FED7AA] dark:border-orange-900',
  },
  medium: {
    text: 'text-[#D97706] dark:text-amber-400',
    bg: 'bg-[#FFFBEB] dark:bg-amber-900/20',
    border: 'border-[#FDE68A] dark:border-amber-900',
    badge: 'bg-[#FFFBEB] dark:bg-amber-900/20 text-[#D97706] dark:text-amber-400 border-[#FDE68A] dark:border-amber-900',
  },
  low: {
    text: 'text-[#0F4C81] dark:text-blue-400',
    bg: 'bg-[#EAF4FF] dark:bg-blue-900/20',
    border: 'border-[#B6D4FE] dark:border-blue-900',
    badge: 'bg-[#EAF4FF] dark:bg-blue-900/20 text-[#0F4C81] dark:text-blue-400 border-[#B6D4FE] dark:border-blue-900',
  },
};

/** Recharts-compatible color values for pie/bar charts. */
export const SEVERITY_CHART_COLORS = {
  critical: '#DC2626',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#3B82F6',
};
