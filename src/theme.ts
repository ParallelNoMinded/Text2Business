export const accent = '#52525B';

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function cardClass(isDark: boolean, extra = '') {
  return cn(
    'rounded-2xl border',
    isDark
      ? 'bg-[#1A1D22] border-[#2C3139] text-zinc-100'
      : 'bg-white border-[#E6E8EC] text-zinc-900 shadow-[0_10px_40px_rgba(16,24,40,0.05)]',
    extra
  );
}

export function insetClass(isDark: boolean, extra = '') {
  return cn(
    'rounded-xl border',
    isDark ? 'bg-[#121417] border-[#2C3139]' : 'bg-[#F7F8FA] border-[#E6E8EC]',
    extra
  );
}

export function inputClass(isDark: boolean, extra = '') {
  return cn(
    'w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-500',
    isDark
      ? 'bg-[#121417] border-[#2C3139] text-zinc-100 placeholder:text-zinc-500'
      : 'bg-[#F7F8FA] border-[#E6E8EC] text-zinc-900 placeholder:text-zinc-400',
    extra
  );
}

export function labelClass(isDark: boolean) {
  return cn(
    'block text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5',
    isDark ? 'text-zinc-400' : 'text-zinc-500'
  );
}

export function primaryBtnClass(extra = '') {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full bg-zinc-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50',
    extra
  );
}

export function secondaryBtnClass(isDark: boolean, extra = '') {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition',
    isDark
      ? 'border-[#3A404A] bg-transparent text-zinc-100 hover:bg-white/5'
      : 'border-[#E6E8EC] bg-white text-zinc-900 hover:bg-zinc-50',
    extra
  );
}
