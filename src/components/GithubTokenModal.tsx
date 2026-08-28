import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';
import { apiFetch, getDispatchToken, setDispatchToken } from '../api';
import { inputClass, primaryBtnClass, secondaryBtnClass } from '../theme';

interface GithubTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSaveToken: (newToken: string) => void;
  selectedModel: string;
  theme: 'dark' | 'light';
}

export const GithubTokenModal: React.FC<GithubTokenModalProps> = ({
  isOpen,
  onClose,
  token,
  onSaveToken,
  selectedModel,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [inputToken, setInputToken] = useState(token);
  const [showToken, setShowToken] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [inputDispatchToken, setInputDispatchToken] = useState(getDispatchToken());

  useEffect(() => {
    setInputToken(token);
  }, [token, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const trimmed = inputToken.trim();
      onSaveToken(trimmed);
      setDispatchToken(inputDispatchToken);
      const res = await apiFetch('/api/llm/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed, model: selectedModel }),
      });
      const data = await res.json();
      setStatusMsg(data.success ? 'Подключено' : 'Сохранено локально');
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setStatusMsg(`Ошибка: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setInputToken('');
    onSaveToken('');
    apiFetch('/api/llm/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: '', model: selectedModel }),
    }).catch(() => {});
    setStatusMsg('Ключ очищен.');
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-lg rounded-3xl border p-6 ${
          isDark ? 'bg-[#1A1D22] border-[#2C3139] text-white' : 'bg-white border-[#E6E8EC] text-zinc-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-[#2C3139]' : 'border-[#E6E8EC]'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>
              <Key className="h-5 w-5 text-[#52525B]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Вход и модели</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Ключ доступа к модели · {selectedModel}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm">
          <div>
            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Ключ доступа
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="ghp_… или github_pat_…"
                className={inputClass(isDark, 'pr-10')}
              />
              <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-2.5 text-zinc-400">
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={`block font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Служебный ключ стенда
            </label>
            <input
              type="text"
              value={inputDispatchToken}
              onChange={(e) => setInputDispatchToken(e.target.value)}
              placeholder="dev-dispatch-token"
              className={inputClass(isDark)}
            />
          </div>
          {statusMsg && <div className={`p-3 rounded-2xl text-xs ${isDark ? 'bg-white/5' : 'bg-zinc-50'}`}>{statusMsg}</div>}
        </div>

        <div className={`pt-3 border-t flex items-center justify-between gap-3 ${isDark ? 'border-[#2C3139]' : 'border-[#E6E8EC]'}`}>
          <button type="button" onClick={handleClear} className={secondaryBtnClass(isDark)}>
            Очистить
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={secondaryBtnClass(isDark)}>
              Отмена
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving} className={primaryBtnClass()}>
              <ShieldCheck className="h-4 w-4" />
              {isSaving ? 'Сохранение…' : 'Подключить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
