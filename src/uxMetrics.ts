export interface UXMetrics {
  sessionId: string;
  startedAt: string | null;
  completedAt: string | null;
  timeToComplete: number | null;
  clicksToComplete: number;
  dispatchStartedAt: string | null;
  decisionReceivedAt: string | null;
  timeToFindDecision: number | null;
}

const STORAGE_KEY = 'text2business_ux_metrics';

let sessionId = '';
let sessionStartedAt: number | null = null;
let dispatchStartedAt: number | null = null;
let decisionReceivedAt: number | null = null;
let completedAt: number | null = null;
let clickCount = 0;
let isSessionActive = false;

export function startUXSession() {
  sessionId = `ux-${Date.now()}`;
  sessionStartedAt = Date.now();
  dispatchStartedAt = null;
  decisionReceivedAt = null;
  completedAt = null;
  clickCount = 0;
  isSessionActive = true;

  saveMetrics();
}

export function startDispatchMeasurement() {
  console.log("UX: startDispatchMeasurement CALLED");
  if (!isSessionActive) {
    startUXSession();
  }

  dispatchStartedAt = Date.now();
  decisionReceivedAt = null;
  completedAt = null;

  saveMetrics();
}

export function markDecisionReceived() {
  console.log("UX: markDecisionReceived CALLED");
  if (!dispatchStartedAt || !isSessionActive) return;

  decisionReceivedAt = Date.now();

  saveMetrics();
}

export function completeUXScenario() {
  if (!isSessionActive) return;

  completedAt = Date.now();
  isSessionActive = false;

  saveMetrics();
}

export function registerUXClick() {
  if (!isSessionActive) return;

  clickCount += 1;

  saveMetrics();
}

export function getUXMetrics(): UXMetrics {
  return {
    sessionId,

    startedAt:
      sessionStartedAt
        ? new Date(sessionStartedAt).toISOString()
        : null,

    completedAt:
      completedAt
        ? new Date(completedAt).toISOString()
        : null,

    timeToComplete:
      sessionStartedAt && completedAt
        ? Number(((completedAt - sessionStartedAt) / 1000).toFixed(2))
        : null,

    clicksToComplete: clickCount,

    dispatchStartedAt:
      dispatchStartedAt
        ? new Date(dispatchStartedAt).toISOString()
        : null,

    decisionReceivedAt:
      decisionReceivedAt
        ? new Date(decisionReceivedAt).toISOString()
        : null,

    timeToFindDecision:
      dispatchStartedAt && decisionReceivedAt
        ? Number(((decisionReceivedAt - dispatchStartedAt) / 1000).toFixed(2))
        : null,
  };
}

function saveMetrics() {
  const metrics = getUXMetrics();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(metrics, null, 2)
  );
}

export function getSavedUXMetrics(): UXMetrics | null {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}
