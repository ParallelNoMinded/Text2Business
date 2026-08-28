import { DatabaseSchema } from './mockDb';
import { Ticket } from './types';
import { nextTicketId } from './ticketNumber';

/**
 * Генератор демонстрационного потока обращений.
 *
 * Нужен для показа: на защите поток заявок должен идти сам, чтобы было видно
 * живой обратный отсчёт срока, проступающие строки журнала и работу с
 * клавиатуры. Заявки собираются из настоящих справочников базы (площадки,
 * оборудование, договоры), поэтому попадают в те же правила SLA и в те же
 * связи, что и обращения из реальных каналов. Выдуманных строк здесь нет.
 */

/** Заготовки обращений: текст, канал и признак нехватки данных. */
const COMPLAINTS: Array<{
  summary: string;
  description: (assetName: string, localCode: string) => string;
  channel: 'telegram' | 'email' | 'call_transcript' | 'rest';
  priority: Ticket['priority'];
  /** Каких данных не хватает — заявка уйдёт диспетчеру на уточнение. */
  missing?: string[];
}> = [
  {
    summary: 'Рост температуры выше уставки',
    description: (asset, code) =>
      `${code}: температура поднялась выше уставки, держится второй час. Оборудование: ${asset}. Продукция под угрозой.`,
    channel: 'telegram',
    priority: 'critical',
  },
  {
    summary: 'Посторонний шум компрессора',
    description: (asset, code) =>
      `${code}: компрессор гудит громче обычного, вибрация по корпусу. Оборудование: ${asset}.`,
    channel: 'call_transcript',
    priority: 'high',
  },
  {
    summary: 'Наледь на испарителе',
    description: (asset, code) =>
      `${code}: наледь на испарителе, оттайка не отрабатывает. Оборудование: ${asset}.`,
    channel: 'email',
    priority: 'medium',
  },
  {
    summary: 'Не закрывается дверь камеры',
    description: (asset, code) =>
      `${code}: не доводит дверь, уплотнитель отходит. Оборудование: ${asset}.`,
    channel: 'telegram',
    priority: 'medium',
  },
  {
    summary: 'Обращение без указания оборудования',
    description: () =>
      'Здравствуйте, у нас тут не морозит нормально, посмотрите пожалуйста. Какое именно — не знаю, я на смене первый день.',
    channel: 'telegram',
    priority: 'high',
    missing: ['asset_id'],
  },
  {
    summary: 'Плановое обслуживание перенесено',
    description: (asset, code) =>
      `${code}: просим перенести плановое обслуживание, идёт приёмка товара. Оборудование: ${asset}.`,
    channel: 'email',
    priority: 'low',
  },
  {
    summary: 'Течь конденсата под агрегатом',
    description: (asset, code) =>
      `${code}: под агрегатом лужа конденсата, поддон переполнен. Оборудование: ${asset}.`,
    channel: 'rest',
    priority: 'high',
  },
  {
    summary: 'Обращение без указания площадки',
    description: () =>
      'Не работает холодильник, нужен мастер сегодня. Адрес уточню позже, я не в городе.',
    channel: 'call_transcript',
    priority: 'medium',
    missing: ['site_id'],
  },
];

/** Часы до нарушения срока в зависимости от важности обращения. */
const SLA_HOURS: Record<Ticket['priority'], number> = {
  critical: 2,
  high: 4,
  medium: 8,
  low: 24,
};

/** Дежурные группы — в кого попадает заявка после разбора. */
const GROUPS = ['Дежурная смена', 'Холодильная группа', 'Электрики', 'Сервис-инженеры'];

const OPENERS = [
  'Добрый день.',
  'Коллеги, нужна помощь.',
  'Передаю обращение со смены.',
  'Просим зарегистрировать заявку.',
  'Сообщаем о неисправности.',
];

const CLOSERS = [
  'Связь держим по этому каналу.',
  'На объекте есть дежурный сотрудник.',
  'Просим сообщить плановое время прибытия.',
  'Ждём подтверждения регистрации.',
  'Доступ к оборудованию обеспечим.',
];

let lastGeneratedText = '';
let sequence = 0;
const reservedTicketIds = new Set<string>();

/** Случайный элемент списка. */
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const variedDescription = (base: string) => `${pick(OPENERS)} ${base} ${pick(CLOSERS)}`;

/**
 * Собирает одно новое обращение из справочников переданной базы.
 * Возвращает `null`, если справочники пусты — тогда поток просто не идёт.
 */
