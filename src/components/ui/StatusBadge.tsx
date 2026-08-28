import React from 'react';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASS: Record<StatusTone, string> = {
  success: 'status-success',
  warning: 'status-warning',
  danger: 'status-danger',
  info: 'status-info',
  neutral: 'status-neutral',
};

const DOT_CLASS: Record<StatusTone, string> = {
  success: 'status-dot-success',
  warning: 'status-dot-warning',
  danger: 'status-dot-danger',
  info: 'status-dot-info',
  neutral: 'status-dot-neutral',
};

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  title?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ tone, label, title, className = '' }) => {
  return (
    <span
      title={title || label}
      className={`inline-flex max-w-full items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-snug tracking-wide ${TONE_CLASS[tone]} ${className}`}
      aria-label={title || label}
    >
      <span className={`status-dot ${DOT_CLASS[tone]}`} aria-hidden="true" />
      {label}
    </span>
  );
};
