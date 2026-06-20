/**
 * @module colors
 * @description Design system color tokens for LittleCam.
 *
 * Single source of truth for brand, severity, status, surface, border,
 * and text colors. Referenced in code reviews and style audits.
 *
 * Usage: import { COLORS } from '../config/colors';
 *        Primarily used for Recharts inline styles and documentation.
 *        Tailwind classes still reference raw hex for tree-shaking.
 */

export const COLORS = {
  /** Primary brand palette */
  brand: {
    primary:    '#0F4C81',   // Bengaluru Police blue
    primaryHover: '#0D3F6B',
    accent:     '#FF9933',   // Tricolor saffron accent
  },

  /** Risk/severity semantic colors */
  severity: {
    critical:   '#DC2626',
    high:       '#EA580C',
    medium:     '#D97706',
    low:        '#3B82F6',
  },

  /** Status indicator colors */
  status: {
    success:    '#16A34A',
    info:       '#0F4C81',
    warning:    '#F59E0B',
    danger:     '#DC2626',
    purple:     '#8B5CF6',
  },

  /** Surface / background colors */
  surface: {
    page:       { light: '#F8FAFC', dark: '#020617' },
    card:       { light: '#FFFFFF', dark: '#0F172A' },
    elevated:   { light: '#F8FAFC', dark: '#1E293B' },
    input:      { light: '#F1F5F9', dark: '#334155' },
  },

  /** Border colors */
  border: {
    default:    { light: '#E5E7EB', dark: '#1E293B' },
    divider:    { light: '#E5E7EB', dark: '#334155' },
  },

  /** Text colors */
  text: {
    heading:    { light: '#111827', dark: '#F8FAFC' },
    body:       { light: '#475569', dark: '#CBD5E1' },
    muted:      { light: '#64748B', dark: '#94A3B8' },
  },

  /** Recharts-specific theme-aware configs */
  chart: {
    text:       { light: '#64748B', dark: '#94A3B8' },
    grid:       { light: '#E5E7EB', dark: '#334155' },
    tooltipBg:  { light: '#FFFFFF', dark: '#1E293B' },
    tooltipBorder: { light: '#E5E7EB', dark: '#334155' },
    tooltipText: { light: '#111827', dark: '#F8FAFC' },
  },
};
