export const ANNOUNCEMENT_PERMISSIONS = {
  READ: 'announcement.read',
  ACKNOWLEDGE: 'announcement.acknowledge',
} as const;

export const BROADCAST_PERMISSIONS = {
  BROADCAST: 'notifications.broadcast',
} as const;

export const NOTIFICATION_PERMISSIONS = {
  READ: 'notification.read',
  UPDATE: 'notification.update',
  DELETE: 'notification.delete',
  MANAGE: 'notification.manage',
} as const;

export const CONVERSATION_PERMISSIONS = {
  READ: 'conversation.read',
  CREATE: 'conversation.create',
  UPDATE: 'conversation.update',
  DELETE: 'conversation.delete',
} as const;

export const MESSAGE_PERMISSIONS = {
  SEND: 'chat.message.send',
} as const;
