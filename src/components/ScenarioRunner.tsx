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
      className={`rounded-2xl p-4 sm:p-5 transition-all border ${
        isDark
          ? 'bg-[#1C1B1B] border-[#2A2A2A] shadow-[0_8px_24px_rgba(0,0,0,0.7)] text-white'
          : 'bg-white border-slate-300 shadow-sm text-slate-900'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${isDark ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-blue-900'}`}></span>
            <h2 className={`text-xs font-mono font-extrabold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-950'}`}>
              Обращение
            </h2>
          </div>
          <p className={`text-xs mt-0.5 font-sans ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
            Выберите пресет быстрой загрузки или введите сообщение
          </p>
        </div>

        {/* Reset Button */}
        <button
          id="reset-input-btn"
          type="button"
          onClick={onResetInput}
          className={`flex items-center space-x-1 px-2.5 py-1 text-[11px] font-mono border rounded-lg transition ${
              isDark
                ? 'text-slate-300 bg-[#222222] border-[#2A2A2A] hover:border-cyan-500/30 hover:text-white'
                : 'text-slate-700 hover:text-blue-950 bg-slate-100 hover:bg-slate-200 border-slate-300 font-bold'
            }`}
          title="Сбросить введенные данные к значениям пресета"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Сброс</span>
        </button>
      </div>

      {/* Preset Pills */}
      <div className="my-3 space-y-1.5">
        <label
          className={`block text-[10px] font-mono font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-blue-950'
          }`}
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
                className={`text-left px-3 py-2 rounded-xl border text-xs font-mono transition-all flex flex-col justify-between ${
                  isSelected
                    ? isDark
                      ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)] ring-1 ring-cyan-500/40'
                      : 'bg-blue-900 border-blue-950 text-white font-extrabold ring-1 ring-blue-900 shadow-sm'
                    : isDark
                    ? 'bg-[#1C1B1B] border-[#2A2A2A] text-slate-300 hover:border-cyan-500/40 hover:text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-blue-900 hover:bg-slate-100 font-semibold'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{preset.code}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                      preset.id === 'tc-04'
                        ? isDark
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-rose-100 text-rose-950 border border-rose-300 font-extrabold'
                        : isSelected
                        ? isDark
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-blue-800 text-white'
                        : isDark
                        ? 'bg-slate-700/30 text-slate-400'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <span className={`text-[10px] truncate mt-1 ${isSelected && !isDark ? 'text-blue-100' : 'text-slate-500'}`}>
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
              className={`block text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${
                isDark ? 'text-cyan-400' : 'text-blue-950'
              }`}
            >
              Канал связи
            </label>
            <div className="relative">
              <select
                id="channel-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none appearance-none pr-8 ${
                  isDark
                    ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white focus:border-cyan-400'
                    : 'bg-slate-50 border-slate-300 text-blue-950 font-bold focus:border-blue-900'
                }`}
              >
                <option value="email">Email (Электронная почта)</option>
                <option value="call_transcript">
                  Транскрипт звонка (Call Transcript)
                </option>
                <option value="telegram">Telegram Бот / Чат</option>
                <option value="portal">Сервисный Веб-Портал</option>
              </select>
              <div className={`absolute right-2.5 top-2.5 pointer-events-none ${isDark ? 'text-cyan-500' : 'text-blue-900'}`}>
                {getChannelIcon(channel)}
              </div>
            </div>
          </div>

          <div>
            <label
              className={`block text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${
                isDark ? 'text-cyan-400' : 'text-blue-950'
              }`}
            >
              Время получения (Timestamp)
            </label>
            <div className="relative">
              <input
                id="incoming-time-input"
                type="text"
                value={incomingTime}
                onChange={(e) => setIncomingTime(e.target.value)}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none pr-8 ${
                  isDark
                    ? 'bg-[#1C1B1B] border-[#2A2A2A] text-white focus:border-cyan-400'
                    : 'bg-slate-50 border-slate-300 text-blue-950 font-bold focus:border-blue-900'
                }`}
              />
              <Clock className={`absolute right-2.5 top-2 h-3.5 w-3.5 pointer-events-none ${isDark ? 'text-cyan-500' : 'text-blue-900'}`} />
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              className={`block text-[10px] font-mono font-bold uppercase tracking-wider ${
                isDark ? 'text-cyan-400' : 'text-blue-950'
              }`}
            >
              Текст входящего обращения
            </label>
            <span
              className={`text-[10px] font-mono ${
                isDark ? 'text-slate-400' : 'text-slate-700 font-bold'
              }`}
            >
              Ctrl + Enter для запуска
            </span>
          </div>
          <textarea
            id="raw-text-input"
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите неструктурированный текст обращения..."
            className={`w-full border rounded-xl p-4 text-sm placeholder-slate-400 focus:outline-none font-sans leading-relaxed shadow-inner resize-none ${
              isDark
                ? 'bg-[#1C1B1B] border-[#2A2A2A] text-slate-100 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-300 text-slate-900 font-semibold focus:border-blue-900'
            }`}
          />
        </div>

        {/* Primary CTA Button */}
        <button
          id="run-dispatch-btn"
          type="button"
          onClick={onRunDispatch}
          disabled={isLoading || !rawText.trim()}
          className={`w-full font-extrabold py-4 px-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition transform active:scale-[0.99] ${
            isDark
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_10px_40px_rgba(34,211,238,0.12)]'
              : 'bg-blue-900 hover:bg-blue-950 text-white shadow-blue-900/20'
          } ${isLoading || !rawText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                ▶ ЗАПУСТИТЬ AI-ДИСПЕТЧЕРИЗАЦИЮ (Ctrl+Enter)
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
