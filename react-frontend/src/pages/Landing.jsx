import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  MapPin, 
  TrendingUp, 
  Users, 
  Activity,
  Menu,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { AnimatedRoadmap } from "../components/ui/animated-roadmap";

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] font-sans text-[#333333] dark:text-[#F8FAFC] selection:bg-[#0B3D91] selection:text-white transition-colors">
      {/* ── NAVBAR ── */}
      <nav className="border-b border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center text-2xl font-black tracking-widest uppercase">
            <span className="text-[#0f172a] dark:text-[#F8FAFC]">Little</span>
            <span className="text-[#0B3D91] dark:text-[#38BDF8]">Cam</span>
          </div>
          
          <div className="hidden lg:flex space-x-8 text-xs font-bold uppercase tracking-widest text-[#333333] dark:text-gray-300">
            <a href="#" className="text-[#0B3D91] dark:text-[#38BDF8] border-b-2 border-[#0B3D91] dark:border-[#38BDF8] pb-1">{t('nav.home')}</a>
            <a href="#about" className="hover:text-[#0B3D91] dark:hover:text-[#38BDF8] transition-colors pb-1">{t('nav.about')}</a>
            <a href="#footer" className="hover:text-[#0B3D91] dark:hover:text-[#38BDF8] transition-colors pb-1">{t('nav.contact')}</a>
          </div>

          <div className="lg:hidden">
            <button 
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#0B3D91] dark:hover:text-[#38BDF8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full bg-white dark:bg-[#0F172A] border-b border-gray-200 dark:border-[#1E293B] flex flex-col p-4 space-y-4 shadow-xl z-40 text-xs font-bold uppercase tracking-widest">
            <a href="#" onClick={() => setMobileMenuOpen(false)} className="text-[#0B3D91] dark:text-[#38BDF8]">{t('nav.home')}</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-[#333333] dark:text-[#F8FAFC]">{t('nav.about')}</a>
            <a href="#footer" onClick={() => setMobileMenuOpen(false)} className="text-[#333333] dark:text-[#F8FAFC]">{t('nav.contact')}</a>
          </div>
        )}
      </nav>

      <main id="main">
        {/* ── HERO SECTION ── */}
        <section className="bg-[#F8FAFC] dark:bg-[#020617] border-b border-gray-200 dark:border-[#1E293B] py-16 md:py-24 transition-colors relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left relative z-20">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0F4C81] dark:text-blue-400 tracking-tighter mb-6 leading-tight">
                  {t('landing.hero.title')} <br className="hidden md:block" /> {t('landing.hero.subtitle')}
                </h1>
                <p className="text-lg md:text-xl text-[#64748B] dark:text-gray-400 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-medium">
                  {t('landing.hero.desc')}
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                  <button 
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="bg-[#0F4C81] dark:bg-blue-600 hover:bg-[#0B3D91] dark:hover:bg-blue-700 text-white px-8 py-4 text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C81] dark:focus-visible:outline-blue-400 shadow-sm border border-[#0F4C81] dark:border-blue-600"
                  >
                    {t('landing.btn.viewDashboard')} <TrendingUp size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
              
              <div className="relative z-10 w-full flex justify-center">
                <AnimatedRoadmap
                  milestones={[]}
                  mapImageSrc="https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-SsfjxCJh43Hr1dqzkbFWUGH3ICZQbH.png&w=320&q=75"
                  aria-label="Animated roadmap showing LittleCam AI pipeline stages"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── ABOUT SECTION (Consolidated) ── */}
        <section id="about" className="py-16 md:py-24 bg-white dark:bg-[#020617] transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Intro */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0B3D91] dark:text-blue-400 mb-6">{t('landing.about.title')}</h2>
              <div className="w-16 h-1 bg-[#FF9933] mx-auto mb-8"></div>
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed font-medium">
                {t('landing.about.desc')}
              </p>
            </div>

            {/* A) Platform Features */}
            <div className="mb-20">
              <h3 className="text-xl font-black uppercase tracking-widest text-[#0B3D91] dark:text-blue-400 mb-8 border-b-2 pb-4 border-gray-200 dark:border-[#1E293B]">{t('landing.features.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: <MapPin />, title: t('landing.features.1.title'), desc: t('landing.features.1.desc') },
                  { icon: <Activity />, title: t('landing.features.2.title'), desc: t('landing.features.2.desc') },
                  { icon: <TrendingUp />, title: t('landing.features.3.title'), desc: t('landing.features.3.desc') },
                  { icon: <Users />, title: t('landing.features.4.title'), desc: t('landing.features.4.desc') }
                ].map((feature, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-[#0F172A] p-6 border border-gray-200 dark:border-[#1E293B]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-[#0B3D91] dark:bg-blue-600 text-white flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <h4 className="text-lg font-bold text-[#333333] dark:text-[#F8FAFC]">{feature.title}</h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* C) Impact */}
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest text-[#0B3D91] dark:text-blue-400 mb-8 border-b-2 pb-4 border-gray-200 dark:border-[#1E293B]">{t('landing.impact.title')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#0B3D91] dark:bg-[#0F172A] text-white p-6 border border-[#082a63] dark:border-[#1E293B]">
                  <div className="text-4xl font-extrabold text-[#FF9933] mb-2">{Math.floor((data?.daily_brief?.stats?.total_violations_analyzed || 50000) / 1000)}K+</div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-blue-100 dark:text-gray-400">{t('landing.impact.1')}</div>
                </div>
                <div className="bg-[#0B3D91] dark:bg-[#0F172A] text-white p-6 border border-[#082a63] dark:border-[#1E293B]">
                  <div className="text-4xl font-extrabold text-[#FF9933] mb-2">{Math.floor((data?.daily_brief?.stats?.total_hotspots || 120) / 10) * 10}+</div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-blue-100 dark:text-gray-400">{t('landing.impact.2')}</div>
                </div>
                <div className="bg-[#0B3D91] dark:bg-[#0F172A] text-white p-6 border border-[#082a63] dark:border-[#1E293B]">
                  <div className="text-4xl font-extrabold text-[#FF9933] mb-2">{Math.floor(data?.daily_brief?.stats?.projected_improvement || 35)}%</div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-blue-100 dark:text-gray-400">{t('landing.impact.3')}</div>
                </div>
                <div className="bg-[#0B3D91] dark:bg-[#0F172A] text-white p-6 border border-[#082a63] dark:border-[#1E293B]">
                  <div className="text-2xl font-extrabold text-[#FF9933] mb-2 leading-tight py-1">{t('landing.impact.4.title')}</div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-blue-100 dark:text-gray-400 mt-1">{t('landing.impact.4')}</div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer id="footer" className="bg-[#111827] dark:bg-[#0F172A] text-gray-300 pt-16 pb-8 border-t-[6px] border-[#0B3D91] dark:border-blue-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-12 text-center md:text-left">
            <div>
              <div className="text-white text-2xl font-bold mb-1 tracking-tight">LittleCam</div>
              <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
                {t('footer.title')}
              </p>
            </div>
            <div>
              <div className="text-white font-medium flex items-center justify-center md:justify-start gap-2">
                <Shield size={18} className="text-[#FF9933]"/> 
                {t('footer.astram')}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 dark:border-[#1E293B] pt-8 text-center text-xs text-gray-500">
            <p>{t('footer.disclaimer')}</p>
            <p className="mt-2">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
