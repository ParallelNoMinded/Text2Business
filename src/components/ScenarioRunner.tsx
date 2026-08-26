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
  theme = 'light',
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
        return <Mail className="h-4 w-4" />;
      case 'call_transcript':
        return <PhoneCall className="h-4 w-4" />;
      case 'telegram':
        return <Send className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div
      id="scenario-runner-panel"
      className={`rounded-xl p-5 sm:p-6 border transition-all ${
        isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'
      }`}
    >
      {/* Header Bar */}
      <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-slate-700' : 'border-[#e0e0e0]'}`}>
        <div>
          <h2 className="text-base font-extrabold">Входящее обращение</h2>
          <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
            Выберите сценарий или введите текст вручную
          </p>
        </div>

        {/* Reset Button */}
        <button
          id="reset-input-btn"
          type="button"
          onClick={onResetInput}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg transition ${
            isDark
              ? 'text-slate-300 hover:text-white bg-[#1c1a2e] hover:bg-white/5 border-slate-700'
              : 'text-[#475569] hover:text-black bg-white hover:bg-slate-50 border-[#c8c8c8]'
          }`}
          title="Сбросить введенные данные"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Сброс</span>
        </button>
      </div>

      {/* Preset Pills */}
      <div className="my-4 space-y-2">
        <label className={`block text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
          Сценарии (Кейсы ТЗ)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-pill-${preset.id}`}
                onClick={() => onSelectPreset(preset.id)}
                className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1c1a2e] border-[#2d7a7a] text-white shadow-sm ring-1 ring-[#2d7a7a]'
                      : 'bg-slate-50 border-[#2d7a7a] text-black font-extrabold ring-1 ring-[#2d7a7a]'
                    : isDark
                    ? 'bg-[#1c1a2e] border-slate-700 text-slate-300 hover:border-slate-500'
                    : 'bg-white border-[#e0e0e0] text-[#475569] hover:border-slate-400 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold">{preset.code}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                      preset.id === 'tc-04'
                        ? 'bg-rose-500/20 text-rose-500'
                        : isSelected
                        ? 'bg-[#2d7a7a]/20 text-[#2d7a7a]'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <span className={`text-[11px] truncate mt-1.5 ${isSelected ? (isDark ? 'text-white' : 'text-black font-bold') : 'text-slate-500'}`}>
                  {preset.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
              Канал связи
            </label>
            <div className="relative">
              <select
                id="channel-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:outline-none appearance-none pr-8 ${
                  isDark
                    ? 'bg-[#1c1a2e] border-slate-700 text-white focus:border-[#2d7a7a]'
                    : 'bg-white border-[#c8c8c8] text-black focus:border-[#2d7a7a]'
                }`}
              >
                <option value="email">Email</option>
                <option value="call_transcript">Транскрипт звонка</option>
                <option value="telegram">Telegram</option>
                <option value="portal">Веб-Портал</option>
              </select>
              <div className="absolute right-2.5 top-2.5 pointer-events-none text-slate-400">
                {getChannelIcon(channel)}
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
              Время обращения
            </label>
            <div className="relative">
              <input
                id="incoming-time-input"
                type="text"
                value={incomingTime}
                onChange={(e) => setIncomingTime(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs font-bold focus:outline-none pr-8 ${
                  isDark
                    ? 'bg-[#1c1a2e] border-slate-700 text-white focus:border-[#2d7a7a]'
                    : 'bg-white border-[#c8c8c8] text-black focus:border-[#2d7a7a]'
                }`}
              />
              <Clock className="absolute right-2.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-slate-400" />
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`block text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
              Текст входящего обращения
            </label>
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
              Ctrl + Enter для запуска
            </span>
          </div>
          <textarea
            id="raw-text-input"
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите текст обращения..."
            className={`w-full border rounded-xl p-3.5 text-xs placeholder-slate-400 focus:outline-none leading-relaxed resize-none ${
              isDark
                ? 'bg-[#1c1a2e] border-slate-700 text-white focus:border-[#2d7a7a]'
                : 'bg-white border-[#c8c8c8] text-black focus:border-[#2d7a7a]'
            }`}
          />
        </div>

        {/* Primary CTA Button */}
        <button
          id="run-dispatch-btn"
          type="button"
          onClick={onRunDispatch}
          disabled={isLoading || !rawText.trim()}
          className={`w-full font-extrabold h-[48px] px-5 rounded-xl text-white shadow-sm flex items-center justify-center gap-2 transition ${
            isLoading || !rawText.trim()
              ? 'bg-[#2D7A7A]/50 cursor-not-allowed'
              : 'bg-[#2D7A7A] hover:bg-[#236565]'
          }`}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Идет обработка AI...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span className="text-sm">Запустить обработку (Ctrl+Enter)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
