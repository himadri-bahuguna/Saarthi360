import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  Icon: LucideIcon;
  colorScheme?: 'blue' | 'red' | 'amber' | 'green' | 'purple' | 'indigo' | 'gray';
  onClick?: () => void;
  trend?: { value: number; label: string };
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', value: 'text-blue-700', border: 'border-blue-100' },
  red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', value: 'text-red-700', border: 'border-red-100' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', value: 'text-amber-700', border: 'border-amber-100' },
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', value: 'text-green-700', border: 'border-green-100' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', value: 'text-purple-700', border: 'border-purple-100' },
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600', value: 'text-indigo-700', border: 'border-indigo-100' },
  gray: { bg: 'bg-gray-50', icon: 'bg-gray-100 text-gray-600', value: 'text-gray-700', border: 'border-gray-100' },
};

export function SummaryCard({ title, value, subtitle, Icon, colorScheme = 'blue', onClick, trend }: SummaryCardProps) {
  const colors = colorMap[colorScheme];

  return (
    <div
      className={`bg-white rounded-xl border ${colors.border} p-5 shadow-sm transition-all duration-150 ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${colors.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.value > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
            </p>
          )}
        </div>
        <div className={`flex-shrink-0 ml-3 p-2.5 rounded-lg ${colors.icon}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
