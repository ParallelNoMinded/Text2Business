const FIELD_LABELS: Record<string, string> = {
  site_id: 'объект обслуживания',
  asset_id: 'оборудование',
  asset_code: 'код оборудования',
  contact: 'контактное лицо',
  preferred_time: 'предпочтительное время визита',
  customer_name: 'название организации',
  site_info: 'адрес объекта',
  problem_summary: 'описание неисправности',
  requested_deadline: 'желаемый срок выполнения',
  has_backup: 'наличие резервного оборудования',
  contact_name: 'контактное лицо',
  contact_phone: 'контактный телефон',
};

export const getFieldLabel = (field: string) =>
  FIELD_LABELS[field] ?? field.replaceAll('_', ' ');

export const formatFieldLabels = (fields: string[]) =>
  fields.map(getFieldLabel).join(', ');
