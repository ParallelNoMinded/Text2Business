import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Zap } from 'lucide-react';
import { AI_ASSISTANTS, findAssistant } from '../aiAssistants';

interface AssistantPickerProps {
  selectedModel: string;
  onSelect: (model: string) => void;
  tokenReady: boolean;
  compact?: boolean;
}

export const AssistantPicker: React.FC<AssistantPickerProps> = ({
  selectedModel,
  onSelect,
  tokenReady,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = findAssistant(selectedModel);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative ${compact ? 'w-full' : ''}`}>
      <button
        id="header-model-dropdown"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Выбрать помощника ИИ"
        title="Доступные помощники ИИ"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex min-h-8 w-full items-center gap-1.5 rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 py-1 text-left text-[11px] text-[var(--oc-text)] hover:border-[var(--oc-accent)] ${
          compact ? '' : 'min-w-[11rem] max-w-[16rem]'
        }`}
      >
        <Zap className="h-3 w-3 shrink-0 text-[var(--oc-accent)]" aria-hidden="true" />
        <span className="min-w-0 flex-1 break-words font-medium">{current.name}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-[var(--oc-muted)]" aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Помощники, которых можно использовать"
          className="absolute right-0 z-[70] mt-1 w-[18rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-md border border-[var(--oc-border)] bg-[var(--oc-surface)] py-1 shadow-lg"
        >
          <li className="px-3 py-1.5 text-[10px] text-[var(--oc-muted)]">
            {tokenReady ? 'Помощники' : 'Нужен токен API'}
          </li>
          {AI_ASSISTANTS.map((item) => {
            const active = item.id === selectedModel;
            return (
              <li key={item.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-2 px-3 py-1.5 text-left hover:bg-[var(--oc-surface-2)] ${
                    active ? 'bg-[var(--oc-accent-soft)]' : ''
                  }`}
                >
                  <Check
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                      active ? 'text-[var(--oc-accent)]' : 'text-transparent'
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-[12px] font-medium text-[var(--oc-text)]">{item.name}</span>
                    <span className="block font-mono text-[10px] text-[var(--oc-muted)]">{item.id}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
