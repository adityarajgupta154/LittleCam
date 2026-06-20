import { motion, animate } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const AnimatedNumber = ({ value, suffix, isFloat }) => {
  const [display, setDisplay] = useState("0");
  
  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => {
        let formatted = isFloat ? v.toFixed(1) : Math.floor(v).toLocaleString();
        setDisplay(formatted);
      }
    });
    return controls.stop;
  }, [value, isFloat]);

  return <>{display}{suffix}</>;
};

/**
 * KPI Grid component for Dashboard displaying 5 top-level metrics.
 * @param {Object} props
 * @param {Array} props.kpiData - Array of KPI objects to display
 * @returns {JSX.Element}
 */
export default function KPIGrid({ kpiData }) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpiData.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] p-5 relative overflow-hidden transition-colors"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20">
            <kpi.icon size={48} className={kpi.color.split(' ')[0]} />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-[#64748B] dark:text-gray-400 font-bold uppercase tracking-widest">
              {t(kpi.title)}
            </p>
            <h3 className={`text-4xl font-black mt-3 tracking-tighter ${kpi.color}`}>
              {kpi.rawValue !== undefined ? (
                <AnimatedNumber value={kpi.rawValue} suffix={kpi.suffix} isFloat={kpi.isFloat} />
              ) : (
                kpi.value
              )}
            </h3>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

KPIGrid.propTypes = {
  kpiData: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      icon: PropTypes.elementType.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
};
