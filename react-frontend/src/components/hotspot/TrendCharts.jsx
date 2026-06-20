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

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const risk = val > 150 ? 'High' : val > 80 ? 'Medium' : 'Low';
    return (
      <div className={`p-4 border ${isDark ? 'bg-[#0F172A] border-[#334155] text-[#F8FAFC]' : 'bg-white border-[#E5E7EB] text-[#111827]'}`}>
        <p className="font-bold border-b pb-2 mb-2 border-inherit uppercase tracking-widest text-xs text-[#64748B] dark:text-gray-400">{label}</p>
        <p className="text-sm mb-1"><span className="text-[#64748B] dark:text-gray-400">Violations:</span> <span className="font-black text-lg ml-1">{val}</span></p>
        <p className="text-sm"><span className="text-[#64748B] dark:text-gray-400">Risk Level:</span> <span className={`font-black uppercase ml-1 ${risk === 'High' ? 'text-[#DC2626] dark:text-red-500' : risk === 'Medium' ? 'text-[#F59E0B] dark:text-amber-500' : 'text-[#10B981] dark:text-emerald-500'}`}>{risk}</span></p>
      </div>
    );
  }
  return null;
};

/**
 * Renders the three trend charts for a specific hotspot (Weekly Trend, Vehicle Breakdown, Time Heatmap).
 * @param {Object} props
 * @param {Array} props.weeklyTrend - Data for weekly trend area chart
 * @param {Array} props.vehicleTypes - Data for vehicle types pie chart
 * @param {Array} props.timeDistribution - Data for time distribution bar chart
 * @returns {JSX.Element}
 */
export default function TrendCharts({ weeklyTrend, vehicleTypes, timeDistribution }) {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E5E7EB';

  const totalVehicles = vehicleTypes.reduce((sum, item) => sum + item.value, 0);
  const totalTime = timeDistribution.reduce((sum, item) => sum + item.count, 0);
  const maxTimeCount = Math.max(...timeDistribution.map(t => t.count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Weekly Trend Area Chart */}
      <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 transition-colors">
        <h3 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mb-6 flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#334155] pb-4">
          <span>{t('hotspot.trend') || 'Weekly Violation Trend'}</span>
        </h3>
        <div className="h-64">
          <div className="sr-only">Area chart showing the weekly trend of parking violations.</div>
          <ResponsiveContainer width="100%" height="100%" aria-hidden="true">
            <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F4C81" stopOpacity={isDark ? 0.6 : 0.3} />
                  <stop offset="95%" stopColor="#0F4C81" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" stroke={textColor} tick={{ fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis stroke={textColor} tick={{ fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
              <RechartsTooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: isDark ? '#334155' : '#E5E7EB', strokeWidth: 2, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="violations"
                stroke="#0F4C81"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorViolations)"
                activeDot={{ r: 6, fill: '#0F4C81', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vehicle Breakdown Donut Chart */}
      <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 transition-colors flex flex-col">
        <h3 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mb-6 border-b border-[#E5E7EB] dark:border-[#334155] pb-4">
          {t('hotspot.breakdown') || 'Vehicle Breakdown'}
        </h3>
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-48 h-48 mb-4">
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
              <span className="text-[#64748B] dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Total</span>
              <span className="text-2xl font-black text-[#111827] dark:text-[#F8FAFC]">{totalVehicles}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%" aria-hidden="true">
              <PieChart>
                <Pie
                  data={vehicleTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {vehicleTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#fff', borderColor: isDark ? '#334155' : '#E5E7EB', color: isDark ? '#F8FAFC' : '#111827', fontWeight: 'bold' }} itemStyle={{ fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-x-2 gap-y-3 mt-auto pt-4 border-t border-[#E5E7EB] dark:border-[#334155]">
            {vehicleTypes.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center text-sm">
                <div className="w-3 h-3 mr-2 shrink-0" style={{ backgroundColor: entry.color }}></div>
                <span className="text-[#475569] dark:text-gray-300 font-medium truncate flex-1">{entry.name}</span>
                <span className="font-bold text-[#111827] dark:text-[#F8FAFC] ml-1">{Math.round((entry.value / totalVehicles) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time Distribution Heatmap (Google Analytics Style) */}
      <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-6 transition-colors flex flex-col">
        <h3 className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC] mb-6 border-b border-[#E5E7EB] dark:border-[#334155] pb-4">
          {t('hotspot.heatmap') || 'Time Distribution'}
        </h3>
        <div className="flex-1 flex flex-col justify-center space-y-5">
          {timeDistribution.map((item, index) => {
            const percentage = totalTime > 0 ? Math.round((item.count / totalTime) * 100) : 0;
            return (
              <div key={item.time} className="w-full">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-[#475569] dark:text-gray-300 uppercase tracking-widest text-xs">{item.time}</span>
                  <span className="font-black text-[#111827] dark:text-[#F8FAFC]">{item.count}</span>
                </div>
                <div className="w-full bg-[#E5E7EB] dark:bg-[#1E293B] h-6 flex relative group overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / maxTimeCount) * 100}%` }}
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
  );
}

TrendCharts.propTypes = {
  weeklyTrend: PropTypes.array.isRequired,
  vehicleTypes: PropTypes.array.isRequired,
  timeDistribution: PropTypes.array.isRequired,
};
