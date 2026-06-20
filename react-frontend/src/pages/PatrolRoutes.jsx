import React, { useState, useMemo, useEffect } from 'react';
import { motion, animate } from 'framer-motion';
import { Users, Navigation, Route as RouteIcon, BatteryCharging } from 'lucide-react';
import PatrolRouteMap from '../components/PatrolRouteMap';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

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

export default function PatrolRoutes() {
  const { data } = useData();
  const [officers, setOfficers] = useState(data?.daily_brief?.stats?.officers_available || 30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPlan, setShowPlan] = useState(true);
  const { t } = useLanguage();

  const allTeams = useMemo(() => data?.patrol_routes?.teams || [], [data]);

  const teamsToShow = useMemo(() => {
    let available = officers;
    const showing = [];
    for (const team of allTeams) {
      if (available >= team.total_officers) {
        showing.push(team);
        available -= team.total_officers;
      }
    }
    if (showing.length === 0 && allTeams.length > 0 && officers >= Math.min(...allTeams.map(t => t.total_officers))) {
      showing.push(allTeams[0]);
    }
    return showing;
  }, [allTeams, officers]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPlan(true);
    }, 1500);
  };

  const colors = ['bg-[#0F4C81] dark:bg-blue-500', 'bg-[#16A34A] dark:bg-green-500', 'bg-[#EA580C] dark:bg-orange-500', 'bg-[#8B5CF6] dark:bg-purple-500'];
  const dotColors = ['bg-[#0F4C81] dark:bg-blue-400', 'bg-[#16A34A] dark:bg-green-400', 'bg-[#EA580C] dark:bg-orange-400', 'bg-[#8B5CF6] dark:bg-purple-400'];

  return (
    <div className="p-6 space-y-6 transition-colors">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">{t('page.patrolRoutes') || 'Patrol Route Optimizer'}</h1>
        <p className="text-[#64748B] dark:text-gray-400 mt-1">{t('patrol.subtitle') || 'AI-generated patrol plans based on available workforce.'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 flex flex-col transition-colors">
          <h3 className="text-lg font-semibold text-[#111827] dark:text-[#F8FAFC] mb-6 flex items-center gap-2">
            <Users size={20} className="text-[#0F4C81] dark:text-blue-400" /> {t('patrol.availableOfficers') || 'Available Officers'}
          </h3>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-center gap-6 mb-8">
              <button 
                type="button"
                aria-label="Decrease available officers"
                onClick={() => setOfficers(Math.max(4, officers - 2))}
                className="w-12 h-12 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] flex items-center justify-center text-2xl text-[#111827] dark:text-[#F8FAFC] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400"
              >
                -
              </button>
              <div className="text-center">
                <span className="text-6xl font-black text-[#0F4C81] dark:text-blue-400">
                  {officers}
                </span>
              </div>
              <button 
                type="button"
                aria-label="Increase available officers"
                onClick={() => setOfficers(Math.min(100, officers + 2))}
                className="w-12 h-12 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] flex items-center justify-center text-2xl text-[#111827] dark:text-[#F8FAFC] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400"
              >
                +
              </button>
            </div>
            
            <button 
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              aria-busy={isGenerating}
              className="w-full py-4 font-bold text-white bg-[#0F4C81] dark:bg-blue-600 hover:bg-[#0D3F6B] dark:hover:bg-blue-700 border border-[#0F4C81] dark:border-blue-600 transition-all flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin"></div>
                  {t('patrol.optimizing') || 'Optimizing...'}
                </>
              ) : (
                <>
                  <Navigation size={20} /> {t('patrol.generate') || 'Generate AI Patrol Plan'}
                </>
              )}
            </button>
          </div>
        </div>

        {showPlan && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 lg:col-span-3 transition-colors"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
                <RouteIcon className="text-[#16A34A] dark:text-green-400" /> {t('patrol.generatedPlan') || 'Generated Plan'}
              </h3>
              <span className="px-3 py-1 bg-[#F0FDF4] dark:bg-green-900/20 text-[#16A34A] dark:text-green-400 text-sm font-semibold border border-[#16A34A]/30 dark:border-green-900">
                {t('patrol.optimalCoverage') || 'Optimal Coverage'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {teamsToShow.map((team, idx) => (
                  <div key={team.team} className="bg-[#F8FAFC] dark:bg-[#1E293B] p-5 border border-[#E5E7EB] dark:border-[#334155] relative group transition-colors">
                    <div className={`absolute top-0 right-0 w-2 h-full ${colors[idx % colors.length]}`}></div>
                    <h4 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mb-4">{team.team} <span className="text-sm font-normal text-[#64748B] dark:text-gray-400 ml-2">({team.total_officers} officers)</span></h4>
                    
                    <div className="space-y-4 relative before:absolute before:top-0 before:bottom-0 before:left-[11px] before:w-[2px] before:bg-[#E5E7EB] dark:before:bg-[#334155] before:z-0 py-2" style={{ overflow: 'visible' }}>
                      {team.stops.slice(0, 5).map((stop, sidx) => (
                        <div key={sidx} className="relative flex items-start justify-start w-full z-10 pl-8">
                          {/* The Card */}
                          <div className="w-full bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] p-3 shadow-sm">
                            <p className="text-sm text-[#475569] dark:text-gray-300 font-medium leading-snug break-words">
                              {stop.location}
                            </p>
                          </div>
                          
                          {/* The Dot */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 border-2 border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] shrink-0 z-10">
                            <div className={`w-2 h-2 ${dotColors[idx % dotColors.length]}`}></div>
                          </div>
                        </div>
                      ))}
                      {team.stops.length > 5 && (
                        <div className="relative flex items-center justify-start z-10 pt-2 pl-8">
                          <div className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#64748B] dark:text-gray-400">
                            + {team.stops.length - 5} more stops
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E5E7EB] dark:border-[#334155] grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] p-2">
                        <div className="text-[10px] font-black text-[#64748B] dark:text-gray-400 uppercase tracking-widest mb-1">{t('patrol.distance') || 'Distance'}</div>
                        <div className="font-black text-[#111827] dark:text-[#F8FAFC]"><AnimatedCounter value={team.total_distance_km} suffix=" KM" /></div>
                      </div>
                      <div className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] p-2">
                        <div className="text-[10px] font-black text-[#64748B] dark:text-gray-400 uppercase tracking-widest mb-1">Impact</div>
                        <div className="font-black text-[#0F4C81] dark:text-blue-500"><AnimatedCounter value={team.total_impact} /></div>
                      </div>
                      <div className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] p-2">
                        <div className="text-[10px] font-black text-[#64748B] dark:text-gray-400 uppercase tracking-widest mb-1">{t('patrol.coverage') || 'Coverage'}</div>
                        <div className="font-black text-[#16A34A] dark:text-green-500"><AnimatedCounter value={team.coverage_pct} suffix="%" /></div>
                      </div>
                    </div>
                  </div>
                ))}

                {teamsToShow.length < allTeams.length && (
                  <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-5 border border-[#E5E7EB] dark:border-[#334155] relative flex items-center justify-center h-[120px] transition-colors">
                    <div className="text-center">
                      <BatteryCharging className="mx-auto text-[#64748B] dark:text-gray-500 mb-2" size={32} />
                      <p className="text-[#64748B] dark:text-gray-400 text-sm">{t('patrol.allocateMore') || `Allocate ${allTeams[teamsToShow.length].total_officers} more officers for ${allTeams[teamsToShow.length].team}.`}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] relative min-h-[400px] h-full transition-colors">
                <PatrolRouteMap teams={teamsToShow} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
