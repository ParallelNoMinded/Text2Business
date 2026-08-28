import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Карусель графы журнала для узкого экрана.
 *
 * Применяется только на телефоне и планшете: там строка на шесть колонок
 * либо сжимается в нечитаемый столбик, либо уезжает в горизонтальную
 * прокрутку таблицы без всяких признаков, что справа что-то есть.
 * Карточка с прилипанием даёт понятную единицу листания, а точки под
 * лентой показывают, сколько записей в графе и где диспетчер находится.
 *
 * На широком мониторе компонент не используется — прятать данные за
 * прокрутку там было бы потерей информации, а не упрощением.
 *
 * Точки одновременно служат кнопками перехода: свайп доступен не всем,
 * и лента должна листаться с клавиатуры и мышью.
 */
interface SwipeRailProps {
  /** Название графы для программ чтения с экрана. */
  label: string;
  /** Число карточек: по нему считается позиция и рисуются точки. */
  count: number;
  children: React.ReactNode;
  className?: string;
}

export const SwipeRail: React.FC<SwipeRailProps> = ({ label, count, children, className = '' }) => {
  const railRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [index, setIndex] = useState(0);

  // Позиция считается по прокрутке: карточки равной ширины, поэтому
  // достаточно арифметики, без наблюдателя пересечений.
  const readIndex = useCallback(() => {
    const el = railRef.current;
    if (!el || count === 0) return;

    const perCard = el.scrollWidth / count;
    if (perCard <= 0) return;

    const next = Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / perCard)));
    setIndex((prev) => (prev === next ? prev : next));
  }, [count]);

  const handleScroll = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      readIndex();
    });
  }, [readIndex]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    },
    []
  );

  // Состав графы изменился — позиция пересчитывается, чтобы точка не
  // осталась на записи, которой больше нет.
  useEffect(() => {
    readIndex();
  }, [count, readIndex]);

  const scrollToCard = (target: number) => {
    const el = railRef.current;
    if (!el || count === 0) return;

    el.scrollTo({ left: (el.scrollWidth / count) * target, behavior: 'smooth' });
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div ref={railRef} onScroll={handleScroll} className="swipe-rail" role="group" aria-label={label}>
        {children}
      </div>

      {count > 1 && (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToCard(i)}
              aria-label={`Показать запись ${i + 1} из ${count}`}
              aria-current={i === index ? 'true' : undefined}
              className="flex items-center justify-center p-2"
            >
              <span className="swipe-dot" data-active={i === index ? 'true' : 'false'} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
