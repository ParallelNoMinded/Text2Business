import { Ticket } from './types';

export function outboundChannelLabel(channel?: string): string {
  const v = (channel || '').toLowerCase();
  if (v.includes('telegram')) return 'Telegram';
  if (v.includes('email') || v.includes('mail')) return 'Письмо';
  if (v.includes('voice') || v.includes('call')) return 'SMS после звонка';
  return 'SMS';
}

export function buildClientTemplates(
  ticket: Ticket,
  customer: string
): Array<{ id: string; label: string; text: string }> {
  const who = customer || 'клиент';
  const id = ticket.ticket_id;
  return [
    {
      id: 'en_route',
      label: 'Инженер выехал',
      text: `${who}, по заявке ${id} инженер выехал на объект. Сообщим, когда будет на месте.`,
    },
    {
      id: 'need_code',
      label: 'Нужен код камеры',
      text: `${who}, чтобы закрыть заявку ${id}, пришлите локальный код оборудования с шильдика (например, ХУ-17).`,
    },
    {
      id: 'done',
      label: 'Работы закончены',
      text: `${who}, работы по заявке ${id} выполнены. Если что-то повторится — напишите в этот же канал.`,
    },
  ];
}
