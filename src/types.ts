export type FactType = 'fact' | 'inference' | 'database';

export interface ExtractedFact {
  value: string | null;
  quote?: string | null;
  confidence: number;
  type: FactType;
}

export interface ExtractedFacts {
  customer_name: ExtractedFact;
  site_info: ExtractedFact;
  asset_code: ExtractedFact;
  problem_summary: ExtractedFact;
  requested_deadline: ExtractedFact;
  has_backup: ExtractedFact;
  symptoms?: string[];
}

export interface Site {
  site_id: string;
  customer_id: string;
  customer_name: string;
  address: string;
  contact_person: string;
  timezone: string;
  region: string;
}

export interface Asset {
  asset_id: string;
  site_id: string;
  local_code: string; // e.g. "ХУ-17"
  name: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OK' | 'WARNING' | 'CRITICAL_FAIL';
}

export interface Contract {
  site_id: string;
  plan: 'Gold' | 'Silver' | 'Standard';
  sla_minutes: number;
  working_hours: string;
  penalty_per_hour?: string;
  active: boolean;
}

export interface Ticket {
  ticket_id: string;
  customer_id: string;
  site_id: string;
  asset_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  description: string;
  sla_deadline: string;
  assigned_group: string;
  status: 'NEW' | 'IN_PROGRESS' | 'WAITING_DISPATCHER' | 'RESOLVED';
  created_at: string;
  updated_at?: string;
  history?: Array<{ timestamp: string; note: string; author: string }>;
}

export type BusinessAction =
  | 'CREATE_TICKET'
  | 'UPDATE_TICKET'
  | 'REQUEST_CLARIFICATION'
  | 'ESCALATE_TO_HUMAN'
  | 'REJECT';

export type ResultStatus = 'AUTO_APPROVED' | 'REQUIRES_HUMAN_CONFIRMATION' | 'BLOCKED';

export interface TraceStep {
  id: string;
  step_name: string;
  timestamp: string;
  duration_ms: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  details: Record<string, any>;
}

export interface ProcessingResult {
  status: ResultStatus;
  recommended_action: BusinessAction;
  confidence_score: number;
  decision_reasoning: string[];
  extracted_facts: ExtractedFacts;
  matched_site: Site | null;
  matched_asset: Asset | null;
  matched_contract: Contract | null;
  target_ticket_id?: string | null;
  ticket_payload: Partial<Ticket> | null;
  customer_response_draft: string;
  missing_information: string[];
  trace: TraceStep[];
  is_dry_run: boolean;
  guardrail_triggered?: boolean;
  guardrail_reason?: string;
}

export interface ScenarioPreset {
  id: string;
  code: string;
  title: string;
  badge: string;
  channel: 'email' | 'call_transcript' | 'telegram' | 'portal';
  incoming_time: string;
  sender: string;
  raw_text: string;
  description: string;
  expected_outcome: string;
}
