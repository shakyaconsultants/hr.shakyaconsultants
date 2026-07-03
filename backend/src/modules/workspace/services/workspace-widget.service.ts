import {
  WORKSPACE_WIDGET,
  WorkspaceWidgetConfigRepository,
  type WorkspaceWidgetConfigDocument,
} from '@domain/workspace/workspace-extended.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { WORKSPACE_PERMISSIONS } from '@modules/workspace/constants/workspace-permissions.constants.js';
import { WorkspaceActivityService } from '@modules/workspace/services/workspace-activity.service.js';
import type { WidgetConfigInput, WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';

export interface WidgetCatalogEntry {
  slug: string;
  name: string;
  description: string;
  defaultSortOrder: number;
  defaultColumnSpan: number;
  requiredPermission?: string;
  isPlaceholder?: boolean;
  roleHints?: string[];
}

export const WORKSPACE_WIDGET_CATALOG: WidgetCatalogEntry[] = [
  { slug: WORKSPACE_WIDGET.TODAY_TASKS, name: "Today's Tasks", description: 'Tasks due today and in progress', defaultSortOrder: 1, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ },
  { slug: WORKSPACE_WIDGET.MY_PROJECTS, name: 'My Projects', description: 'Projects you are assigned to', defaultSortOrder: 2, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ },
  { slug: WORKSPACE_WIDGET.PROJECT_PROGRESS, name: 'Project Progress', description: 'Overall progress across your projects', defaultSortOrder: 3, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ },
  { slug: WORKSPACE_WIDGET.UPCOMING_DEADLINES, name: 'Upcoming Deadlines', description: 'Tasks and milestones due soon', defaultSortOrder: 4, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ },
  { slug: WORKSPACE_WIDGET.RECENT_NOTIFICATIONS, name: 'Recent Notifications', description: 'Latest notifications', defaultSortOrder: 5, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.NOTIFICATION_READ },
  { slug: WORKSPACE_WIDGET.ATTENDANCE_SUMMARY, name: 'Attendance Summary', description: 'Attendance overview (coming soon)', defaultSortOrder: 6, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ, isPlaceholder: true },
  { slug: WORKSPACE_WIDGET.LEAVE_BALANCE, name: 'Leave Balance', description: 'Leave balance overview (coming soon)', defaultSortOrder: 7, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ, isPlaceholder: true },
  { slug: WORKSPACE_WIDGET.PAYSLIPS, name: 'Payslips', description: 'Recent payslips (coming soon)', defaultSortOrder: 8, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ, isPlaceholder: true },
  { slug: WORKSPACE_WIDGET.ANNOUNCEMENTS, name: 'Company Announcements', description: 'Latest company announcements', defaultSortOrder: 9, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.ANNOUNCEMENT_READ },
  { slug: WORKSPACE_WIDGET.QUICK_LINKS, name: 'Quick Links', description: 'Shortcuts to common actions', defaultSortOrder: 10, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ },
  { slug: WORKSPACE_WIDGET.UPCOMING_BIRTHDAYS, name: 'Upcoming Birthdays', description: 'Team birthdays this month', defaultSortOrder: 11, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ },
  { slug: WORKSPACE_WIDGET.WORK_ANNIVERSARIES, name: 'Work Anniversaries', description: 'Work anniversaries this month', defaultSortOrder: 12, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ },
  { slug: WORKSPACE_WIDGET.MANAGER_MESSAGES, name: 'Manager Messages', description: 'Messages from your manager', defaultSortOrder: 13, defaultColumnSpan: 1, requiredPermission: WORKSPACE_PERMISSIONS.READ, roleHints: ['employee'] },
];

function filterByPermissions(catalog: WidgetCatalogEntry[], permissions: string[]): WidgetCatalogEntry[] {
  const permSet = new Set(permissions);
  return catalog.filter((entry) => !entry.requiredPermission || permSet.has(entry.requiredPermission));
}

export const WorkspaceWidgetService = {
  getCatalog(permissions: string[]): WidgetCatalogEntry[] {
    return filterByPermissions(WORKSPACE_WIDGET_CATALOG, permissions);
  },

  async getLayout(companyId: string, employeeId: string, permissions: string[]): Promise<{
    catalog: WidgetCatalogEntry[];
    widgets: WorkspaceWidgetConfigDocument[];
  }> {
    const catalog = filterByPermissions(WORKSPACE_WIDGET_CATALOG, permissions);
    const saved = await WorkspaceWidgetConfigRepository.findMany({ employeeId }, { companyId });
    const savedSlugs = new Set(saved.map((w) => w.widgetSlug));

    const missing = catalog.filter((c) => !savedSlugs.has(c.slug));
    if (missing.length > 0) {
      for (const entry of missing) {
        await WorkspaceWidgetConfigRepository.create(
          {
            id: generateUuid(),
            companyId,
            employeeId,
            widgetSlug: entry.slug,
            sortOrder: entry.defaultSortOrder,
            isVisible: true,
            columnSpan: entry.defaultColumnSpan,
            config: {},
            createdBy: 'system',
            updatedBy: 'system',
          },
          { companyId },
        );
      }
    }

    const widgets = await WorkspaceWidgetConfigRepository.findMany({ employeeId }, { companyId });

    return {
      catalog,
      widgets: widgets.sort((a, b) => a.sortOrder - b.sortOrder),
    };
  },

  async updateConfig(
    context: WorkspaceActorContext,
    configs: WidgetConfigInput[],
  ): Promise<WorkspaceWidgetConfigDocument[]> {
    const results: WorkspaceWidgetConfigDocument[] = [];

    for (const input of configs) {
      const existing = await WorkspaceWidgetConfigRepository.findOne(
        { employeeId: context.employeeId, widgetSlug: input.widgetSlug },
        { companyId: context.companyId },
      );

      if (existing) {
        const updated = await WorkspaceWidgetConfigRepository.update(
          existing.id,
          {
            sortOrder: input.sortOrder,
            isVisible: input.isVisible,
            columnSpan: input.columnSpan ?? existing.columnSpan,
            config: input.config ?? existing.config,
            updatedBy: context.userId,
          },
          { companyId: context.companyId },
        );
        if (updated) {
          results.push(updated);
        }
      } else {
        const created = await WorkspaceWidgetConfigRepository.create(
          {
            id: generateUuid(),
            companyId: context.companyId,
            employeeId: context.employeeId,
            widgetSlug: input.widgetSlug,
            sortOrder: input.sortOrder,
            isVisible: input.isVisible,
            columnSpan: input.columnSpan ?? 1,
            config: input.config ?? {},
            createdBy: context.userId,
            updatedBy: context.userId,
          },
          { companyId: context.companyId },
        );
        results.push(created);
      }
    }

    await WorkspaceActivityService.publish(context, {
      activityType: WorkspaceActivityService.TYPES.WIDGET_CONFIG_UPDATED,
      description: 'Workspace widget layout updated',
      entityType: 'workspace_widget_config',
      entityId: context.employeeId,
      metadata: { widgetCount: configs.length },
    });

    return results.sort((a, b) => a.sortOrder - b.sortOrder);
  },
};
