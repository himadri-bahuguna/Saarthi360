import React from 'react';
import { getStatusColors, getStatusLabel } from '../../utils/businessLogic.ts';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  label?: string;
}

export function StatusBadge({ status, size = 'md', label }: StatusBadgeProps) {
  const colors = getStatusColors(status);
  const displayLabel = label || getStatusLabel(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${colors.bg} ${colors.text} border ${colors.border}`}>
      {displayLabel}
    </span>
  );
}
