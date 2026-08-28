import React, { useState } from 'react';
import { ProcessingResult } from '../types';
import { CheckCircle, ChevronDown, Copy, Check } from 'lucide-react';

interface DispatchCardProps {
  result: ProcessingResult | null;
  commitSuccessMsg: string | null;
  theme?: 'dark' | 'light';
}

/**
 * Бланк принятого решения.
 *
 * Раньше это были три «стеклянные» карточки со свечением и цветными
 * плашками действий. Теперь — графы бланка: подпись слева, значение
 * справа, разделено точечной линией. Цветом помечен только статус,
 * и то сухой рамкой-штампом, а не залитой плашкой.
 */
export const DispatchCard: React.FC<DispatchCardProps> = ({ result, commitSuccessMsg }) => {
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="sheet p-5 text-center font-mono text-xs text-ink-3">
        Обращение ещё не разобрано
      </div>
    );
  }

  const handleCopyReply = () => {
    if (result.customer_response_draft) {
      navigator.clipboard.writeText(result.customer_response_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const ACTION_LABELS: Record<string, string> = {
    CREATE_TICKET: 'Создание заявки',
    UPDATE_TICKET: 'Обновление заявки',
    REQUEST_CLARIFICATION: 'Запрос уточнения',
    ESCALATE_TO_HUMAN: 'Эскалация диспетчеру',
    REJECT: 'Отклонение',
  };

  /**
   * Пометка статуса. Красный — только для настоящей блокировки,
   * янтарный — для ожидания решения диспетчера, чернила — для нормы.
   */
  const statusStamp = (status: string) => {
    if (status === 'AUTO_APPROVED') {
      return <span className="stamp text-accent">Проверок не требует</span>;
    }
    if (status === 'REQUIRES_HUMAN_CONFIRMATION') {
      return <span className="stamp text-warn">Требуется подтверждение</span>;
    }
    return <span className="stamp text-danger">Заблокировано защитой</span>;
  };

  const deadline = result.ticket_payload?.sla_deadline
    ? new Date(result.ticket_payload.sla_deadline).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'не вычисляется';

  return (
    <div id="dispatch-decision-card" className="sheet flex flex-col">
      {/* Заголовок бланка */}
      <div className="flex flex-col justify-between gap-2 border-b border-rule-strong px-4 py-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="font-sans text-lg font-bold text-ink">Принятое решение</h2>
          <p className="mt-1 max-w-prose font-sans text-sm leading-relaxed text-ink-2">
            Составлено по извлечённым фактам и сверке с реестром.
          </p>
        </div>
        <div className="shrink-0">{statusStamp(result.status)}</div>
      </div>

      {/* Графы бланка: три группы в одну сетку, без вложенных карточек. */}
      <div className="grid grid-cols-1 gap-x-10 gap-y-5 px-4 py-4 lg:grid-cols-3">
        <section className="flex flex-col gap-1">
          <h3 className="mb-1 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink-3">
            Действие
          </h3>
          <div className="field-row">
            <span className="font-sans text-sm text-ink-2">Рекомендовано</span>
            <span className="text-right font-sans text-sm font-medium text-ink">
              {ACTION_LABELS[result.recommended_action] ?? result.recommended_action}
            </span>
          </div>
          <div className="field-row">
            <span className="font-sans text-sm text-ink-2">Уверенность</span>
            <span className="font-mono text-xs tabular-nums text-ink">
              {Math.round(result.confidence_score * 100)}%
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <h3 className="mb-1 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink-3">
            Привязка в реестре
          </h3>
          <div className="field-row">
            <span className="font-sans text-sm text-ink-2">Объект</span>
            <span className="text-right font-sans text-sm font-medium text-ink">
              {result.matched_site ? (
                `${result.matched_site.customer_name} (${result.matched_site.site_id})`
              ) : (
                <span className="text-warn">не привязан</span>
              )}
            </span>
          </div>
          <div className="field-row">
            <span className="font-sans text-sm text-ink-2">Адрес</span>
            <span className="text-right font-sans text-sm text-ink">
              {result.matched_site?.address || 'требуется уточнение'}
            </span>
          </div>
          <div className="field-row">
            <span className="font-sans text-sm text-ink-2">Оборудование</span>
            <span className="font-mono text-xs text-ink">
              {result.matched_asset ? result.matched_asset.local_code : 'не определено'}
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <h3 className="mb-1 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink-3">
            Срок по договору
          </h3>
          {/* Без найденного договора условия не подставляются: показывать
              план и неустойку у необслуживаемого контрагента нельзя. */}
          <div className="field-row">
            <span className="font-sans text-sm text-ink-2">План</span>
            <span className="font-sans text-sm font-medium text-ink">
              {result.matched_contract ? (
                result.matched_contract.plan
              ) : (
                <span className="text-ink-3">договор не найден</span>
              )}
            </span>
          </div>
          <div className="field-row">
            <span className="font-sans text-sm text-ink-2">Срок до</span>
            <span className="font-mono text-xs tabular-nums text-ink">{deadline}</span>
          </div>
          <div className="field-row">
            <span className="font-sans text-sm text-ink-2">Неустойка</span>
            <span className="font-mono text-xs text-ink">
              {result.matched_contract ? (
                result.matched_contract.penalty_per_hour
              ) : (
                <span className="text-ink-3">не применяется</span>
              )}
            </span>
          </div>
        </section>
      </div>

      {/* Обоснование остаётся доступным для проверки, но не перегружает рабочий экран. */}
      <details className="group border-t border-rule">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 font-sans text-sm text-ink-3 marker:hidden hover:bg-panel-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent">
          <span className="font-semibold uppercase tracking-[0.12em]">Основание решения</span>
          <span className="font-mono text-xs tabular-nums">
            {result.decision_reasoning.length} пункта
          </span>
          <span className="ml-auto text-xs group-open:hidden">Показать</span>
          <span className="ml-auto hidden text-xs group-open:inline">Скрыть</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <ul className="flex flex-col gap-1.5 border-t border-rule px-4 py-4">
          {result.decision_reasoning.map((reason, idx) => (
            <li key={idx} className="flex gap-2.5 font-sans text-sm leading-relaxed text-ink-2">
              <span className="reg-no shrink-0 tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </details>

      {/* Проект ответа клиенту */}
      <div className="border-t border-rule px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.12em] text-ink-3">
            Проект ответа клиенту
          </h3>
          <button
            type="button"
            onClick={handleCopyReply}
            className="inline-flex min-h-8 items-center gap-1.5 border border-rule bg-paper px-2.5 font-mono text-[11px] text-ink-2 hover:bg-panel-2 hover:text-ink"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" aria-hidden="true" />
                <span>Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                <span>Копировать</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-2 border-l-2 border-rule-strong bg-paper px-3 py-2.5 font-sans text-sm leading-relaxed text-ink">
          {result.customer_response_draft}
        </p>
      </div>

      <div className="border-t border-rule-strong bg-panel px-4 py-3">
        <p className="font-sans text-sm font-medium text-ink">
          Симуляция завершена — результат не добавлен в рабочую очередь и реестр.
        </p>
      </div>

      {commitSuccessMsg && (
        <p
          role="status"
          className="flex items-center gap-2 border-t border-rule bg-accent-bg px-4 py-3 font-sans text-sm text-ink"
        >
          <CheckCircle className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span>{commitSuccessMsg}</span>
        </p>
      )}
    </div>
  );
};
