import React from 'react';
import { Play, Pause, Radio } from 'lucide-react';
import { StreamPace, PACE_LABEL } from '../demoStream';

interface DemoStreamControlProps {
  isRunning: boolean;
  onToggle: () => void;
  pace: StreamPace;
  onPaceChange: (pace: StreamPace) => void;
  /** Сколько обращений пришло с момента включения потока. */
  deliveredCount: number;
}

const PACES: StreamPace[] = ['calm', 'busy', 'storm'];

/**
 * Пульт демонстрационного потока.
 *
 * Нужен для показа: включает самостоятельный поток обращений, чтобы на защите
 * было видно живой обратный отсчёт срока и проступающие строки журнала без
 * ручного ввода. Оформлен как служебная врезка бланка — тише рабочих граф,
 * потому что диспетчеру в смене он не нужен.
 */
export const DemoStreamControl: React.FC<DemoStreamControlProps> = ({
  isRunning,
  onToggle,
  pace,
  onPaceChange,
  deliveredCount,
}) => {
  return (
    <details className="sheet group px-4 py-3">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 font-sans text-sm font-medium text-ink marker:hidden">
        <Radio
          className={`h-4 w-4 ${isRunning ? 'text-accent' : 'text-ink-3'}`}
          aria-hidden="true"
        />
        <span>Демонстрационный поток</span>
        <span className="ml-auto text-sm text-ink-3">{isRunning ? 'Работает' : 'Настройки'}</span>
      </summary>
      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
      <div className="sr-only flex items-center gap-2">
        <Radio
          className={`h-3.5 w-3.5 ${isRunning ? 'text-accent' : 'text-ink-3'}`}
          aria-hidden="true"
        />
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-3">
          Демо-поток обращений
        </span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isRunning}
        className="inline-flex items-center gap-1.5 border border-rule px-2.5 py-1 text-sm font-medium text-ink transition-colors hover:bg-panel-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {isRunning ? (
          <>
            <Pause className="h-3 w-3" aria-hidden="true" />
            Остановить
          </>
        ) : (
          <>
            <Play className="h-3 w-3" aria-hidden="true" />
            Запустить
          </>
        )}
      </button>

      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Темп демонстрационного потока"
      >
        {PACES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPaceChange(p)}
            aria-pressed={pace === p}
            className={`border px-2 py-1 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              pace === p
                ? 'border-accent bg-accent-bg text-accent'
                : 'border-rule text-ink-3 hover:bg-panel-2'
            }`}
          >
            {PACE_LABEL[p]}
          </button>
        ))}
      </div>

        <span className="ml-auto font-mono text-sm text-ink-3">
          Поступило: <span className="text-ink">{deliveredCount}</span>
        </span>
      </div>
    </details>
  );
};
