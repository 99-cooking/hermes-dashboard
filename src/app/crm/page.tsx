'use client';

import { useState } from 'react';
import {
  Contact, Search, ChevronRight, Mail, Linkedin, Star,
  Clock, Building2, User, ArrowUpDown, X,
  Send, Eye, CircleDot, MessageSquare, CalendarCheck, CheckCircle, Ban,
} from 'lucide-react';
import { useSmartPoll } from '@/hooks/use-smart-poll';
import { timeAgo } from '@/lib/utils';
import type { Lead, Sequence, FunnelStep } from '@/types';

interface CrmData {
  leads: Lead[];
  funnel: FunnelStep[];
  summary: { total: number; avg_score: number; tier_breakdown: { tier: string; c: number }[] };
}

interface LeadDetail {
  lead: Lead;
  sequences: Sequence[];
  timeline: { id: number; type: string; description: string; timestamp: string }[];
}

const STAGE_ICONS: Record<string, typeof Send> = {
  new: CircleDot,
  validated: CheckCircle,
  contacted: Send,
  replied: MessageSquare,
  interested: Eye,
  booked: CalendarCheck,
  qualified: Star,
  disqualified: Ban,
};

const STAGE_COLORS: Record<string, string> = {
  new: 'text-muted-foreground',
  validated: 'text-info',
  contacted: 'text-primary',
  replied: 'text-warning',
  interested: 'text-success',
  booked: 'text-success',
  qualified: 'text-success',
  disqualified: 'text-destructive',
};

const TIER_COLORS: Record<string, string> = {
  A: 'bg-success/15 text-success border-success/30',
  B: 'bg-warning/15 text-warning border-warning/30',
  C: 'bg-muted/30 text-muted-foreground border-border',
};

