import React from 'react';
import { SCENARIO_PRESETS } from '../scenarios';
import { RotateCcw, Mail, PhoneCall, Send, Globe, Clock } from 'lucide-react';

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
  onRunDispatch,
  isLoading,
  onResetInput,
}) => {
  // Ctrl+Enter / Cmd+Enter — быстрый запуск разбора
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && rawText.trim()) {
        onRunDispatch();
      }
    }
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'email':
        return <Mail className="h-3.5 w-3.5" aria-hidden="true" />;
      case 'call_transcript':
        return <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />;
      case 'telegram':
        return <Send className="h-3.5 w-3.5" aria-hidden="true" />;
      default:
        return <Globe className="h-3.5 w-3.5" aria-hidden="true" />;
    }
  };

  return (
    <div id="scenario-runner-panel" className="sheet p-4 sm:p-5">
      {/* Шапка бланка */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-rule pb-3">
        <div>
          <h1 className="text-lg font-bold text-ink">Входящее обращение</h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            Выберите готовый случай или впишите текст обращения
          </p>
        </div>

        <button
          id="reset-input-btn"
          type="button"
          onClick={onResetInput}
          className="inline-flex min-h-11 items-center gap-1.5 border border-rule-strong px-3 font-mono text-[11px] uppercase tracking-wider text-ink-2 transition hover:bg-panel-2 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          title="Вернуть поля к значениям выбранного случая"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          <span>Сброс</span>
        </button>
      </div>

      {/* Готовые случаи — корешки картотеки */}
      <div className="my-3">
        <span
          id="preset-group-label"
          className="mb-1.5 block font-sans text-sm font-semibold text-ink-2"
        >
          Готовые случаи
        </span>
        <div
          role="group"
          aria-labelledby="preset-group-label"
          className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-4"
        >
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            const isEscalation = preset.id === 'tc-04';
            return (
              <button
                key={preset.id}
                id={`preset-pill-${preset.id}`}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                aria-pressed={isSelected}
                className={`flex min-h-20 min-w-0 flex-col justify-between gap-1 overflow-hidden px-3 py-3 text-left font-sans text-sm transition ${
                  isSelected
                    ? 'bg-accent text-on-accent'
                    : 'bg-paper text-ink-2 hover:bg-panel-2 hover:text-ink'
                }`}
              >
                <span className="flex min-w-0 items-start justify-between gap-2">
                  <span className="shrink-0 tracking-wider">{preset.code}</span>
                  <span
                    className={`min-w-0 break-words text-right text-xs uppercase leading-snug tracking-wider ${
                      isSelected
                        ? 'text-on-accent/85'
                        : isEscalation
                        ? 'text-attention'
                        : 'text-ink-3'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </span>
                <span
                  className={`block min-w-0 break-words text-sm leading-snug ${isSelected ? 'text-on-accent/90' : 'text-ink-2'}`}
                >
                  {preset.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Графы бланка */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="channel-select"
              className="mb-1 block font-sans text-sm font-semibold text-ink-2"
            >
              Канал связи
            </label>
            <div className="relative">
              <select
                id="channel-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="min-h-11 w-full appearance-none border border-rule bg-paper px-3 pr-8 font-sans text-base text-ink focus:border-rule-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <option value="email">Электронная почта</option>
                <option value="call_transcript">Запись телефонного звонка</option>
                <option value="telegram">Telegram</option>
                <option value="portal">Веб-портал</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3">
                {getChannelIcon(channel)}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="incoming-time-input"
              className="mb-1 block font-sans text-sm font-semibold text-ink-2"
            >
              Время получения
            </label>
            <div className="relative">
              <input
                id="incoming-time-input"
                type="text"
                value={incomingTime}
                onChange={(e) => setIncomingTime(e.target.value)}
                className="min-h-11 w-full border border-rule bg-paper px-3 pr-8 font-sans text-base tabular-nums text-ink focus:border-rule-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              />
              <Clock
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Основная графа — текст обращения */}
        <div>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
            <label
              htmlFor="raw-text-input"
              className="block font-sans text-sm font-semibold text-ink-2"
            >
              Текст обращения
            </label>
            <span className="font-mono text-[10px] text-ink-3">Ctrl + Enter — разобрать</span>
          </div>
          <textarea
            id="raw-text-input"
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Впишите текст обращения…"
            className="w-full resize-none rounded-lg border border-rule bg-paper p-4 text-base leading-relaxed text-ink placeholder:text-ink-3 focus:border-rule-strong focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>

        {/* Действие — печать-штамп «принять в работу» */}
        <button
          id="run-dispatch-btn"
          type="button"
          onClick={onRunDispatch}
          disabled={isLoading || !rawText.trim()}
          aria-busy={isLoading}
          className="flex min-h-12 w-full items-center justify-center gap-2 border border-accent bg-accent px-4 font-sans text-base uppercase tracking-[0.14em] text-on-accent transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isLoading ? (
            <>
              <span
                className="h-3.5 w-3.5 rounded-full border border-current border-t-transparent motion-safe:animate-spin"
                aria-hidden="true"
              />
              <span>Обработка…</span>
            </>
          ) : (
            <span>Разобрать обращение</span>
          )}
        </button>

        <p role="status" aria-live="polite" className="sr-only">
          {isLoading ? 'Обращение обрабатывается, подождите.' : ''}
        </p>
      </div>
    </div>
  );
};
