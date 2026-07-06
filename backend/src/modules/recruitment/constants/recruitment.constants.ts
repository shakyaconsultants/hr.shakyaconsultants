export const RECRUITMENT_ROUTES = {
  BASE: '/recruitment',
  CANDIDATES: '/candidates',
  PIPELINE: '/pipeline',
  DASHBOARD: '/dashboard',
  INTERVIEWS: '/interviews',
  OFFERS: '/offers',
  ONBOARDING: '/onboarding',
} as const;

export const RECRUITMENT_AUDIT_WHERE = 'recruitment' as const;

export const RECRUITMENT_EMAIL_JOB = {
  INTERVIEW_INVITE: 'recruitment.interview_invite',
  INTERVIEW_REMINDER: 'recruitment.interview_reminder',
  INTERVIEW_RESCHEDULE: 'recruitment.interview_reschedule',
  REJECTION: 'recruitment.rejection',
  STAGE_UPDATE: 'recruitment.stage_update',
  OFFER_LETTER: 'recruitment.offer_letter',
  JOINING_INSTRUCTIONS: 'recruitment.joining_instructions',
  ACCOUNT_CREDENTIALS: 'recruitment.account_credentials',
  WELCOME: 'recruitment.welcome',
} as const;

export const DEFAULT_EMPLOYEE_ROLE_SLUG = 'employee' as const;
