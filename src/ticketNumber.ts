import type { DatabaseSchema } from './mockDb';

const TICKET_NUMBER = /^T-(\d+)$/;

/** Возвращает следующий свободный последовательный номер среди всех заявок. */
export function nextTicketId(
  database: Pick<DatabaseSchema, 'open_tickets' | 'closed_tickets'>,
  reservedIds: Iterable<string> = [],
): string {
  const used = new Set([
    ...[...(database.open_tickets || []), ...(database.closed_tickets || [])].map((ticket) => ticket.ticket_id),
    ...reservedIds,
  ]);
  const maxNumber = [...used].reduce((maximum, ticketId) => {
    const match = TICKET_NUMBER.exec(ticketId);
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);

  let candidate = maxNumber + 1;
  while (used.has(`T-${candidate}`)) candidate += 1;
  return `T-${candidate}`;
}

export function isTicketIdAvailable(
  database: Pick<DatabaseSchema, 'open_tickets' | 'closed_tickets'>,
  ticketId: string,
): boolean {
  return ![...(database.open_tickets || []), ...(database.closed_tickets || [])].some(
    (ticket) => ticket.ticket_id === ticketId,
  );
}