export default function CrmPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'score' | 'created_at'>('score');

  const params = new URLSearchParams();
  if (stageFilter) params.set('status', stageFilter);
  if (tierFilter) params.set('tier', tierFilter);
  if (search) params.set('search', search);

  const { data } = useSmartPoll<CrmData>(
    () => fetch(`/api/crm?${params}`).then(r => r.json()),
    { interval: 30_000 },
  );

  const leads = data?.leads || [];
  const sorted = [...leads].sort((a, b) => {
    if (sortField === 'score') return (b.score ?? 0) - (a.score ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">CRM</h1>
        {data?.summary && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{data.summary.total}</strong> leads</span>
            <span>avg score <strong className="text-foreground">{data.summary.avg_score}</strong></span>
            {data.summary.tier_breakdown.map(t => (
              <span key={t.tier} className={`badge border ${TIER_COLORS[t.tier] || ''}`}>
                Tier {t.tier}: {t.c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Funnel */}
      {data?.funnel && (
        <div className="card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Pipeline</h3>
          <div className="flex items-end gap-1 h-20">
            {data.funnel.filter(s => s.name !== 'disqualified').map(step => {
              const maxVal = Math.max(...data.funnel.map(s => s.value), 1);
              const height = Math.max((step.value / maxVal) * 100, 8);
              const Icon = STAGE_ICONS[step.name] || CircleDot;
              const isFiltered = stageFilter === step.name;
              return (
                <button
                  key={step.name}
                  onClick={() => setStageFilter(isFiltered ? '' : step.name)}
                  className={`flex-1 flex flex-col items-center gap-1 group transition-opacity ${
                    stageFilter && !isFiltered ? 'opacity-40' : ''
                  }`}
                >
                  <span className="text-xs font-mono font-semibold">{step.value}</span>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isFiltered ? 'bg-primary' : 'bg-primary/40 group-hover:bg-primary/60'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <div className="flex flex-col items-center gap-0.5">
                    <Icon size={12} className={STAGE_COLORS[step.name]} />
                    <span className="text-[9px] text-muted-foreground capitalize">{step.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="bg-muted/50 border border-border/30 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Tiers</option>
          <option value="A">Tier A</option>
          <option value="B">Tier B</option>
          <option value="C">Tier C</option>
        </select>
        <button
          onClick={() => setSortField(sortField === 'score' ? 'created_at' : 'score')}
          className="btn btn-ghost btn-sm"
        >
          <ArrowUpDown size={12} />
          {sortField === 'score' ? 'Score' : 'Date'}
        </button>
        {(stageFilter || tierFilter || search) && (
          <button onClick={() => { setStageFilter(''); setTierFilter(''); setSearch(''); }} className="btn btn-ghost btn-sm text-destructive">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Lead List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead List */}
        <div className="lg:col-span-2 space-y-2">
          {sorted.length === 0 ? (
            <div className="card p-8 text-center text-sm text-muted-foreground">No leads found</div>
          ) : (
            sorted.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                selected={selectedLead === lead.id}
                onClick={() => setSelectedLead(selectedLead === lead.id ? null : lead.id)}
              />
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedLead ? (
            <LeadDetailPanel id={selectedLead} onClose={() => setSelectedLead(null)} />
          ) : (
            <div className="card p-8 text-center text-sm text-muted-foreground sticky top-24">
              <Contact size={32} className="mx-auto mb-3 opacity-30" />
              <p>Select a lead to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadRow({ lead, selected, onClick }: { lead: Lead; selected: boolean; onClick: () => void }) {
  const Icon = STAGE_ICONS[lead.status] || CircleDot;
  return (
    <button
      onClick={onClick}
      className={`card card-hover w-full text-left p-4 flex items-center gap-4 transition-all ${
        selected ? 'border-primary/50 bg-primary/5' : ''
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
        <User size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {lead.first_name} {lead.last_name}
          </span>
          {lead.tier && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${TIER_COLORS[lead.tier] || ''}`}>
              {lead.tier}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {lead.company && (
            <span className="flex items-center gap-1 truncate">
              <Building2 size={10} /> {lead.company}
            </span>
          )}
          {lead.title && <span className="truncate">{lead.title}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <Icon size={14} className={STAGE_COLORS[lead.status]} />
          <span className="text-xs capitalize">{lead.status}</span>
        </div>
        {lead.score != null && (
          <span className="text-xs font-mono font-semibold bg-muted/50 px-2 py-0.5 rounded">
            {lead.score}
          </span>
        )}
        <ChevronRight size={14} className="text-muted-foreground" />
      </div>
    </button>
  );
}

function LeadDetailPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, loading } = useSmartPoll<LeadDetail>(
    () => fetch(`/api/crm?id=${id}`).then(r => r.json()),
    { interval: 30_000 },
  );

  if (loading || !data) {
    return <div className="card p-6 animate-pulse bg-muted/20 h-96 sticky top-24" />;
  }

  const { lead, sequences, timeline } = data;

  return (
    <div className="card p-5 space-y-4 sticky top-24 animate-slide-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{lead.first_name} {lead.last_name}</h3>
          <p className="text-xs text-muted-foreground">{lead.title} at {lead.company}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5">
        {lead.email && (
          <div className="flex items-center gap-2 text-xs">
            <Mail size={12} className="text-muted-foreground" />
            <span className="font-mono">{lead.email}</span>
          </div>
        )}
        {lead.linkedin_url && (
          <div className="flex items-center gap-2 text-xs">
            <Linkedin size={12} className="text-muted-foreground" />
            <span className="truncate">{lead.linkedin_url}</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-sm font-semibold">{lead.score ?? '—'}</div>
          <div className="text-[9px] text-muted-foreground uppercase">Score</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-sm font-semibold">{lead.tier ?? '—'}</div>
          <div className="text-[9px] text-muted-foreground uppercase">Tier</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-sm font-semibold capitalize">{lead.status}</div>
          <div className="text-[9px] text-muted-foreground uppercase">Stage</div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1 text-xs">
        {lead.industry_segment && (
          <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span>{lead.industry_segment}</span></div>
        )}
        {lead.company_size && (
          <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span>{lead.company_size}</span></div>
        )}
        {lead.source && (
          <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span>{lead.source}</span></div>
        )}
        {lead.sequence_name && (
          <div className="flex justify-between"><span className="text-muted-foreground">Sequence</span><span>{lead.sequence_name}</span></div>
        )}
        {lead.last_touch_at && (
          <div className="flex justify-between"><span className="text-muted-foreground">Last Touch</span><span>{timeAgo(lead.last_touch_at)}</span></div>
        )}
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="bg-muted/20 rounded-lg p-3 text-xs">
          <span className="text-muted-foreground font-medium">Notes: </span>
          {lead.notes}
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock size={12} /> Timeline
          </h4>
          <div className="space-y-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {timeline.map(event => (
              <div key={event.id} className="flex items-start gap-3 pl-0 relative">
                <div className="w-[15px] h-[15px] rounded-full bg-muted border-2 border-background shrink-0 z-10" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed">{event.description}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sequences */}
      {sequences.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Send size={12} /> Email Sequences ({sequences.length})
          </h4>
          <div className="space-y-1.5">
            {sequences.map(seq => (
              <div key={seq.id} className="flex items-center justify-between text-xs bg-muted/20 rounded-lg px-3 py-2">
                <div className="truncate">
                  <span className="text-muted-foreground">Step {seq.step}: </span>
                  {seq.subject || 'No subject'}
                </div>
                <span className={`shrink-0 ml-2 ${
                  seq.status === 'sent' ? 'text-success' :
                  seq.status === 'pending_approval' ? 'text-warning' :
                  'text-muted-foreground'
                }`}>
                  {seq.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
