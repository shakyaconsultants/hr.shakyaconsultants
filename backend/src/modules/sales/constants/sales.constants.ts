export { LEAD_PERMISSIONS, DEAL_PERMISSIONS, PIPELINE_PERMISSIONS } from '@modules/sales/constants/sales-permissions.constants.js';

export const SALES_ROUTES = {
  BASE: '/sales',
} as const;

export const SALES_AUDIT_WHERE = 'sales' as const;

export const SALES_NOTIFICATION_JOB = {
  LEAD_ASSIGNED: 'sales.lead_assigned',
  LEAD_STAGE_CHANGED: 'sales.lead_stage_changed',
  FOLLOW_UP_DUE: 'sales.follow_up_due',
  DEAL_WON: 'sales.deal_won',
  DEAL_LOST: 'sales.deal_lost',
  TARGET_ACHIEVED: 'sales.target_achieved',
} as const;

export const SALES_REPORT_TYPE = {
  SOURCE: 'source',
  EXECUTIVE: 'executive',
  PIPELINE: 'pipeline',
  CONVERSION: 'conversion',
  REVENUE: 'revenue',
  ACTIVITY: 'activity',
  FOLLOW_UP: 'follow_up',
} as const;

export const SALES_POLICY_KEYS = {
  ASSIGNMENT_RULES: 'sales.assignment_rules',
  SCORING_RULES: 'sales.scoring_rules',
  POLICIES: 'sales.policies',
} as const;

export const DEFAULT_SALES_POLICIES = {
  assignmentRules: {
    autoAssignEnabled: false,
    roundRobin: true,
    territoryBased: true,
    defaultTeamId: null as string | null,
  },
  scoringRules: {
    rules: [] as Array<{ field: string; operator: string; value: unknown; points: number }>,
    maxScore: 100,
  },
  policies: {
    requireLostReason: true,
    requireWonReason: false,
    defaultCurrency: 'INR',
    defaultPipelineName: 'Default Sales Pipeline',
  },
} as const;

export const DEFAULT_PIPELINE_STAGES = [
  { id: 'new', name: 'New', order: 1, probability: 10 },
  { id: 'contacted', name: 'Contacted', order: 2, probability: 20 },
  { id: 'qualified', name: 'Qualified', order: 3, probability: 40 },
  { id: 'proposal', name: 'Proposal', order: 4, probability: 60 },
  { id: 'negotiation', name: 'Negotiation', order: 5, probability: 80 },
  { id: 'won', name: 'Won', order: 6, probability: 100 },
  { id: 'lost', name: 'Lost', order: 7, probability: 0 },
] as const;

export const SALES_SCOPE = {
  OWN: 'own',
  TEAM: 'team',
  ALL: 'all',
} as const;
