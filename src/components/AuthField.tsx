import React from 'react';
import { Check } from 'lucide-react';

interface AuthFieldProps {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  value: string;
  error?: string | null;
  showOk?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export const AuthField: React.FC<AuthFieldProps> = ({
  id,
  label,
  hint,
  placeholder,
  type = 'text',
  autoComplete,
  value,
  error,
  showOk = false,
  disabled,
  onChange,
  onBlur,
}) => {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="flex items-center gap-1.5 text-[12px] font-medium">
        {label}
        {showOk && !error && (
          <Check className="h-3.5 w-3.5 text-[var(--status-success)]" aria-label="Поле заполнено верно" />
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-[11px] text-[var(--oc-muted)]">
          {hint}
        </p>
      )}
      <input
        id={id}
        className={`oc-input ${
          error
            ? 'border-[var(--status-danger)]'
            : showOk
              ? 'border-[var(--status-success)]'
              : ''
        }`}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {error && (
        <p id={`${id}-error`} className="text-[11px] text-[var(--status-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
