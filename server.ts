import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DATABASE, DatabaseSchema } from './src/mockDb';
import {
  extractFactsFromText,
  runDeterministicDispatch,
} from './src/dispatcherEngine';
import { ExtractedFacts, Ticket, ProcessingResult } from './src/types';

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
    telegram_bot_configured: !!process.env.TELEGRAM_BOT_TOKEN,
    webhook_endpoints: {
      telegram: '/api/webhooks/telegram',
      email: '/api/webhooks/email',
      telephony: '/api/webhooks/telephony',
      rest: '/api/webhooks/dispatch',
      c1_erp: '/api/1c/tickets',
    },
  });
});

// Telegram Bot Token helper
let activeBotToken: string | null = process.env.TELEGRAM_BOT_TOKEN || null;
let isPollingActive = false;
let pollingOffset = 0;

// Helper to send message back to Telegram Chat
async function sendTelegramMessage(chatId: number | string, text: string) {
  if (!activeBotToken) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
    return null;
  }
}

// Helper function to persist tickets directly into mockDb upon receiving messages
function saveOrUpdateTicketInDb(
  channel: string,
  incomingText: string,
  result: ProcessingResult,
  senderName: string = 'Клиент',
  chatId: number | string | null = null
): Ticket {
  const timeIso = new Date().toISOString();
  const ticketId = result.ticket_payload?.ticket_id || `T-${Math.floor(100 + Math.random() * 899)}`;
  const missingInfo = result.missing_information || [];
  const requiresClarification =
    result.recommended_action === 'REQUEST_CLARIFICATION' || missingInfo.length > 0;

  let ticket = mockDb.open_tickets.find(
    (t) => (chatId && t.chat_id === chatId) || (result.target_ticket_id && t.ticket_id === result.target_ticket_id)
  );

  if (ticket) {
    ticket.messages = ticket.messages || [];
    ticket.messages.push({
      id: `m-${Date.now()}`,
      sender: 'client',
      author_name: senderName,
      text: incomingText,
      timestamp: timeIso,
      channel,
    });
    if (result.customer_response_draft) {
      ticket.messages.push({
        id: `m-${Date.now() + 1}`,
        sender: 'bot',
        author_name: 'AI-Диспетчер',
        text: result.customer_response_draft,
        timestamp: new Date().toISOString(),
        channel,
      });
    }

    if (requiresClarification) {
      ticket.status = 'WAITING_DISPATCHER';
      ticket.missing_fields = missingInfo.length > 0 ? missingInfo : ['Уточнение данных'];
    }

    if (result.matched_asset) ticket.asset_id = result.matched_asset.asset_id;
    if (result.matched_site) ticket.site_id = result.matched_site.site_id;

    ticket.history = ticket.history || [];
    ticket.history.push({
      timestamp: timeIso,
      note: `Поступила новая реплика от ${senderName} (${channel}). Статус: ${ticket.status}. AI-Действие: ${result.recommended_action}`,
      author: 'AI-Диспетчер',
    });

    return ticket;
  }

  // Create brand new ticket
  const newTicket: Ticket = {
    ticket_id: ticketId,
    customer_id: result.matched_site?.customer_id || 'C-UNKNOWN',
    site_id: result.matched_site?.site_id || 'S-UNKNOWN',
    asset_id: result.matched_asset?.asset_id || 'A-UNKNOWN',
    priority: result.ticket_payload?.priority || (requiresClarification ? 'high' : 'medium'),
    summary: result.extracted_facts.problem_summary?.value || incomingText.slice(0, 80),
    description: incomingText,
    sla_deadline: result.ticket_payload?.sla_deadline || new Date(Date.now() + 3600 * 4 * 1000).toISOString(),
    assigned_group: result.ticket_payload?.assigned_group || 'Дежурная служба',
    status: requiresClarification ? 'WAITING_DISPATCHER' : 'NEW',
    created_at: timeIso,
    channel,
    chat_id: chatId || undefined,
    missing_fields: requiresClarification ? (missingInfo.length > 0 ? missingInfo : ['Код оборудования']) : [],
    messages: [
      {
        id: `m-${Date.now()}`,
        sender: 'client',
        author_name: senderName,
        text: incomingText,
        timestamp: timeIso,
        channel,
      },
      {
        id: `m-${Date.now() + 1}`,
        sender: 'bot',
        author_name: 'AI-Диспетчер',
        text: result.customer_response_draft || 'Ваше обращение принято и обрабатывается.',
        timestamp: new Date().toISOString(),
        channel,
      },
    ],
    history: [
      {
        timestamp: timeIso,
        note: `Обращение создано через канал ${channel.toUpperCase()} (Отправитель: ${senderName}). Назначен статус: ${requiresClarification ? 'Ожидает диспетчера' : 'Новая заявка'}`,
        author: 'AI-Диспетчер',
      },
    ],
  };

  mockDb.open_tickets.unshift(newTicket);
  return newTicket;
}

