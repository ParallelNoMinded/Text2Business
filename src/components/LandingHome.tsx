import React from 'react';
import { ArrowRight, MessageSquareMore, ShieldCheck } from 'lucide-react';
import { TabType } from './Header';
import { DatabaseSchema } from '../mockDb';

interface LandingHomeProps {
  setActiveTab: (tab: TabType) => void;
  theme?: 'dark' | 'light';
  db?: DatabaseSchema | null;
}

export const LandingHome: React.FC<LandingHomeProps> = ({ setActiveTab, theme = 'light', db }) => {
  const pendingTickets = (db?.open_tickets || []).filter(
    (ticket) => ticket.status === 'WAITING_DISPATCHER' || Boolean(ticket.missing_fields?.length),
  );
  const totalTickets = (db?.open_tickets?.length || 0) + (db?.closed_tickets?.length || 0);
  const pendingCount = pendingTickets.length;
  const slaRate = totalTickets ? Math.round(((totalTickets - pendingCount) / totalTickets) * 100) : 100;
  const customersById = new Map((db?.contractors || []).map((customer) => [customer.customer_id, customer.name]));

  return (
    <div id="home-page" className={`home-page ${theme === 'dark' ? 'home-page-dark' : ''}`}>
      <div className="home-heading"><h1>Добро пожаловать!</h1><p>AI-диспетчер для управления входящими обращениями</p></div>

      <button id="home-dispatcher-cta" type="button" className="home-dispatcher-card" onClick={() => setActiveTab('operator')}>
        <span className="home-card-icon"><MessageSquareMore /></span>
        <span className="home-card-copy"><strong>Перейти к обращениям</strong><small>Открыть диспетчер и начать работу с заявками</small></span>
        <span className="home-primary-action">Открыть диспетчер <ArrowRight /></span>
      </button>

      <section className="home-attention-card">
        <div className="home-section-header">
          <div><h2>Требуют внимания <b>{pendingCount}</b></h2><p>Заявки, где требуется решение диспетчера</p></div>
          <button type="button" onClick={() => setActiveTab('operator')}>Открыть список <ArrowRight /></button>
        </div>
        <div className="home-ticket-list">
          {pendingTickets.length === 0 ? <div className="home-empty">Все текущие обращения обработаны автоматически.</div> : pendingTickets.map((ticket) => (
            <button type="button" className="home-ticket-row" key={ticket.ticket_id} onClick={() => setActiveTab('operator')}>
              <span className="home-ticket-id"><strong>{ticket.ticket_id}</strong><small>{new Date(ticket.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small></span>
              <span className="home-ticket-summary"><strong>{customersById.get(ticket.customer_id) || ticket.customer_id}</strong><small>{ticket.summary}</small></span>
              <span className={`home-priority priority-${ticket.priority}`}>{ticket.priority === 'high' || ticket.priority === 'critical' ? 'Высокий' : ticket.priority === 'medium' ? 'Средний' : 'Низкий'}</span>
              <span className={`home-status status-${ticket.status.toLowerCase()}`}>{ticket.status === 'WAITING_DISPATCHER' ? 'Ожидает уточнения' : ticket.status === 'IN_PROGRESS' ? 'В работе' : ticket.status}</span>
              <ArrowRight className="home-row-arrow" />
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="home-sla-card" onClick={() => setActiveTab('logs_traces')}>
        <span className="home-sla-icon"><ShieldCheck /></span><span><strong>Уровень сервиса в норме</strong><small>{slaRate}% обращений обрабатываются в рамках соглашения</small></span><ArrowRight />
      </button>

    </div>
  );
};
