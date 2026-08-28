export interface FieldCrew {
  id: string;
  name: string;
  region: string;
  lead: string;
  phone: string;
  capacity: number;
}

export const FIELD_CREWS: FieldCrew[] = [
  {
    id: 'crew-msk-cold',
    name: 'Группа №2 (Холод-МСК)',
    region: 'Москва',
    lead: 'Сергей Кравцов',
    phone: '+7 495 120-17-17',
    capacity: 2,
  },
  {
    id: 'crew-spb',
    name: 'Группа №1 (СПб Сервис)',
    region: 'Санкт-Петербург',
    lead: 'Ольга Немцова',
    phone: '+7 812 440-08-08',
    capacity: 2,
  },
  {
    id: 'crew-ural',
    name: 'Дежурная Урал',
    region: 'Екатеринбург',
    lead: 'Игорь Сафин',
    phone: '+7 343 310-22-10',
    capacity: 1,
  },
];

export const VISIT_COLUMNS = [
  { id: 'queued', label: 'Назначить' },
  { id: 'en_route', label: 'В пути' },
  { id: 'on_site', label: 'На объекте' },
  { id: 'done', label: 'Выезд закрыт' },
] as const;

export type VisitStatus = (typeof VISIT_COLUMNS)[number]['id'];

export const VISIT_CHECK_ITEMS = [
  { id: 'access', label: 'Допуск на объект' },
  { id: 'nameplate', label: 'Фото шильдика' },
  { id: 'temp', label: 'Температура снята' },
  { id: 'act', label: 'Акт подписан' },
] as const;

export function visitShowsChecklist(status?: VisitStatus): boolean {
  return status === 'on_site' || status === 'done';
}

export function visitBlocksClose(status?: VisitStatus): boolean {
  return status === 'on_site' || status === 'done';
}

export function visitChecklistDone(checked?: string[]): boolean {
  const set = new Set(checked || []);
  return VISIT_CHECK_ITEMS.every((item) => set.has(item.id));
}

export function toggleVisitCheck(checked: string[] | undefined, id: string): string[] {
  const set = new Set(checked || []);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return [...set];
}
