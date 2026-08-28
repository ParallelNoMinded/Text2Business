import React from 'react';
import { SCENARIO_PRESETS } from '../scenarios';
import { Play, RotateCcw, Mail, PhoneCall, Send, Globe, Clock } from 'lucide-react';
import { cardClass, inputClass, labelClass, primaryBtnClass } from '../theme';

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
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

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
    <div id="scenario-runner-panel" className={cardClass(isDark, 'p-4 sm:p-5')}>
      <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-[#2C3139]' : 'border-[#E6E8EC]'}`}>
        <div>
          <h2 className="text-sm font-extrabold">Обращение</h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Выберите готовый сценарий или введите сообщение
          </p>
        </div>
        <button
          id="reset-input-btn"
          type="button"
          onClick={onResetInput}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border rounded-full ${
            isDark ? 'border-[#3A404A] hover:bg-white/5' : 'border-[#E6E8EC] hover:bg-zinc-50'
          }`}
        >
          <RotateCcw className="h-3 w-3" />
          Сброс
        </button>
      </div>

      <div className="my-4 space-y-1.5">
        <label className={labelClass(isDark)}>Быстрые кейсы</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-pill-${preset.id}`}
                onClick={() => onSelectPreset(preset.id)}
                className={`text-left px-3 py-2.5 rounded-2xl border text-xs transition ${
                  isSelected
                    ? 'bg-zinc-700 border-zinc-700 text-white'
                    : isDark
                    ? 'bg-[#121417] border-[#2C3139] text-zinc-300 hover:border-zinc-500'
                    : 'bg-[#F7F8FA] border-[#E6E8EC] text-zinc-700 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold">{preset.code}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${
                      preset.id === 'tc-04'
                        ? isSelected
                          ? 'bg-white/20 text-white'
                          : isDark
                          ? 'bg-white/10 text-zinc-400'
                          : 'bg-zinc-100 text-zinc-600'
                        : isSelected
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-white/10 text-zinc-400'
                        : 'bg-white text-zinc-500'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <span className={`text-[10px] line-clamp-2 mt-1 ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                  {preset.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass(isDark)}>Канал связи</label>
            <div className="relative">
              <select
                id="channel-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className={inputClass(isDark, 'appearance-none pr-8')}
              >
                <option value="email">Email</option>
                <option value="call_transcript">Транскрипт звонка</option>
                <option value="telegram">Telegram</option>
                <option value="portal">Сервисный портал</option>
              </select>
              <div className={`absolute right-3 top-2.5 pointer-events-none ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {getChannelIcon(channel)}
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass(isDark)}>Время получения</label>
            <div className="relative">
              <input
                id="incoming-time-input"
                type="text"
                value={incomingTime}
                onChange={(e) => setIncomingTime(e.target.value)}
                className={inputClass(isDark, 'pr-8')}
              />
              <Clock className={`absolute right-3 top-2.5 h-3.5 w-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass(isDark)}>Текст обращения</label>
            <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Ctrl + Enter</span>
          </div>
          <textarea
            id="raw-text-input"
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите неструктурированный текст обращения..."
            className={inputClass(isDark, 'resize-none leading-relaxed')}
          />
        </div>

        <button
          id="run-dispatch-btn"
          type="button"
          onClick={onRunDispatch}
          disabled={isLoading || !rawText.trim()}
          className={primaryBtnClass('w-full py-3')}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Обработка...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Запустить диспетчеризацию
            </>
          )}
        </button>
      </div>
    </div>
  );
};
