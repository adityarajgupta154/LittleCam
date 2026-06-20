import React, { useState, useMemo, useEffect } from 'react';
import { GitCompare, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, animate } from 'framer-motion';
import { useData } from '../context/DataContext';
import GoogleTrafficMap from '../components/GoogleTrafficMap';
import MapErrorBoundary from '../components/MapErrorBoundary';
import { useLanguage } from '../context/LanguageContext';

const AnimatedCounter = ({ value, isFloat, suffix = '' }) => {
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
  return <>{display}{suffix}</>;
};

const DigitalTwin = () => {
  const { data } = useData();
  const { t } = useLanguage();
  const [twinMode, setTwinMode] = useState('before'); // 'before' or 'after'

  const hotspots = useMemo(() => data.hotspots || [], [data.hotspots]);

  /** Simulated optimized hotspot data — applies reduction factor when in "after" mode. */
  const optimizedData = useMemo(() => hotspots.map(h => {
    const reduction = h.rank <= 30 ? 0.6 : (h.rank <= 100 ? 0.4 : 0.1);
    const score = twinMode === 'after' ? h.impact_score * (1 - reduction) : h.impact_score;
    return { ...h, impact_score: score };
  }), [hotspots, twinMode]);

  /** Derived statistics from the (possibly optimized) hotspot data. */
  const { avgScore, criticalCount } = useMemo(() => {
    const totalScore = optimizedData.reduce((sum, h) => sum + h.impact_score, 0);
    return {
      avgScore: hotspots.length ? (totalScore / hotspots.length).toFixed(1) : '0',
      criticalCount: optimizedData.filter(h => h.impact_score >= 60).length,
    };
  }, [optimizedData, hotspots.length]);

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#020617] transition-colors">
      <div className="absolute top-4 left-4 z-10 bg-white/98 dark:bg-[#0F172A]/98 p-4 border border-[#E5E7EB] dark:border-[#1E293B] w-80 transition-colors">
        <h2 className="text-lg font-bold mb-4 text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2 border-b border-[#E5E7EB] dark:border-[#334155] pb-3 uppercase tracking-widest">
          <GitCompare size={20} className="text-[#0F4C81] dark:text-[#3B82F6]" /> {t('twin.title') || 'Digital Twin Simulation'}
        </h2>
        
        <div className="flex bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] p-1 mb-6 relative overflow-hidden">
          <button 
            type="button"
            className={`relative flex-1 py-2 flex justify-center items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors z-10 ${twinMode === 'before' ? 'text-white' : 'text-[#64748B] dark:text-gray-400 hover:text-[#111827] dark:hover:text-[#F8FAFC]'}`}
            onClick={() => setTwinMode('before')}
          >
            {twinMode === 'before' && (
              <motion.div
                layoutId="twinMode"
                className="absolute inset-0 bg-[#DC2626] dark:bg-red-600"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}
            <AlertCircle size={14} aria-hidden="true" className="shrink-0" /> <span className="truncate">{t('twin.btn.before') || 'Before Enforcement'}</span>
          </button>
          <button 
            type="button"
            className={`relative flex-1 py-2 flex justify-center items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors z-10 ${twinMode === 'after' ? 'text-white' : 'text-[#64748B] dark:text-gray-400 hover:text-[#111827] dark:hover:text-[#F8FAFC]'}`}
            onClick={() => setTwinMode('after')}
          >
            {twinMode === 'after' && (
              <motion.div
                layoutId="twinMode"
                className="absolute inset-0 bg-[#16A34A] dark:bg-green-600"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}
            <CheckCircle size={14} aria-hidden="true" className="shrink-0" /> <span className="truncate">{t('twin.btn.after') || 'AI Optimized'}</span>
          </button>
        </div>

        <div className="space-y-5 border-t border-[#E5E7EB] dark:border-[#334155] pt-5">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">{t('twin.stat.state') || 'Network State'}</span>
            <span className={`text-xl font-black ${twinMode === 'after' ? 'text-[#16A34A] dark:text-green-500' : 'text-[#DC2626] dark:text-red-500'}`}>
              {twinMode === 'after' ? (t('twin.state.optimized') || 'Optimized Flow') : (t('twin.state.critical') || 'Critical Congestion')}
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">
              {twinMode === 'before' ? 'Congestion Delay' : 'Efficiency Gain'}
            </span>
            <span className={`text-3xl font-black ${twinMode === 'after' ? 'text-[#16A34A] dark:text-green-500' : 'text-[#DC2626] dark:text-red-500'}`}>
              <AnimatedCounter value={twinMode === 'before' ? 84 : 42} suffix="%" />
            </span>
            <div className="w-full bg-[#E5E7EB] dark:bg-[#1E293B] h-1.5 mt-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: twinMode === 'before' ? '84%' : '42%' }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full ${twinMode === 'after' ? 'bg-[#16A34A] dark:bg-green-500' : 'bg-[#DC2626] dark:bg-red-500'}`}
              />
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">
               {twinMode === 'before' ? 'Avg Impact Score' : 'Reduced Impact'}
            </span>
            <span className={`text-3xl font-black ${twinMode === 'after' ? 'text-[#0F4C81] dark:text-blue-500' : 'text-[#F59E0B] dark:text-amber-500'}`}>
              <AnimatedCounter value={avgScore} isFloat={true} />
            </span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">
              {twinMode === 'before' ? 'Critical Zones (>60)' : 'Remaining Zones'}
            </span>
            <span className={`text-3xl font-black ${twinMode === 'after' ? 'text-[#10B981] dark:text-emerald-500' : 'text-[#DC2626] dark:text-red-500'}`}>
              <AnimatedCounter value={criticalCount} />
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-full transition-opacity duration-1000 dark:opacity-90">
        <MapErrorBoundary>
          <GoogleTrafficMap customData={optimizedData} />
        </MapErrorBoundary>
      </div>
    </div>
  );
};

export default DigitalTwin;
