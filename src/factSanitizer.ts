const PLACEHOLDER_VALUES = new Set([
  'null',
  'undefined',
  'не указано',
  'не указан',
  'не указана',
  'не определено',
  'не определён',
  'не определен',
  'отсутствует',
  'пусто',
]);

const REASONING_MARKERS =
  /схем[аеы]\s*валидац|валидации\s*json|\bjson\b|оставим\s*значение|поля\s*могут|в\s*поле\s*value|ожидание\s*указания|согласно\s*схеме|пустую\s*строку/i;

const JSON_KEY_LEAK = /(?:^|[,{\s])['"]?(?:quote|confidence|type|value)['"]?\s*:/i;

/** Rejects model explanations and fragments of serialized JSON leaked into a fact field. */
export function sanitizeFactValue(raw: unknown, maxLen: number): string | null {
  if (typeof raw !== 'string') return null;
  let cleaned = raw.trim();
  const wrappers: Record<string, string> = { '"': '"', "'": "'", '«': '»' };
  const closing = wrappers[cleaned[0]];
  if (closing && cleaned.endsWith(closing)) cleaned = cleaned.slice(1, -1).trim();
  if (!cleaned) return null;
  if (PLACEHOLDER_VALUES.has(cleaned.toLowerCase())) return null;
  if (REASONING_MARKERS.test(cleaned) || JSON_KEY_LEAK.test(cleaned)) return null;
  if (cleaned.length > maxLen) return null;
  return cleaned;
}
