import { lazy } from 'react';

export const EnterpriseWidgetComponents = {
  'employee-stats': lazy(() =>
    import('@/features/enterprise/widgets/employee-stats-widget').then((m) => ({ default: m.EmployeeStatsWidget })),
  ),
  'recruitment-overview': lazy(() =>
    import('@/features/enterprise/widgets/recruitment-overview-widget').then((m) => ({
      default: m.RecruitmentOverviewWidget,
    })),
  ),
  'project-overview': lazy(() =>
    import('@/features/enterprise/widgets/project-overview-widget').then((m) => ({ default: m.ProjectOverviewWidget })),
  ),
  'employees-on-leave': lazy(() =>
    import('@/features/enterprise/widgets/leave-summary-widget').then((m) => ({ default: m.LeaveSummaryWidget })),
  ),
  'attendance-today': lazy(() =>
    import('@/features/enterprise/widgets/attendance-today-widget').then((m) => ({ default: m.AttendanceTodayWidget })),
  ),
  'upcoming-joinings': lazy(() =>
    import('@/features/enterprise/widgets/upcoming-joinings-widget').then((m) => ({
      default: m.UpcomingJoiningsWidget,
    })),
  ),
  'pending-approvals': lazy(() =>
    import('@/features/enterprise/widgets/pending-approvals-widget').then((m) => ({
      default: m.PendingApprovalsWidget,
    })),
  ),
  'pending-interviews': lazy(() =>
    import('@/features/enterprise/widgets/pending-interviews-widget').then((m) => ({
      default: m.PendingInterviewsWidget,
    })),
  ),
  'pending-onboarding': lazy(() =>
    import('@/features/enterprise/widgets/pending-onboarding-widget').then((m) => ({
      default: m.PendingOnboardingWidget,
    })),
  ),
  'projects-at-risk': lazy(() =>
    import('@/features/enterprise/widgets/projects-at-risk-widget').then((m) => ({ default: m.ProjectsAtRiskWidget })),
  ),
  'recent-activities': lazy(() =>
    import('@/features/enterprise/widgets/recent-activities-widget').then((m) => ({
      default: m.RecentActivitiesWidget,
    })),
  ),
  'system-health': lazy(() =>
    import('@/features/enterprise/widgets/system-health-widget').then((m) => ({ default: m.SystemHealthWidget })),
  ),
  'org-chart-preview': lazy(() =>
    import('@/features/enterprise/widgets/org-chart-preview-widget').then((m) => ({
      default: m.OrgChartPreviewWidget,
    })),
  ),
} as const;

export type EnterpriseWidgetId = keyof typeof EnterpriseWidgetComponents;
