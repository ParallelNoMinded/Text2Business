import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';
import {
  Send,
  Mail,
  PhoneCall,
  Code,
  ShieldCheck,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  Terminal,
  Zap,
  Server,
  Layers,
  Lock,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';

interface ChannelsConfigViewProps {
  theme?: 'dark' | 'light';
  onNavigateToConsole?: () => void;
}

export const ChannelsConfigView: React.FC<ChannelsConfigViewProps> = ({
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // Telegram state
  const [telegramToken, setTelegramToken] = useState(
    (typeof process !== 'undefined' && process.env?.TELEGRAM_BOT_TOKEN) || ''
  );
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [isPolling, setIsPolling] = useState(true);

  // Email state
  const [emailHost, setEmailHost] = useState('imap.yandex.ru');
  const [emailPort, setEmailPort] = useState('993');
  const [emailAddress, setEmailAddress] = useState('dispatch@severfood.ru');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [mcpEnabled, setMcpEnabled] = useState(true);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Telephony state
  const [sttProvider, setSttProvider] = useState('Yandex SpeechKit v3 (Cloud STT)');
  const [sipTrunk, setSipTrunk] = useState('sip-trunk-7495-msk-01');
  const [telephonySecret, setTelephonySecret] = useState('');
  const [showTelephonySecret, setShowTelephonySecret] = useState(false);
  const [telephonyStatus, setTelephonyStatus] = useState<string | null>(null);

  // 5th Channel - Real-time Voice Input state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState(
    'Завод Северсталь, цех 3. На котельной потек насос ХУ-17'
  );
  const [voiceInputStatus, setVoiceInputStatus] = useState<string | null>(null);
  const [isVoiceSubmitting, setIsVoiceSubmitting] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'ru-RU';

      rec.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        if (currentText) {
          setVoiceTranscript(currentText);
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setVoiceTranscript('');
      setVoiceInputStatus(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (err) {
          setIsRecording(false);
          setVoiceInputStatus('⚠️ Нажмите еще раз или используйте пресеты транскрипта');
        }
      } else {
        // Fallback simulated voice recording sequence
        setIsRecording(true);
        setVoiceInputStatus('🎙 Голосовой ввод симулируется... Запись речи...');
        setTimeout(() => {
          setVoiceTranscript('Завод Северсталь, цех 3. На котельной потек насос ХУ-17');
          setIsRecording(false);
          setVoiceInputStatus('✅ Речь распознана STT движком!');
        }, 2000);
      }
    }
  };

  const handleSendVoiceDispatch = async () => {
    if (!voiceTranscript.trim()) return;
    setIsVoiceSubmitting(true);
    setVoiceInputStatus('🚀 Отправка распознанной речи в AI-Диспетчер...');
    try {
      const res = await apiFetch('/api/webhooks/telephony', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_number: '+7 (999) 777-44-55',
          transcript: voiceTranscript,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const tId = data.dispatch_result?.ticket_payload?.ticket_id || 'T-VOICE';
        setVoiceInputStatus(
          `✅ Заявка создана через Голосовой Канал! № ${tId}. Статус: ${data.dispatch_result?.recommended_action}`
        );
      } else {
        setVoiceInputStatus(`❌ Ошибка обработки: ${data.error}`);
      }
    } catch (err: any) {
      setVoiceInputStatus(`❌ Ошибка отправки: ${err.message}`);
    } finally {
      setIsVoiceSubmitting(false);
    }
  };

  // Swagger / API test runner
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState('/api/webhooks/dispatch');
  const [apiMethod, setApiMethod] = useState<'POST' | 'GET'>('POST');
  const [apiRequestBody, setApiRequestBody] = useState(
    JSON.stringify(
      {
        channel: 'telegram',
        sender: 'ООО "СеверФуд" (ИНН 7701234567)',
        text: 'Срочно! Сломался компрессор на ХУ-17, температура поднялась до +6 градусов.',
      },
      null,
      2
    )
  );
  const [apiResponseOutput, setApiResponseOutput] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Handle Telegram Bot Token Activation
  const handleSaveTelegramToken = async () => {
    if (!telegramToken.trim()) {
      setTelegramStatus('⚠️ Пожалуйста, введите токен бота из @BotFather');
      return;
    }
    setIsSavingToken(true);
    setTelegramStatus(null);
    try {
      const res = await apiFetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: telegramToken, enable_polling: isPolling }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus(data.message || '✅ Бот успешно подключен и слушает Telegram!');
      } else {
        setTelegramStatus(`❌ Ошибка подключения: ${data.error || 'Проверьте токен'}`);
      }
    } catch (err: any) {
      setTelegramStatus(`❌ Не удалось применить настройки: ${err.message}`);
    } finally {
      setIsSavingToken(false);
    }
  };

  // Test Email Webhook
  const handleTestEmailWebhook = async () => {
    setEmailStatus('📧 Отправка тестового письма...');
    try {
      const res = await apiFetch('/api/webhooks/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: emailAddress,
          subject: 'Сбой холодильной камеры ХУ-17',
          text: 'Здравствуйте! На объекте Дмитровское шоссе 100 в камере ХУ-17 не держит температуру. Просим выслать инженера по договору Gold.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatus(`✅ Письмо обработано MCP & AI. Создана заявка № ${data.dispatch_result?.ticket_payload?.ticket_id || 'T-SUCCESS'}`);
      }
    } catch (err) {
      setEmailStatus('❌ Ошибка отправки тестового письма.');
    }
  };

  // Test Telephony Webhook
  const handleTestTelephonyWebhook = async () => {
    setTelephonyStatus('📞 Запуск симуляции входящего звонка...');
    try {
      const res = await apiFetch('/api/webhooks/telephony', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_number: '+7 (999) 111-22-33',
          transcript: 'Алло, диспетчерская? Это склад СеверФуд. На чиллере ЧИЛ-01 упало давление до 2 бар, пошел аварийный сигнал.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTelephonyStatus(`✅ Транскрипт STT успешно разобран AI. Заявка № ${data.dispatch_result?.ticket_payload?.ticket_id || 'T-CALL'}`);
      }
    } catch (err) {
      setTelephonyStatus('❌ Ошибка тестирования телефонии.');
    }
  };

  // Run Swagger / API Test
  const handleRunApiTest = async () => {
    setIsApiLoading(true);
    setApiResponseOutput(null);
    try {
      let url = selectedApiEndpoint;
      const init: RequestInit = {
        method: apiMethod,
        headers: { 'Content-Type': 'application/json' },
      };

      if (apiMethod === 'POST') {
        init.body = apiRequestBody;
      } else if (apiMethod === 'GET') {
        // If query parameters provided in JSON body box, convert to URL query parameters
        try {
          if (apiRequestBody && apiRequestBody.trim().startsWith('{')) {
            const parsed = JSON.parse(apiRequestBody);
            const params = new URLSearchParams();
            Object.keys(parsed).forEach((k) => {
              if (parsed[k] !== undefined && parsed[k] !== null) {
                params.append(k, String(parsed[k]));
              }
            });
            const queryString = params.toString();
            if (queryString) {
              url += (url.includes('?') ? '&' : '?') + queryString;
            }
          }
        } catch (e) {
          // ignore parsing error and perform direct GET
        }
      }

      const res = await apiFetch(url, init);
      const data = await res.json();
      setApiResponseOutput(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiResponseOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsApiLoading(false);
    }
  };

  return (
    <div id="channels-config-page" className="space-y-6">
      {/* Top Banner */}
      <div
        className={`flex flex-col border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between gap-5 ${
          isDark
            ? 'bg-panel/90 border-accent text-ink'
            : 'bg-panel border-rule text-ink shadow-sm'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <Zap className={`h-5 w-5 ${isDark ? 'text-accent' : 'text-accent'}`} />
            <h1 className="text-balance font-sans text-3xl font-bold tracking-tight text-ink">
              Каналы и интеграции
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-[11px] font-mono px-3 py-1.5 rounded-[2px] border flex items-center space-x-1.5 ${
            isDark
              ? 'bg-accent-bg text-accent border-accent font-bold'
              : 'bg-accent-bg text-accent border-accent font-semibold'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isDark ? 'bg-accent' : 'bg-accent'}`}></span>
            <span>5 Каналов Активно</span>
          </span>
        </div>
      </div>

      {/* 4 CHANNEL CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: TELEGRAM BOT CONNECTOR */}
        <div
          className={`rounded-[2px] p-5 border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-panel/90 border-accent'
              : 'bg-panel border-rule shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3 border-b pb-3 border-rule">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-[2px] bg-accent-bg text-accent border border-accent">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-mono font-bold uppercase ${isDark ? 'text-accent' : 'text-accent'}`}>
                    1. Telegram Bot (Live API)
                  </h3>
                  <span className="text-[11px] text-ink-3 font-mono">
                    Long Polling & Webhook Engine
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded uppercase ${
                telegramToken
                  ? (isDark ? 'bg-accent-bg text-accent border border-accent font-bold' : 'bg-accent-bg text-accent border border-accent font-semibold')
                  : (isDark ? 'bg-warn-bg text-warn border border-warn font-bold' : 'bg-danger-bg text-danger border border-danger font-semibold')
              }`}>
                {telegramToken ? 'Бот подключен' : 'Ожидает токен'}
              </span>
            </div>

            <p className={`text-xs mb-4 ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
              Вставьте API токен вашего бота из <b>@BotFather</b>. Все входящие сообщения будут моментально обрабатываться AI-Диспетчером с выдачей ответов и отправкой заявок в 1С.
            </p>

            <div className="space-y-3 font-mono">
              <div>
                <label
                  htmlFor="telegram-token-input"
                  className="mb-1 block text-[11px] font-bold uppercase text-ink-3"
                >
                  Telegram Bot API Token
                </label>
                <div className="relative">
                  <input
                    id="telegram-token-input"
                    type={showTelegramToken ? 'text' : 'password'}
                    placeholder="7123456789:AAEFghIJKlmNopQRstUv..."
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    className={`w-full rounded-[2px] border p-2.5 pr-12 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                      isDark
                        ? 'bg-panel border-rule text-ink focus-visible:ring-offset-paper'
                        : 'bg-panel-2 border-rule text-ink focus-visible:ring-offset-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTelegramToken(!showTelegramToken)}
                    aria-label={showTelegramToken ? 'Скрыть токен' : 'Показать токен'}
                    className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[2px] text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {showTelegramToken ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <label
                  htmlFor="telegram-polling-toggle"
                  className="flex min-h-11 cursor-pointer items-center gap-2"
                >
                  <input
                    id="telegram-polling-toggle"
                    type="checkbox"
                    checked={isPolling}
                    onChange={(e) => setIsPolling(e.target.checked)}
                    className="h-4 w-4 rounded border-rule text-accent focus-visible:ring-2 focus-visible:ring-accent"
                  />
                  <span className={isDark ? 'text-ink-3' : 'text-ink-2'}>
                    Автоматический Long Polling
                  </span>
                </label>
                <span className="text-[10px] text-ink-3">Секреты хранятся в `.env`</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-rule">
            <button
              onClick={handleSaveTelegramToken}
              disabled={isSavingToken}
              className="w-full py-2.5 px-4 rounded-[2px] bg-accent hover:bg-accent-hover text-ink font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {isSavingToken ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Активировать Бота в Telegram</span>
                </>
              )}
            </button>
            {telegramStatus && (
              <div className="mt-2.5 p-2.5 rounded-[2px] bg-accent-bg border border-accent text-[11px] font-mono text-accent">
                {telegramStatus}
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: EMAIL CONNECTOR (IMAP & MCP) */}
        <div
          className={`rounded-[2px] p-5 border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-panel/90 border-warn'
              : 'bg-panel border-rule shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3 border-b pb-3 border-rule">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-[2px] bg-warn-bg text-warn border border-warn">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-mono font-bold uppercase ${isDark ? 'text-warn' : 'text-accent'}`}>
                    2. Email Connector (MCP & IMAP)
                  </h3>
                  <span className="text-[11px] text-ink-3 font-mono">
                    Model Context Protocol Protocol (Active)
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded uppercase ${
                isDark
                  ? 'bg-warn-bg text-warn font-bold border border-warn'
                  : 'bg-danger-bg text-danger font-semibold border border-danger'
              }`}>
                MCP Active
              </span>
            </div>

            <p className={`text-xs mb-3 ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
              Автоматический сбор сервисных писем по протоколу IMAP с поддержкой MCP сервер-агентов. Все пароли приложений маскируются и защищены.
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs mb-3">
              <div>
                <label htmlFor="email-host-input" className="mb-0.5 block text-[10px] text-ink-3">
                  IMAP сервер
                </label>
                <input
                  id="email-host-input"
                  type="text"
                  value={emailHost}
                  onChange={(e) => setEmailHost(e.target.value)}
                  className={`min-h-11 w-full rounded-[2px] border px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isDark ? 'bg-panel border-rule text-ink' : 'bg-panel-2 border-rule'}`}
                />
              </div>
              <div>
                <label htmlFor="email-port-input" className="mb-0.5 block text-[10px] text-ink-3">
                  Порт SSL
                </label>
                <input
                  id="email-port-input"
                  type="text"
                  inputMode="numeric"
                  value={emailPort}
                  onChange={(e) => setEmailPort(e.target.value)}
                  className={`min-h-11 w-full rounded-[2px] border px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isDark ? 'bg-panel border-rule text-ink' : 'bg-panel-2 border-rule'}`}
                />
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div>
                <label htmlFor="email-address-input" className="mb-0.5 block text-[10px] text-ink-3">
                  Адрес сервисного ящика
                </label>
                <input
                  id="email-address-input"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className={`min-h-11 w-full rounded-[2px] border px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isDark ? 'bg-panel border-rule text-ink' : 'bg-panel-2 border-rule'}`}
                />
              </div>
              <div>
                <label htmlFor="email-password-input" className="mb-0.5 block text-[10px] text-ink-3">
                  Пароль приложения
                </label>
                <div className="relative">
                  <input
                    id="email-password-input"
                    type={showEmailPass ? 'text' : 'password'}
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className={`min-h-11 w-full rounded-[2px] border px-2 pr-12 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isDark ? 'bg-panel border-rule text-ink' : 'bg-panel-2 border-rule'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPass(!showEmailPass)}
                    aria-label={showEmailPass ? 'Скрыть пароль' : 'Показать пароль'}
                    className="absolute right-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[2px] text-ink-3 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {showEmailPass ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-rule">
            <button
              onClick={handleTestEmailWebhook}
              className={`w-full py-2.5 px-4 rounded-[2px] font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 ${
                isDark
                  ? 'bg-warn-bg hover:bg-warn-bg text-ink'
                  : 'bg-warn-bg hover:bg-warn-bg text-ink border border-warn'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Симуляция входящего Email</span>
            </button>
            {emailStatus && (
              <div className="mt-2.5 p-2.5 rounded-[2px] bg-warn-bg border border-warn text-[11px] font-mono text-warn">
                {emailStatus}
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: TELEPHONY CONNECTOR (VOICE STT) */}
        <div
          className={`rounded-[2px] p-5 border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-panel/90 border-accent'
              : 'bg-panel border-rule shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3 border-b pb-3 border-rule">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-[2px] bg-accent-bg text-accent border border-accent">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-mono font-bold uppercase ${isDark ? 'text-accent' : 'text-accent'}`}>
                    3. Телефония (Voice STT)
                  </h3>
                  <span className="text-[11px] text-ink-3 font-mono">
                    Speech-To-Text & Диаризация Голоса
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded uppercase ${
                isDark
                  ? 'bg-accent-bg text-accent font-bold border border-accent'
                  : 'bg-accent-bg text-accent font-semibold border border-accent'
              }`}>
                SIP Ready
              </span>
            </div>

            <p className={`text-xs mb-3 ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
              Интеграция с виртуальной АТС, транскрибацией речи в реальном времени и автоматической идентификацией звонящего по базе контрагентов.
            </p>

            <div className="space-y-2 font-mono text-xs mb-3">
              <div>
                <label htmlFor="tel-stt-provider" className="block text-[10px] text-ink-3 mb-0.5">Движок Распознавания Речи (STT):</label>
                <input
                  id="tel-stt-provider"
                  type="text"
                  value={sttProvider}
                  onChange={(e) => setSttProvider(e.target.value)}
                  className={`w-full p-2 rounded-[2px] border text-xs ${isDark ? 'bg-panel border-rule text-ink' : 'bg-panel-2 border-rule'}`}
                />
              </div>
              <div>
                <label htmlFor="tel-sip-trunk" className="block text-[10px] text-ink-3 mb-0.5">SIP Транк ID:</label>
                <input
                  id="tel-sip-trunk"
                  type="text"
                  value={sipTrunk}
                  onChange={(e) => setSipTrunk(e.target.value)}
                  className={`w-full p-2 rounded-[2px] border text-xs ${isDark ? 'bg-panel border-rule text-ink' : 'bg-panel-2 border-rule'}`}
                />
              </div>
              <div>
                <label htmlFor="tel-secret" className="block text-[10px] text-ink-3 mb-0.5">Секретный Ключ АТС (Masked):</label>
                <div className="relative">
                  <input
                    id="tel-secret"
                    type={showTelephonySecret ? 'text' : 'password'}
                    value={telephonySecret}
                    onChange={(e) => setTelephonySecret(e.target.value)}
                    className={`w-full p-2 pr-9 rounded-[2px] border text-xs ${isDark ? 'bg-panel border-rule text-ink' : 'bg-panel-2 border-rule'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTelephonySecret(!showTelephonySecret)}
                    aria-label={showTelephonySecret ? 'Скрыть секретный ключ АТС' : 'Показать секретный ключ АТС'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-ink-3 hover:text-ink"
                  >
                    {showTelephonySecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-rule">
            <button
              onClick={handleTestTelephonyWebhook}
              className="w-full py-2.5 px-4 rounded-[2px] bg-accent hover:bg-accent-hover text-ink font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Тестовый звонок (Симуляция STT)</span>
            </button>
            {telephonyStatus && (
              <div className="mt-2.5 p-2.5 rounded-[2px] bg-accent-bg border border-accent text-[11px] font-mono text-accent">
                {telephonyStatus}
              </div>
            )}
          </div>
        </div>

        {/* CARD 4: API SWAGGER & LIVE RUNNER */}
        <div
          className={`rounded-[2px] p-5 border transition-all flex flex-col justify-between ${
            isDark
              ? 'bg-panel/90 border-accent'
              : 'bg-panel border-rule shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3 border-b pb-3 border-rule">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-[2px] bg-accent-bg text-accent border border-accent">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-mono font-bold uppercase ${isDark ? 'text-accent' : 'text-accent'}`}>
                    4. Swagger REST API & Webhooks
                  </h3>
                  <span className="text-[11px] text-ink-3 font-mono">
                    OpenAPI Interactive Sandbox
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded uppercase ${
                isDark
                  ? 'bg-accent-bg text-accent font-bold border border-accent'
                  : 'bg-accent-bg text-accent font-semibold border border-accent'
              }`}>
                Swagger Live
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs mb-3">
              <div className="flex items-center gap-2">
                <select
                  aria-label="HTTP-метод запроса"
                  value={apiMethod}
                  onChange={(e: any) => setApiMethod(e.target.value)}
                  className={`p-2 rounded-[2px] border font-bold ${
                    isDark ? 'bg-panel border-rule text-accent' : 'bg-panel-2 border-rule text-ink'
                  }`}
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>

                <select
                  aria-label="Адрес эндпоинта"
                  value={selectedApiEndpoint}
                  onChange={(e) => {
                    const ep = e.target.value;
                    setSelectedApiEndpoint(ep);
                    if (ep === '/api/1c/tickets') {
                      setApiMethod('GET');
                    } else {
                      setApiMethod('POST');
                      if (ep === '/api/webhooks/dispatch') {
                        setApiRequestBody(
                          JSON.stringify(
                            {
                              channel: 'telegram',
                              sender: 'ООО "СеверФуд" (ИНН 7701234567)',
                              text: 'Срочно! Сломался компрессор на ХУ-17, температура поднялась до +6 градусов.',
                            },
                            null,
                            2
                          )
                        );
                      } else if (ep === '/api/webhooks/telegram') {
                        setApiRequestBody(
                          JSON.stringify(
                            {
                              sender: 'ООО "СеверФуд"',
                              text: 'СеверФуд, Дмитровское шоссе 100, аварийная остановка ХУ-17',
                            },
                            null,
                            2
                          )
                        );
                      } else if (ep === '/api/webhooks/email') {
                        setApiRequestBody(
                          JSON.stringify(
                            {
                              from: 'dispatch@severfood.ru',
                              subject: 'Аварийный вызов - компрессор ХУ-17',
                              body: 'ООО СеверФуд. Срочный ремонт холодильной установки ХУ-17 на складе Дмитровское ш. 100',
                            },
                            null,
                            2
                          )
                        );
                      } else if (ep === '/api/webhooks/telephony') {
                        setApiRequestBody(
                          JSON.stringify(
                            {
                              caller_number: '+7 999 111-2233',
                              transcript: 'Здравствуйте, это ООО СеверФуд. У нас авария на Дмитровском шоссе, компрессор ХУ-17 отключился.',
                            },
                            null,
                            2
                          )
                        );
                      }
                    }
                  }}
                  className={`w-full p-2 rounded-[2px] border font-bold ${
                    isDark ? 'bg-panel border-rule text-ink' : 'bg-panel-2 border-rule text-ink'
                  }`}
                >
                  <option value="/api/webhooks/dispatch">POST /api/webhooks/dispatch (AI Dispatcher Webhook)</option>
                  <option value="/api/webhooks/telegram">POST /api/webhooks/telegram (Telegram Webhook)</option>
                  <option value="/api/webhooks/email">POST /api/webhooks/email (Email IMAP Webhook)</option>
                  <option value="/api/webhooks/telephony">POST /api/webhooks/telephony (SIP Voice STT)</option>
                  <option value="/api/1c/tickets">GET /api/1c/tickets (1C OData Sync)</option>
                </select>
              </div>

              <div>
                <label htmlFor="api-request-body" className="block text-[10px] text-ink-3 mb-0.5">
                  {apiMethod === 'POST' ? 'Payload (JSON):' : 'Параметры запроса (JSON / Query):'}
                </label>
                <textarea
                  id="api-request-body"
                  rows={4}
                  value={apiRequestBody}
                  onChange={(e) => setApiRequestBody(e.target.value)}
                  placeholder={apiMethod === 'GET' ? '{"sender": "ООО СеверФуд", "text": "Срочный ремонт"}' : '{"text": "Заявка..."}'}
                  className={`w-full p-2 rounded-[2px] border text-[11px] font-mono leading-tight focus:outline-none focus:ring-1 focus:ring-accent ${
                    isDark ? 'bg-panel border-rule text-ink-3' : 'bg-panel-2 border-rule text-ink'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-rule">
            <button
              onClick={handleRunApiTest}
              disabled={isApiLoading}
              className={`w-full py-2.5 px-4 rounded-[2px] font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 border disabled:opacity-50 ${
                isDark
                  ? 'bg-accent hover:bg-accent-hover text-ink border-accent'
                  : 'bg-accent hover:bg-accent-hover text-ink border-accent'
              }`}
            >
              {isApiLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Выполнение API запроса...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Выполнить API запрос в Sandbox</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CARD 5: TEST VOICE INPUT (MIC / SPEECH RECOGNITION) */}
        <div
          className={`rounded-[2px] p-5 border transition-all flex flex-col justify-between lg:col-span-2 ${
            isDark
              ? 'bg-panel/90 border-danger'
              : 'bg-panel border-rule shadow-sm'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3 border-b pb-3 border-rule">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-[2px] border ${isRecording ? 'bg-accent-bg text-accent border-accent' : 'bg-accent-bg text-accent border-accent'}`}>
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-mono font-bold uppercase ${isDark ? 'text-danger' : 'text-accent'}`}>
                    5. Тестовый голосовой ввод (Browser Speech Recognition)
                  </h3>
                  <span className="text-[11px] text-ink-3 font-mono">
                    Интерактивная запись голоса с микрофона или пресеты транскрипта
                  </span>
                </div>
              </div>
              <span
                aria-live="polite"
                className={`text-[10px] font-mono px-2.5 py-1 rounded uppercase ${
                  isRecording
                    ? (isDark ? 'bg-accent-bg text-accent border border-accent font-bold' : 'bg-accent-bg text-accent border border-accent font-semibold')
                    : (isDark ? 'bg-panel-2/20 text-ink-3 border border-rule font-bold' : 'bg-panel-2 text-ink border border-rule font-semibold')
                }`}
              >
                {isRecording ? 'Идёт запись' : 'Готов к записи'}
              </span>
            </div>

            <p className={`text-xs mb-3 ${isDark ? 'text-ink-3' : 'text-ink-2'}`}>
              Нажмите кнопку микрофона и произнесите голосовое обращение (например: <i>"Склад СеверФуд, в камере ХУ-17 поднялась температура"</i>). AI-Диспетчер распознает текст, извлечет факты и сформирует тикет.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Mic Controls */}
              <div className="flex flex-col justify-center items-center p-4 rounded-[2px] bg-paper border border-rule space-y-2">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  aria-label={isRecording ? 'Остановить запись голосового обращения' : 'Начать запись голосового обращения'}
                  aria-pressed={isRecording}
                  className={`p-4 rounded-full transition-colors flex items-center justify-center ${
                    isRecording
                      ? 'bg-accent-bg text-ink ring-2 ring-accent'
                      : 'bg-accent-bg hover:bg-accent-bg text-accent border border-accent'
                  }`}
                >
                  {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                <span className="text-[11px] font-bold text-ink-3">
                  {isRecording ? 'Остановить запись' : 'Нажмите для записи'}
                </span>
                <span className="text-[9px] text-ink-3 text-center">
                  Web Speech API / SpeechKit
                </span>
              </div>

              {/* Live Transcript Display Box */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="voice-transcript" className="text-[10px] font-bold text-ink-3 uppercase flex items-center gap-1">
                    <Volume2 className="h-3 w-3 text-danger" />
                    Транскрипт Распознанной Речи (STT):
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setVoiceTranscript('Завод Северсталь, цех 3. На котельной потек насос ХУ-17')}
                      className="text-[10px] px-2.5 py-1.5 min-h-[24px] rounded bg-panel hover:bg-panel-2 text-ink-3 border border-rule"
                    >
                      Пресет 1 (Северсталь)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceTranscript('Склад Дмитровское шоссе 100, в камере ХУ-17 не держит температуру')}
                      className="text-[10px] px-2.5 py-1.5 min-h-[24px] rounded bg-panel hover:bg-panel-2 text-ink-3 border border-rule"
                    >
                      Пресет 2 (Дмитровское)
                    </button>
                  </div>
                </div>

                <textarea
                  id="voice-transcript"
                  rows={3}
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  placeholder="Произнесите фразу или введите текст для теста голосового канала..."
                  className={`w-full p-2.5 rounded-[2px] border text-xs font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-danger ${
                    isDark ? 'bg-panel border-rule text-ink' : 'bg-panel-2 border-rule text-ink'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleSendVoiceDispatch}
              disabled={isVoiceSubmitting || !voiceTranscript.trim()}
              className="w-full sm:w-auto py-2.5 px-6 rounded-[2px] bg-danger-bg hover:bg-danger-bg text-ink font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isVoiceSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Обработка AI-Диспетчером...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Отправить Голосовое Обращение в AI-Диспетчер</span>
                </>
              )}
            </button>

            {voiceInputStatus && (
              <div className="w-full sm:w-auto p-2 px-3 rounded-[2px] bg-danger-bg border border-danger text-[11px] font-mono text-danger">
                {voiceInputStatus}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SWAGGER RESPONSE OUTPUT PANEL */}
      {apiResponseOutput && (
        <div
          className={`p-5 rounded-[2px] border transition-all ${
            isDark
              ? 'bg-panel border-accent text-accent'
              : 'bg-panel border-rule text-accent'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 font-mono text-xs font-bold">
              <Terminal className="h-4 w-4 text-accent" />
              <span>Swagger REST API Output Response [HTTP 200 OK]</span>
            </div>
            <button
              onClick={() => setApiResponseOutput(null)}
              className="text-[10px] font-mono text-ink-3 hover:text-ink"
            >
              Очистить
            </button>
          </div>
          <pre className="text-xs font-mono max-h-64 overflow-y-auto p-3 rounded-[2px] bg-paper border border-rule text-accent whitespace-pre-wrap leading-relaxed">
            {apiResponseOutput}
          </pre>
        </div>
      )}
    </div>
  );
};
