import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DATABASE, DatabaseSchema } from './src/mockDb';
import {
  extractFactsFromText,
  runDeterministicDispatch,
} from './src/dispatcherEngine';
import { ExtractedFacts, Ticket } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State
let mockDb: DatabaseSchema = JSON.parse(JSON.stringify(INITIAL_DATABASE));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System Instruction for Gemini Fact Extraction
const SYSTEM_EXTRACTION_PROMPT = `
Вы — модуль первичного извлечения фактов (Perception Core) из текста обращений клиентов сервисной службы.
Ваша задача — проанализировать неструктурированный текст (email, транскрипт звонка, сообщение) и извлечь структурированные факты с цитатами и уровнем уверенности (0.0 - 1.0).

ВЕРНИТЕ ИСКЛЮЧИТЕЛЬНО JSON по заданной схеме:
- customer_name: { value, quote, confidence, type: 'fact' }
- site_info: { value, quote, confidence, type: 'fact' } (адрес или наименование объекта)
- asset_code: { value, quote, confidence, type: 'fact' } (локальный код оборудования, например "ХУ-17", "18-я", "ЧИЛ-01")
- problem_summary: { value, quote, confidence, type: 'fact' } (краткая суть проблемы)
- requested_deadline: { value, quote, confidence, type: 'fact' } (запрошенный срок/время)
- has_backup: { value, confidence, type: 'inference' }
`;

// Helper for Gemini Structured Fact Extraction
async function extractFactsWithGemini(text: string, channel: string): Promise<ExtractedFacts> {
  if (!aiClient) {
    return extractFactsFromText(text, channel);
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Канал: ${channel}\nОбращение: "${text}"`,
      config: {
        systemInstruction: SYSTEM_EXTRACTION_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customer_name: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                quote: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                type: { type: Type.STRING },
              },
            },
            site_info: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                quote: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                type: { type: Type.STRING },
              },
            },
            asset_code: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                quote: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                type: { type: Type.STRING },
              },
            },
            problem_summary: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                quote: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                type: { type: Type.STRING },
              },
            },
            requested_deadline: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                quote: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                type: { type: Type.STRING },
              },
            },
            has_backup: {
              type: Type.OBJECT,
              properties: {
                value: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                type: { type: Type.STRING },
              },
            },
          },
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim()) as ExtractedFacts;
      return {
        customer_name: parsed.customer_name || { value: null, confidence: 0, type: 'fact' },
        site_info: parsed.site_info || { value: null, confidence: 0, type: 'fact' },
        asset_code: parsed.asset_code || { value: null, confidence: 0, type: 'fact' },
        problem_summary: parsed.problem_summary || { value: text.slice(0, 100), confidence: 0.8, type: 'fact' },
        requested_deadline: parsed.requested_deadline || { value: null, confidence: 0, type: 'fact' },
        has_backup: parsed.has_backup || { value: 'Неизвестно', confidence: 0.5, type: 'inference' },
      };
    }
  } catch (err) {
    console.warn('Gemini extraction fallback triggered:', err);
  }

  return extractFactsFromText(text, channel);
}

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Text2Business AI Dispatcher Core',
    gemini_enabled: !!aiClient,
  });
});

app.get('/api/database', (req, res) => {
  res.json(mockDb);
});

app.post('/api/database/reset', (req, res) => {
  mockDb = JSON.parse(JSON.stringify(INITIAL_DATABASE));
  res.json({ success: true, message: 'Database reset to default test state.' });
});

app.post('/api/dispatch', async (req, res) => {
  try {
    const { text, channel = 'email', incoming_time, is_dry_run = true } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Field "text" is required.' });
    }

    const timeIso = incoming_time || new Date().toISOString();

    // Step 1: LLM Fact Extraction
    const facts = await extractFactsWithGemini(text, channel);

    // Step 2-4: Deterministic Core Dispatch Execution
    const result = runDeterministicDispatch(
      mockDb,
      facts,
      text,
      channel,
      timeIso,
      is_dry_run
    );

    res.json(result);
  } catch (err: any) {
    console.error('Dispatch endpoint error:', err);
    res.status(500).json({ error: err.message || 'Server dispatch error' });
  }
});

app.post('/api/commit-ticket', (req, res) => {
  try {
    const { ticket_payload, action } = req.body;

    if (!ticket_payload) {
      return res.status(400).json({ error: 'ticket_payload is required' });
    }

    if (action === 'UPDATE_TICKET' && ticket_payload.ticket_id) {
      const existingIdx = mockDb.open_tickets.findIndex(
        (t) => t.ticket_id === ticket_payload.ticket_id
      );
      if (existingIdx !== -1) {
        const existing = mockDb.open_tickets[existingIdx];
        mockDb.open_tickets[existingIdx] = {
          ...existing,
          priority: ticket_payload.priority || 'critical',
          summary: `${existing.summary} (Обновлено по повторному обращению)`,
          updated_at: new Date().toISOString(),
          history: [
            ...(existing.history || []),
            {
              timestamp: new Date().toISOString(),
              note: `Заявка обновлена повторным обращением. Назначен приоритет ${ticket_payload.priority || 'critical'}.`,
              author: 'AI Dispatcher Execution Core',
            },
          ],
        };
        return res.json({
          success: true,
          mode: 'LIVE',
          action: 'UPDATE',
          ticket: mockDb.open_tickets[existingIdx],
        });
      }
    }

    // Create ticket
    const newTicket: Ticket = {
      ticket_id: ticket_payload.ticket_id || `T-${Math.floor(885 + Math.random() * 100)}`,
      customer_id: ticket_payload.customer_id || 'C-101',
      site_id: ticket_payload.site_id || 'S-MSK-01',
      asset_id: ticket_payload.asset_id || 'A-1003',
      priority: ticket_payload.priority || 'high',
      summary: ticket_payload.summary || 'Новая сервисная заявка',
      description: ticket_payload.description || 'Создана через AI Dispatcher',
      sla_deadline: ticket_payload.sla_deadline || new Date(Date.now() + 3600000).toISOString(),
      assigned_group: ticket_payload.assigned_group || 'Группа №1 (Высокий SLA)',
      status: 'NEW',
      created_at: new Date().toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          note: 'Заявка успешно создана в базе данных.',
          author: 'AI Dispatcher Execution Core',
        },
      ],
    };

    mockDb.open_tickets.unshift(newTicket);

    res.json({
      success: true,
      mode: 'LIVE',
      action: 'CREATE',
      ticket: newTicket,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error committing ticket' });
  }
});

// Vite & Static File Server Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