// Long Polling for Telegram Bot (when token provided)
async function pollTelegramUpdates() {
  if (!activeBotToken || isPollingActive) return;
  isPollingActive = true;
  console.log('Starting Telegram Bot Long Polling loop...');

  while (isPollingActive && activeBotToken) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${activeBotToken}/getUpdates?offset=${pollingOffset}&timeout=20`
      );
      const data: any = await response.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          pollingOffset = update.update_id + 1;
          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const incomingText = update.message.text;
            const senderName = update.message.from?.first_name || update.message.chat?.title || 'Telegram User';

            console.log(`[Telegram Bot] Inbound msg from Chat ${chatId}: "${incomingText}"`);

            // Execute full AI Dispatcher Pipeline
            const timeIso = new Date().toISOString();
            const facts = await extractFactsWithGemini(incomingText, 'telegram');
            const result = runDeterministicDispatch(
              mockDb,
              facts,
              incomingText,
              'telegram',
              timeIso,
              false // Live commit to DB
            );

            // Save or Update ticket in DB
            const savedTicket = saveOrUpdateTicketInDb('telegram', incomingText, result, senderName, chatId);

            // Format clean response for Telegram user
            const ticketId = savedTicket.ticket_id;
            const priority = (savedTicket.priority || 'high').toUpperCase();
            const group = savedTicket.assigned_group || 'Дежурная служба';
            const slaDeadline = savedTicket.sla_deadline
              ? new Date(savedTicket.sla_deadline).toLocaleString('ru-RU')
              : 'В пределах 2 часов';

            const replyMsg = `🤖 <b>AI-Диспетчер: Обращение обработано</b>\n\n` +
              `📋 <b>Статус заявки:</b> ${savedTicket.status === 'WAITING_DISPATCHER' ? '⚠️ Ожидает уточнения диспетчера' : '✅ Принято в работу'}\n` +
              `🎟 <b>Заявка №:</b> ${ticketId}\n` +
              `🏢 <b>Объект:</b> ${result.extracted_facts.site_info.value || 'Определен по контакту'}\n` +
              `⚡ <b>Приоритет:</b> ${priority}\n` +
              `⏱ <b>Дедлайн SLA:</b> ${slaDeadline}\n` +
              `🛠 <b>Назначена команда:</b> ${group}\n\n` +
              `<i>Запись зарегистрирована в базе данных и доступна на панели Диспетчера.</i>`;

            await sendTelegramMessage(chatId, replyMsg);
          }
        }
      }
    } catch (err) {
      console.error('Telegram polling error:', err);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Start polling if token exists in process env
if (activeBotToken) {
  pollTelegramUpdates();
}

// 1. Real Webhook Endpoint for Telegram Bot (POST from Telegram Servers or Webhook Simulators)
app.post('/api/webhooks/telegram', async (req, res) => {
  try {
    const update = req.body;
    let messageText = '';
    let chatId: number | string | null = null;
    let senderName = 'Telegram User';

    if (update.message) {
      messageText = update.message.text || '';
      chatId = update.message.chat?.id || null;
      senderName = update.message.from?.first_name || update.message.chat?.title || 'Telegram User';
    } else if (typeof update.text === 'string') {
      messageText = update.text;
      senderName = update.sender || 'Telegram Webhook Test';
    }

    if (!messageText) {
      return res.status(400).json({ error: 'No text message payload found in Telegram update.' });
    }

    // Execute full pipeline
    const facts = await extractFactsWithGemini(messageText, 'telegram');
    const result = runDeterministicDispatch(
      mockDb,
      facts,
      messageText,
      'telegram',
      new Date().toISOString(),
      false
    );

    // Save ticket to DB
    const savedTicket = saveOrUpdateTicketInDb('telegram', messageText, result, senderName, chatId);

    // If chat ID exists and active bot token set, reply directly to Telegram
    if (chatId && activeBotToken) {
      const replyMsg = `🤖 <b>AI-Диспетчер: Обращение обработано</b>\n` +
        `🎟 <b>Заявка №:</b> ${savedTicket.ticket_id}\n` +
        `⚡ <b>Приоритет:</b> ${savedTicket.priority.toUpperCase()}\n` +
        `🛠 <b>Группа:</b> ${savedTicket.assigned_group}`;
      await sendTelegramMessage(chatId, replyMsg);
    }

    res.json({
      success: true,
      channel: 'telegram',
      sender: senderName,
      dispatch_result: result,
      ticket: savedTicket,
      database_open_tickets_count: mockDb.open_tickets.length,
    });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    res.status(500).json({ error: err.message || 'Telegram webhook error' });
  }
});

// 2. Real Webhook Endpoint for Email (IMAP/Inbound Webhook from SendGrid, Postmark, Mailgun)
app.post('/api/webhooks/email', async (req, res) => {
  try {
    const { from, subject, body, text } = req.body;
    const emailText = text || body || subject || '';

    if (!emailText) {
      return res.status(400).json({ error: 'Email body or text is required.' });
    }

    const fullText = subject ? `Тема: ${subject}\n\n${emailText}` : emailText;
    const facts = await extractFactsWithGemini(fullText, 'email');
    const result = runDeterministicDispatch(
      mockDb,
      facts,
      fullText,
      'email',
      new Date().toISOString(),
      false
    );

    const savedTicket = saveOrUpdateTicketInDb('email', fullText, result, from || 'Email Client');

    res.json({
      success: true,
      channel: 'email',
      sender: from || 'inbound-email@service.ru',
      dispatch_result: result,
      ticket: savedTicket,
      database_open_tickets_count: mockDb.open_tickets.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Email webhook error' });
  }
});

// 3. Real Webhook Endpoint for Telephony (Voice STT Transcripts)
app.post('/api/webhooks/telephony', async (req, res) => {
  try {
    const { caller_number, transcript, audio_url } = req.body;
    const text = transcript || '';

    if (!text) {
      return res.status(400).json({ error: 'Voice transcript text is required.' });
    }

    const facts = await extractFactsWithGemini(text, 'voice');
    const result = runDeterministicDispatch(
      mockDb,
      facts,
      text,
      'voice',
      new Date().toISOString(),
      false
    );

    const savedTicket = saveOrUpdateTicketInDb('voice', text, result, caller_number || '+7 999 000-00-00');

    res.json({
      success: true,
      channel: 'voice',
      caller: caller_number || '+7 999 000-00-00',
      dispatch_result: result,
      ticket: savedTicket,
      database_open_tickets_count: mockDb.open_tickets.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Telephony webhook error' });
  }
});

// 4. Endpoint to Configure Telegram Bot Token live from the UI
app.post('/api/operator/reply', async (req, res) => {
  try {
    const { ticket_id, chat_id, operator_message, channel } = req.body;
    if (!operator_message) {
      return res.status(400).json({ error: 'operator_message is required' });
    }

    const ticketIdx = mockDb.open_tickets.findIndex((t) => t.ticket_id === ticket_id);
    if (ticketIdx !== -1) {
      const ticket = mockDb.open_tickets[ticketIdx];
      const newMsg = {
        id: `m-${Date.now()}`,
        sender: 'operator' as const,
        author_name: 'Дежурный Диспетчер',
        text: operator_message,
        timestamp: new Date().toISOString(),
        channel: channel || ticket.channel,
      };

      ticket.messages = [...(ticket.messages || []), newMsg];
      ticket.history = [
        ...(ticket.history || []),
        {
          timestamp: new Date().toISOString(),
          note: `Диспетчер направил сообщение клиенту: "${operator_message.slice(0, 60)}..."`,
          author: 'Оператор HITL',
        },
      ];
    }

    if (chat_id && activeBotToken) {
      const telegramText = `💬 <b>Ответ диспетчера сервисной службы (по заявке ${ticket_id}):</b>\n\n${operator_message}`;
      await sendTelegramMessage(chat_id, telegramText);
    }

    res.json({ success: true, message: 'Reply recorded and sent to client' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing operator reply' });
  }
});

// 5. Endpoint to Configure Telegram Bot Token live from the UI
app.post('/api/telegram/config', (req, res) => {
  const { token, enable_polling } = req.body;
  if (!token) {
    activeBotToken = null;
    isPollingActive = false;
    return res.json({ success: true, message: 'Telegram Bot Token cleared', configured: false });
  }

  activeBotToken = token.trim();
  if (enable_polling) {
    isPollingActive = false; // Reset loop if running
    pollTelegramUpdates();
  }

  res.json({
    success: true,
    message: 'Telegram Bot Token active!',
    configured: true,
    webhook_url: `${req.protocol}://${req.get('host')}/api/webhooks/telegram`,
  });
});

// 5. Real 1C / CRM OData Integration Endpoint
app.get('/api/1c/tickets', (req, res) => {
  // Returns tickets in 1C OData XML / JSON format
  const odataResponse = {
    '@odata.context': `${req.protocol}://${req.get('host')}/api/1c/$metadata#Document_ЗаявкаНаРемонт`,
    value: mockDb.open_tickets.map((ticket) => ({
      Ref_Key: ticket.ticket_id,
      Data: ticket.created_at,
      Number: ticket.ticket_id,
      Posted: true,
      Контрагент_Key: ticket.customer_id,
      ОбъектЭксплуатации_Key: ticket.site_id,
      Оборудование_Key: ticket.asset_id,
      Приоритет: ticket.priority.toUpperCase(),
      СрокИсполненияSLA: ticket.sla_deadline,
      Описание: ticket.summary,
      ИсполнительнаяГруппа: ticket.assigned_group,
      Статус: ticket.status,
    })),
  };
  res.json(odataResponse);
});

app.get('/api/database', (req, res) => {
  res.json(mockDb);
});

app.post('/api/database', (req, res) => {
  if (req.body && Array.isArray(req.body.open_tickets)) {
    mockDb = req.body;
  }
  res.json({ success: true, db: mockDb });
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
