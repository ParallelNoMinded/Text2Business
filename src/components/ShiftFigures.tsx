import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Сводка смены — сигнатурный элемент рабочего места.
 *
 * Иерархия держится на масштабе, а не на цвете: моноширинная цифра
 * кеглем около 56px рядом с подписью в 15px даёт отношение примерно
 * 3,5:1 при монохромной палитре. Диспетчер с трёх метров видит главное
 * число смены, но и подпись читает без усилия — сама цифра «02» ни о
 * чём не говорит, пока не прочитана графа, к которой она относится.
 *
 * Цвет появляется только там, где он означает состояние: янтарный —
 * срок под угрозой, кирпичный — уже просрочено.
 *
 * Пояснения к показателям в потоке смены не выводятся: диспетчер читает
 * их один раз, а дальше они конкурируют с цифрами за внимание. Текст
 * остаётся доступен по кнопке подсказки — для нового сотрудника и для
 * разбора спорного показателя.
 */

export interface ShiftFigure {
  id: string;
  /** Подпись графы — намеренно мелкая. */
  label: string;
  value: number;
  /** Пояснение: что именно диспетчеру с этим делать. Показывается по запросу. */
  note: string;
  tone?: 'neutral' | 'warn' | 'danger';
}

interface ShiftFiguresProps {
  figures: ShiftFigure[];
  /** Значения, изменившиеся с прошлого обновления — подчёркиваются один раз. */
  changedIds?: string[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}

const toneClass = (tone: ShiftFigure['tone']) => {
  if (tone === 'warn') return 'text-warn';
  if (tone === 'danger') return 'text-danger';
  return 'text-ink';
};

export const ShiftFigures: React.FC<ShiftFiguresProps> = ({
  figures,
  changedIds = [],
  activeId = null,
  onSelect,
}) => {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <section className="flex flex-col" aria-label="Сводка текущей смены">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          aria-pressed={showNotes}
          className="inline-flex items-center gap-1.5 py-1 font-sans text-sm font-semibold text-ink-3 hover:text-accent"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          {showNotes ? 'Скрыть пояснения' : 'Что значат показатели'}
        </button>
      </div>

      <div className="figure-strip">
        {figures.map((f) => {
          const isActive = activeId === f.id;
          const isFilterable = f.value > 0 && !!onSelect;

          const figureBody = (
            <>
              <h3 className="figure-label">{f.label}</h3>

              <p
                className={`figure ${toneClass(f.tone)} ${
                  changedIds.includes(f.id) ? 'value-changed' : ''
                }`}
              >
                {/* Ведущий ноль сохраняем: графа журнала не должна «прыгать». */}
                {String(f.value).padStart(2, '0')}
              </p>

              {showNotes && (
                <p className="font-sans text-[0.9375rem] leading-relaxed text-ink-2">{f.note}</p>
              )}
            </>
          );

          if (!isFilterable) {
            return (
              <article key={f.id} className="figure-cell">
                {figureBody}
              </article>
            );
          }

          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect?.(f.id)}
              aria-pressed={isActive}
              className={`figure-cell figure-cell-action ${isActive ? 'figure-cell-active' : ''}`}
            >
              {figureBody}
              <span className="figure-hint" aria-hidden="true">
                {isActive ? 'Показано · сбросить' : 'Показать эти заявки'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
