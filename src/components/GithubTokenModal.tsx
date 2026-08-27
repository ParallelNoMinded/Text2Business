import React, { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { apiFetch, getDispatchToken, setDispatchToken } from '../api';

interface GithubTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSaveToken: (newToken: string) => void;
  selectedModel: string;
  theme: 'dark' | 'light';
}

function mask(value: string): string {
  if (!value) return 'не задан';
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}

export const GithubTokenModal: React.FC<GithubTokenModalProps> = ({
  isOpen,
  onClose,
  token,
  onSaveToken,
  selectedModel,
}) => {
  const [inputToken, setInputToken] = useState(token);
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
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

      if (data.success) {
        setStatusMsg(`Токен и модель (${selectedModel}) подключены.`);
        setTimeout(() => onClose(), 800);
      } else {
        setStatusMsg('Сохранено локально.');
      }
    } catch (err: any) {
      setStatusMsg(`Ошибка передачи: ${err.message}`);
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
    setStatusMsg('Токен очищен.');
  };

  return (
    <div className="oc-dialog-backdrop" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-dialog-title"
        className="oc-card w-full max-w-md p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 id="token-dialog-title" className="oc-section-title text-[13px]">
              Токены API
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--oc-muted)]">
              Модель {selectedModel}. Значения маскируются, полный секрет не отображается.
            </p>
          </div>
          <button type="button" className="oc-btn h-8 w-8 p-0" onClick={onClose} aria-label="Закрыть диалог">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-2 text-[11px]">
          <label>
            Токен GitHub Models
            <input
              type="password"
              autoComplete="off"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="ghp_… или github_pat_…"
              className="oc-input mt-0.5"
            />
            <span className="mt-0.5 block font-mono text-[10px] text-[var(--oc-muted)]">{mask(inputToken)}</span>
          </label>
          <label>
            X-Dispatch-Token
            <input
              type="password"
              autoComplete="off"
              value={inputDispatchToken}
              onChange={(e) => setInputDispatchToken(e.target.value)}
              className="oc-input mt-0.5"
            />
            <span className="mt-0.5 block font-mono text-[10px] text-[var(--oc-muted)]">
              {mask(inputDispatchToken)} · только sessionStorage
            </span>
          </label>
          {statusMsg && <p className="text-[var(--oc-muted)]">{statusMsg}</p>}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" className="oc-btn" onClick={handleClear}>
            Очистить
          </button>
          <div className="flex gap-1">
            <button type="button" className="oc-btn" onClick={onClose}>
              Отмена
            </button>
            <button type="button" className="oc-btn" onClick={handleSave} disabled={isSaving}>
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {isSaving ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
