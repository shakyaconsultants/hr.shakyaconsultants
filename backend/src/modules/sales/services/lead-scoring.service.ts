import type { LeadDocument } from '@domain/sales/sales.schemas.js';
import { SalesPolicyService } from '@modules/sales/services/sales-policy.service.js';

function evaluateRule(lead: LeadDocument, rule: { field: string; operator: string; value: unknown; points: number }): number {
  const fieldValue = (lead as unknown as Record<string, unknown>)[rule.field];
  if (fieldValue === undefined || fieldValue === null) return 0;

  switch (rule.operator) {
    case 'eq':
      return fieldValue === rule.value ? rule.points : 0;
    case 'neq':
      return fieldValue !== rule.value ? rule.points : 0;
    case 'gt':
      return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue > rule.value ? rule.points : 0;
    case 'gte':
      return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue >= rule.value ? rule.points : 0;
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase()) ? rule.points : 0;
    case 'exists':
      return rule.value ? rule.points : 0;
    default:
      return 0;
  }
}

export const LeadScoringService = {
  async calculateScore(companyId: string, lead: LeadDocument): Promise<number> {
    const policies = await SalesPolicyService.getPolicies(companyId);
    let score = 0;

    for (const rule of policies.scoringRules.rules) {
      score += evaluateRule(lead, rule);
    }

    return Math.min(score, policies.scoringRules.maxScore);
  },

  async applyToLead(companyId: string, lead: LeadDocument): Promise<number> {
    return this.calculateScore(companyId, lead);
  },
};
