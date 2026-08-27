import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api';
import { SystemLogEntry } from '../types';
import { PageSection } from './layout/PageSection';
import { StatusBadge, StatusTone } from './ui/StatusBadge';
import { ruConnStatus } from '../uiRu';
import { Eye, EyeOff, Mic, MicOff } from 'lucide-react';

interface ChannelsConfigViewProps {
  theme?: 'dark' | 'light';
  onNavigateToConsole?: () => void;
  onViewLogs?: () => void;
}

function maskSecret(value: string): string {
  if (!value) return 'не задан';
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}

function lastLog(logs: SystemLogEntry[], channel: SystemLogEntry['channel']): SystemLogEntry | undefined {
  return logs.find((l) => l.channel === channel);
}

const inputCls =
  'h-7 w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] px-2 text-xs';
const btnCls =
  'rounded-md border border-[var(--oc-border)] px-2 py-1 text-[11px] hover:bg-[var(--oc-surface-2)] disabled:opacity-50';

export const ChannelsConfigView: React.FC<ChannelsConfigViewProps> = ({
  onNavigateToConsole,
  onViewLogs,
}) => {
  const [telegramToken, setTelegramToken] = useState(
    (typeof process !== 'undefined' && process.env?.TELEGRAM_BOT_TOKEN) || ''
  );
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [isPolling, setIsPolling] = useState(true);

  const [emailHost, setEmailHost] = useState('imap.yandex.ru');
  const [emailPort, setEmailPort] = useState('993');
  const [emailAddress, setEmailAddress] = useState('dispatch@severfood.ru');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [mcpEnabled, setMcpEnabled] = useState(true);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  const [sttProvider, setSttProvider] = useState('Yandex SpeechKit v3 (Cloud STT)');
  const [sipTrunk, setSipTrunk] = useState('sip-trunk-7495-msk-01');
  const [telephonySecret, setTelephonySecret] = useState('');
  const [showTelephonySecret, setShowTelephonySecret] = useState(false);
  const [telephonyStatus, setTelephonyStatus] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState(
    'Завод Северсталь, цех 3. На котельной потек насос ХУ-17'
  );
  const [voiceInputStatus, setVoiceInputStatus] = useState<string | null>(null);
  const [isVoiceSubmitting, setIsVoiceSubmitting] = useState(false);
  const recognitionRef = useRef<any>(null);

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
  const [openConfig, setOpenConfig] = useState<string | null>(null);
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);

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
        for (let i = 0; i < event.results.length; i++) currentText += event.results[i][0].transcript;
        if (currentText) setVoiceTranscript(currentText);
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const res = await apiFetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      /* keep */
    }
  }, []);

  useEffect(() => {
    loadLogs();
    const id = setInterval(loadLogs, 5000);
    return () => clearInterval(id);
  }, [loadLogs]);

  const toggleVoiceRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setVoiceTranscript('');
      setVoiceInputStatus(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch {
          setIsRecording(false);
          setVoiceInputStatus('Нажмите еще раз или используйте пресеты транскрипта');
        }
      } else {
        setIsRecording(true);
        setVoiceInputStatus('Голосовой ввод симулируется...');
        setTimeout(() => {
          setVoiceTranscript('Завод Северсталь, цех 3. На котельной потек насос ХУ-17');
          setIsRecording(false);
          setVoiceInputStatus('Речь распознана STT движком');
        }, 2000);
      }
    }
  };

  const handleSendVoiceDispatch = async () => {
    if (!voiceTranscript.trim()) return;
    setIsVoiceSubmitting(true);
    setVoiceInputStatus('Отправка в AI-Диспетчер…');
    try {
      const res = await apiFetch('/api/webhooks/telephony', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller_number: '+7 (999) 777-44-55', transcript: voiceTranscript }),
      });
      const data = await res.json();
      if (data.success) {
        const tId = data.dispatch_result?.ticket_payload?.ticket_id || 'T-VOICE';
        setVoiceInputStatus(`Заявка ${tId} · ${data.dispatch_result?.recommended_action}`);
      } else setVoiceInputStatus(data.error || 'Ошибка');
    } catch (err: any) {
      setVoiceInputStatus(err.message);
    } finally {
      setIsVoiceSubmitting(false);
    }
  };

  const handleSaveTelegramToken = async () => {
    if (!telegramToken.trim()) {
      setTelegramStatus('Введите токен бота из @BotFather');
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
      setTelegramStatus(data.success ? data.message || 'Бот подключен' : data.error || 'Ошибка токена');
    } catch (err: any) {
      setTelegramStatus(err.message);
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleTestEmailWebhook = async () => {
    setEmailStatus('Тест входящего письма…');
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
        setEmailStatus(`Обработано · ${data.dispatch_result?.ticket_payload?.ticket_id || 'ok'}`);
      }
    } catch {
      setEmailStatus('Ошибка тестового письма');
    }
  };

  const handleTestTelephonyWebhook = async () => {
    setTelephonyStatus('Симуляция звонка…');
    try {
      const res = await apiFetch('/api/webhooks/telephony', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_number: '+7 (999) 111-22-33',
          transcript:
            'Алло, диспетчерская? Это склад СеверФуд. На чиллере ЧИЛ-01 упало давление до 2 бар, пошел аварийный сигнал.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTelephonyStatus(`STT разобран · ${data.dispatch_result?.ticket_payload?.ticket_id || 'ok'}`);
      }
    } catch {
      setTelephonyStatus('Ошибка телефонии');
    }
  };

  const handleRunApiTest = async () => {
    setIsApiLoading(true);
    setApiResponseOutput(null);
    try {
      let url = selectedApiEndpoint;
      const init: RequestInit = { method: apiMethod, headers: { 'Content-Type': 'application/json' } };
      if (apiMethod === 'POST') init.body = apiRequestBody;
      else if (apiRequestBody?.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(apiRequestBody);
          const params = new URLSearchParams();
          Object.keys(parsed).forEach((k) => {
            if (parsed[k] != null) params.append(k, String(parsed[k]));
          });
          const q = params.toString();
          if (q) url += (url.includes('?') ? '&' : '?') + q;
        } catch {
          /* ignore */
        }
      }
      const res = await apiFetch(url, init);
      setApiResponseOutput(JSON.stringify(await res.json(), null, 2));
    } catch (err: any) {
      setApiResponseOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsApiLoading(false);
    }
  };

  const applyEndpointPreset = (ep: string) => {
    setSelectedApiEndpoint(ep);
    if (ep === '/api/1c/tickets') {
      setApiMethod('GET');
      return;
    }
    setApiMethod('POST');
    const bodies: Record<string, object> = {
      '/api/webhooks/dispatch': {
        channel: 'telegram',
        sender: 'ООО "СеверФуд" (ИНН 7701234567)',
        text: 'Срочно! Сломался компрессор на ХУ-17, температура поднялась до +6 градусов.',
      },
      '/api/webhooks/telegram': {
        sender: 'ООО "СеверФуд"',
        text: 'СеверФуд, Дмитровское шоссе 100, аварийная остановка ХУ-17',
      },
      '/api/webhooks/email': {
        from: 'dispatch@severfood.ru',
        subject: 'Аварийный вызов - компрессор ХУ-17',
        body: 'ООО СеверФуд. Срочный ремонт холодильной установки ХУ-17 на складе Дмитровское ш. 100',
      },
      '/api/webhooks/telephony': {
        caller_number: '+7 999 111-2233',
        transcript: 'Здравствуйте, это ООО СеверФуд. У нас авария на Дмитровском шоссе, компрессор ХУ-17 отключился.',
      },
    };
    if (bodies[ep]) setApiRequestBody(JSON.stringify(bodies[ep], null, 2));
  };

  const tgLog = lastLog(logs, 'TELEGRAM');
  const emLog = lastLog(logs, 'EMAIL');
  const voLog = lastLog(logs, 'VOICE');
  const restLog = lastLog(logs, 'REST');

  const err = (s: string | null) => Boolean(s && /ошибк|error|fail/i.test(s));
  const rows: {
    name: string;
    type: string;
    tone: StatusTone;
    status: string;
    last: string;
    latency: string;
    config: string;
    key: string;
  }[] = [
    {
      name: 'Telegram',
      type: 'Bot API',
      key: 'telegram',
      tone: err(telegramStatus) ? 'danger' : telegramToken ? 'success' : 'warning',
      status: err(telegramStatus) ? 'ERROR' : telegramToken ? 'ACTIVE' : 'WAITING',
      last: tgLog?.message || '—',
      latency: tgLog?.duration_ms != null ? `${tgLog.duration_ms} ms` : '—',
      config: `токен ${maskSecret(telegramToken)} · опрос ${isPolling ? 'вкл' : 'выкл'}`,
    },
    {
      name: 'Email',
      type: 'IMAP / MCP',
      key: 'email',
      tone: err(emailStatus) ? 'danger' : mcpEnabled ? 'success' : 'neutral',
      status: err(emailStatus) ? 'ERROR' : mcpEnabled ? 'ACTIVE' : 'DISCONNECTED',
      last: emLog?.message || emailStatus || '—',
      latency: emLog?.duration_ms != null ? `${emLog.duration_ms} ms` : '—',
      config: `${emailHost}:${emailPort} · ${emailAddress}`,
    },
    {
      name: 'Voice / STT',
      type: 'SIP + STT',
      key: 'voice',
      tone: err(telephonyStatus) ? 'danger' : isRecording ? 'info' : 'warning',
      status: err(telephonyStatus) ? 'ERROR' : isRecording ? 'ACTIVE' : 'WAITING',
      last: voLog?.message || telephonyStatus || '—',
      latency: voLog?.duration_ms != null ? `${voLog.duration_ms} ms` : '—',
      config: `${sttProvider} · ${sipTrunk}`,
    },
    {
      name: 'REST API',
      type: 'HTTP',
      key: 'rest',
      tone: 'success',
      status: 'ACTIVE',
      last: restLog?.message || 'песочница готова',
      latency: restLog?.duration_ms != null ? `${restLog.duration_ms} ms` : '—',
      config: selectedApiEndpoint,
    },
    {
      name: 'Webhooks',
      type: 'Входящие',
      key: 'webhooks',
      tone: 'success',
      status: 'ACTIVE',
      last: logs[0]?.message || 'приём запросов',
      latency: logs[0]?.duration_ms != null ? `${logs[0].duration_ms} ms` : '—',
      config: '/api/webhooks/*',
    },
  ];

  const SecretField = ({
    value,
    onChange,
    revealed,
    onToggle,
  }: {
    value: string;
    onChange: (v: string) => void;
    revealed: boolean;
    onToggle: () => void;
  }) => (
    <div className="relative">
      <input
        type="password"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} pr-8`}
      />
      <button
        type="button"
        className="absolute right-1.5 top-1 text-[var(--oc-muted)]"
        onClick={onToggle}
        title={revealed ? 'Скрыть подсказку' : 'Показать последние 4 символа'}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      {revealed && (
        <p className="mt-0.5 font-mono text-[10px] text-[var(--oc-muted)]">{maskSecret(value)}</p>
      )}
    </div>
  );

  return (
    <div id="channels-config-page" className="grid gap-3">
      <PageSection
        title="Каналы и интеграции"
        description="Состояние подключений. Секреты маскируются, полный токен не отображается."
        status={{ tone: telegramToken ? 'success' : 'warning', label: telegramToken ? 'АКТИВЕН' : 'ОЖИДАНИЕ' }}
      />

      <section className="oc-card">
        <div className="border-b border-[var(--oc-border)] px-3 py-2">
          <h2 className="oc-section-title">Состояние подключений</h2>
        </div>
        <div className="table-scroll">
          <table className="oc-table min-w-[800px]">
            <thead>
              <tr>
                <th>Канал</th>
                <th>Статус</th>
                <th>Тип</th>
                <th>Последнее событие</th>
                <th>Задержка</th>
                <th>Конфигурация</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="font-medium">{r.name}</td>
                  <td>
                    <StatusBadge tone={r.tone} label={ruConnStatus(r.status)} />
                  </td>
                  <td className="text-[var(--oc-muted)]">{r.type}</td>
                  <td className="max-w-[220px] truncate" title={r.last}>
                    {r.last}
                  </td>
                  <td className="font-mono text-[11px]">{r.latency}</td>
                  <td className="max-w-[200px] truncate font-mono text-[11px] text-[var(--oc-muted)]">{r.config}</td>
                  <td className="whitespace-nowrap">
                    <button type="button" className="mr-1 text-[11px] text-[var(--oc-accent)]" onClick={() => setOpenConfig(r.key)}>
                      Настроить
                    </button>
                    <button type="button" className="text-[11px] text-[var(--oc-muted)]" onClick={onViewLogs}>
                      Логи
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="oc-card px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="oc-section-title">Telegram-бот</h2>
            <StatusBadge tone={telegramToken ? 'success' : 'warning'} label={telegramToken ? 'АКТИВЕН' : 'ОЖИДАНИЕ'} />
          </div>
          {(openConfig === 'telegram' || openConfig === null) && (
            <div className="grid gap-1.5 text-[11px]">
              <span className="text-[var(--oc-muted)]">Токен (маскируется)</span>
              <SecretField
                value={telegramToken}
                onChange={setTelegramToken}
                revealed={showTelegramToken}
                onToggle={() => setShowTelegramToken((v) => !v)}
              />
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={isPolling} onChange={(e) => setIsPolling(e.target.checked)} />
                Long polling (длительный опрос)
              </label>
              <div className="flex flex-wrap gap-1">
                <button type="button" className={btnCls} onClick={handleSaveTelegramToken} disabled={isSavingToken}>
                  {isSavingToken ? 'Сохранение…' : 'Проверить связь'}
                </button>
                <button type="button" className={btnCls} onClick={onViewLogs}>
                  Логи
                </button>
              </div>
              {telegramStatus && <p className="text-[var(--oc-muted)]">{telegramStatus}</p>}
            </div>
          )}
        </section>

        <section className="oc-card px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="oc-section-title">Почта</h2>
            <StatusBadge tone={mcpEnabled ? 'success' : 'neutral'} label={mcpEnabled ? 'АКТИВЕН' : 'ОТКЛЮЧЁН'} />
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <label>
              Хост
              <input className={inputCls} value={emailHost} onChange={(e) => setEmailHost(e.target.value)} />
            </label>
            <label>
              Порт
              <input className={inputCls} value={emailPort} onChange={(e) => setEmailPort(e.target.value)} />
            </label>
            <label className="col-span-2">
              Почтовый ящик
              <input className={inputCls} value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
            </label>
            <label className="col-span-2">
              Пароль приложения
              <SecretField
                value={emailPassword}
                onChange={setEmailPassword}
                revealed={showEmailPass}
                onToggle={() => setShowEmailPass((v) => !v)}
              />
            </label>
          </div>
          <div className="mt-1.5 flex gap-1">
            <button type="button" className={btnCls} onClick={handleTestEmailWebhook}>
              Проверить связь
            </button>
            <button type="button" className={btnCls} onClick={() => setMcpEnabled((v) => !v)}>
              Настроить
            </button>
            <button type="button" className={btnCls} onClick={onViewLogs}>
              Логи
            </button>
          </div>
          {emailStatus && <p className="mt-1 text-[11px] text-[var(--oc-muted)]">{emailStatus}</p>}
        </section>

        <section className="oc-card px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="oc-section-title">Голос / STT</h2>
            <StatusBadge tone={isRecording ? 'info' : 'warning'} label={isRecording ? 'АКТИВЕН' : 'ОЖИДАНИЕ'} />
          </div>
          <div className="grid gap-1.5 text-[11px]">
            <label>
              Движок
              <input className={inputCls} value={sttProvider} onChange={(e) => setSttProvider(e.target.value)} />
            </label>
            <label>
              SIP-транк
              <input className={inputCls} value={sipTrunk} onChange={(e) => setSipTrunk(e.target.value)} />
            </label>
            <label>
              Секрет АТС
              <SecretField
                value={telephonySecret}
                onChange={setTelephonySecret}
                revealed={showTelephonySecret}
                onToggle={() => setShowTelephonySecret((v) => !v)}
              />
            </label>
            <div className="flex flex-wrap gap-1">
              <button type="button" className={btnCls} onClick={handleTestTelephonyWebhook}>
                Проверить связь
              </button>
              <button type="button" className={btnCls} onClick={toggleVoiceRecording}>
                {isRecording ? <MicOff className="mr-1 inline h-3 w-3" /> : <Mic className="mr-1 inline h-3 w-3" />}
                {isRecording ? 'Стоп' : 'Микрофон'}
              </button>
              <button type="button" className={btnCls} onClick={onViewLogs}>
                Логи
              </button>
            </div>
            <textarea
              rows={2}
              className="w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-1.5 text-xs"
              value={voiceTranscript}
              onChange={(e) => setVoiceTranscript(e.target.value)}
            />
            <div className="flex gap-1">
              <button
                type="button"
                className={btnCls}
                onClick={() => setVoiceTranscript('Завод Северсталь, цех 3. На котельной потек насос ХУ-17')}
              >
                Пресет 1
              </button>
              <button
                type="button"
                className={btnCls}
                onClick={() =>
                  setVoiceTranscript('Склад Дмитровское шоссе 100, в камере ХУ-17 не держит температуру')
                }
              >
                Пресет 2
              </button>
              <button
                type="button"
                className={btnCls}
                disabled={isVoiceSubmitting}
                onClick={handleSendVoiceDispatch}
              >
                Отправить диспетчеру
              </button>
            </div>
            {telephonyStatus && <p className="text-[var(--oc-muted)]">{telephonyStatus}</p>}
            {voiceInputStatus && <p className="text-[var(--oc-muted)]">{voiceInputStatus}</p>}
          </div>
        </section>

        <section className="oc-card px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="oc-section-title">REST API</h2>
            <StatusBadge tone="success" label="АКТИВЕН" />
          </div>
          <div className="flex gap-1.5">
            <select
              className={inputCls}
              value={apiMethod}
              onChange={(e) => setApiMethod(e.target.value as 'POST' | 'GET')}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
            <select className={`${inputCls} flex-1`} value={selectedApiEndpoint} onChange={(e) => applyEndpointPreset(e.target.value)}>
              <option value="/api/webhooks/dispatch">/api/webhooks/dispatch</option>
              <option value="/api/webhooks/telegram">/api/webhooks/telegram</option>
              <option value="/api/webhooks/email">/api/webhooks/email</option>
              <option value="/api/webhooks/telephony">/api/webhooks/telephony</option>
              <option value="/api/1c/tickets">/api/1c/tickets</option>
            </select>
          </div>
          <textarea
            rows={4}
            className="mt-1.5 w-full rounded-md border border-[var(--oc-border)] bg-[var(--oc-bg)] p-1.5 font-mono text-[11px]"
            value={apiRequestBody}
            onChange={(e) => setApiRequestBody(e.target.value)}
          />
          <div className="mt-1.5 flex gap-1">
            <button type="button" className={btnCls} disabled={isApiLoading} onClick={handleRunApiTest}>
              {isApiLoading ? 'Выполняется…' : 'Проверить связь'}
            </button>
            <button type="button" className={btnCls} onClick={onNavigateToConsole}>
              Настроить
            </button>
            <button type="button" className={btnCls} onClick={onViewLogs}>
              Логи
            </button>
          </div>
        </section>

        <section className="oc-card px-3 py-2 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="oc-section-title">Вебхуки</h2>
            <StatusBadge tone="success" label="АКТИВЕН" />
          </div>
          <p className="text-[11px] text-[var(--oc-muted)]">
            Входящие: /api/webhooks/telegram · email · telephony · dispatch. Черновик до подтверждения оператором.
          </p>
          <div className="mt-1.5 flex gap-1">
            <button type="button" className={btnCls} onClick={handleRunApiTest}>
              Проверить связь
            </button>
            <button type="button" className={btnCls} onClick={() => setOpenConfig('webhooks')}>
              Настроить
            </button>
            <button type="button" className={btnCls} onClick={onViewLogs}>
              Логи
            </button>
          </div>
          {apiResponseOutput && (
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-[var(--oc-bg)] p-2 font-mono text-[10px] text-[var(--oc-muted)]">
              {apiResponseOutput}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
};
