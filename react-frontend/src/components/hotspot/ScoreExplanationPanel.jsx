import { Info } from 'lucide-react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const MetricBar = ({ label, value, max, colorClass, barColorClass, delay }) => {
  const safeValue = value || 0;
  const percentage = Math.min((safeValue / max) * 100, 100);
  
  return (
    <div className="bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] p-4 flex flex-col items-start transition-colors">
      <div className="flex justify-between w-full mb-3">
        <span className="text-[#475569] dark:text-gray-400 font-bold text-xs uppercase tracking-widest">{label}</span>
        <span className={`font-black ${colorClass}`}>
          {safeValue.toFixed(1)} <span className="text-[#94A3B8] dark:text-gray-500 text-xs font-semibold">/ {max}</span>
        </span>
      </div>
      <div className="w-full bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] h-2 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className={`h-full ${barColorClass}`}
        />
      </div>
    </div>
  );
};

/**
 * Displays the breakdown of factors contributing to a hotspot's impact score.
 * @param {Object} props
 * @param {Object} props.scoreBreakdown - Object containing the numerical score factors
 * @returns {JSX.Element}
 */
export default function ScoreExplanationPanel({ scoreBreakdown }) {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 lg:col-span-2 transition-colors flex flex-col">
      <h3 className="text-lg font-semibold text-[#111827] dark:text-[#F8FAFC] mb-6 flex items-center gap-2 border-b border-[#E5E7EB] dark:border-[#334155] pb-4">
        <Info size={20} className="text-[#0F4C81] dark:text-blue-400" />{' '}
        {t('hotspot.explanation') || 'Score Explanation'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
        <MetricBar 
          label="Density" 
          value={scoreBreakdown?.violation_density} 
          max={35} 
          colorClass="text-[#DC2626] dark:text-red-400" 
          barColorClass="bg-[#DC2626] dark:bg-red-500" 
          delay={0.1} 
        />
        <MetricBar 
          label="Landmark Prox" 
          value={scoreBreakdown?.proximity_to_landmark} 
          max={20} 
          colorClass="text-[#0F4C81] dark:text-blue-400" 
          barColorClass="bg-[#0F4C81] dark:bg-blue-500" 
          delay={0.2} 
        />
        <MetricBar 
          label="Peak Effect" 
          value={scoreBreakdown?.peak_hour_effect} 
          max={15} 
          colorClass="text-[#F59E0B] dark:text-amber-400" 
          barColorClass="bg-[#F59E0B] dark:bg-amber-500" 
          delay={0.3} 
        />
        <MetricBar 
          label="Vehicle Severity" 
          value={scoreBreakdown?.vehicle_severity} 
          max={12} 
          colorClass="text-[#FBBF24] dark:text-yellow-400" 
          barColorClass="bg-[#FBBF24] dark:bg-yellow-500" 
          delay={0.4} 
        />
        <MetricBar 
          label="Violation Sev" 
          value={scoreBreakdown?.violation_severity} 
          max={9} 
          colorClass="text-[#8B5CF6] dark:text-purple-400" 
          barColorClass="bg-[#8B5CF6] dark:bg-purple-500" 
          delay={0.5} 
        />
        <MetricBar 
          label="Recurrence" 
          value={scoreBreakdown?.historical_recurrence} 
          max={9} 
          colorClass="text-[#10B981] dark:text-emerald-400" 
          barColorClass="bg-[#10B981] dark:bg-emerald-500" 
          delay={0.6} 
        />
      </div>
    </div>
  );
}

ScoreExplanationPanel.propTypes = {
  scoreBreakdown: PropTypes.shape({
    violation_density: PropTypes.number,
    proximity_to_landmark: PropTypes.number,
    peak_hour_effect: PropTypes.number,
    vehicle_severity: PropTypes.number,
    violation_severity: PropTypes.number,
    historical_recurrence: PropTypes.number,
  }),
};
