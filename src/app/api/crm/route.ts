import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { maybeSeedExclude } from '@/lib/seed-filter';
import type { Lead, Sequence, FunnelStep } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const db = getDb();

  // Single lead detail
  if (id) {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Lead | undefined;
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const sequences = db.prepare(
      'SELECT * FROM sequences WHERE lead_id = ? ORDER BY step ASC, created_at DESC'
    ).all(id) as Sequence[];

    // Build timeline from sequences + activity
    const timeline: { id: number; type: string; description: string; timestamp: string }[] = [];

    // Add sequence events
    for (const seq of sequences) {
      if (seq.sent_at) {
        timeline.push({
          id: timeline.length + 1,
          type: 'sequence_sent',
          description: `Email step ${seq.step}: "${seq.subject || 'No subject'}" sent`,
          timestamp: seq.sent_at,
        });
      } else if (seq.status === 'pending_approval') {
        timeline.push({
          id: timeline.length + 1,
          type: 'sequence_sent',
          description: `Email step ${seq.step}: "${seq.subject || 'No subject'}" pending approval`,
          timestamp: seq.created_at,
        });
      }
    }

    // Add discovery event
    if (lead.created_at) {
      timeline.push({
        id: timeline.length + 1,
        type: 'discovery',
        description: `Lead discovered via ${lead.source || 'unknown source'}`,
        timestamp: lead.created_at,
      });
    }

    // Sort timeline descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ lead, sequences, timeline });
  }

  // List all leads with summary stats
  const status = searchParams.get('status');
  const tier = searchParams.get('tier');
  const search = searchParams.get('search');
  const seedExcludeLeads = maybeSeedExclude(request, 'leads');

  let sql = `SELECT * FROM leads WHERE 1=1${seedExcludeLeads}`;
  const params: unknown[] = [];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (tier) { sql += ' AND tier = ?'; params.push(tier); }
  if (search) {
    sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR company LIKE ? OR email LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  sql += ' ORDER BY score DESC, created_at DESC';
  const leads = db.prepare(sql).all(...params) as Lead[];

  // Funnel stats
  const stages = ['new', 'validated', 'contacted', 'replied', 'interested', 'booked', 'qualified', 'disqualified'];
  const funnel: FunnelStep[] = stages.map(name => {
    const row = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE status = ?${seedExcludeLeads}`).get(name) as { c: number };
    return { name, value: row?.c ?? 0 };
  });

  // Summary
  const totalLeads = (db.prepare(`SELECT COUNT(*) as c FROM leads WHERE 1=1${seedExcludeLeads}`).get() as { c: number })?.c ?? 0;
  const avgScore = (db.prepare(`SELECT AVG(score) as avg FROM leads WHERE score IS NOT NULL${seedExcludeLeads}`).get() as { avg: number | null })?.avg ?? 0;
  const tierBreakdown = db.prepare(
    `SELECT tier, COUNT(*) as c FROM leads WHERE tier IS NOT NULL${seedExcludeLeads} GROUP BY tier ORDER BY tier`
  ).all() as { tier: string; c: number }[];

  return NextResponse.json({
    leads,
    funnel,
    summary: {
      total: totalLeads,
      avg_score: Math.round(avgScore),
      tier_breakdown: tierBreakdown,
    },
  });
}
