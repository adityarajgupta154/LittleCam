import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Settings, Moon, Sun, BarChart3, Map, ClipboardList, SearchCheck, GitCompare, Route, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const tabs = [
    { id: 'dashboard', path: '/dashboard', icon: BarChart3, label: 'page.commandSummary' },
    { id: 'map', path: '/map', icon: Map, label: 'page.mapView' },
    { id: 'worklist', path: '/worklist', icon: ClipboardList, label: 'page.enforcementWorklist' },
    { id: 'hotspots', path: '/hotspots', icon: SearchCheck, label: 'page.hotspotDetail' },
    { id: 'twin', path: '/twin', icon: GitCompare, label: 'page.digitalTwin' },
    { id: 'patrol', path: '/patrol', icon: Route, label: 'page.patrolRoutes' },
    { id: 'reports', path: '/reports', icon: FileText, label: 'page.riskBrief' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="h-16 border-b border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] flex items-center justify-between px-6 sticky top-0 z-50 transition-colors">
      <div style={{ display: 'flex', alignItems: 'center', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', marginRight: '40px' }}>
        <span className="text-[#111827] dark:text-[#F8FAFC]">Little</span>
        <span className="text-[#0F4C81] dark:text-[#3B82F6]">Cam</span>
      </div>

      <div className="flex gap-1 h-full pt-3 flex-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-[10px] px-4 py-2 border-b-2 font-medium transition-all duration-200 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400 ${
                  isActive
                    ? 'border-[#0F4C81] dark:border-[#3B82F6] text-[#0F4C81] dark:text-[#3B82F6] bg-[#EAF4FF] dark:bg-[#1E293B]'
                    : 'border-transparent text-[#64748B] dark:text-gray-400 hover:text-[#111827] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} className="opacity-80" aria-hidden="true" />
              <span className="hidden lg:inline text-sm">{t(tab.label)}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="flex items-center gap-4 ml-4">
          <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-2 text-gray-500 hover:text-[#111827] dark:text-gray-400 dark:hover:text-[#F8FAFC] transition-colors hover:bg-gray-100 dark:hover:bg-[#1E293B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400"
            title={t('settings.appearance')}
            aria-label={t('settings.appearance') || 'Settings'}
            aria-expanded={settingsOpen}
            aria-haspopup="true"
          >
            <Settings size={20} />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-[#1E293B] shadow-lg py-2 z-50">
              <div className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t('settings.appearance')}
              </div>
              <button 
                type="button"
                onClick={() => toggleTheme('light')}
                aria-pressed={theme === 'light'}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400 ${theme === 'light' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0F4C81] dark:text-blue-400' : 'text-[#333333] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#1E293B]'}`}
              >
                <Sun size={14} aria-hidden="true" /> {t('settings.light')}
              </button>
              <button 
                type="button"
                onClick={() => toggleTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400 ${theme === 'dark' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0F4C81] dark:text-blue-400' : 'text-[#333333] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#1E293B]'}`}
              >
                <Moon size={14} aria-hidden="true" /> {t('settings.dark')}
              </button>

              <div className="border-t border-gray-100 dark:border-[#1E293B] my-2"></div>
              
              <div className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {t('settings.language')}
              </div>
              <button 
                type="button"
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
                className={`w-full text-left px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400 ${language === 'en' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0F4C81] dark:text-blue-400' : 'text-[#333333] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#1E293B]'}`}
              >
                English
              </button>
              <button 
                type="button"
                onClick={() => setLanguage('hi')}
                aria-pressed={language === 'hi'}
                className={`w-full text-left px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400 ${language === 'hi' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0F4C81] dark:text-blue-400' : 'text-[#333333] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#1E293B]'}`}
              >
                हिन्दी
              </button>
              <button 
                type="button"
                onClick={() => setLanguage('kn')}
                aria-pressed={language === 'kn'}
                className={`w-full text-left px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400 ${language === 'kn' ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0F4C81] dark:text-blue-400' : 'text-[#333333] dark:text-[#F8FAFC] hover:bg-gray-50 dark:hover:bg-[#1E293B]'}`}
              >
                ಕನ್ನಡ
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
