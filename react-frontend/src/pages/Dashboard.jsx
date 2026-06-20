/**
 * @module Dashboard
 * @description Command Summary page — the primary operational overview.
 *
 * Displays 5 KPI cards, a violation trend line chart, a severity
 * distribution pie chart, an hourly parking pattern bar chart, and
 * an AI executive summary panel. All data is derived from the
 * pre-computed JSON files loaded via DataContext.
 */
import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle, Navigation, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { getSeverity, SEVERITY_CHART_COLORS } from '../config/severity';
import KPIGrid from '../components/dashboard/KPIGrid';
import ChartsPanel from '../components/dashboard/ChartsPanel';
import ExecutiveSummaryPanel from '../components/dashboard/ExecutiveSummaryPanel';

export default function Dashboard() {
  const { t } = useLanguage();
  const { data } = useData();

  /**
   * KPI cards displayed at the top of the dashboard.
   * Each card shows a key metric pulled from the pre-computed summary/brief data.
   */
  const kpiData = useMemo(() => [
    { title: 'dash.kpi.total', value: data?.summary?.total_violations_analyzed?.toLocaleString() || '0', rawValue: data?.summary?.total_violations_analyzed || 0, suffix: '', icon: Activity, color: 'text-[#0F4C81] dark:text-blue-400' },
    { title: 'dash.kpi.critical', value: data?.daily_brief?.stats?.critical_hotspots?.toString() || '0', rawValue: data?.daily_brief?.stats?.critical_hotspots || 0, suffix: '', icon: AlertTriangle, color: 'text-[#DC2626] dark:text-red-400' },
    { title: 'dash.kpi.impact', value: `${data?.summary?.hotspot_score_stats?.mean?.toFixed(1) || '0'}/100`, rawValue: data?.summary?.hotspot_score_stats?.mean || 0, suffix: '/100', isFloat: true, icon: TrendingUp, color: 'text-[#F59E0B] dark:text-amber-400' },
    { title: 'dash.kpi.patrol', value: data?.summary?.recommended_officers?.toString() || '0', rawValue: data?.summary?.recommended_officers || 0, suffix: '', icon: Navigation, color: 'text-[#16A34A] dark:text-green-400' },
    { title: 'dash.kpi.improvement', value: `${data?.summary?.projected_improvement_pct || '0'}%`, rawValue: data?.summary?.projected_improvement_pct || 0, suffix: '%', icon: CheckCircle, color: 'text-[#0F4C81] dark:text-blue-400' },
  ], [data]);

  /**
   * Aggregates hourly violation counts across all hotspots into a 24-hour
   * time series, then filters to business hours (06:00–22:00, 2-hour intervals)
   * for readable chart display.
   * @returns {Array<{time: string, violations: number}>}
   */
  const violationTrend = useMemo(() => {
    if (!data?.hotspots) return [];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const trend = hours.map(h => ({ time: `${h.toString().padStart(2, '0')}:00`, violations: 0 }));
    data.hotspots.forEach(h => {
      if (h.hour_distribution) {
        Object.entries(h.hour_distribution).forEach(([hourStr, count]) => {
          const hour = parseInt(hourStr);
          if (hour >= 0 && hour < 24) {
            trend[hour].violations += count;
          }
        });
      }
    });
    // Filter to every 2 hours from 6:00 to 22:00 for better chart readability
    return trend.filter(t => [6, 8, 10, 12, 14, 16, 18, 20, 22].includes(parseInt(t.time)));
  }, [data]);

  /**
   * Classifies all hotspots into severity tiers using the centralized
   * thresholds from config/severity.js. Produces data for the donut chart.
   * @returns {Array<{name: string, value: number, color: string}>}
   */
  const hotspotSeverity = useMemo(() => {
    if (!data?.hotspots) return [];
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    data.hotspots.forEach(h => {
      const severity = getSeverity(h.impact_score);
      counts[severity.key]++;
    });
    return [
      { name: 'Critical', value: counts.critical, color: SEVERITY_CHART_COLORS.critical },
      { name: 'High', value: counts.high, color: SEVERITY_CHART_COLORS.high },
      { name: 'Medium', value: counts.medium, color: SEVERITY_CHART_COLORS.medium },
      { name: 'Low', value: counts.low, color: SEVERITY_CHART_COLORS.low }
    ];
  }, [data]);

  /**
   * Aggregates violation counts by day-part (morning/afternoon/evening/night)
   * across all hotspots for the hourly pattern bar chart.
   * @returns {Array<{hour: string, count: number}>}
   */
  const hourlyPattern = useMemo(() => {
    if (!data?.hotspots) return [];
    let morning = 0, afternoon = 0, evening = 0, night = 0;
    data.hotspots.forEach(h => {
      if (h.day_part_distribution) {
        morning += h.day_part_distribution.morning || 0;
        afternoon += h.day_part_distribution.midday || 0;
        evening += h.day_part_distribution.evening || 0;
        night += h.day_part_distribution.night || 0;
      }
    });
    return [
      { hour: t('dash.time.morning'), count: morning },
      { hour: t('dash.time.afternoon'), count: afternoon },
      { hour: t('dash.time.evening'), count: evening },
      { hour: t('dash.time.night'), count: night }
    ];
  }, [data, t]);

  const topPriorityLocation = data?.daily_brief?.priority_areas?.[0]?.nearest_landmark || 'Commercial Street';

  return (
    <div className="p-6 space-y-6 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">{t('dash.title')}</h1>
          <p className="text-[#64748B] dark:text-gray-400 mt-1">{t('dash.subtitle')}</p>
        </div>
      </div>

      <KPIGrid kpiData={kpiData} />

      <div className="flex flex-col gap-6">
        <ChartsPanel 
          violationTrend={violationTrend} 
          hotspotSeverity={hotspotSeverity} 
          hourlyPattern={hourlyPattern} 
          executiveSummary={
            <ExecutiveSummaryPanel 
              summaryData={data?.summary} 
              topPriorityLocation={topPriorityLocation} 
            />
          }
        />
      </div>
    </div>
  );
}
