export interface AiAssistant {
  id: string;
  name: string;
  hint: string;
}

export const AI_ASSISTANTS: AiAssistant[] = [
  { id: 'gpt-4o', name: 'GPT-4o', hint: 'Универсальный помощник' },
  { id: 'qwen3.6-27b', name: 'Qwen 3.6 27B', hint: 'Факты и длинный текст' },
  { id: 'gemma4:e4b', name: 'Gemma 4 E4B', hint: 'Лёгкая быстрая модель' },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', hint: 'Сложные рассуждения' },
  { id: 'nemotron-3-ultra-550b-a55b', name: 'Nemotron Ultra', hint: 'Максимальный объём' },
];

export function findAssistant(id: string): AiAssistant {
  return AI_ASSISTANTS.find((m) => m.id === id) || AI_ASSISTANTS[0];
}
