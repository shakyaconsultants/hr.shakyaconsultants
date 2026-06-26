import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';

export const WORKSPACE_WIDGET = {
  TODAY_TASKS: 'today_tasks',
  MY_PROJECTS: 'my_projects',
  PROJECT_PROGRESS: 'project_progress',
  UPCOMING_DEADLINES: 'upcoming_deadlines',
  RECENT_NOTIFICATIONS: 'recent_notifications',
  RECENT_ACTIVITIES: 'recent_activities',
  ATTENDANCE_SUMMARY: 'attendance_summary',
  LEAVE_BALANCE: 'leave_balance',
  PAYSLIPS: 'payslips',
  ANNOUNCEMENTS: 'announcements',
  QUICK_LINKS: 'quick_links',
  UPCOMING_BIRTHDAYS: 'upcoming_birthdays',
  WORK_ANNIVERSARIES: 'work_anniversaries',
  MANAGER_MESSAGES: 'manager_messages',
} as const;

export interface WorkspaceWidgetConfigDocument extends BaseDocument {
  employeeId: string;
  widgetSlug: string;
  sortOrder: number;
  isVisible: boolean;
  columnSpan: number;
  config: Record<string, unknown>;
}

export interface AnnouncementReadReceiptDocument extends BaseDocument {
  announcementId: string;
  employeeId: string;
  readAt: Date;
  acknowledgedAt?: Date;
}

const workspaceWidgetConfigFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  widgetSlug: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  columnSpan: { type: Number, default: 1, min: 1, max: 2 },
  config: { type: Schema.Types.Mixed, default: {} },
};

const announcementReadReceiptFields: SchemaDefinition = {
  announcementId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  readAt: { type: Date, required: true, default: Date.now },
  acknowledgedAt: { type: Date },
};

export const workspaceWidgetConfigModel = defineDomainModel<WorkspaceWidgetConfigDocument>(
  'WorkspaceWidgetConfig',
  COLLECTIONS.WORKSPACE_WIDGET_CONFIGS,
  workspaceWidgetConfigFields,
  {
    indexes: [
      {
        fields: { companyId: 1, employeeId: 1, widgetSlug: 1 },
        options: { unique: true, name: 'uq_workspace_widget_configs' },
      },
    ],
  },
);

export const announcementReadReceiptModel = defineDomainModel<AnnouncementReadReceiptDocument>(
  'AnnouncementReadReceipt',
  COLLECTIONS.ANNOUNCEMENT_READ_RECEIPTS,
  announcementReadReceiptFields,
  {
    indexes: [
      {
        fields: { companyId: 1, announcementId: 1, employeeId: 1 },
        options: { unique: true, name: 'uq_announcement_read_receipts' },
      },
    ],
  },
);

export const WorkspaceWidgetConfigRepository = workspaceWidgetConfigModel.repository;
export const AnnouncementReadReceiptRepository = announcementReadReceiptModel.repository;
