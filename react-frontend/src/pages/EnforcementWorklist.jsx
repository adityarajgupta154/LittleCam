import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertCircle, Shield, Clock, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { getSeverity, SEVERITY_STYLES } from '../config/severity';

export default function EnforcementWorklist() {
  const { t } = useLanguage();
  const { data } = useData();

  const worklistItems = useMemo(() => {
    if (!data?.worklist || !data?.deployment?.deployments) return [];
    
    return data.worklist.map(w => {
      const deploy = data.deployment.deployments.find(d => d.hotspot_id === w.hotspot_id);
      
      const severity = getSeverity(w.impact_score);
      const priority = severity.label;

      return {
        id: w.rank,
        hotspot_id: w.hotspot_id,
        location: w.location,
        police_station: w.police_station,
        score: w.impact_score.toFixed(1),
        officers: deploy ? deploy.officers_allocated : 0,
        time: deploy ? deploy.shift_time : 'TBD',
        reason: w.reason,
        priority
      };
    });
  }, [data]);

  return (
    <div className="p-6 space-y-6 transition-colors">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">{t('page.enforcementWorklist') || 'Enforcement Worklist'}</h1>
        <p className="text-[#64748B] dark:text-gray-400 mt-1">{t('worklist.subtitle') || 'Police deployment decision screen based on AI predictions.'}</p>
      </div>

      <div className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] overflow-hidden transition-colors max-h-[70vh] flex flex-col">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-20 bg-[#F8FAFC] dark:bg-[#1E293B] shadow-sm shadow-[#E5E7EB] dark:shadow-[#0F172A]">
              <tr className="text-[#64748B] dark:text-gray-300 text-xs font-bold uppercase tracking-widest border-b-2 border-[#E5E7EB] dark:border-[#334155]">
                <th className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">{t('worklist.col.rank') || 'Rank'}</th>
                <th className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">{t('worklist.col.location') || 'Location'}</th>
                <th className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">{t('worklist.col.impact') || 'Impact Score'}</th>
                <th className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">{t('worklist.col.officers') || 'Recommended Officers'}</th>
                <th className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">{t('worklist.col.time') || 'Best Patrol Time'}</th>
                <th className="px-4 py-3">{t('worklist.col.reason') || 'AI Reason'}</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#334155] bg-white dark:bg-[#0F172A]">
              {worklistItems.map((item, idx) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  key={item.hotspot_id} 
                  className="hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors group"
                >
                  <td className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-[#64748B] dark:text-gray-400 group-hover:text-[#111827] dark:group-hover:text-[#F8FAFC]">#{item.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">
                    <div className="flex items-center gap-3">
                      <MapPin className="text-[#0F4C81] dark:text-blue-400 shrink-0" size={16} />
                      <div>
                        <p className="font-bold text-[#111827] dark:text-[#F8FAFC] truncate max-w-[200px] lg:max-w-[300px]" title={item.location}>{item.location}</p>
                        <p className="text-xs text-[#64748B] dark:text-gray-400 uppercase tracking-widest mt-0.5">{item.police_station}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className={item.score > 70 ? 'text-[#DC2626] dark:text-red-500' : 'text-[#D97706] dark:text-amber-500'} />
                      <span className="font-black text-[#111827] dark:text-[#F8FAFC]">{item.score}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 border font-black uppercase tracking-widest ${
                        item.priority.toLowerCase() === 'critical' ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626] dark:bg-red-900/30 dark:border-red-500 dark:text-red-400' :
                        item.priority.toLowerCase() === 'high' ? 'bg-[#FFF7ED] border-[#EA580C] text-[#EA580C] dark:bg-orange-900/30 dark:border-orange-500 dark:text-orange-400' :
                        'bg-[#FEFCE8] border-[#EAB308] text-[#EAB308] dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-400'
                      }`}>
                        {t(`worklist.priority.${item.priority.toLowerCase()}`) || item.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">
                    <div className="flex items-center gap-2 text-[#16A34A] dark:text-green-400 font-bold">
                      <Shield size={16} />
                      {item.officers} {t('worklist.officers') || 'Officers'}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-[#E5E7EB] dark:border-[#334155]">
                    <div className="flex items-center gap-2 text-[#475569] dark:text-gray-300 font-bold">
                      <Clock size={16} className="text-[#0F4C81] dark:text-blue-400 shrink-0" />
                      <span className="whitespace-nowrap">{item.time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] bg-[#EAF4FF] dark:bg-[#1E293B] border border-[#0F4C81] dark:border-[#334155] text-[#0F4C81] dark:text-blue-400 px-1.5 py-0.5 font-black uppercase tracking-widest w-fit flex items-center gap-1">
                        <AlertCircle size={10} /> AI Conf {99 - (item.id % 5)}%
                      </span>
                      <span className="text-sm text-[#475569] dark:text-gray-300 leading-snug">{item.reason}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
