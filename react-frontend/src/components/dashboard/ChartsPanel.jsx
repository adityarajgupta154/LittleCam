import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

/**
 * Charts Panel containing Line Chart for violations, Pie chart for severity, and Bar chart for hourly patterns.
 * @param {Object} props
 * @param {Array} props.violationTrend - Time series data for violations
 * @param {Array} props.hotspotSeverity - Pie chart data for severity
 * @param {Array} props.hourlyPattern - Bar chart data for hourly distribution
 * @param {JSX.Element} props.executiveSummary - The executive summary component to render in the grid
 * @returns {JSX.Element}
 */
const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className={`p-4 border ${isDark ? 'bg-[#0F172A] border-[#334155] text-[#F8FAFC]' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
        <p className="font-bold border-b pb-2 mb-2 border-inherit uppercase tracking-widest text-xs text-[#64748B] dark:text-gray-400">{label}</p>
        <p className="text-sm"><span className="text-[#64748B] dark:text-gray-400">Violations:</span> <span className="font-black text-lg ml-1 text-[#0F4C81] dark:text-blue-400">{val}</span></p>
      </div>
    );
  }
  return null;
};

export default function ChartsPanel({ violationTrend, hotspotSeverity, hourlyPattern, executiveSummary }) {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E5E7EB';

  const totalHotspots = hotspotSeverity.reduce((sum, item) => sum + item.value, 0);
  const maxHourlyCount = Math.max(...hourlyPattern.map(t => t.count), 1);
  const totalHourly = hourlyPattern.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Violation Trend Line Chart */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 lg:col-span-2 transition-colors">
          <h3 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mb-6 flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#334155] pb-4 uppercase tracking-widest">
            {t('dash.violationTrend')}
          </h3>
          <div className="h-72">
            <div className="sr-only">Area chart showing the daily trend of violations over the selected time period.</div>
            <ResponsiveContainer width="100%" height="100%" aria-hidden="true">
              <AreaChart data={violationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F4C81" stopOpacity={isDark ? 0.6 : 0.3} />
                    <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="time" stroke={textColor} tick={{ fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <YAxis stroke={textColor} tick={{ fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: isDark ? '#334155' : '#E5E7EB', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="violations"
                  stroke="#0F4C81"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTrend)"
                  activeDot={{ r: 6, fill: '#0F4C81', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="lg:col-span-1">
          {executiveSummary}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotspot Severity Pie Chart */}
        {/* Hotspot Severity Donut Chart */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 transition-colors flex flex-col">
          <h3 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mb-6 border-b border-[#E5E7EB] dark:border-[#334155] pb-4 uppercase tracking-widest">
            {t('dash.hotspotDist')}
          </h3>
          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-56 h-56 mb-4">
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <span className="text-[#64748B] dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Total</span>
                <span className="text-3xl font-black text-[#111827] dark:text-[#F8FAFC]">{totalHotspots}</span>
              </div>
              <ResponsiveContainer width="100%" height="100%" aria-hidden="true">
                <PieChart>
                  <Pie
                    data={hotspotSeverity}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                  >
                    {hotspotSeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#fff', borderColor: isDark ? '#334155' : '#E5E7EB', color: isDark ? '#F8FAFC' : '#111827', fontWeight: 'bold' }} itemStyle={{ fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-x-2 gap-y-3 mt-auto pt-4 border-t border-[#E5E7EB] dark:border-[#334155]">
              {hotspotSeverity.map((item) => (
                <div key={item.name} className="flex items-center text-sm">
                  <div className="w-3 h-3 mr-2 shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[#475569] dark:text-gray-300 font-medium truncate flex-1">{item.name}</span>
                  <span className="font-bold text-[#111827] dark:text-[#F8FAFC] ml-1">{Math.round((item.value / totalHotspots) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hourly Pattern Progress Bars */}
        <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 transition-colors flex flex-col">
          <h3 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mb-6 border-b border-[#E5E7EB] dark:border-[#334155] pb-4 uppercase tracking-widest">
            {t('dash.hourlyPattern')}
          </h3>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {hourlyPattern.map((item, index) => {
              const percentage = totalHourly > 0 ? Math.round((item.count / totalHourly) * 100) : 0;
              return (
                <div key={item.hour} className="w-full">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-[#475569] dark:text-gray-300 uppercase tracking-widest text-xs">{item.hour}</span>
                    <span className="font-black text-[#111827] dark:text-[#F8FAFC]">{item.count}</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] dark:bg-[#1E293B] h-6 flex relative group overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxHourlyCount) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.15, ease: "easeOut" }}
                      className="bg-[#0F4C81] dark:bg-blue-600 h-full border-r-2 border-white dark:border-[#0F172A]"
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold text-[#111827] dark:text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md z-10">
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

ChartsPanel.propTypes = {
  violationTrend: PropTypes.array.isRequired,
  hotspotSeverity: PropTypes.array.isRequired,
  hourlyPattern: PropTypes.array.isRequired,
  executiveSummary: PropTypes.node,
};
