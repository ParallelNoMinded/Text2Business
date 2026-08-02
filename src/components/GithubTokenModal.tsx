import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, CheckCircle, AlertCircle, X, Eye, EyeOff, Zap } from 'lucide-react';

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

  useEffect(() => {
    setInputToken(token);
  }, [token, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const trimmed = inputToken.trim();
      onSaveToken(trimmed);

      // Post to backend config
      const res = await fetch('/api/llm/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed, model: selectedModel }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg(`✅ Токен и модель (${selectedModel}) успешно подключены!`);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setStatusMsg(`⚠️ Сохранено локально.`);
      }
    } catch (err: any) {
      setStatusMsg(`❌ Ошибка передачи: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setInputToken('');
    onSaveToken('');
    fetch('/api/llm/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: '', model: selectedModel }),
    }).catch(() => {});
    setStatusMsg('⚠️ Токен очищен.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
          isDark
            ? 'bg-[#060612] border-cyan-500/40 text-white shadow-[0_0_30px_rgba(34,211,238,0.2)]'
            : 'bg-white border-slate-300 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-mono font-bold">Настройка GITHUB_MODELS_TOKEN</h3>
              <p className="text-xs text-slate-400 font-mono">
                Подключение нейросетей GitHub Models API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 font-mono text-xs">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center space-x-2">
            <Zap className="h-4 w-4 text-cyan-400 flex-shrink-0" />
            <p className="text-cyan-300">
              Активная модель: <span className="font-bold underline">{selectedModel}</span>. По умолчанию
              запрашивается <span className="font-bold">GITHUB_MODELS_TOKEN</span>.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Введите Personal Access Token (GITHUB_MODELS_TOKEN / GITHUB_TOKEN):
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="ghp_... или github_pat_..."
                className={`w-full p-3 pr-10 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-[#030712] border-slate-700 text-cyan-300 focus:ring-cyan-500/50'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Если токен установлен в переменных окружения сервера, поле можно оставить пустым или ввести собственный ключ.
            </p>
          </div>

          {statusMsg && (
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-cyan-300 text-xs">
              {statusMsg}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-700/40 flex items-center justify-between gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition"
          >
            Очистить
          </button>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-white/5 transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg transition flex items-center space-x-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isSaving ? 'Сохранение...' : 'Подключить модель'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
