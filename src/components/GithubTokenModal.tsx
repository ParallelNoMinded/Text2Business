import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, CheckCircle, AlertCircle, X, Eye, EyeOff, Zap } from 'lucide-react';
import { apiFetch, getDispatchToken, setDispatchToken } from '../api';

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

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const trimmed = inputToken.trim();
      onSaveToken(trimmed);
      setDispatchToken(inputDispatchToken);

      // Post to backend config
      const res = await apiFetch('/api/llm/config', {
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
    apiFetch('/api/llm/config', {
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
            ? 'bg-[#222222] border-cyan-500/40 text-white shadow-[0_0_30px_rgba(34,211,238,0.2)]'
            : 'bg-white border-slate-300 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-700/40' : 'border-slate-200'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/30">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-mono font-bold">Настройка GITHUB_MODELS_TOKEN</h3>
              <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Подключение нейросетей GitHub Models API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 font-mono text-xs">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center space-x-2">
            <Zap className="h-4 w-4 text-cyan-600 flex-shrink-0" />
            <p className={isDark ? 'text-cyan-300' : 'text-cyan-900'}>
              Активная модель: <span className="font-bold underline">{selectedModel}</span>. По умолчанию
              запрашивается <span className="font-bold">GITHUB_MODELS_TOKEN</span>.
            </p>
          </div>

          <div>
            <label className={`block font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
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
                    ? 'bg-[#222222] border-slate-700 text-cyan-300 focus:ring-cyan-500/50'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className={`absolute right-3 top-3 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-blue-950'}`}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className={`mt-1.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Если токен установлен в переменных окружения сервера, поле можно оставить пустым или ввести собственный ключ.
            </p>
          </div>

          <div>
            <label className={`block font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              X-Dispatch-Token (заголовок защиты API):
            </label>
            <input
              type="text"
              value={inputDispatchToken}
              onChange={(e) => setInputDispatchToken(e.target.value)}
              placeholder="dev-dispatch-token"
              className={`w-full p-3 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-[#222222] border-slate-700 text-cyan-300 focus:ring-cyan-500/50'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-blue-500'
              }`}
            />
            <p className={`mt-1.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Значение по умолчанию для прототипа — <span className="font-bold">dev-dispatch-token</span> (переопределяется env <span className="font-bold">DISPATCH_TOKEN</span>). Хранится только в sessionStorage.
            </p>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-slate-800/80 border-slate-700 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-950'}`}>
              {statusMsg}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className={`pt-3 border-t flex items-center justify-between gap-3 font-mono text-xs ${isDark ? 'border-slate-700/40' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={handleClear}
            className={`px-4 py-2 rounded-xl border transition ${isDark ? 'border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/40' : 'border-slate-300 text-slate-700 hover:text-red-700 hover:border-red-400'}`}
          >
            Очистить
          </button>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-white/5' : 'border-slate-300 text-slate-800 hover:bg-slate-100'}`}
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
