import React, { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { FarmerProfile, Language } from '../types';
import { t } from '../i18n';
import farmerBannerImg from '../assets/images/farmer_banner_art_1789481364416.jpg';
import { DashboardHero } from './DashboardHero';

interface WelcomeBannerProps {
  farmer: FarmerProfile;
  language: Language;
  actions?: React.ReactNode;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ farmer, language, actions }) => {
  const [imageLoaded, setImageLoaded] = useState(true);

  const firstName = farmer.name ? farmer.name.split(' ')[0] : 'Rakesh';
  const displayName = language === 'hi' ? (farmer.nameHi ? farmer.nameHi.split(' ')[0] : firstName) : firstName;

  return (
    <DashboardHero
      tone="cream"
      badge={<span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">KisanSetu Farmer Portal</span>}
      title={t(language, 'welcomeGreeting', { name: displayName })}
      subtitle={t(language, 'welcomeSubtitle')}
      illustration={(
        <div className="relative flex-shrink-0 flex items-center justify-center">
          {imageLoaded ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-300/30 to-emerald-400/20 rounded-full blur-sm" />
              <img
                src={farmerBannerImg}
                alt="Farmer with digital tablet"
                onError={() => setImageLoaded(false)}
                className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 object-cover rounded-2xl shadow-sm border border-amber-200/50"
              />
            </div>
          ) : (
            <div className="w-36 h-36 md:w-44 md:h-44 bg-amber-100/70 rounded-2xl border border-amber-200 flex items-center justify-center p-3">
              <svg viewBox="0 0 120 120" className="w-full h-full text-amber-800" fill="none">
                <ellipse cx="85" cy="90" rx="20" ry="16" fill="#D97706" opacity="0.8" />
                <ellipse cx="35" cy="95" rx="18" ry="14" fill="#B45309" opacity="0.8" />
                <rect x="42" y="60" width="36" height="45" rx="8" fill="#F8FAFC" stroke="#334155" strokeWidth="2" />
                <circle cx="60" cy="42" r="14" fill="#FBD5B5" />
                <path d="M46 36 C48 24, 72 24, 74 36 C74 40, 68 44, 60 44 C52 44, 46 40, 46 36 Z" fill="#EA580C" />
                <circle cx="60" cy="30" r="10" fill="#F97316" />
                <rect x="52" y="70" width="22" height="28" rx="3" fill="#1E293B" />
                <rect x="54" y="72" width="18" height="22" rx="2" fill="#22C55E" />
                <path d="M59 83 L63 87 L71 78" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      )}
      actions={actions}
    >
      <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold text-[#2E7D4F]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF5EE] border border-[#CDE5D4]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {language === 'hi' ? 'सीधा बैंक खाता भुगतान (DBT)' : 'Direct Benefit Transfer (DBT)'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5EFE0] border border-[#E5DAC0] text-[#7A5B18]">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {language === 'hi' ? 'शून्य प्रतीक्षा टोकन प्रणाली' : 'Zero-Wait Token System'}
              </span>
            </div>
    </DashboardHero>
  );
};
