import React from 'react';

interface DashboardHeroProps {
  tone?: 'forest' | 'cream';
  badge?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  stats?: React.ReactNode;
  actions?: React.ReactNode;
  illustration?: React.ReactNode;
  children?: React.ReactNode;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  tone = 'forest',
  badge,
  title,
  subtitle,
  stats,
  actions,
  illustration,
  children,
}) => {
  const isForest = tone === 'forest';

  return (
    <section
      className={isForest
        ? 'bg-[#1B5E3C] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-700/60 relative overflow-hidden'
        : 'bg-[#FAF6EE] border-b border-[#EFE8D6] overflow-hidden relative'}
    >
      {isForest && <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />}
      <div className={isForest ? 'relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6'}>
        <div className={isForest ? 'relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full' : 'flex flex-col md:flex-row items-center justify-between gap-4'}>
          <div className={isForest ? 'space-y-1.5' : 'text-center md:text-left z-10'}>
            {badge}
            <h1 className={isForest ? 'text-xl sm:text-2xl font-bold tracking-tight text-white' : 'text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#193B26] tracking-tight'}>
              {title}
            </h1>
            {subtitle && (
              <p className={isForest ? 'text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed' : 'mt-1 sm:mt-1.5 text-base sm:text-lg text-[#3E5243] font-medium'}>
                {subtitle}
              </p>
            )}
            {children}
          </div>
          {(stats || actions) && (
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {stats}
              {actions}
            </div>
          )}
          {illustration}
        </div>
      </div>
    </section>
  );
};