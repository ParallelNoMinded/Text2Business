import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, CheckCircle, AlertCircle, X, Eye, EyeOff, Zap } from 'lucide-react';
import { apiFetch, getDispatchToken, setDispatchToken } from '../api';

interface GeminiTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSaveToken: (newToken: string) => void;
  selectedModel: string;
  theme: 'dark' | 'light';
}

export const GeminiTokenModal: React.FC<GeminiTokenModalProps> = ({
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
      // Gemini API keys issued by Google AI Studio usually start with "AIza".
      // An empty value restores the key from the server environment.
      const looksLikeGeminiKey = /^AIza[\w-]{20,}$/.test(trimmed);
      onSaveToken(trimmed);
      setDispatchToken(inputDispatchToken);

      const res = await apiFetch('/api/llm/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: trimmed, model: selectedModel }),
      });

      // Ответ может быть не JSON: страница-заглушка прокси, 502 шлюза, HTML 404.
      // Читаем как текст и разбираем сами, чтобы показать причину, а не «Unexpected token».
      const raw = await res.text();
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = null;
        }
      }

      if (data === null) {
        const snippet = raw.trim().slice(0, 120).replace(/\s+/g, ' ');
        setStatusMsg(
          `Сервер вернул не JSON (HTTP ${res.status}, тип «${contentType || 'не указан'}»). ` +
            `Запрос ушёл не на API приложения. Начало ответа: ${snippet || '(пусто)'}`
        );
        return;
      }

      if (res.status === 401) {
        setStatusMsg(
          'HTTP 401: заголовок X-Dispatch-Token неверный. ' +
            'Проверьте значение — по умолчанию dev-dispatch-token, либо env DISPATCH_TOKEN на сервере.'
        );
        return;
      }

      if (!res.ok) {
        setStatusMsg(`HTTP ${res.status}: ${data.error || 'запрос отклонён сервером'}`);
        return;
      }

      if (data.success) {
        setStatusMsg(
          looksLikeGeminiKey || trimmed === ''
            ? `Ключ принят, активная модель — ${data.model || selectedModel}.`
            : `Ключ сохранён, но не похож на ключ Gemini API. При ошибке API система ` +
                `перейдёт на встроенный распознаватель. Обычно ключ Gemini начинается с AIza.`
        );
        if (looksLikeGeminiKey || trimmed === '') {
          setTimeout(() => onClose(), 800);
        }
      } else {
        setStatusMsg(data.message || 'Сервер ответил без признака успеха.');
      }
    } catch (err: any) {
      setStatusMsg(
        `Запрос не дошёл до сервера: ${err?.message || err}. ` +
          'Проверьте, что бэкенд запущен (npm run dev) и обслуживает тот же адрес, что и интерфейс.'
      );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 scrim ">
      <div
        className={`w-full max-w-lg rounded-[2px] border p-6 shadow-2xl transition-all ${
          isDark
            ? 'bg-panel border-accent text-ink'
            : 'bg-panel border-rule text-ink shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rule">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-[2px] bg-accent-bg text-accent border border-accent">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-mono font-bold">Настройка GEMINI_API_KEY</h3>
              <p className="text-xs text-ink-3 font-mono">
                Прямое подключение Google Gemini API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[2px] text-ink-3 hover:text-ink hover:bg-panel-2 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 font-mono text-xs">
          <div className="p-3 rounded-[2px] bg-accent-bg border border-accent flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent flex-shrink-0" />
            <p className="text-accent">
              Активная модель: <span className="font-bold underline">{selectedModel}</span>. По умолчанию
              используется <span className="font-bold">GEMINI_API_KEY</span> сервера.
            </p>
          </div>

          <div>
            <label htmlFor="gemini-key-input" className="mb-1.5 block font-bold text-ink-3">
              Google Gemini API key (GEMINI_API_KEY)
            </label>
            <div className="relative">
              <input
                id="gemini-key-input"
                type={showToken ? 'text' : 'password'}
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="AIza..."
                aria-describedby="gemini-key-hint"
                className={`w-full rounded-[2px] border p-3 pr-12 font-mono text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isDark
                    ? 'bg-panel border-rule text-accent focus-visible:ring-accent focus-visible:ring-offset-paper'
                    : 'bg-panel-2 border-rule text-ink focus-visible:ring-accent focus-visible:ring-offset-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                aria-label={showToken ? 'Скрыть токен' : 'Показать токен'}
                className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[2px] text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <p id="gemini-key-hint" className="mt-1.5 text-[11px] text-ink-3">
              Если токен установлен в переменных окружения сервера, поле можно оставить пустым или ввести собственный ключ.
            </p>
          </div>

          <div>
            <label htmlFor="dispatch-token-input" className="mb-1.5 block font-bold text-ink-3">
              X-Dispatch-Token (заголовок защиты API)
            </label>
            <input
              id="dispatch-token-input"
              type="text"
              value={inputDispatchToken}
              onChange={(e) => setInputDispatchToken(e.target.value)}
              placeholder="dev-dispatch-token"
              aria-describedby="dispatch-token-hint"
              className={`w-full rounded-[2px] border p-3 font-mono text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isDark
                  ? 'bg-panel border-rule text-accent focus-visible:ring-accent focus-visible:ring-offset-paper'
                  : 'bg-panel-2 border-rule text-ink focus-visible:ring-accent focus-visible:ring-offset-white'
              }`}
            />
            <p id="dispatch-token-hint" className="mt-1.5 text-[11px] text-ink-3">
              Значение по умолчанию для прототипа — <span className="font-bold">dev-dispatch-token</span> (переопределяется env <span className="font-bold">DISPATCH_TOKEN</span>). Хранится только в sessionStorage.
            </p>
          </div>

          {statusMsg && (
            <div className="p-3 rounded-[2px] bg-panel border border-rule text-accent text-xs">
              {statusMsg}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-rule flex items-center justify-between gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 rounded-[2px] border border-rule text-ink-3 hover:text-danger hover:border-danger transition"
          >
            Очистить
          </button>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[2px] border border-rule text-ink-3 hover:bg-panel-2 transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-[2px] bg-accent text-on-accent hover:bg-accent-hover font-bold transition-colors flex items-center gap-1.5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
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
