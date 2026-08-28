import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { inputClass, primaryBtnClass, secondaryBtnClass } from '../theme';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ isOpen, onClose, theme }) => {
  const isDark = theme === 'dark';
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSent(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-request-title"
        className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
          isDark ? 'bg-[#1A1D22] border-[#2C3139] text-zinc-100' : 'bg-white border-[#E6E8EC] text-zinc-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 id="demo-request-title" className="text-lg font-extrabold tracking-tight">
              Запросить показ
            </h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Оставьте контакты — покажем диспетчеризацию на ваших сценариях.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 ${isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'}`}
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">
              Заявка принята. Пока можно пройти готовые сценарии на стенде.
            </p>
            <button type="button" className={primaryBtnClass('w-full')} onClick={onClose}>
              Понятно
            </button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <input className={inputClass(isDark)} required placeholder="Имя" name="name" />
            <input className={inputClass(isDark)} required placeholder="Компания" name="company" />
            <input className={inputClass(isDark)} required type="tel" placeholder="Телефон" name="phone" />
            <input className={inputClass(isDark)} required type="email" placeholder="Рабочая почта" name="email" />
            <div className="flex gap-2 pt-1">
              <button type="button" className={secondaryBtnClass(isDark, 'flex-1')} onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className={primaryBtnClass('flex-1')}>
                Отправить
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
