import React, { useState, useEffect, useMemo } from 'react';
import { motion, animate } from 'framer-motion';
import { MapPin, Map as MapIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import ScoreExplanationPanel from '../components/hotspot/ScoreExplanationPanel';
import TrendCharts from '../components/hotspot/TrendCharts';

const AnimatedScore = ({ value }) => {
  const [display, setDisplay] = useState("0.0");
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v.toFixed(1))
    });
    return controls.stop;
  }, [value]);
  return <>{display}</>;
};

export default function HotspotDetails() {
  const { t } = useLanguage();
  const { data } = useData();
  
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);

  const topHotspots = useMemo(() => {
    if (!data?.hotspots) return [];
    return [...data.hotspots].sort((a, b) => b.impact_score - a.impact_score).slice(0, 10);
  }, [data]);

  useEffect(() => {
    if (topHotspots.length > 0 && !selectedHotspotId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedHotspotId(topHotspots[0].id);
    }
  }, [topHotspots, selectedHotspotId]);

  const currentHotspot = useMemo(() => {
    return topHotspots.find(h => h.id === selectedHotspotId) || topHotspots[0];
  }, [topHotspots, selectedHotspotId]);

  const weeklyTrend = useMemo(() => {
    if (!currentHotspot?.day_of_week_distribution) return [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      day,
      violations: currentHotspot.day_of_week_distribution[`${i}.0`] || 0
    }));
  }, [currentHotspot]);

  const vehicleTypes = useMemo(() => {
    if (!currentHotspot?.vehicle_distribution) return [];
    const dist = currentHotspot.vehicle_distribution;
    const colors = {
      'TWO_WHEELER': '#0F4C81',
      'CAR': '#F59E0B',
      'HEAVY': '#64748B',
      'LCV': '#475569',
      'AUTO': '#DC2626',
      'OTHER': '#94A3B8'
    };
    const labels = {
      'TWO_WHEELER': t('hotspot.vehicle.2w') || '2-Wheeler',
      'CAR': t('hotspot.vehicle.4w') || '4-Wheeler',
      'HEAVY': t('hotspot.vehicle.commercial') || 'Commercial',
      'LCV': 'Light Commercial',
      'AUTO': t('hotspot.vehicle.auto') || 'Auto',
      'OTHER': 'Other'
    };
    return Object.entries(dist).map(([type, value]) => ({
      name: labels[type] || type,
      value,
      color: colors[type] || '#94A3B8'
    })).sort((a, b) => b.value - a.value);
  }, [currentHotspot, t]);

  const timeDistribution = useMemo(() => {
    if (!currentHotspot?.day_part_distribution) return [];
    const dist = currentHotspot.day_part_distribution;
    return [
      { time: 'Morning', count: dist.morning || 0 },
      { time: 'Midday', count: dist.midday || 0 },
      { time: 'Evening', count: dist.evening || 0 },
      { time: 'Night', count: dist.night || 0 }
    ];
  }, [currentHotspot]);

  if (!currentHotspot) return null;

  return (
    <div className="p-6 space-y-6 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">{t('page.hotspotDetail') || 'Hotspot Details'}</h1>
          <p className="text-[#64748B] dark:text-gray-400 mt-1">{t('hotspot.subtitle') || 'Deep dive analysis into specific problem areas.'}</p>
        </div>
        <div className="flex bg-[#F1F5F9] dark:bg-[#1E293B] p-1 border border-[#E5E7EB] dark:border-[#334155] overflow-x-auto max-w-full scrollbar-hide">
          {topHotspots.slice(0, 5).map(h => {
            const isSelected = selectedHotspotId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedHotspotId(h.id)}
                className={`relative px-5 py-2 font-bold text-sm transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400 ${
                  isSelected 
                    ? 'text-white' 
                    : 'text-[#64748B] dark:text-gray-400 hover:text-[#111827] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#0F4C81] dark:bg-blue-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                {h.nearest_landmark || `Hotspot #${h.id}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          key={currentHotspot.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-8 flex flex-col items-center justify-center relative overflow-hidden transition-colors"
        >
          {/* Badge */}
          <div className="absolute top-4 left-4 bg-[#FEF2F2] dark:bg-red-900/20 text-[#DC2626] dark:text-red-400 border border-[#DC2626] dark:border-red-500/50 px-3 py-1 text-xs font-black uppercase tracking-widest z-20">
            {currentHotspot.impact_score >= 80 ? 'CRITICAL IMPACT' : currentHotspot.impact_score >= 50 ? 'HIGH IMPACT' : 'MODERATE IMPACT'}
          </div>

          <div className="absolute -top-10 -right-10 text-[#F8FAFC] dark:text-[#1E293B] opacity-50 dark:opacity-20 z-0">
            <MapIcon size={200} />
          </div>

          <div className="relative z-10 flex flex-col items-center mt-6">
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-[#F1F5F9] dark:text-[#1E293B]" />
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" 
                  stroke={currentHotspot.impact_score >= 80 ? "#DC2626" : "#F59E0B"} 
                  strokeWidth="8" 
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * currentHotspot.impact_score) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="flex flex-col items-center justify-center mt-2">
                <div className="text-5xl font-black text-[#111827] dark:text-[#F8FAFC] tracking-tighter">
                  <AnimatedScore value={currentHotspot.impact_score} />
                </div>
                <div className="text-sm font-bold text-[#64748B] dark:text-gray-400 mt-1 uppercase tracking-widest">/ 100</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#111827] dark:text-[#F8FAFC] text-center mb-2 flex items-center justify-center gap-2">
              <MapPin size={24} className="text-[#DC2626] dark:text-red-500 shrink-0" />
              <span className="truncate max-w-[250px] md:max-w-[300px]">{currentHotspot.location_name?.split(',')[0] || currentHotspot.junction_name}</span>
            </h2>
            <p className="text-[#64748B] dark:text-gray-400 font-semibold uppercase tracking-widest text-sm text-center">{t('hotspot.impact') || 'Congestion Impact'}</p>
          </div>
        </motion.div>

        <ScoreExplanationPanel scoreBreakdown={currentHotspot.score_breakdown} />
      </div>

      <TrendCharts 
        weeklyTrend={weeklyTrend} 
        vehicleTypes={vehicleTypes} 
        timeDistribution={timeDistribution} 
      />
    </div>
  );
}
