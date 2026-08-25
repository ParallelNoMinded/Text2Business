import React from 'react';
import { SCENARIO_PRESETS } from '../scenarios';
import {
  Play,
  RotateCcw,
  Mail,
  PhoneCall,
  Send,
  Globe,
  Clock,
} from 'lucide-react';

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
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // Keydown listener for Ctrl+Enter / Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        return <Mail className="h-3.5 w-3.5" />;
      case 'call_transcript':
        return <PhoneCall className="h-3.5 w-3.5" />;
      case 'telegram':
        return <Send className="h-3.5 w-3.5" />;
      default:
        return <Globe className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div
      id="scenario-runner-panel"
      className="oc-card p-5"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-oc-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-oc-accent"></span>
            <h2 className="text-xs font-mono uppercase tracking-wider text-oc-accent font-medium">Incoming Request</h2>
          </div>
          <p className="text-xs mt-1 text-oc-secondary">
            Channel, timestamp, message. Preset or custom input.
          </p>
        </div>

        <button
          id="reset-input-btn"
          type="button"
          onClick={onResetInput}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono border border-oc-border rounded-md text-oc-secondary hover:text-oc-text hover:bg-oc-hover transition-all"
          title="Сбросить введенные данные к значениям пресета"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Сброс</span>
        </button>
      </div>

      {/* Preset Pills */}
      <div className="my-4 space-y-2">
        <label
          className={`block text-[10px] font-mono font-medium uppercase tracking-wider text-oc-muted`}
        >
          Быстрые кейсы
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-pill-${preset.id}`}
                onClick={() => onSelectPreset(preset.id)}
                className={`text-left px-3 py-2.5 rounded-md border text-xs font-mono transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-oc-surface border-oc-border-strong text-oc-accent'
                    : 'bg-oc-bg-2 border-oc-border text-oc-secondary hover:text-oc-text hover:bg-oc-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{preset.code}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase ${
                      preset.id === 'tc-04'
                        ? 'bg-oc-critical/20 text-oc-critical border border-oc-critical/30'
                        : isSelected
                        ? 'bg-oc-accent/20 text-oc-accent'
                        : 'bg-oc-bg-3 text-oc-muted'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <span className={`text-[10px] truncate mt-1.5 text-oc-muted`}>
                  {preset.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs Form */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label
              className={`block text-[10px] font-mono font-medium uppercase tracking-wider mb-1.5 text-oc-muted`}
            >
              Канал связи
            </label>
            <div className="relative">
              <select
                id="channel-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full oc-input px-3 py-1.5 text-xs font-mono appearance-none pr-8"
              >
                <option value="email">Email (Электронная почта)</option>
                <option value="call_transcript">
                  Транскрипт звонка (Call Transcript)
                </option>
                <option value="telegram">Telegram Бот / Чат</option>
                <option value="portal">Сервисный Веб-Портал</option>
              </select>
              <div className={`absolute right-2.5 top-2.5 pointer-events-none text-oc-accent`}>
                {getChannelIcon(channel)}
              </div>
            </div>
          </div>

          <div>
            <label
              className={`block text-[10px] font-mono font-medium uppercase tracking-wider mb-1.5 text-oc-muted`}
            >
              Время получения (Timestamp)
            </label>
            <div className="relative">
              <input
                id="incoming-time-input"
                type="text"
                value={incomingTime}
                onChange={(e) => setIncomingTime(e.target.value)}
                className="w-full oc-input px-3 py-1.5 text-xs font-mono pr-8"
              />
              <Clock className={`absolute right-2.5 top-2 h-3.5 w-3.5 pointer-events-none text-oc-accent`} />
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className={`block text-[10px] font-mono font-medium uppercase tracking-wider text-oc-muted`}
            >
              Текст входящего обращения
            </label>
            <span
              className={`text-[10px] font-mono text-oc-muted`}
            >
              Ctrl + Enter для запуска
            </span>
          </div>
          <textarea
            id="raw-text-input"
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите неструктурированный текст обращения..."
            className="w-full oc-input p-3 text-xs placeholder:text-oc-muted font-sans leading-relaxed resize-none"
          />
        </div>

        {/* Primary CTA Button */}
        <button
          id="run-dispatch-btn"
          type="button"
          onClick={onRunDispatch}
          disabled={isLoading || !rawText.trim()}
          className={`w-full h-10 rounded-md bg-oc-accent text-white text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
            isLoading || !rawText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-oc-accent-2 active:bg-oc-accent-3'
          }`}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-xs uppercase tracking-wider font-mono">
                Идет Обработка AI...
              </span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span className="text-xs uppercase tracking-wider font-mono">
                Run AI Dispatch (Ctrl+Enter)
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
