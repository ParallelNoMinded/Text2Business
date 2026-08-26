import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';
import {
  Send,
  Mail,
  PhoneCall,
  Code,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  Terminal,
  Zap,
  Mic,
  MicOff,
  Volume2,
  Filter,
  Info,
  ExternalLink,
  Plus,
  Settings,
  X,
} from 'lucide-react';

interface ChannelsConfigViewProps {
  theme?: 'dark' | 'light';
  onNavigateToConsole?: () => void;
}

type ChannelTab = 'all' | 'messengers' | 'email' | 'voice' | 'api';

export const ChannelsConfigView: React.FC<ChannelsConfigViewProps> = ({
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<ChannelTab>('all');
  const [activeModalChannel, setActiveModalChannel] = useState<'telegram' | 'email' | 'telephony' | 'api' | 'voice_test' | null>(null);

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
  const [emailAddress, setEmailAddress] = useState('inbox@company.ru');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPass, setShowEmailPass] = useState(false);
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
        } catch (e) {}
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

  const channelItems = [
    {
      id: 'telegram' as const,
      category: 'messengers',
      title: 'Telegram Bot (Live API)',
      desc: 'Прием обращений и сообщений из Telegram',
      iconBg: 'bg-[#E0F2FE]',
      iconColor: 'text-[#0284C7]',
      icon: Send,
      statusType: 'active' as const,
      statusLabel: 'Активен',
      detail1: 'Подключен: @Text2Business_Bot',
      detail2: 'Последняя активность: 2 мин назад',
    },
    {
      id: 'email' as const,
      category: 'email',
      title: 'Email Connector (IMAP/MCP)',
      desc: 'Обработка входящих писем из почтовых ящиков',
      iconBg: 'bg-[#DCFCE7]',
      iconColor: 'text-[#16A34A]',
      icon: Mail,
      statusType: 'active' as const,
      statusLabel: 'Активен',
      detail1: `Почтовый ящик: ${emailAddress}`,
      detail2: 'Последняя активность: 5 мин назад',
    },
    {
      id: 'telephony' as const,
      category: 'voice',
      title: 'Голосовой канал (SIP/STT)',
      desc: 'Прием звонков и преобразование речи в текст',
      iconBg: 'bg-[#F3E8FF]',
      iconColor: 'text-[#9333EA]',
      icon: PhoneCall,
      statusType: 'setup' as const,
      statusLabel: 'Настройка',
      detail1: 'SIP сервер: sip.company.ru',
      detail2: 'Последняя активность: -',
    },
    {
      id: 'api' as const,
      category: 'api',
      title: 'API&Webhooks',
      desc: 'Интеграция через REST API и Webhooks',
      iconBg: 'bg-[#CCFBF1]',
      iconColor: 'text-[#0D9488]',
      icon: Code,
      statusType: 'active' as const,
      statusLabel: 'Активен',
      detail1: 'Webhook URL: https://api.company.ru/dispatch',
      detail2: 'Последняя активность: 1 мин назад',
    },
  ];

  const filteredChannels = channelItems.filter((ch) => {
    if (activeTab === 'all') return true;
    return ch.category === activeTab;
  });

  return (
    <div id="channels-config-page" className="mx-auto w-full max-w-[1780px] pb-24 pt-2 sm:pt-4 lg:pb-8 font-sans">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-[30px]">Каналы связи и интеграции</h1>
          <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
            Управляйте подключенными каналами и настройками интеграции.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveModalChannel('telegram')}
          className="flex h-[44px] items-center gap-2 rounded-xl bg-[#2D7A7A] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#236565] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить канал</span>
        </button>
      </div>

      {/* Main Container */}
      <div className={`overflow-hidden rounded-xl border p-5 sm:p-6 ${isDark ? 'border-slate-700 bg-[#242438]' : 'border-[#c8c8c8] bg-white'}`}>
        {/* Tabs Bar */}
        <div className={`flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-slate-700' : 'border-[#e0e0e0]'}`}>
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {[
              { key: 'all' as const, label: 'Все каналы' },
              { key: 'messengers' as const, label: 'Мессенджеры' },
              { key: 'email' as const, label: 'Email' },
              { key: 'voice' as const, label: 'Голосовые' },
              { key: 'api' as const, label: 'API и Webhooks' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative pb-1 text-sm font-extrabold transition ${
                  activeTab === tab.key
                    ? isDark ? 'text-white' : 'text-black'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-[#686868] hover:text-black'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#2d7a7a]" />
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-extrabold transition self-start sm:self-auto ${
              isDark ? 'border-slate-700 bg-[#1c1a2e] text-slate-300 hover:bg-white/5' : 'border-[#c8c8c8] bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Фильтры</span>
          </button>
        </div>

        {/* Channels List */}
        <div className="mt-6 space-y-3.5">
          {filteredChannels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.id}
                onClick={() => setActiveModalChannel(ch.id)}
                className={`flex flex-col gap-4 rounded-xl border p-4 transition sm:flex-row sm:items-center sm:justify-between sm:p-5 cursor-pointer hover:border-[#2D7A7A] ${
                  isDark ? 'border-slate-700 bg-[#1c1a2e] hover:bg-[#201e33]' : 'border-[#e0e0e0] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${ch.iconBg} ${ch.iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold">{ch.title}</h2>
                    <p className={`mt-0.5 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
                      {ch.desc}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-start lg:w-80">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${ch.statusType === 'active' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}></span>
                    <span className={`text-sm font-extrabold ${ch.statusType === 'active' ? (isDark ? 'text-emerald-400' : 'text-[#10B981]') : (isDark ? 'text-amber-400' : 'text-[#D97706]')}`}>
                      {ch.statusLabel}
                    </span>
                  </div>
                  <div className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-[#475569]'}`}>
                    {ch.detail1}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#686868]'}`}>
                    {ch.detail2}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Help Banner */}
        <div className={`mt-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          isDark ? 'border-teal-900/50 bg-[#14282c] text-teal-100' : 'border-[#CCFBF1] bg-[#F0FDFA] text-[#0F766E]'
        }`}>
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 shrink-0 text-[#0D9488]" />
            <div>
              <span className="font-extrabold text-sm block sm:inline mr-2">Как работают каналы</span>
              <span className="text-xs font-medium opacity-90">
                Обращения из подключенных каналов автоматически попадают в диспетчер и обрабатываются AI-движком.
              </span>
            </div>
          </div>

          <a
            href="#docs"
            onClick={(e) => {
              e.preventDefault();
              setActiveModalChannel('voice_test');
            }}
            className="flex items-center gap-1.5 text-xs font-extrabold text-[#0D9488] hover:underline self-start sm:self-auto shrink-0"
          >
            <span>Документация и тест каналов</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Interactive Settings / Test Modal (Preserves all existing functions) */}
      {activeModalChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
            isDark ? 'border-slate-700 bg-[#242438] text-white' : 'border-[#c8c8c8] bg-white text-black'
          }`}>
            <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-[#2D7A7A]" />
                <h2 className="text-lg font-extrabold">
                  {activeModalChannel === 'telegram' && 'Настройка Telegram Bot'}
                  {activeModalChannel === 'email' && 'Настройка и тест Email (IMAP/MCP)'}
                  {activeModalChannel === 'telephony' && 'Настройка Телефонии (SIP/STT)'}
                  {activeModalChannel === 'api' && 'Swagger REST API Sandbox'}
                  {activeModalChannel === 'voice_test' && 'Тест голосового ввода (Web Speech API)'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalChannel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Telegram settings */}
            {activeModalChannel === 'telegram' && (
              <div className="mt-5 space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-400 mb-1">Telegram Bot API Token (из @BotFather):</label>
                  <div className="relative">
                    <input
                      type={showTelegramToken ? 'text' : 'password'}
                      placeholder="7123456789:AAEFghIJKlmNopQRstUv..."
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      className={`w-full p-3 pr-10 rounded-xl border text-xs outline-none ${
                        isDark ? 'border-slate-700 bg-[#1c1a2e] text-white' : 'border-[#c8c8c8] bg-white text-black'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTelegramToken(!showTelegramToken)}
                      className="absolute right-3 top-3 text-slate-400"
                    >
                      {showTelegramToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPolling}
                      onChange={(e) => setIsPolling(e.target.checked)}
                      className="rounded text-[#2D7A7A]"
                    />
                    <span>Автоматический Long Polling</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleSaveTelegramToken}
                  disabled={isSavingToken}
                  className="w-full py-3 rounded-xl bg-[#2D7A7A] hover:bg-[#236565] text-white font-extrabold flex items-center justify-center gap-2"
                >
                  {isSavingToken ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  <span>Сохранить и активировать Telegram</span>
                </button>
                {telegramStatus && (
                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                    {telegramStatus}
                  </div>
                )}
              </div>
            )}

            {/* Email settings */}
            {activeModalChannel === 'email' && (
              <div className="mt-5 space-y-4 text-xs font-bold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">IMAP Сервер:</label>
                    <input
                      type="text"
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Порт SSL:</label>
                    <input
                      type="text"
                      value={emailPort}
                      onChange={(e) => setEmailPort(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Сервисный ящик:</label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Пароль приложения:</label>
                  <div className="relative">
                    <input
                      type={showEmailPass ? 'text' : 'password'}
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className={`w-full p-2.5 pr-9 rounded-lg border text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPass(!showEmailPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400"
                    >
                      {showEmailPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTestEmailWebhook}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold flex items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Отправить тестовое Email обращение</span>
                </button>
                {emailStatus && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    {emailStatus}
                  </div>
                )}
              </div>
            )}

            {/* Telephony settings */}
            {activeModalChannel === 'telephony' && (
              <div className="mt-5 space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-400 mb-1">STT Provider:</label>
                  <input
                    type="text"
                    value={sttProvider}
                    onChange={(e) => setSttProvider(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">SIP Транк ID:</label>
                  <input
                    type="text"
                    value={sipTrunk}
                    onChange={(e) => setSipTrunk(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Ключ АТС:</label>
                  <div className="relative">
                    <input
                      type={showTelephonySecret ? 'text' : 'password'}
                      value={telephonySecret}
                      onChange={(e) => setTelephonySecret(e.target.value)}
                      className={`w-full p-2.5 pr-9 rounded-lg border text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTelephonySecret(!showTelephonySecret)}
                      className="absolute right-2.5 top-2.5 text-slate-400"
                    >
                      {showTelephonySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTestTelephonyWebhook}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold flex items-center justify-center gap-2"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Симулировать входящий звонок (STT)</span>
                </button>
                {telephonyStatus && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                    {telephonyStatus}
                  </div>
                )}
              </div>
            )}

            {/* API Sandbox */}
            {activeModalChannel === 'api' && (
              <div className="mt-5 space-y-4 text-xs font-bold">
                <div className="flex gap-2">
                  <select
                    value={apiMethod}
                    onChange={(e: any) => setApiMethod(e.target.value)}
                    className={`p-2.5 rounded-lg border ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                  <select
                    value={selectedApiEndpoint}
                    onChange={(e) => setSelectedApiEndpoint(e.target.value)}
                    className={`flex-1 p-2.5 rounded-lg border ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                  >
                    <option value="/api/webhooks/dispatch">POST /api/webhooks/dispatch</option>
                    <option value="/api/webhooks/telegram">POST /api/webhooks/telegram</option>
                    <option value="/api/webhooks/email">POST /api/webhooks/email</option>
                    <option value="/api/webhooks/telephony">POST /api/webhooks/telephony</option>
                    <option value="/api/1c/tickets">GET /api/1c/tickets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payload (JSON):</label>
                  <textarea
                    rows={4}
                    value={apiRequestBody}
                    onChange={(e) => setApiRequestBody(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border font-mono text-xs ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRunApiTest}
                  disabled={isApiLoading}
                  className="w-full py-3 rounded-xl bg-[#2D7A7A] hover:bg-[#236565] text-white font-extrabold flex items-center justify-center gap-2"
                >
                  {isApiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                  <span>Выполнить запрос в API Sandbox</span>
                </button>
                {apiResponseOutput && (
                  <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 text-emerald-400 font-mono text-[11px] max-h-48 overflow-y-auto">
                    {apiResponseOutput}
                  </pre>
                )}
              </div>
            )}

            {/* Voice input test */}
            {activeModalChannel === 'voice_test' && (
              <div className="mt-5 space-y-4 text-xs font-bold">
                <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-rose-400/50 space-y-3">
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`p-4 rounded-full transition-all shadow-lg ${
                      isRecording ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400/50' : 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                  <span>{isRecording ? 'Идет запись речи...' : 'Нажмите микрофон для записи'}</span>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Транскрипт:</label>
                  <textarea
                    rows={3}
                    value={voiceTranscript}
                    onChange={(e) => setVoiceTranscript(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border text-xs font-sans ${isDark ? 'border-slate-700 bg-[#1c1a2e]' : 'border-[#c8c8c8] bg-white'}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendVoiceDispatch}
                  disabled={isVoiceSubmitting || !voiceTranscript.trim()}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold flex items-center justify-center gap-2"
                >
                  {isVoiceSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Отправить голос в AI-Диспетчер</span>
                </button>
                {voiceInputStatus && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    {voiceInputStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

