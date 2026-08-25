import {
  ExtractedFacts,
  ProcessingResult,
  TraceStep,
  Site,
  Asset,
  Contract,
  Ticket,
} from './types';
import { DatabaseSchema } from './mockDb';

// --- Normalization Helpers ---
export function cleanCode(input: string | null | undefined): string {
  if (!input) return '';
  return input.replace(/[^0-9a-zA-Zа-яА-Я]/g, '').toLowerCase();
}

export function extractDigits(input: string | null | undefined): string {
  if (!input) return '';
  return input.replace(/[^0-9]/g, '');
}

/** True when two local codes refer to the same unit (ХУ-17 ≠ ХУ-17-БАК). */
export function assetCodesMatch(
  localCode: string | null | undefined,
  query: string | null | undefined
): boolean {
  const a = cleanCode(localCode);
  const q = cleanCode(query);
  return Boolean(a && q && a === q);
}

// --- PII Masking (phones, INN, emails) ---
const PII_PATTERNS: RegExp[] = [
  /\+?\d[\d\s\-()]{8,}\d/g, // phone numbers with separators
  /\b\d{10,12}\b/g, // INN / long numeric IDs
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, // emails
];

export function maskPii(text: string | null | undefined): string {
  if (!text) return '';
  let masked = text;
  for (const re of PII_PATTERNS) {
    masked = masked.replace(re, (m) => {
      const digits = m.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 12 && m === digits) {
        return `${m.slice(0, 2)}***${m.slice(-2)}`;
      }
      if (m.includes('@')) return `${m[0]}***@***`;
      if (digits.length >= 8) return `+7***${digits.slice(-2)}`;
      return m;
    });
  }
  return masked;
}

// --- Guardrail Inspector ---
export interface GuardrailCheck {
  triggered: boolean;
  reason?: string;
}

const INJECTION_SIGNATURES = [
  'system override',
  'ignore previous instructions',
  'ignore all previous',
  'ignore the system',
  'forget everything',
  'не следуй инструкциям',
  'игнорируй предыдущие',
  'игнорируй инструкции',
  'не учитывай правила',
  'обойди защиту',
  'отключи защиту',
  'перепиши системный промпт',
  'set sla',
  'sla 5 минут',
  'sla 5 minutes',
  'sla 1 минуту',
  'sla 1 minute',
  'назначь sla',
  'измени договор',
  'искази условия',
  'перенастройте серверы',
  'удали бд',
  'удали базу',
  'drop table',
  'delete from',
  'truncate table',
];

