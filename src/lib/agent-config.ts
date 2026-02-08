// Static agent definitions — sourced from openclaw.json but without secrets.
// These change rarely; activity data comes dynamically from the DB.

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'sales' | 'research' | 'ops';
}

export interface CronJob {
  id: string;
  label: string;
  skill: string;
  schedule: string;      // human-readable
  cron: string;          // cron expression
  days?: string[];       // ['mon'] for monday-only, etc.
}

export interface AgentDefinition {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  model: string;
  fallbacks: string[];
  tools: string[];
  skills: AgentSkill[];
  cronJobs: CronJob[];
  workspace: string;
}

export const AGENTS: AgentDefinition[] = [
  {
    id: 'hermes',
    name: 'Hermes',
    emoji: '\u{1F3DB}\u{FE0F}',
    role: 'Marketing Engine',
    description: 'Content creation, social engagement, brand building, and experiment management. Owns the public voice of Builderz across X and LinkedIn.',
    model: 'Claude Sonnet 4',
    fallbacks: ['Haiku 4.5', 'Qwen 2.5 14B'],
    tools: ['read', 'write', 'exec', 'bash', 'memory_get', 'memory_search', 'message', 'reactions', 'web_search', 'web_fetch'],
    workspace: '/home/leads/workspace',
    skills: [
      { id: 'x-research', name: 'X Research', description: 'Search X via API v2 for ICP pain signals, trending topics, and engagement opportunities', category: 'research' },
      { id: 'content-engine', name: 'Content Engine', description: 'Draft LinkedIn + X content by pillar with calendar planning and A/B variants', category: 'marketing' },
      { id: 'social-engagement', name: 'Social Engagement', description: 'Reply to mentions, quote-tweet opportunities, LinkedIn comments, strategic follows', category: 'marketing' },
      { id: 'social-listening', name: 'Social Listening', description: 'Monitor brand mentions, competitor activity, pain-point keywords, and opportunities', category: 'research' },
      { id: 'cold-outreach', name: 'Cold Outreach', description: 'Full email pipeline: discover, score, personalize, send. Manages sequences and suppression', category: 'sales' },
      { id: 'reply-triage', name: 'Reply Triage', description: 'Classify replies from email, X, and DMs into interested/objection/unsubscribe/spam', category: 'ops' },
      { id: 'experiment-tracker', name: 'Experiment Tracker', description: 'Weekly marketing experiment lifecycle: propose, run, measure, decide (SCALE/ITERATE/KILL)', category: 'ops' },
      { id: 'reporting', name: 'Reporting', description: 'Daily Telegram summary with key metrics + weekly deep-dive performance review', category: 'ops' },
    ],
    cronJobs: [
      { id: 'morning-research', label: 'Morning Research', skill: 'x-research', schedule: '8:00 AM', cron: '0 8 * * 1-5' },
      { id: 'morning-engagement', label: 'Morning Engagement', skill: 'social-engagement', schedule: '9:30 AM', cron: '30 9 * * 1-5' },
      { id: 'monday-content', label: 'Content Planning', skill: 'content-engine', schedule: '10:00 AM', cron: '0 10 * * 1', days: ['mon'] },
      { id: 'monday-experiment', label: 'Experiment Review', skill: 'experiment-tracker', schedule: '10:30 AM', cron: '30 10 * * 1', days: ['mon'] },
      { id: 'midday-listening', label: 'Midday Listening', skill: 'social-listening', schedule: '12:00 PM', cron: '0 12 * * 1-5' },
      { id: 'afternoon-engagement', label: 'Afternoon Engagement', skill: 'social-engagement', schedule: '2:00 PM', cron: '0 14 * * 1-5' },
      { id: 'daily-report', label: 'Daily Report', skill: 'reporting', schedule: '6:00 PM', cron: '0 18 * * 1-5' },
      { id: 'friday-review', label: 'Weekly Review', skill: 'experiment-tracker', schedule: '4:00 PM', cron: '0 16 * * 5', days: ['fri'] },
    ],
  },
  {
    id: 'apollo',
    name: 'Apollo',
    emoji: '\u{1F3AF}',
    role: 'Sales Pipeline',
    description: 'Lead discovery, scoring, email sequences, reply triage, and CRM management. Owns the outbound pipeline from discovery to qualification.',
    model: 'Claude Sonnet 4',
    fallbacks: ['Haiku 4.5', 'Qwen 2.5 14B'],
    tools: ['read', 'write', 'exec', 'bash', 'memory_get', 'memory_search', 'web_search', 'web_fetch'],
    workspace: '/home/leads/.openclaw/workspace-apollo',
    skills: [
      { id: 'cold-outreach', name: 'Cold Outreach', description: 'Lead discovery via enrichment APIs, ICP scoring, personalized email sequences, bounce/suppression management', category: 'sales' },
      { id: 'reply-triage', name: 'Reply Triage', description: 'Classify email replies, update lead stages, handle objections, route interested leads to CRM', category: 'sales' },
    ],
    cronJobs: [
      { id: 'outreach-pipeline', label: 'Outreach Pipeline', skill: 'cold-outreach', schedule: '10:30 AM', cron: '30 10 * * 1-5' },
      { id: 'evening-triage', label: 'Evening Triage', skill: 'reply-triage', schedule: '7:00 PM', cron: '0 19 * * 1-5' },
    ],
  },
];

export function getAgent(id: string): AgentDefinition | undefined {
  return AGENTS.find(a => a.id === id);
}

// Map activity_log actions to agent + skill
export const ACTION_TO_AGENT: Record<string, { agent: string; skill: string }> = {
  post: { agent: 'hermes', skill: 'content-engine' },
  engage: { agent: 'hermes', skill: 'social-engagement' },
  research: { agent: 'hermes', skill: 'x-research' },
  discover: { agent: 'apollo', skill: 'cold-outreach' },
  send: { agent: 'apollo', skill: 'cold-outreach' },
  triage: { agent: 'apollo', skill: 'reply-triage' },
  alert: { agent: 'hermes', skill: 'reporting' },
};
