import { Site, Asset, Contract, Ticket, Contractor } from './types';

export interface DatabaseSchema {
  contractors: Contractor[];
  sites: Site[];
  assets: Asset[];
  contracts: Contract[];
  open_tickets: Ticket[];
  closed_tickets: Ticket[];
}

export const INITIAL_DATABASE: DatabaseSchema = {
  contractors: [
    {
      customer_id: 'C-101',
      name: 'ООО "СеверФуд"',
      inn: '7701234567',
      contact_phone: '+7 999 111-2233',
      contact_email: 'dispatch@severfood.ru',
      contract_number: 'ДОГ-SF-2025/11',
      status: 'ACTIVE',
    },
    {
      customer_id: 'C-202',
      name: 'ООО "АгроЛогистика"',
      inn: '7809876543',
      contact_phone: '+7 981 333-4455',
      contact_email: 'info@agrolog.spb.ru',
      contract_number: 'ДОГ-AL-2024/04',
      status: 'ACTIVE',
    },
    {
      customer_id: 'C-303',
      name: 'ПАО "Северсталь"',
      inn: '3528000597',
      contact_phone: '+7 820 253-5353',
      contact_email: 'service@severstal.ru',
      contract_number: 'ДОГ-SS-2026/01',
      status: 'ACTIVE',
    },
  ],
  sites: [
    {
      site_id: 'S-MSK-01',
      customer_id: 'C-101',
      customer_name: 'СеверФуд',
      address: 'г. Москва, Дмитровское шоссе, 100',
      contact_person: 'Андрей (директор склада, +7 999 111-2233)',
      timezone: 'Europe/Moscow',
      region: 'Москва и МО',
    },
    {
      site_id: 'S-EKB-02',
      customer_id: 'C-101',
      customer_name: 'СеверФуд',
      address: 'г. Екатеринбург, ул. Сибирский Тракт, 12',
      contact_person: 'Елена (старший смены, +7 999 222-3344)',
      timezone: 'Asia/Yekaterinburg',
      region: 'Урал',
    },
    {
      site_id: 'S-SPB-03',
      customer_id: 'C-202',
      customer_name: 'АгроЛогистика',
      address: 'г. Санкт-Петербург, Пулковское шоссе, 40',
      contact_person: 'Михаил (главный инженер, +7 981 333-4455)',
      timezone: 'Europe/Moscow',
      region: 'Северо-Запад',
    },
  ],
  assets: [
    {
      asset_id: 'A-1001',
      site_id: 'S-MSK-01',
      local_code: 'ХУ-17',
      name: 'Холодильная камера молочной продукции (-18°C)',
      criticality: 'CRITICAL',
      status: 'WARNING',
    },
    {
      asset_id: 'A-1002',
      site_id: 'S-MSK-01',
      local_code: 'ХУ-17-БАК',
      name: 'Резервная холодильная камера (-18°C)',
      criticality: 'HIGH',
      status: 'OK',
    },
    {
      asset_id: 'A-1003',
      site_id: 'S-MSK-01',
      local_code: 'ХУ-18',
      name: 'Холодильная камера заморозки (-24°C)',
      criticality: 'MEDIUM',
      status: 'OK',
    },
    {
      asset_id: 'A-2001',
      site_id: 'S-EKB-02',
      local_code: 'ХУ-17',
      name: 'Холодильная камера овощехранилища (+4°C)',
      criticality: 'MEDIUM',
      status: 'OK',
    },
    {
      asset_id: 'A-3001',
      site_id: 'S-SPB-03',
      local_code: 'ЧИЛ-01',
      name: 'Чиллер кондиционирования административного корпуса',
      criticality: 'LOW',
      status: 'OK',
    },
  ],
  contracts: [
    {
      site_id: 'S-MSK-01',
      plan: 'Gold',
      sla_minutes: 60,
      working_hours: '24x7 Круглосуточно',
      penalty_per_hour: '50 000 руб./час задержки',
      active: true,
    },
    {
      site_id: 'S-EKB-02',
      plan: 'Silver',
      sla_minutes: 240,
      working_hours: 'Пн-Пт 08:00 - 20:00',
      penalty_per_hour: '10 000 руб./час',
      active: true,
    },
    {
      site_id: 'S-SPB-03',
      plan: 'Standard',
      sla_minutes: 480,
      working_hours: 'Пн-Пт 09:00 - 18:00',
      penalty_per_hour: 'без неустойки',
      active: true,
    },
  ],
  open_tickets: [
    {
      ticket_id: 'T-884',
      customer_id: 'C-101',
      site_id: 'S-MSK-01',
      asset_id: 'A-1001',
      priority: 'high',
      summary: 'Температура поднялась до +5°C, шум компрессора №1',
      description: 'Поступило первичное обращение по каналу Email. Инженер назначен.',
      sla_deadline: '2026-08-13T16:55:00+03:00',
      assigned_group: 'Группа №2 (Холод-МСК)',
      status: 'IN_PROGRESS',
      created_at: '2026-08-13T15:55:00+03:00',
      history: [
        {
          timestamp: '2026-08-13T15:55:00+03:00',
          note: 'Заявка T-884 автоматически создана из входящего письма.',
          author: 'AI Dispatcher System',
        },
      ],
    },
    {
      ticket_id: 'T-880',
      customer_id: 'C-202',
      site_id: 'S-SPB-03',
      asset_id: 'A-3001',
      priority: 'medium',
      summary: 'Необходимо плановое ТО чиллера ЧИЛ-01',
      description: 'Поступил запрос от клиента по каналу Telegram.',
      sla_deadline: '2026-08-14T12:00:00+03:00',
      assigned_group: 'Группа №1 (СПб Сервис)',
      status: 'WAITING_DISPATCHER',
      created_at: '2026-08-13T14:00:00+03:00',
      missing_fields: ['asset_code', 'preferred_time'],
      messages: [
        {
          id: 'm-1',
          sender: 'client',
          author_name: 'Михаил (СПб)',
          text: 'Добрый день! Нужно плановое ТО чиллера на Пулковском шоссе.',
          timestamp: '2026-08-13T14:00:00+03:00',
          channel: 'telegram',
        },
        {
          id: 'm-2',
          sender: 'bot',
          author_name: 'AI-Диспетчер',
          text: '🤖 Обращение получено. Требуется уточнение данных.',
          timestamp: '2026-08-13T14:00:05+03:00',
          channel: 'telegram',
        },
      ],
      history: [
        {
          timestamp: '2026-08-13T14:00:00+03:00',
          note: 'Создана неполная заявка T-880. Передано в HITL диспетчеру.',
          author: 'AI Dispatcher Core',
        },
      ],
    },
  ],
  closed_tickets: [
    {
      ticket_id: 'T-801',
      customer_id: 'C-101',
      site_id: 'S-MSK-01',
      asset_id: 'A-1002',
      priority: 'high',
      summary: 'Замена фреонового фильтра на ХУ-17-БАК',
      description: 'Работы выполнены в полном объеме, акт подписан.',
      sla_deadline: '2026-07-28T18:00:00+03:00',
      assigned_group: 'Группа №2 (Холод-МСК)',
      status: 'CLOSED',
      created_at: '2026-07-28T10:00:00+03:00',
      updated_at: '2026-07-28T16:30:00+03:00',
      history: [
        {
          timestamp: '2026-07-28T16:30:00+03:00',
          note: 'Заявка успешно закрыта инженером. Акт №801-SF передан в 1С.',
          author: 'Старший Диспетчер',
        },
      ],
    },
    {
      ticket_id: 'T-795',
      customer_id: 'C-303',
      site_id: 'S-EKB-02',
      asset_id: 'A-2001',
      priority: 'medium',
      summary: 'Калибровка датчиков температуры в камере овощехранилища',
      description: 'Тестирование прошло успешно.',
      sla_deadline: '2026-07-20T17:00:00+03:00',
      assigned_group: 'Группа Урал Сервис',
      status: 'CLOSED',
      created_at: '2026-07-20T09:00:00+03:00',
      updated_at: '2026-07-20T14:15:00+03:00',
      history: [
        {
          timestamp: '2026-07-20T14:15:00+03:00',
          note: 'Заявка закрыта.',
          author: 'AI Dispatcher System',
        },
      ],
    },
  ],
};
