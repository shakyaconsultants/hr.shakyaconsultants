export const EMAIL_TEMPLATE_TYPES = {
  INTERVIEW: 'interview',
  OFFER_LETTER: 'offer_letter',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_ACTIVATION: 'account_activation',
  ONBOARDING_PORTAL: 'onboarding_portal',
  LEAVE: 'leave',
  PAYROLL: 'payroll',
  NOTIFICATION: 'notification',
  RESIGNATION: 'resignation',
  TASK_ASSIGNMENT: 'task_assignment',
} as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[keyof typeof EMAIL_TEMPLATE_TYPES];
