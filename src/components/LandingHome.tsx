import React from 'react';
import { TabType } from './Header';
import { DatabaseSchema } from '../mockDb';
import {
  ArrowRight,
  ChevronRight,
  Headphones,
  ShieldCheck,
} from 'lucide-react';

interface LandingHomeProps {
  setActiveTab: (tab: TabType) => void;
  theme?: 'dark' | 'light';
  onRunPreset?: (presetId: string) => void;
  db?: DatabaseSchema;
}

export const LandingHome: React.FC<LandingHomeProps> = ({
  setActiveTab,
  theme = 'light',
  db,
}) => {
  const isDark = theme === 'dark';

  const surface = isDark
    ? 'border-slate-700 bg-[#242438] text-slate-100'
    : 'border-[#c8c8c8] bg-white text-black';
  const muted = isDark ? 'text-slate-400' : 'text-[#686868]';
  const attentionRequests = (db?.open_tickets || []).filter(
    (ticket) => ticket.status === 'WAITING_DISPATCHER' || (ticket.missing_fields && ticket.missing_fields.length > 0)
  );

  // Real SLA calculation based on database tickets
  const totalTickets = (db?.open_tickets?.length || 0) + (db?.closed_tickets?.length || 0);
  const now = Date.now();
  const breachedTickets = (db?.open_tickets || []).filter((t) => {
    if (!t.sla_deadline) return false;
    const deadlineMs = new Date(t.sla_deadline).getTime();
    return !isNaN(deadlineMs) && deadlineMs < now;
  }).length;
  
  const inSlaCount = Math.max(0, totalTickets - breachedTickets);
  const slaPercentage = totalTickets > 0 ? Math.round((inSlaCount / totalTickets) * 100) : 100;

  return (
    <div className="mx-auto w-full max-w-[1400px] text-[16px] pb-24 pt-3 sm:pt-8 lg:pb-8 lg:pt-12">
      <section className="mb-7 sm:mb-8">
        <h1 className="text-[34px] font-black leading-[1.06] tracking-[-0.035em] sm:text-[44px] lg:text-[52px]">
          Добро пожаловать!
        </h1>
        <p className={`mt-2 text-lg font-light sm:text-[23px] ${muted}`}>
          AI-диспетчер для управления входящими обращениями
        </p>
      </section>

      <button
        id="home-tile-operator"
        type="button"
        onClick={() => setActiveTab('operator')}
        className={`group flex w-full flex-col items-stretch gap-5 rounded-xl border px-5 py-6 text-left transition hover:-translate-y-0.5 hover:border-[#2d7a7a] hover:shadow-lg sm:flex-row sm:items-center sm:px-9 sm:py-10 ${surface}`}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#2b7777] text-white">
          <Headphones className="h-9 w-9" strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1 sm:pl-4">
          <span className="block text-xl font-extrabold sm:text-[26px]">Перейти к обращениям</span>
          <span className={`mt-1 block text-base font-light sm:text-xl ${muted}`}>
            Открыть диспетчер и начать работу с заявками
          </span>
        </span>
        <span className="flex min-h-13 items-center justify-center gap-3 rounded-md bg-[#2b7777] px-5 py-3 text-sm font-bold text-white transition group-hover:bg-[#236565] sm:px-6 sm:text-base">
          Открыть диспетчер
          <ArrowRight className="h-5 w-5" />
        </span>
      </button>

      <section className={`mt-7 overflow-hidden rounded-xl border px-4 py-5 sm:mt-10 sm:px-6 sm:py-8 ${surface}`}>
        <div className="flex flex-col gap-4 px-1 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-extrabold sm:text-[25px]">Требуют внимания</h2>
            <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-red-600 px-3 text-lg font-extrabold text-white">
              {attentionRequests.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('operator')}
            className="flex items-center gap-6 self-start py-1 text-base font-extrabold text-[#06439b] transition hover:text-[#2b7777] sm:self-auto"
          >
            Открыть список
            <ArrowRight className="h-6 w-6" />
          </button>
        </div>

        <div className={`border-t ${isDark ? 'border-slate-600' : 'border-[#bcbcbc]'}`}>
          {attentionRequests.map((request) => {
            const contractor = db?.contractors.find((item) => item.customer_id === request.customer_id);
            const priorityClass = request.priority === 'critical' || request.priority === 'high'
              ? 'border-red-300 bg-red-100 text-red-600'
              : request.priority === 'medium'
              ? 'border-orange-300 bg-orange-100 text-orange-600'
              : 'border-emerald-300 bg-emerald-100 text-emerald-700';
            const priorityLabel = request.priority === 'critical'
              ? 'Критический'
              : request.priority === 'high'
              ? 'Высокий'
              : request.priority === 'medium'
              ? 'Средний'
              : 'Низкий';
            return (
            <button
              key={request.ticket_id}
              type="button"
              onClick={() => setActiveTab('operator')}
              className={`grid w-full grid-cols-[68px_minmax(0,1fr)_auto] items-center gap-x-3 border-b px-0 py-3 text-left transition last:border-b-0 hover:bg-[#2b7777]/5 sm:grid-cols-[104px_minmax(0,1fr)_112px_150px_20px] sm:gap-x-4 sm:px-4 lg:grid-cols-[130px_minmax(240px,1fr)_132px_185px_24px] lg:px-8 ${
                isDark ? 'border-slate-600' : 'border-[#c8c8c8]'
              }`}
            >
              <span className="text-center">
                <span className="block text-base font-black sm:text-xl lg:text-2xl">{request.ticket_id}</span>
                <span className={`block text-xs font-bold sm:text-base lg:text-lg ${muted}`}>
                  {new Date(request.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-extrabold sm:text-lg lg:text-[23px]">{contractor?.name || request.customer_id}</span>
                <span className={`block truncate text-xs font-bold sm:text-sm lg:text-lg ${muted}`}>{request.summary}</span>
              </span>
              <ChevronRight className="h-5 w-5 sm:hidden" />
              <span className={`hidden w-fit rounded-xl border px-3 py-2 text-sm font-extrabold sm:inline-flex lg:px-5 lg:text-base ${priorityClass}`}>
                {priorityLabel}
              </span>
              <span className="hidden text-sm font-extrabold text-[#d56600] sm:block lg:text-base">Ожидает уточнения</span>
              <ChevronRight className="hidden h-6 w-6 sm:block" />
              <span className="col-span-2 mt-2 flex gap-2 sm:hidden">
                <span className={`rounded-lg border px-3 py-1 text-xs font-extrabold ${priorityClass}`}>{priorityLabel}</span>
                <span className="px-2 py-1 text-xs font-extrabold text-[#d56600]">Ожидает уточнения</span>
              </span>
            </button>
            );
          })}
          {attentionRequests.length === 0 && (
            <div className={`px-4 py-8 text-center text-sm font-semibold ${muted}`}>
              Нет обращений, требующих внимания
            </div>
          )}
        </div>
      </section>

      <button
        id="home-tile-logs"
        type="button"
        onClick={() => setActiveTab('logs_traces')}
        className={`group mt-10 flex w-full items-center gap-5 rounded-xl border px-5 py-6 text-left transition hover:-translate-y-0.5 hover:border-[#2b7777] hover:shadow-lg sm:px-12 sm:py-7 ${surface}`}
      >
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-md ${
          slaPercentage >= 90
            ? 'bg-[#d7eaea] text-[#2b7777]'
            : slaPercentage >= 70
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
        }`}>
          <ShieldCheck className="h-10 w-10" strokeWidth={2.1} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-base font-extrabold uppercase tracking-wide sm:text-lg ${
            slaPercentage >= 90
              ? 'text-[#2b7777]'
              : slaPercentage >= 70
              ? 'text-amber-600'
              : 'text-red-600'
          }`}>
            {slaPercentage >= 90 ? 'SLA в норме' : slaPercentage >= 70 ? 'SLA требует внимания' : 'SLA нарушен'}
          </span>
          <span className={`mt-1 block text-sm font-bold sm:text-xl ${muted}`}>
            {slaPercentage}% обращений обрабатываются в рамках соглашения ({inSlaCount} из {totalTickets})
          </span>
        </span>
        <ArrowRight className="h-7 w-7 shrink-0 text-[#2b7777] transition group-hover:translate-x-1" />
      </button>
    </div>
  );
};