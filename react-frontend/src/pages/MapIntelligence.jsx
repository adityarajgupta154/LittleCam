import React, { useState, useMemo, useEffect } from 'react';
import { Target, Flame, Car } from 'lucide-react';
import { motion, animate } from 'framer-motion';
import { useData } from '../context/DataContext';
import GoogleTrafficMap from '../components/GoogleTrafficMap';
import MapErrorBoundary from '../components/MapErrorBoundary';
import { useLanguage } from '../context/LanguageContext';

const AnimatedCounter = ({ value, isFloat }) => {
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, numericValue, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplay(isFloat ? v.toFixed(1) : Math.floor(v).toLocaleString());
      }
    });
    return controls.stop;
  }, [value, isFloat]);
  return <>{display}</>;
};

const MapIntelligence = () => {
  const { data } = useData();
  const { t } = useLanguage();
  const [mode, setMode] = useState('current');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);

  const hotspots = useMemo(() => data.hotspots || [], [data.hotspots]);
  
  /** Derived stats memoized to avoid recalculation on mode/heatmap toggles. */
  const { totalViolations, avgScore } = useMemo(() => ({
    totalViolations: hotspots.reduce((sum, h) => sum + h.violation_count, 0),
    avgScore: hotspots.length > 0 
      ? (hotspots.reduce((sum, h) => sum + h.impact_score, 0) / hotspots.length).toFixed(1)
      : '0',
  }), [hotspots]);

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#020617] transition-colors">
      <div className="absolute top-4 left-4 z-10 bg-white/98 dark:bg-[#0F172A]/98 p-4 border border-[#E5E7EB] dark:border-[#1E293B] w-80 transition-colors">
        <h2 className="text-lg font-bold mb-4 text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2 border-b border-[#E5E7EB] dark:border-[#334155] pb-3 uppercase tracking-widest">
          <Target size={20} className="text-[#0F4C81] dark:text-[#3B82F6]" /> {t('map.title') || 'Network Intelligence'}
        </h2>
        
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] p-1 relative overflow-hidden">
            <button 
              type="button"
              className={`relative flex-1 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors z-10 ${mode === 'current' ? 'text-white' : 'text-[#64748B] dark:text-gray-400 hover:text-[#111827] dark:hover:text-[#F8FAFC]'}`}
              onClick={() => { setMode('current'); setShowHeatmap(false); }}
            >
              {mode === 'current' && (
                <motion.div
                  layoutId="mapMode"
                  className="absolute inset-0 bg-[#0F4C81] dark:bg-blue-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{ zIndex: -1 }}
                />
              )}
              {t('map.btn.current') || 'Current Risk'}
            </button>
            <button 
              type="button"
              className={`relative flex-1 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors z-10 ${mode === 'predicted' ? 'text-white' : 'text-[#64748B] dark:text-gray-400 hover:text-[#111827] dark:hover:text-[#F8FAFC]'}`}
              onClick={() => { setMode('predicted'); setShowHeatmap(false); }}
            >
              {mode === 'predicted' && (
                <motion.div
                  layoutId="mapMode"
                  className="absolute inset-0 bg-[#D97706] dark:bg-amber-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{ zIndex: -1 }}
                />
              )}
              {t('map.btn.predicted') || 'AI Prediction'}
            </button>
          </div>
          
          <button 
            type="button"
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors border ${showHeatmap ? 'bg-[#F3E8FF] dark:bg-purple-900/30 border-[#A855F7] dark:border-purple-500 text-[#7E22CE] dark:text-purple-400' : 'border-[#E5E7EB] dark:border-[#334155] text-[#64748B] dark:text-gray-400 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] hover:text-[#111827] dark:hover:text-[#F8FAFC]'}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            <Flame size={16} aria-hidden="true" /> {t('map.btn.heatmap') || 'Toggle Heatmap Layer'}
          </button>
          
          <button 
            type="button"
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors border ${showTraffic ? 'bg-[#F0FDF4] dark:bg-green-900/30 border-[#16A34A] dark:border-green-500 text-[#15803D] dark:text-green-400' : 'border-[#E5E7EB] dark:border-[#334155] text-[#64748B] dark:text-gray-400 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] hover:text-[#111827] dark:hover:text-[#F8FAFC]'}`}
            onClick={() => setShowTraffic(!showTraffic)}
          >
            <Car size={16} aria-hidden="true" /> {t('map.btn.traffic') || 'Live Traffic Layer'}
          </button>
        </div>

        <div className="space-y-4 border-t border-[#E5E7EB] dark:border-[#334155] pt-5">
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">{t('map.stat.critical') || 'Critical Zones'}</span>
            <span className="text-2xl font-black text-[#DC2626] dark:text-red-500"><AnimatedCounter value={hotspots.length} /></span>
          </div>
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">{t('map.stat.violations') || 'Total Violations'}</span>
            <span className="text-2xl font-black text-[#0F4C81] dark:text-blue-500"><AnimatedCounter value={totalViolations} /></span>
          </div>
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">{t('map.stat.avgRisk') || 'Avg City Risk'}</span>
            <span className="text-2xl font-black text-[#D97706] dark:text-amber-500"><AnimatedCounter value={avgScore} isFloat={true} /></span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-full dark:opacity-90">
        <MapErrorBoundary>
          <GoogleTrafficMap mode={mode} showHeatmap={showHeatmap} showTraffic={showTraffic} />
        </MapErrorBoundary>
      </div>
    </div>
  );
};

export default MapIntelligence;
