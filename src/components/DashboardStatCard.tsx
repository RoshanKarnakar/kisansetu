import React from 'react';

interface DashboardStatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  label,
  value,
  detail,
  icon,
  onClick,
  className = '',
}) => {
  const content = (
    <>
      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl sm:text-3xl font-black text-[#1B5E3C]">{value}</div>
      {detail && <div className="text-[11px] text-gray-500 mt-1">{detail}</div>}
    </>
  );

  const sharedClassName = `bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-left ${onClick ? 'hover:border-emerald-400 transition-colors cursor-pointer' : ''} ${className}`;

  return onClick ? (
    <button type="button" onClick={onClick} className={sharedClassName}>
      {content}
    </button>
  ) : (
    <div className={sharedClassName}>{content}</div>
  );
};