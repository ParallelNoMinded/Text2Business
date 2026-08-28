export const SHIFT_COLLEAGUES = [
  { id: 'marina', name: 'Марина Старшая', role: 'Старший смены' },
  { id: 'pavel', name: 'Павел Ночная', role: 'Ночная смена' },
  { id: 'elena', name: 'Елена Урал', role: 'Регион Урал' },
] as const;

export const SHIFT_REASONS = ['Конец смены', 'Перегруз очереди', 'Другой регион'] as const;
export const ESCALATE_REASONS = ['Нет данных объекта', 'Клиент не отвечает', 'Нужно решение по договору'] as const;
