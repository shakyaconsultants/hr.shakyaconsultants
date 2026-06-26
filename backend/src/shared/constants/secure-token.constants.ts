export const SECURE_TOKEN_PURPOSE = {
  ACCOUNT_ACTIVATION: 'account_activation',
  CANDIDATE_ONBOARDING: 'candidate_onboarding',
} as const;

export const SECURE_TOKEN_ENTITY_TYPE = {
  USER: 'user',
  ONBOARDING: 'onboarding',
  CANDIDATE: 'candidate_lead',
} as const;
