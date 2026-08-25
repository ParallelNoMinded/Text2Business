import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { TraceStep } from '../../types';
import { Card, StatusBadge } from '../ui/OpsPrimitives';

export const PIPELINE_STEPS = [
  { id: 'in', name: 'Incoming Message', desc: 'Channel ingest' },
  { id: 'g', name: 'Guardrails', desc: 'Safety / injection check' },
  { id: 'f', name: 'Fact Extraction', desc: 'Structured facts' },
  { id: 'c', name: 'Customer Search', desc: 'Contractor match' },
  { id: 'a', name: 'Asset Search', desc: 'Equipment match' },
  { id: 't', name: 'Ticket Search', desc: 'Dedup / open ticket' },
  { id: 's', name: 'SLA Check', desc: 'Contract window' },
  { id: 'd', name: 'Decision Engine', desc: 'Recommended action' },
  { id: 'h', name: 'Human Approval', desc: 'Operator gate' },
  { id: 'e', name: 'Execution', desc: 'Commit / 1C' },
] as const;

type StepStatus = 'done' | 'live' | 'idle';

export const AIPipeline: React.FC<{ trace?: TraceStep[] }> = ({ trace }) => {
  const steps = PIPELINE_STEPS.map((step, i) => {
    if (!trace?.length) {
      const status: StepStatus = i < 7 ? 'done' : i === 7 ? 'live' : 'idle';
      const ts = i < 8 ? `14:01:${String(2 + i).padStart(2, '0')}` : '—';
      return { ...step, status, ts };
    }
    const tr = trace[i];
    if (!tr) return { ...step, status: (i < trace.length ? 'done' : i === trace.length ? 'live' : 'idle') as StepStatus, ts: '—' };
    const status: StepStatus = tr.status === 'SUCCESS' ? 'done' : tr.status === 'WARNING' ? 'live' : tr.status === 'ERROR' ? 'idle' : 'done';
    return { ...step, name: tr.step_name || step.name, status, ts: tr.timestamp?.slice(11, 19) || '—' };
  });

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-oc-secondary">AI Pipeline Status</div>
        <StatusBadge tone="ok">Live</StatusBadge>
      </div>
      <div>
        {steps.map((step, i) => (
          <div key={step.id} className="relative pl-6 pb-3 last:pb-0">
            {i < steps.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-oc-border" />}
            <div className="absolute left-0 top-0.5">
              {step.status === 'done' && <CheckCircle2 className="h-4 w-4 text-oc-success" />}
              {step.status === 'live' && <Circle className="h-4 w-4 text-oc-ai fill-oc-ai" />}
              {step.status === 'idle' && <Circle className="h-4 w-4 text-oc-muted" />}
            </div>
            <div className="text-[12px] leading-tight">{step.name}</div>
            <div className="text-[10px] text-oc-muted">{step.desc}</div>
            <div className="text-[10px] font-mono text-oc-secondary">{step.ts}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};
