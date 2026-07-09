export {
  ANNOUNCEMENT_PERMISSIONS,
  BROADCAST_PERMISSIONS,
  NOTIFICATION_PERMISSIONS,
  CONVERSATION_PERMISSIONS,
  MESSAGE_PERMISSIONS,
} from '@modules/communication/constants/communication-permissions.constants.js';

export const COMMUNICATION_ROUTES = {
  BASE: '/communication',
} as const;

export const COMMUNICATION_AUDIT_WHERE = 'communication' as const;

export const COMMUNICATION_NOTIFICATION_JOB = {
  ANNOUNCEMENT_PUBLISHED: 'communication.announcement_published',
  ANNOUNCEMENT_EMERGENCY: 'communication.announcement_emergency',
  MESSAGE_MENTION: 'communication.message_mention',
  MESSAGE_RECEIVED: 'communication.message_received',
  CHANNEL_INVITE: 'communication.channel_invite',
  NOTIFICATION_DIGEST: 'communication.notification_digest',
} as const;

export const COMMUNICATION_REPORT_TYPE = {
  REACH: 'reach',
  READ_STATS: 'read_stats',
  CHANNEL_ACTIVITY: 'channel_activity',
  USER_ACTIVITY: 'user_activity',
  UNREAD_SUMMARY: 'unread_summary',
} as const;

export const COMMUNICATION_POLICY_KEYS = {
  POLICIES: 'communication.policies',
  TEMPLATES: 'communication.templates',
  PREFERENCES: 'communication.preferences',
} as const;

export const DEFAULT_COMMUNICATION_POLICIES = {
  allowDirectMessages: true,
  allowPrivateChannels: true,
  allowEmployeeChannels: false,
  maxAttachmentSizeMb: 25,
  messageRetentionDays: 365,
  requireAcknowledgementDefault: false,
  emergencyBypassQuietHours: true,
} as const;

export const DEFAULT_ANNOUNCEMENT_TEMPLATES = [
  {
    slug: 'general',
    name: 'General Update',
    subject: 'Company Update',
    body: 'Please review the following announcement.',
  },
  {
    slug: 'policy',
    name: 'Policy Change',
    subject: 'Policy Update',
    body: 'An important policy change requires your attention.',
  },
  {
    slug: 'emergency',
    name: 'Emergency Alert',
    subject: 'Emergency Notice',
    body: 'Immediate action may be required.',
  },
  {
    slug: 'holiday',
    name: 'Holiday Notice',
    subject: 'Holiday Announcement',
    body: 'Please note the upcoming holiday schedule.',
  },
] as const;

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  digestFrequency: 'daily',
  mutedCategories: [] as string[],
} as const;

export const COMMUNICATION_SCOPE = {
  OWN: 'own',
  TEAM: 'team',
  ALL: 'all',
} as const;

export const INBOX_CATEGORIES = [
  'approval',
  'payroll',
  'attendance',
  'leave',
  'interview',
  'assignment',
  'system',
] as const;