export const generateIncomingTicket = (db: DatabaseSchema): Ticket | null => {
  const assets = db.assets || [];
  const sites = db.sites || [];
  if (assets.length === 0 || sites.length === 0) return null;

  const asset = assets[sequence % assets.length];
  const site = sites.find((s) => s.site_id === asset.site_id) || sites[sequence % sites.length];
  let complaint = COMPLAINTS[sequence % COMPLAINTS.length];

  const now = new Date();
  const slaHours = SLA_HOURS[complaint.priority];
  const deadline = new Date(now.getTime() + slaHours * 3_600_000);

  const ticketId = nextTicketId(db, reservedTicketIds);
  reservedTicketIds.add(ticketId);

  const missing = complaint.missing || [];
  let description = variedDescription(complaint.description(asset.name, asset.local_code));
  if (description === lastGeneratedText) {
    complaint = COMPLAINTS[(sequence + 1) % COMPLAINTS.length];
    description = variedDescription(complaint.description(asset.name, asset.local_code));
  }
  lastGeneratedText = description;
  sequence += 1;

  return {
    ticket_id: ticketId,
    customer_id: site.customer_id,
    site_id: missing.includes('site_id') ? '' : site.site_id,
    asset_id: missing.includes('asset_id') ? '' : asset.asset_id,
    priority: complaint.priority,
    summary: complaint.summary,
    description,
    sla_deadline: deadline.toISOString(),
    assigned_group: pick(GROUPS),
    // Неполные обращения сразу уходят диспетчеру — иначе разбор невозможен.
    status: missing.length > 0 ? 'WAITING_DISPATCHER' : 'NEW',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    channel: complaint.channel,
    missing_fields: missing.length > 0 ? missing : undefined,
    history: [
      {
        timestamp: now.toISOString(),
        note: `Обращение поступило из канала ${complaint.channel}`,
        author: 'Демо-поток',
      },
    ],
  };
};

export interface DemoClarification {
  reply: string;
  ticket: Ticket;
  completedFields: string[];
}

/** Имитирует содержательный ответ клиента только для локальной демо-заявки. */
export const completeDemoClarification = (
  db: DatabaseSchema,
  ticket: Ticket,
  answeredAt = new Date()
): DemoClarification | null => {
  const missing = ticket.missing_fields || [];
  if (missing.length === 0 || ticket.chat_id) return null;

  const knownAsset = db.assets.find((item) => item.asset_id === ticket.asset_id);
  const knownSite =
    db.sites.find((item) => item.site_id === ticket.site_id) ||
    db.sites.find((item) => item.site_id === knownAsset?.site_id) ||
    db.sites.find((item) => item.customer_id === ticket.customer_id);
  const asset =
    knownAsset ||
    db.assets.find((item) => item.site_id === knownSite?.site_id) ||
    db.assets.find((item) => db.sites.some((site) => site.site_id === item.site_id && site.customer_id === ticket.customer_id));

  if (!knownSite || !asset) return null;

  const parts: string[] = [];
  if (missing.includes('site_id')) parts.push(`Адрес объекта: ${knownSite.address}`);
  if (missing.includes('asset_id') || missing.includes('asset_code')) {
    parts.push(`оборудование ${asset.local_code} — ${asset.name}`);
  }
  if (missing.includes('preferred_time')) parts.push('предпочтительное время визита — сегодня после 15:00');
  if (missing.includes('contact')) parts.push(`контакт на объекте — ${knownSite.contact_person}`);
  if (missing.includes('problem_summary')) parts.push(`неисправность: ${ticket.summary}`);
  if (parts.length === 0) return null;

  const timestamp = answeredAt.toISOString();
  const reply = `Уточняю: ${parts.join(', ')}. Контакт на объекте — ${knownSite.contact_person}.`;
  const supportedFields = ['site_id', 'asset_id', 'asset_code', 'preferred_time', 'contact', 'problem_summary'];
  const completedFields = missing.filter((field) => supportedFields.includes(field));

  return {
    reply,
    completedFields,
    ticket: {
      ...ticket,
      site_id: knownSite.site_id,
      asset_id: asset.asset_id,
      missing_fields: missing.filter((field) => !completedFields.includes(field)),
      updated_at: timestamp,
      messages: [
        ...(ticket.messages || []),
        {
          id: `m-client-${answeredAt.getTime()}`,
          sender: 'client',
          author_name: knownSite.contact_person || 'Клиент',
          text: reply,
          timestamp,
          channel: ticket.channel,
        },
      ],
      history: [
        ...(ticket.history || []),
        {
          timestamp,
          note: `Клиент уточнил данные: ${parts.join('; ')}.`,
          author: 'Клиент (демо)',
        },
      ],
    },
  };
};

/** Темп потока: интервал между обращениями. */
export type StreamPace = 'calm' | 'busy' | 'storm';

export const PACE_INTERVAL_MS: Record<StreamPace, number> = {
  calm: 12_000,
  busy: 5_000,
  storm: 2_000,
};

export const PACE_LABEL: Record<StreamPace, string> = {
  calm: 'Спокойная смена',
  busy: 'Рабочий поток',
  storm: 'Аварийный вал',
};
