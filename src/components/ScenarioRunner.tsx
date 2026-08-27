import React from 'react';
import { SCENARIO_PRESETS } from '../scenarios';
import { Play, RotateCcw, Mail, PhoneCall, Send, Globe } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';

interface ScenarioRunnerProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  rawText: string;
  setRawText: (val: string) => void;
  channel: string;
  setChannel: (val: string) => void;
  incomingTime: string;
  setIncomingTime: (val: string) => void;
  isDryRun: boolean;
  setIsDryRun: (val: boolean) => void;
  onRunDispatch: () => void;
  isLoading: boolean;
  onResetInput: () => void;
  theme?: 'dark' | 'light';
}

export const ScenarioRunner: React.FC<ScenarioRunnerProps> = ({
  selectedPresetId,
  onSelectPreset,
  rawText,
  setRawText,
  channel,
  setChannel,
  incomingTime,
  setIncomingTime,
  isDryRun,
  onRunDispatch,
  isLoading,
  onResetInput,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && rawText.trim()) onRunDispatch();
    }
  };

  const ChannelIcon =
    channel === 'email' ? Mail : channel === 'call_transcript' ? PhoneCall : channel === 'telegram' ? Send : Globe;

  return (
    <section id="scenario-runner-panel" className="oc-card" aria-label="Входящее обращение">
      <div className="flex items-center justify-between border-b border-[var(--oc-border)] px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="oc-section-title">Входящее обращение</h2>
          {isDryRun && <StatusBadge tone="warning" label="ЧЕРНОВИК" />}
        </div>
        <button
          id="reset-input-btn"
          type="button"
          onClick={onResetInput}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[var(--oc-muted)] hover:bg-[var(--oc-surface-2)] hover:text-[var(--oc-text)]"
          title="Сбросить к пресету"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Сброс
        </button>
      </div>

      <div className="space-y-2 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {SCENARIO_PRESETS.map((preset) => {
            const selected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-pill-${preset.id}`}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                title={preset.title}
                className={`rounded px-2 py-0.5 font-mono text-[11px] ${
                  selected
                    ? 'bg-[var(--oc-accent-soft)] text-[var(--oc-accent)]'
                    : 'text-[var(--oc-muted)] hover:bg-[var(--oc-surface-2)]'
                }`}
              >
                {preset.code}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Канал</span>
            <div className="relative">
              <select
                id="channel-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="h-8 w-full appearance-none rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 pr-7 text-xs"
              >
                <option value="email">Почта</option>
                <option value="call_transcript">Расшифровка звонка</option>
                <option value="telegram">Telegram</option>
                <option value="portal">Портал</option>
              </select>
              <ChannelIcon className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-[var(--oc-muted)]" />
            </div>
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">Время поступления</span>
            <input
              id="incoming-time-input"
              type="text"
              value={incomingTime}
              onChange={(e) => setIncomingTime(e.target.value)}
              className="h-8 w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 font-mono text-xs"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-0.5 flex items-center justify-between text-[10px] uppercase tracking-wide text-[var(--oc-muted)]">
            Текст обращения
            <span className="normal-case tracking-normal">Ctrl+Enter</span>
          </span>
          <textarea
            id="raw-text-input"
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите неструктурированный текст обращения..."
            className="w-full resize-none rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-2 text-xs leading-relaxed"
          />
        </label>

        <button
          id="run-dispatch-btn"
          type="button"
          onClick={onRunDispatch}
          disabled={isLoading || !rawText.trim()}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--oc-accent-soft)] px-3 text-[12px] font-medium text-[var(--oc-accent)] hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isLoading ? 'Запуск…' : 'Запустить пайплайн'}
        </button>
      </div>
    </section>
  );
};