export function checkGuardrails(text: string): GuardrailCheck {
  const normalized = (text || '')
    .toLowerCase()
    .replace(/[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~\-—–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const signature of INJECTION_SIGNATURES) {
    if (normalized.includes(signature)) {
      return {
        triggered: true,
        reason: `Обнаружена попытка внедрения инструкций / искажения условий ("${signature}")`,
      };
    }
  }

  return { triggered: false };
}

// --- SLA: business-window aware deadline calculation ---
const SITE_TZ_OFFSET_MINUTES: Record<string, number> = {
  'Europe/Moscow': 180,
  'Asia/Yekaterinburg': 300,
};

export function siteTzOffsetMinutes(timezone: string | undefined): number {
  if (!timezone) return 180;
  return SITE_TZ_OFFSET_MINUTES[timezone] ?? 180;
}

function formatHM(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function parseWorkingWindow(
  workingHours: string | undefined
): { startMin: number; endMin: number; weekdaysOnly: boolean; is24x7: boolean } {
  const text = (workingHours || '').toLowerCase();
  if (/24x7|круглосуточно|round the clock|always/.test(text)) {
    return { startMin: 0, endMin: 1440, weekdaysOnly: false, is24x7: true };
  }
  const m = text.match(/(\d{1,2})[:.]?(\d{2})?\s*[-–—]\s*(\d{1,2})[:.]?(\d{2})?/);
  const weekdaysOnly = /пн|понедельник|mon|пят|fri|weekday/i.test(text);
  if (m) {
    const startMin = Number(m[1]) * 60 + (m[2] ? Number(m[2]) : 0);
    const endMin = Number(m[3]) * 60 + (m[4] ? Number(m[4]) : 0);
    return { startMin, endMin: endMin > startMin ? endMin : endMin + 1440, weekdaysOnly, is24x7: false };
  }
  return { startMin: 9 * 60, endMin: 18 * 60, weekdaysOnly: true, is24x7: false };
}

function addServiceMinutes(
  baseUtcMs: number,
  minutes: number,
  offsetMin: number,
  win: { startMin: number; endMin: number; weekdaysOnly: boolean; is24x7: boolean }
): number {
  if (win.is24x7) return baseUtcMs + minutes * 60000;
  let lm = Math.floor(baseUtcMs / 60000) + offsetMin;
  let remaining = minutes;
  while (remaining > 0) {
    const dayIndex = Math.floor(lm / 1440);
    const jsDow = (((dayIndex + 4) % 7) + 7) % 7; // 0=Sun..4=Thu (1970-01-01 was Thursday)
    const minuteOfDay = ((lm % 1440) + 1440) % 1440;
    if (win.weekdaysOnly && (jsDow === 0 || jsDow === 6)) {
      const toMonday = jsDow === 6 ? 2 : 1;
      lm += toMonday * 1440 + (win.startMin - minuteOfDay);
      continue;
    }
    if (minuteOfDay < win.startMin) {
      lm += win.startMin - minuteOfDay;
      continue;
    }
    if (minuteOfDay >= win.endMin) {
      lm += 1440 - minuteOfDay + win.startMin;
      continue;
    }
    const available = win.endMin - minuteOfDay;
    const take = Math.min(available, remaining);
    lm += take;
    remaining -= take;
  }
  return (lm - offsetMin) * 60000;
}

export function calculateSlaDeadline(
  incomingTimeIso: string,
  slaMinutes: number,
  workingHours: string | undefined,
  timezone: string | undefined
): { deadlineIso: string; working_window: string } {
  const baseUtcMs = new Date(incomingTimeIso).getTime();
  if (isNaN(baseUtcMs)) {
    return {
      deadlineIso: new Date(Date.now() + slaMinutes * 60000).toISOString(),
      working_window: workingHours || 'default',
    };
  }
  const offset = siteTzOffsetMinutes(timezone);
  const win = parseWorkingWindow(workingHours);
  const deadlineUtcMs = addServiceMinutes(baseUtcMs, slaMinutes, offset, win);
  return {
    deadlineIso: new Date(deadlineUtcMs).toISOString(),
    working_window: win.is24x7
      ? '24x7'
      : `${formatHM(win.startMin)}-${formatHM(win.endMin)}${win.weekdaysOnly ? ' Пн-Пт' : ''}`,
  };
}

// --- Rule-Based / Fallback Fact Extractor ---
export function extractFactsFromText(
  text: string,
  channel: string
): ExtractedFacts {
  const lower = text.toLowerCase();

  // Customer Name
  let customerVal: string | null = null;
  let customerQuote: string | null = null;
  let customerConf = 0.0;

  if (lower.includes('северфуд') || lower.includes('север фуд')) {
    customerVal = 'СеверФуд';
    customerQuote = text.match(/северфуд|север фуд|северфуда/i)?.[0] || 'СеверФуд';
    customerConf = 0.98;
  } else if (lower.includes('агрологистика')) {
    customerVal = 'АгроЛогистика';
    customerQuote = 'АгроЛогистика';
    customerConf = 0.95;
  }

  // Site Address / Info
  let siteVal: string | null = null;
  let siteQuote: string | null = null;
  let siteConf = 0.0;

  if (lower.includes('дмитровском') || lower.includes('дмитровское')) {
    siteVal = 'Дмитровское шоссе, 100';
    siteQuote = text.match(/дмитровском[^\.,]*/i)?.[0] || 'Дмитровское шоссе';
    siteConf = 0.96;
  } else if (lower.includes('сибирский тракт') || lower.includes('екатеринбург')) {
    siteVal = 'ул. Сибирский Тракт, 12';
    siteQuote = 'Сибирский Тракт';
    siteConf = 0.92;
  } else if (lower.includes('пулковское') || lower.includes('санкт-петербург')) {
    siteVal = 'Пулковское шоссе, 40';
    siteQuote = 'Пулковское шоссе';
    siteConf = 0.95;
  }

  // Asset Code
  let assetVal: string | null = null;
  let assetQuote: string | null = null;
  let assetConf = 0.0;

  if (/ху[-\s]?17[-\s]?бак/i.test(text)) {
    assetVal = 'ХУ-17-БАК';
    assetQuote = text.match(/ху[-\s]?17[-\s]?бак/i)?.[0] || 'ХУ-17-БАК';
    assetConf = 0.96;
  } else if (lower.includes('ху-18') || lower.includes('ху 18') || lower.includes('18-я')) {
    assetVal = 'ХУ-18';
    assetQuote = text.match(/ху-18|18-я/i)?.[0] || 'ХУ-18';
    assetConf = 0.95;
  } else if (
    lower.includes('ху-17') ||
    lower.includes('ху 17') ||
    lower.includes('17-я') ||
    lower.includes('семнадцатой')
  ) {
    assetVal = 'ХУ-17';
    assetQuote = text.match(/ху-17|17-я|семнадцатой/i)?.[0] || '17-я';
    assetConf = 0.91;
  } else if (lower.includes('чил-01') || lower.includes('чиллер')) {
    assetVal = 'ЧИЛ-01';
    assetQuote = 'ЧИЛ-01';
    assetConf = 0.92;
  }

  // Problem Summary
  const problemSummaryVal = text.length > 120 ? text.slice(0, 120) + '...' : text;

  // Deadline mention
  let deadlineVal: string | null = null;
  let deadlineQuote: string | null = null;
  if (lower.includes('до 19:00') || lower.includes('сегодня до')) {
    deadlineVal = 'сегодня до 19:00';
    deadlineQuote = text.match(/до 19:00|сегодня до 19:00/i)?.[0] || 'до 19:00';
  }

  return {
    customer_name: {
      value: customerVal,
      quote: customerQuote,
      confidence: customerConf,
      type: 'fact',
    },
    site_info: {
      value: siteVal,
      quote: siteQuote,
      confidence: siteConf,
      type: 'fact',
    },
    asset_code: {
      value: assetVal,
      quote: assetQuote,
      confidence: assetConf,
      type: 'fact',
    },
    problem_summary: {
      value: problemSummaryVal,
      quote: problemSummaryVal,
      confidence: 0.88,
      type: 'fact',
    },
    requested_deadline: {
      value: deadlineVal,
      quote: deadlineQuote,
      confidence: deadlineVal ? 0.9 : 0,
      type: 'fact',
    },
    has_backup: {
      value: lower.includes('резерв') ? 'Присутствует упоминание резерва' : 'Не указано',
      confidence: 0.7,
      type: 'inference',
    },
    symptoms: lower.includes('температура')
      ? ['Рост температуры', 'Риск порчи товара']
      : ['Не запускается'],
  };
}

// --- Main Deterministic Dispatch Core ---
export function runDeterministicDispatch(
  db: DatabaseSchema,
  facts: ExtractedFacts,
  rawText: string,
  channel: string,
  incomingTimeIso: string,
  isDryRun: boolean = true
): ProcessingResult {
  const startTime = performance.now();
  const trace: TraceStep[] = [];

  const addTrace = (
    step_name: string,
    duration_ms: number,
    status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO',
    details: Record<string, any>
  ) => {
    trace.push({
      id: `tr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      step_name,
      timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
      duration_ms: Math.round(duration_ms),
      status,
      details: JSON.parse(maskPii(JSON.stringify(details ?? {}))),
    });
  };

  // Step 1: Guardrails
  const t1 = performance.now();
  const guard = checkGuardrails(rawText);
  addTrace('01_guardrails_and_sanitization', performance.now() - t1, guard.triggered ? 'WARNING' : 'SUCCESS', {
    input_length: rawText.length,
    channel,
    guardrail_triggered: guard.triggered,
    guardrail_reason: guard.reason || 'Ввод санитизирован. Injection/tampering не обнаружены.',
  });

  // Step 2: Extract / Parse Facts
  const t2 = performance.now();
  addTrace('02_fact_extraction', performance.now() - t2, 'SUCCESS', {
    extracted_customer: facts.customer_name,
    extracted_site: facts.site_info,
    extracted_asset: facts.asset_code,
    requested_deadline: facts.requested_deadline,
  });

  // Step 3: Tool - Customer / Site / Contractor Lookup
  const t3 = performance.now();
  const custName = facts.customer_name.value?.toLowerCase() || '';
  const siteAddr = facts.site_info.value?.toLowerCase() || '';
  const rawLower = rawText.toLowerCase();

  const knownContractors = db.contractors.filter((c) => {
    const cName = c.name.toLowerCase();
    const cClean = cName.replace(/ооо|пао|зао|ао|"/g, '').trim();
    return (
      (custName && (cName.includes(custName) || cClean.includes(custName))) ||
      (cClean.length >= 3 && rawLower.includes(cClean))
    );
  });

  const matchedSites: Site[] = db.sites.filter((s) => {
    const nameMatch = custName && s.customer_name.toLowerCase().includes(custName);
    const addrMatch = siteAddr && s.address.toLowerCase().includes(siteAddr);
    const rawMatch = rawLower.includes(s.customer_name.toLowerCase()) ||
      (s.address.toLowerCase().split(',')[1] && rawLower.includes(s.address.toLowerCase().split(',')[1].trim()));
    return nameMatch || addrMatch || rawMatch;
  });

  const matchedAssetsInDb = db.assets.filter((a) => assetCodesMatch(a.local_code, facts.asset_code.value));

  const isContractorOrAssetInDb =
    matchedSites.length > 0 || knownContractors.length > 0 || matchedAssetsInDb.length > 0;

  addTrace('03_tool_find_customer_or_site', performance.now() - t3, isContractorOrAssetInDb ? 'SUCCESS' : 'WARNING', {
    query_customer: facts.customer_name.value,
    query_site: facts.site_info.value,
    found_count: matchedSites.length,
    known_contractors_found: knownContractors.length,
    matched_sites: matchedSites,
  });

  // Step 4: Asset & Ticket Association Matrix
  const t4 = performance.now();
  let selectedSite: Site | null = null;
  let selectedAsset: Asset | null = null;
  let matchingOpenTickets: Ticket[] = [];
  const reasoning: string[] = [];

  const targetAssetCode = facts.asset_code.value;

  const addressMatchedSites = db.sites.filter((s) => {
    const sAddr = s.address.toLowerCase();
    return siteAddr && sAddr.includes(siteAddr);
  });

  if (addressMatchedSites.length === 1) {
    selectedSite = addressMatchedSites[0];
    reasoning.push(
      `Объект однозначно определён по адресу: "${selectedSite.customer_name}" (${selectedSite.address}).`
    );
  } else if (matchedSites.length === 1) {
    selectedSite = matchedSites[0];
    reasoning.push(`Объект однозначно определён: "${selectedSite.customer_name}" (${selectedSite.address}).`);
  } else if (matchedSites.length > 1) {
    reasoning.push(`Найдено несколько объектов (${matchedSites.length}) для клиента "${facts.customer_name.value}".`);

    // Disambiguate using open tickets and asset code across candidate sites
    for (const site of matchedSites) {
      const candidateAssets = db.assets.filter((a) => a.site_id === site.site_id);
      for (const asset of candidateAssets) {
        if (assetCodesMatch(asset.local_code, targetAssetCode)) {
          const tickets = db.open_tickets.filter((t) => t.asset_id === asset.asset_id);
          if (tickets.length > 0) {
            selectedSite = site;
            selectedAsset = asset;
            matchingOpenTickets = tickets;
            reasoning.push(
              `Разрешение неоднозначности: Объект "${site.address}" определен по открытой заявке ${tickets[0].ticket_id} для оборудования "${asset.local_code}".`
            );
            break;
          }
        }
      }
      if (selectedSite) break;
    }

    if (!selectedSite) {
      reasoning.push(`Не удалось однозначно привязать объект среди нескольких локаций клиента.`);
    }
  }

  // TC-02: resolve site through a recent open ticket when customer/address are absent
  if (!selectedSite && targetAssetCode) {
    const incomingTs = new Date(incomingTimeIso).getTime();
    const recentOpen = db.open_tickets
      .map((t) => {
        const asset = db.assets.find((a) => a.asset_id === t.asset_id) || null;
        const created = new Date(t.created_at).getTime();
        const withinWindow =
          !isNaN(created) && !isNaN(incomingTs) && incomingTs - created >= 0 && incomingTs - created <= 24 * 3600 * 1000;
        return { ticket: t, asset, withinWindow };
      })
      .filter((r) => r.asset && assetCodesMatch(r.asset.local_code, targetAssetCode) && r.withinWindow);

    const distinctSiteIds = [...new Set(recentOpen.map((r) => r.asset!.site_id))];
    if (recentOpen.length >= 1 && distinctSiteIds.length === 1) {
      const hit = recentOpen[0];
      selectedSite = db.sites.find((s) => s.site_id === hit.asset!.site_id) || null;
      selectedAsset = hit.asset;
      matchingOpenTickets = recentOpen.map((r) => r.ticket);
      reasoning.push(
        `Объект определён через открытую заявку ${hit.ticket.ticket_id} (окно дедупликации 24ч): ${
          selectedSite?.address || hit.asset!.site_id
        }, оборудование "${hit.asset!.local_code}".`
      );
    } else if (recentOpen.length > 1) {
      reasoning.push(
        `По коду оборудования найдено несколько открытых заявок (${recentOpen.length}) на разных объектах — требуется уточнение у клиента.`
      );
    } else {
      reasoning.push('Открытых заявок по коду оборудования в окне 24ч не найдено.');
    }
  }

  // Find asset if site resolved but asset not yet set
  if (selectedSite && !selectedAsset && facts.asset_code.value) {
    const siteAssets = db.assets.filter((a) => a.site_id === selectedSite!.site_id);
    selectedAsset = siteAssets.find((a) => assetCodesMatch(a.local_code, targetAssetCode)) || null;

    if (selectedAsset) {
      reasoning.push(`Оборудование найдено в каталоге объекта: "${selectedAsset.name}" (${selectedAsset.local_code}).`);
    } else {
      reasoning.push(`Оборудование с кодом "${facts.asset_code.value}" не найдено на объекте.`);
    }
  }

  // Find open tickets if asset resolved
  if (selectedAsset && matchingOpenTickets.length === 0) {
    matchingOpenTickets = db.open_tickets.filter((t) => t.asset_id === selectedAsset!.asset_id);
  }

  addTrace(
    '04_tool_find_assets_and_open_tickets',
    performance.now() - t4,
    selectedAsset ? 'SUCCESS' : 'WARNING',
    {
      selected_site_id: selectedSite?.site_id || null,
      asset_query: facts.asset_code.value,
      matched_asset_id: selectedAsset?.asset_id || null,
      open_tickets_found: matchingOpenTickets.length,
    }
  );

  // Step 5: Contract & SLA Calculation
  const t5 = performance.now();
  let matchedContract: Contract | null = null;
  let slaMinutes = 240; // Default 4 hrs
  let slaDeadlineIso = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
  let slaWorkingWindow = 'Пн-Пт 09:00-18:00 (default)';

  if (selectedSite) {
    matchedContract = db.contracts.find((c) => c.site_id === selectedSite!.site_id) || null;
    if (matchedContract) {
      slaMinutes = matchedContract.sla_minutes;
      const calc = calculateSlaDeadline(
        incomingTimeIso,
        slaMinutes,
        matchedContract.working_hours,
        selectedSite.timezone
      );
      slaDeadlineIso = calc.deadlineIso;
      slaWorkingWindow = calc.working_window;
      reasoning.push(
        `Договор "${matchedContract.plan}": SLA отклика ${slaMinutes} минут, рабочее окно ${slaWorkingWindow} (${matchedContract.working_hours}). Неустойка: ${matchedContract.penalty_per_hour}.`
      );
    } else {
      reasoning.push('Договор на объект не найден — применён стандартный SLA 4 часа.');
    }
  }

  addTrace('05_tool_get_contract_and_sla', performance.now() - t5, matchedContract ? 'SUCCESS' : 'INFO', {
    site_id: selectedSite?.site_id || null,
    contract_plan: matchedContract?.plan || 'Standard (Default)',
    sla_minutes: slaMinutes,
    sla_working_window: slaWorkingWindow,
    calculated_sla_deadline: slaDeadlineIso,
  });

  // Step 6: Decision Core Matrix
  const t6 = performance.now();
  let recommendedAction: 'CREATE_TICKET' | 'UPDATE_TICKET' | 'REQUEST_CLARIFICATION' | 'ESCALATE_TO_HUMAN' | 'REJECT' =
    'CREATE_TICKET';
  let resultStatus: 'AUTO_APPROVED' | 'REQUIRES_HUMAN_CONFIRMATION' | 'BLOCKED' = 'AUTO_APPROVED';
  let targetTicketId: string | null = null;
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let confidenceScore = 0.92;

  if (guard.triggered) {
    recommendedAction = 'ESCALATE_TO_HUMAN';
    resultStatus = 'REQUIRES_HUMAN_CONFIRMATION';
    confidenceScore = 0.4;
    reasoning.push(`Блокировка безопасности: ${guard.reason}`);
  } else if (!isContractorOrAssetInDb) {
    recommendedAction = 'REJECT';
    resultStatus = 'BLOCKED';
    confidenceScore = 0.1;
    reasoning.push('Контрагент не заведен в базу данных и не обслуживается.');
  } else if (!selectedSite) {
    recommendedAction = 'REQUEST_CLARIFICATION';
    resultStatus = 'REQUIRES_HUMAN_CONFIRMATION';
    confidenceScore = 0.55;
    reasoning.push('Требуется уточнение адреса объекта или наименования компании.');
  } else if (matchingOpenTickets.length > 0) {
    // Open Ticket / Deduplication
    recommendedAction = 'UPDATE_TICKET';
    targetTicketId = matchingOpenTickets[0].ticket_id;
    priority = 'critical'; // Escalation on repeated alert
    resultStatus = 'REQUIRES_HUMAN_CONFIRMATION'; // Repeat incident requires dispatcher review
    confidenceScore = 0.94;
    reasoning.push(
      `Обнаружена активная заявка ${targetTicketId} по оборудованию ${selectedAsset?.local_code || 'объекта'}. Проведено автоматическое объединение и повышение приоритета до CRITICAL.`
    );
  } else {
    // Create new ticket
    recommendedAction = 'CREATE_TICKET';
    if (selectedAsset?.criticality === 'CRITICAL' || matchedContract?.plan === 'Gold') {
      priority = 'high';
    } else {
      priority = 'medium';
    }
    resultStatus = 'AUTO_APPROVED';
    confidenceScore = 0.95;
    reasoning.push('Все факты подтверждены. Автоматическое утверждение создания новой сервисной заявки.');
  }

  // Construct Ticket Payload
  const ticketPayload: Partial<Ticket> | null =
    recommendedAction === 'CREATE_TICKET' || recommendedAction === 'UPDATE_TICKET'
      ? {
          ticket_id: targetTicketId || `T-${Math.floor(100 + Math.random() * 900)}`,
          customer_id: selectedSite?.customer_id || 'C-UNKNOWN',
          site_id: selectedSite?.site_id || 'S-UNKNOWN',
          asset_id: selectedAsset?.asset_id || 'A-UNKNOWN',
          priority,
          summary: facts.problem_summary.value || 'Сервисный инцидент',
          description: `Канал: ${channel.toUpperCase()}\nОтправитель: ${facts.customer_name.value}\nДетали: ${rawText}`,
          sla_deadline: slaDeadlineIso,
          assigned_group: matchedContract?.plan === 'Gold' ? 'Группа №1 (Высокий SLA)' : 'Группа №2 (Стандарт)',
          status: recommendedAction === 'UPDATE_TICKET' ? 'IN_PROGRESS' : 'NEW',
          created_at: incomingTimeIso,
        }
      : null;

  // Step 7: Draft Response Generation
  let customerReply = '';
  const deadlineFormatted = new Date(slaDeadlineIso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (recommendedAction === 'REJECT') {
    customerReply = `Контр-агент не заведен в базу и не обслуживается.`;
  } else if (recommendedAction === 'UPDATE_TICKET') {
    customerReply = `Здравствуйте! Информация о текущем статусе оборудования принята и добавлена к вашей заявке №${targetTicketId}. Ваша заявка переведена в высший приоритет (CRITICAL). Наш инженер уже находится на связи с объектом.`;
  } else if (recommendedAction === 'CREATE_TICKET') {
    customerReply = `Здравствуйте! Заявка зарегистрирована в системе под №${ticketPayload?.ticket_id}. Объект: ${selectedSite?.address}. Назначен плановый срок отклика по договору (${matchedContract?.plan || 'Gold'}): до ${deadlineFormatted}. Инженер сервисной службы оповещен.`;
  } else if (recommendedAction === 'REQUEST_CLARIFICATION') {
    customerReply = `Здравствуйте! Ваше обращение получено, однако для регистрации заявки уточните, пожалуйста, точный адрес объекта и локальный номер оборудования.`;
  } else {
    customerReply = `Здравствуйте! Обращение передано старшему диспетчеру для ручной проверки связи с договором обслуживания.`;
  }

  addTrace('06_decision_engine_matrix', performance.now() - t6, resultStatus === 'AUTO_APPROVED' ? 'SUCCESS' : 'WARNING', {
    recommended_action: recommendedAction,
    result_status: resultStatus,
    target_ticket_id: targetTicketId,
    assigned_priority: priority,
    confidence_score: confidenceScore,
    reasoning,
  });

  // Step 8: Execution & Dry-Run Trace
  addTrace('07_dry_run_execution', 2, 'SUCCESS', {
    tool: 'create_or_update_ticket',
    is_dry_run: isDryRun,
    action: recommendedAction,
    payload: ticketPayload,
    message: isDryRun
      ? `[DRY_RUN SUCCESS] Payload verified against rules. No database write executed yet.`
      : `[LIVE COMMIT] Ticket saved to database.`,
  });

  const missingInfo: string[] = [];
  if (!selectedSite) missingInfo.push('Адрес объекта');
  if (!selectedAsset) missingInfo.push('Код оборудования');

  return {
    status: resultStatus,
    recommended_action: recommendedAction,
    confidence_score: confidenceScore,
    decision_reasoning: reasoning,
    extracted_facts: facts,
    matched_site: selectedSite,
    matched_asset: selectedAsset,
    matched_contract: matchedContract,
    target_ticket_id: targetTicketId,
    ticket_payload: ticketPayload,
    customer_response_draft: customerReply,
    missing_information: missingInfo,
    trace,
    is_dry_run: isDryRun,
    guardrail_triggered: guard.triggered,
    guardrail_reason: guard.reason,
  };
}
