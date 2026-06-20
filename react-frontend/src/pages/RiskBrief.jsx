import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, AlertTriangle, CheckCircle, Clock, Printer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { getSeverity, SEVERITY_STYLES } from '../config/severity';

export default function RiskBrief() {
  const { t } = useLanguage();
  const { data } = useData();

  const riskForecast = useMemo(() => {
    if (!data?.hotspots) return [];
    
    const hotspots = [...data.hotspots].sort((a,b) => b.impact_score - a.impact_score).slice(0, 20);
    
    const morning = [];
    const midday = [];
    const evening = [];
    const night = [];
    
    hotspots.forEach(h => {
        if (!h.day_part_distribution) return;
        const dist = h.day_part_distribution;
        // Determine the peak time for this hotspot
        let maxPart = 'morning';
        let peakVal = dist.morning || 0;
        if ((dist.midday || 0) > peakVal) { peakVal = dist.midday; maxPart = 'midday'; }
        if ((dist.evening || 0) > peakVal) { peakVal = dist.evening; maxPart = 'evening'; }
        if ((dist.night || 0) > peakVal) { maxPart = 'night'; }
        
        const severity = getSeverity(h.impact_score);
        const risk = severity.label;
        const styles = SEVERITY_STYLES[severity.key];
        const color = styles.text;
        const bg = styles.bg;
        
        const locationStr = h.nearest_landmark || h.junction_name || h.location_name?.split(',')[0] || `Hotspot ${h.id}`;
        
        // ensure we don't have duplicate locations in the same block
        const zone = { location: locationStr, risk, color, bg };
        
        if (maxPart === 'morning' && !morning.some(z => z.location === locationStr)) morning.push(zone);
        else if (maxPart === 'midday' && !midday.some(z => z.location === locationStr)) midday.push(zone);
        else if (maxPart === 'evening' && !evening.some(z => z.location === locationStr)) evening.push(zone);
        else if (maxPart === 'night' && !night.some(z => z.location === locationStr)) night.push(zone);
    });
    
    return [
      { time: t('dash.time.morning') || 'Morning', zones: morning.slice(0,3) },
      { time: t('dash.time.afternoon') || 'Afternoon', zones: midday.slice(0,3) },
      { time: t('dash.time.evening') || 'Evening', zones: evening.slice(0,3) },
      { time: t('dash.time.night') || 'Night', zones: night.slice(0,3) }
    ].filter(f => f.zones.length > 0);
  }, [data, t]);

  const dateStr = useMemo(() => {
    if (data?.daily_brief?.date) {
      const d = new Date(data.daily_brief.date);
      return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    return new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [data]);

  return (
    <div className="p-6 space-y-6 transition-colors print:bg-white print:text-black">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] tracking-tight">{t('page.riskBrief') || 'Risk & Daily Brief'}</h1>
          <p className="text-[#64748B] dark:text-gray-400 mt-1">{t('brief.subtitle') || 'Operational intelligence and printable summaries.'}</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0F4C81]/90 text-white px-4 py-2 shadow-sm transition-colors print:hidden"
        >
          <Printer size={18} />
          {t('common.export') || 'Export PDF'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 transition-colors print:border-gray-300 h-full">
          <h3 className="text-xl font-black uppercase tracking-widest text-[#111827] dark:text-[#F8FAFC] mb-6 flex items-center gap-2 border-b-2 border-[#E5E7EB] dark:border-[#334155] pb-4 transition-colors">
            <AlertTriangle className="text-[#D97706] dark:text-amber-500 shrink-0" /> {t('brief.forecast') || 'Parking Risk Forecast'}
          </h3>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-[2px] before:bg-[#E5E7EB] dark:before:bg-[#334155] print:before:bg-gray-300">
            {riskForecast.map((forecast, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={forecast.time} 
                className="relative flex items-start gap-6 group"
              >
                <div className="flex items-center justify-center w-10 h-10 border-2 border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#64748B] dark:text-gray-400 shrink-0 z-10 group-hover:border-[#0F4C81] dark:group-hover:border-blue-500 transition-colors print:border-gray-300 print:bg-white">
                  <Clock size={16} />
                </div>
                <div className="flex-1 bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] p-4 shadow-sm group-hover:border-[#94A3B8] dark:group-hover:border-gray-500 transition-colors print:border-gray-300 print:bg-white">
                  <h4 className="text-sm font-black uppercase tracking-widest text-[#0F4C81] dark:text-blue-400 mb-3">{forecast.time}</h4>
                  <div className="flex flex-col gap-2">
                    {forecast.zones.map((zone, zidx) => (
                      <div key={zidx} className={`flex justify-between items-center p-3 border-l-4 border-t border-r border-b ${zone.bg} border-r-[#E5E7EB] border-t-[#E5E7EB] border-b-[#E5E7EB] dark:border-r-[#334155] dark:border-t-[#334155] dark:border-b-[#334155] print:bg-gray-50 print:border-gray-200`} style={{ borderLeftColor: zone.color.replace('text-[', '').replace(']', '') }}>
                        <span className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC] truncate" title={zone.location}>{zone.location}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-current ${zone.color}`}>
                          {t(`brief.risk.${zone.risk.toLowerCase()}`) || `${zone.risk} Risk`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 h-fit sticky top-24 transition-colors print:border-gray-300">
          <h3 className="text-xl font-black uppercase tracking-widest text-[#111827] dark:text-[#F8FAFC] mb-6 flex items-center gap-2 border-b-2 border-[#E5E7EB] dark:border-[#334155] pb-4 transition-colors">
            <FileText className="text-[#0F4C81] dark:text-blue-400 shrink-0" /> {t('brief.dailyBrief') || 'Daily Police Brief'}
          </h3>
          
          <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-6 border border-[#E5E7EB] dark:border-[#334155] relative overflow-hidden transition-colors print:border-gray-300 print:bg-white">
            <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 text-[#0F4C81] dark:text-blue-400">
              <Calendar size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="px-3 py-1 bg-[#0F4C81] text-white text-[10px] font-black uppercase tracking-widest border border-[#0F4C81] dark:border-blue-900 transition-colors">
                  {t('brief.todaysPlan') || "Today's AI Plan"}
                </span>
                <span className="text-[#111827] dark:text-[#F8FAFC] font-bold text-sm tracking-wide">{dateStr}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#FEF2F2] dark:bg-red-900/20 border border-[#FECACA] dark:border-red-900 p-4 text-center transition-colors shadow-sm print:bg-red-50 print:border-red-200">
                  <div className="text-4xl font-black text-[#DC2626] dark:text-red-500 mb-1">{data?.daily_brief?.stats?.critical_hotspots || 0}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-gray-400 uppercase tracking-widest font-black">{t('brief.criticalZones') || 'Critical Zones'}</div>
                </div>
                <div className="bg-[#EAF4FF] dark:bg-blue-900/20 border border-[#B6D4FE] dark:border-blue-900 p-4 text-center transition-colors shadow-sm print:bg-blue-50 print:border-blue-200">
                  <div className="text-4xl font-black text-[#0F4C81] dark:text-blue-500 mb-1">{data?.daily_brief?.stats?.officers_available || 0}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-gray-400 uppercase tracking-widest font-black">{t('brief.officersReq') || 'Officers Reqd'}</div>
                </div>
              </div>
              
              <div className="bg-[#16A34A] dark:bg-green-600 border border-[#16A34A] dark:border-green-600 p-5 mb-6 transition-colors print:bg-green-50 print:border-green-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-white shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-1">{t('brief.expectedImprovement') || 'Expected Improvement'}</h4>
                    <p className="text-white text-3xl font-black mb-1">{data?.daily_brief?.stats?.projected_improvement || 0}% <span className="text-xs font-bold uppercase tracking-widest text-green-200">{t('brief.reduction') || 'reduction in violations'}</span></p>
                    <p className="text-green-100 text-xs font-medium">
                      {t('brief.reductionDetails') || `If recommended deployments are strictly followed. Projected ${data?.daily_brief?.stats?.violations_prevented_weekly} violations prevented per week.`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 border-t border-[#E5E7EB] dark:border-[#334155] pt-6 transition-colors print:border-gray-200">
                <h4 className="text-[#111827] dark:text-[#F8FAFC] font-black uppercase tracking-widest text-sm mb-4">{t('brief.keyDirectives') || 'Key Directives:'}</h4>
                {data?.daily_brief?.deployment_recommendations?.slice(0, 3).map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-[#475569] dark:text-gray-300 bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] p-3 shadow-sm">
                    <div className="flex items-center justify-center w-5 h-5 bg-[#0F4C81] dark:bg-blue-600 text-white font-bold text-xs shrink-0">{idx + 1}</div>
                    <div className="leading-snug">
                      <span className="font-bold text-[#111827] dark:text-[#F8FAFC]">Deploy {rec.officers} officers to {rec.location}.</span>{' '}
                      {rec.reason.split('·')[0]}
                    </div>
                  </div>
                )) || (
                  <div className="text-sm text-[#475569] dark:text-gray-400 italic font-medium p-4 border border-dashed border-[#CBD5E1] dark:border-[#475569] text-center">No directives available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
