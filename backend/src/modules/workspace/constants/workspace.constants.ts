export const WORKSPACE_ROUTES = {
  BASE: '/workspace',
} as const;

export const WORKSPACE_AUDIT_WHERE = 'workspace' as const;

export const WORKSPACE_ACTIVITY_TYPE = {
  PROFILE_UPDATED: 'workspace.profile.updated',
  DOCUMENT_DOWNLOADED: 'workspace.document.downloaded',
  ANNOUNCEMENT_ACKNOWLEDGED: 'workspace.announcement.acknowledged',
  WIDGET_CONFIG_UPDATED: 'workspace.widget.config.updated',
  DOCUMENT_ACCESSED: 'workspace.document.accessed',
} as const;

export const WORKSPACE_QUICK_LINKS = [
  { label: 'My Profile', path: '/workspace/profile', icon: 'user' },
  { label: 'My Tasks', path: '/workspace/tasks', icon: 'check-square' },
  { label: 'My Projects', path: '/workspace/projects', icon: 'folder' },
  { label: 'Documents', path: '/workspace/documents', icon: 'file' },
  { label: 'Calendar', path: '/workspace/calendar', icon: 'calendar' },
  { label: 'Announcements', path: '/workspace/announcements', icon: 'megaphone' },
] as const;
