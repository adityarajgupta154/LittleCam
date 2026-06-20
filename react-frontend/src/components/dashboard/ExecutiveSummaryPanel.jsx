import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { useLanguage } from '../../context/LanguageContext';

/**
 * AI Executive Summary Panel displaying quick insights and recommendations.
 * @param {Object} props
 * @param {Object} props.summaryData - The summary object containing analyzed/detected counts
 * @param {string} props.topPriorityLocation - The highest priority hotspot location
 * @returns {JSX.Element}
 */
export default function ExecutiveSummaryPanel({ summaryData, topPriorityLocation }) {
  const { t } = useLanguage();

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 transition-colors h-full flex flex-col">
      <h3 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mb-6 flex items-center gap-2 border-b border-[#E5E7EB] dark:border-[#334155] pb-4 uppercase tracking-widest">
        <ShieldAlert size={20} className="text-[#0F4C81] dark:text-blue-400" />{' '}
        {t('dash.aiSummary') || 'Executive Insight'}
      </h3>
      <div className="space-y-4 flex-1">
        <div className="bg-white dark:bg-[#1E293B] border-l-4 border-l-[#0F4C81] border-[#E5E7EB] dark:border-[#334155] p-4 transition-colors">
          <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">
            {t('dash.ai.analyzed') || 'Records Analyzed'}
          </p>
          <p className="text-2xl font-black text-[#111827] dark:text-[#F8FAFC]">
            {summaryData?.total_violations_analyzed?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E293B] border-l-4 border-l-[#DC2626] border-[#E5E7EB] dark:border-[#334155] p-4 transition-colors">
          <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">
            {t('dash.ai.detected') || 'Critical Hotspots Detected'}
          </p>
          <p className="text-2xl font-black text-[#111827] dark:text-[#F8FAFC]">
            {summaryData?.total_hotspots_detected || '0'}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E293B] border-l-4 border-l-[#F59E0B] border-[#E5E7EB] dark:border-[#334155] p-4 transition-colors">
          <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-gray-400 mb-1">
            {t('dash.ai.priority') || 'Top Priority Zone'}
          </p>
          <p className="text-xl font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
            {topPriorityLocation}
          </p>
        </div>
        <div className="bg-[#0F4C81] dark:bg-blue-600 border border-[#0F4C81] dark:border-blue-600 p-4 flex items-start gap-3 mt-auto">
          <CheckCircle2 className="text-white mt-1 shrink-0" size={24} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">
              {t('dash.ai.recommended') || 'AI Recommendation'}
            </p>
            <p className="text-lg font-bold text-white leading-tight">
              Deploy {summaryData?.recommended_officers || '0'} officers immediately
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

ExecutiveSummaryPanel.propTypes = {
  summaryData: PropTypes.shape({
    total_violations_analyzed: PropTypes.number,
    total_hotspots_detected: PropTypes.number,
    recommended_officers: PropTypes.number,
  }),
  topPriorityLocation: PropTypes.string.isRequired,
};
