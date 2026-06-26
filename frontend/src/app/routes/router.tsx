import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AuthLayout, PortalLayout } from '@/app/layouts/auth-layout';
import { PortalGuard } from '@/app/routes/portal-guard';
import { PortalIndexRedirect } from '@/app/routes/portal-index-redirect';
import { ProtectedRoute } from '@/app/routes/protected-route';
import { PublicRoute } from '@/app/routes/public-route';
import { ROUTES } from '@/config/app.config';
import { LoginPage } from '@/features/auth/pages/login-page';
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page';
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page';
import { AccountActivationPage } from '@/features/auth/pages/account-activation-page';
import { OnboardingPortalRoutePage } from '@/features/auth/pages/onboarding-portal-page';
import { SessionsPage } from '@/features/auth/pages/sessions-page';
import {
  ForbiddenPage,
  MaintenancePage,
  NotFoundPage,
  SessionExpiredPage,
  UnauthorizedPage,
} from '@/shared/pages/status-pages';
import { OrganizationDashboardPage } from '@/features/organization/pages/organization-dashboard-page';
import { EntityListPage } from '@/features/organization/pages/entity-list-page';
import { SettingsPage } from '@/features/organization/pages/settings-page';
import { RbacDashboardPage } from '@/features/rbac/pages/rbac-dashboard-page';
import { RolesPage } from '@/features/rbac/pages/roles-page';
import { PermissionMatrixPage } from '@/features/rbac/pages/permission-matrix-page';
import { SimulatorPage } from '@/features/rbac/pages/simulator-page';
import { EmployeesListPage } from '@/features/employee/pages/employees-list-page';
import { EmployeeDetailPage } from '@/features/employee/pages/employee-detail-page';
import { EmployeeCreatePage } from '@/features/employee/pages/employee-create-page';
import { RecruitmentDashboardPage } from '@/features/recruitment/pages/recruitment-dashboard-page';
import { CandidatesListPage } from '@/features/recruitment/pages/candidates-list-page';
import { PipelineKanbanPage } from '@/features/recruitment/pages/pipeline-kanban-page';
import { InterviewsCalendarPage } from '@/features/recruitment/pages/interviews-calendar-page';
import { CandidateDetailPage } from '@/features/recruitment/pages/candidate-detail-page';
import { CandidateCreatePage } from '@/features/recruitment/pages/candidate-create-page';
import { ProjectsDashboardPage } from '@/features/project/pages/projects-dashboard-page';
import { ProjectsListPage } from '@/features/project/pages/projects-list-page';
import { ProjectDetailPage } from '@/features/project/pages/project-detail-page';
import { WorkspaceDashboardPage } from '@/features/workspace/pages/workspace-dashboard-page';
import { WorkspaceProfilePage } from '@/features/workspace/pages/workspace-profile-page';
import { WorkspaceProjectsPage } from '@/features/workspace/pages/workspace-projects-page';
import { WorkspaceTasksPage } from '@/features/workspace/pages/workspace-tasks-page';
import { WorkspaceDocumentsPage } from '@/features/workspace/pages/workspace-documents-page';
import { WorkspaceNotificationsPage } from '@/features/workspace/pages/workspace-notifications-page';
import { WorkspaceAnnouncementsPage } from '@/features/workspace/pages/workspace-announcements-page';
import { WorkspaceCalendarPage } from '@/features/workspace/pages/workspace-calendar-page';
import { WorkspaceActivityPage } from '@/features/workspace/pages/workspace-activity-page';
import { WorkspaceSearchPage } from '@/features/workspace/pages/workspace-search-page';
import { LeaveExitDashboardPage } from '@/features/leave-exit/pages/leave-exit-dashboard-page';
import { ApplyLeavePage } from '@/features/leave-exit/pages/apply-leave-page';
import { LeaveRequestsPage } from '@/features/leave-exit/pages/leave-requests-page';
import { LeaveCalendarPage } from '@/features/leave-exit/pages/leave-calendar-page';
import { LeaveBalancesPage } from '@/features/leave-exit/pages/leave-balances-page';
import { LeavePoliciesPage } from '@/features/leave-exit/pages/leave-policies-page';
import { ResignationPage } from '@/features/leave-exit/pages/resignation-page';
import { ExitProgressPage } from '@/features/leave-exit/pages/exit-progress-page';
import { ApprovalInboxPage } from '@/features/approval/pages/approval-inbox-page';
import { ApprovalHistoryPage } from '@/features/approval/pages/approval-history-page';
import { ApprovalWorkflowsPage } from '@/features/approval/pages/approval-workflows-page';
import { EnterpriseDashboardPage } from '@/features/enterprise/pages/enterprise-dashboard-page';
import { ManagerDashboardPage } from '@/features/enterprise/pages/manager-dashboard-page';
import { CompanySetupWizardPage } from '@/features/admin/pages/company-setup-wizard-page';
import { OrganizationChartPage } from '@/features/admin/pages/organization-chart-page';
import { OrganizationEntityDetailPage } from '@/features/admin/pages/organization-entity-detail-page';
import { TemplatesPage } from '@/features/admin/pages/templates-page';
import { ConfigurationHubPage } from '@/features/configuration/pages/configuration-hub-page';
import { ConfigurationSectionPage } from '@/features/configuration/pages/configuration-section-page';
import { NavigationManagerPage } from '@/features/configuration/pages/navigation-manager-page';
import { AuditExplorerPage } from '@/features/configuration/pages/audit-explorer-page';
import { SystemHealthPage } from '@/features/configuration/pages/system-health-page';
import { RoleTemplatesPage } from '@/features/rbac/pages/role-templates-page';
import { AttendancePortalPage } from '@/features/attendance/pages/attendance-portal-page';
import { AttendanceEnterprisePage } from '@/features/attendance/pages/attendance-enterprise-page';
import { AttendanceHrPage } from '@/features/attendance/pages/attendance-hr-page';
import { AttendanceManagerPage } from '@/features/attendance/pages/attendance-manager-page';
import { AttendanceWorkspacePage } from '@/features/attendance/pages/attendance-workspace-page';
import { AttendanceReportsPage } from '@/features/attendance/pages/attendance-reports-page';
import { PayrollPortalPage } from '@/features/payroll/pages/payroll-portal-page';
import { PayrollEnterprisePage } from '@/features/payroll/pages/payroll-enterprise-page';
import { PayrollFinancePage } from '@/features/payroll/pages/payroll-finance-page';
import { PayrollHrPage } from '@/features/payroll/pages/payroll-hr-page';
import { PayrollWorkspacePage } from '@/features/payroll/pages/payroll-workspace-page';
import { PayrollReportsPage } from '@/features/payroll/pages/payroll-reports-page';
import { SalesPortalPage } from '@/features/sales/pages/sales-portal-page';
import { SalesEnterprisePage } from '@/features/sales/pages/sales-enterprise-page';
import { SalesManagerPage } from '@/features/sales/pages/sales-manager-page';
import { SalesExecutivePage } from '@/features/sales/pages/sales-executive-page';
import { SalesReportsPage } from '@/features/sales/pages/sales-reports-page';
import { SalesLeadDetailPage } from '@/features/sales/pages/sales-lead-detail-page';
import { CommunicationPortalPage } from '@/features/communication/pages/communication-portal-page';
import { CommunicationEnterprisePage } from '@/features/communication/pages/communication-enterprise-page';
import { CommunicationManagerPage } from '@/features/communication/pages/communication-manager-page';
import { CommunicationWorkspacePage } from '@/features/communication/pages/communication-workspace-page';
import { CommunicationInboxPage } from '@/features/communication/pages/communication-inbox-page';
import { CommunicationReportsPage } from '@/features/communication/pages/communication-reports-page';
import { CommunicationSearchPage } from '@/features/communication/pages/communication-search-page';
import { AnalyticsHubPage } from '@/features/reports/pages/analytics-hub-page';
import { ExecutiveDashboardPage } from '@/features/reports/pages/executive-dashboard-page';
import { ReportDetailPage } from '@/features/reports/pages/report-detail-page';
import { ReportsCatalogPage } from '@/features/reports/pages/reports-catalog-page';
import { ReportsPortalPage } from '@/features/reports/pages/reports-portal-page';
import { RoleDashboardPage } from '@/features/reports/pages/role-dashboard-page';
import { IntegrationDashboardPage } from '@/features/integration/pages/integration-dashboard-page';
import { IntegrationConnectorsPage } from '@/features/integration/pages/integration-connectors-page';
import { ApiKeysPage } from '@/features/integration/pages/api-keys-page';
import { WebhooksPage } from '@/features/integration/pages/webhooks-page';
import { ImportCenterPage } from '@/features/integration/pages/import-center-page';
import { ExportCenterPage } from '@/features/integration/pages/export-center-page';
import { SchedulerPage } from '@/features/integration/pages/scheduler-page';
import { IntegrationLogsPage } from '@/features/integration/pages/integration-logs-page';
import { BackupPage } from '@/features/integration/pages/backup-page';

function OnboardingRoute() {
  return <OnboardingPortalRoutePage />;
}

const protectedAppRoutes = [
  { index: true, element: <PortalIndexRedirect /> },
  { path: ROUTES.ENTERPRISE.slice(1), element: <EnterpriseDashboardPage /> },
  { path: ROUTES.MANAGER.slice(1), element: <ManagerDashboardPage /> },
  { path: ROUTES.WORKSPACE.slice(1), element: <WorkspaceDashboardPage /> },
  { path: ROUTES.WORKSPACE_PROFILE.slice(1), element: <WorkspaceProfilePage /> },
  { path: ROUTES.WORKSPACE_PROJECTS.slice(1), element: <WorkspaceProjectsPage /> },
  { path: ROUTES.WORKSPACE_TASKS.slice(1), element: <WorkspaceTasksPage /> },
  { path: ROUTES.WORKSPACE_DOCUMENTS.slice(1), element: <WorkspaceDocumentsPage /> },
  { path: ROUTES.WORKSPACE_NOTIFICATIONS.slice(1), element: <WorkspaceNotificationsPage /> },
  { path: ROUTES.WORKSPACE_ANNOUNCEMENTS.slice(1), element: <WorkspaceAnnouncementsPage /> },
  { path: ROUTES.WORKSPACE_CALENDAR.slice(1), element: <WorkspaceCalendarPage /> },
  { path: ROUTES.WORKSPACE_ACTIVITY.slice(1), element: <WorkspaceActivityPage /> },
  { path: ROUTES.WORKSPACE_SEARCH.slice(1), element: <WorkspaceSearchPage /> },
  { path: ROUTES.WORKSPACE_MESSAGES.slice(1), element: <CommunicationWorkspacePage /> },
  { path: ROUTES.ORGANIZATION.slice(1), element: <OrganizationDashboardPage /> },
  { path: `${ROUTES.ORGANIZATION.slice(1)}/setup`, element: <CompanySetupWizardPage /> },
  { path: `${ROUTES.ORGANIZATION.slice(1)}/chart`, element: <OrganizationChartPage /> },
  { path: `${ROUTES.ORGANIZATION.slice(1)}/settings`, element: <SettingsPage /> },
  { path: `${ROUTES.ORGANIZATION.slice(1)}/:entityKey/:id`, element: <OrganizationEntityDetailPage /> },
  { path: `${ROUTES.ORGANIZATION.slice(1)}/:entityKey`, element: <EntityListPage /> },
  { path: ROUTES.ADMIN_SETTINGS.slice(1), element: <Navigate to={ROUTES.CONFIGURATION} replace /> },
  { path: ROUTES.CONFIGURATION.slice(1), element: <ConfigurationHubPage /> },
  { path: `${ROUTES.CONFIGURATION.slice(1)}/:section`, element: <ConfigurationSectionPage /> },
  { path: ROUTES.NAVIGATION_MANAGER.slice(1), element: <NavigationManagerPage /> },
  { path: ROUTES.AUDIT_EXPLORER.slice(1), element: <AuditExplorerPage /> },
  { path: ROUTES.SYSTEM_HEALTH.slice(1), element: <SystemHealthPage /> },
  { path: ROUTES.FEATURE_FLAGS.slice(1), element: <Navigate to={ROUTES.configurationSection('feature_flags')} replace /> },
  { path: ROUTES.SYSTEM_DASHBOARD.slice(1), element: <Navigate to={ROUTES.SYSTEM_HEALTH} replace /> },
  { path: 'admin/audit', element: <Navigate to={ROUTES.AUDIT_EXPLORER} replace /> },
  { path: ROUTES.ADMIN_TEMPLATES.slice(1), element: <TemplatesPage /> },
  { path: ROUTES.RBAC.slice(1), element: <RbacDashboardPage /> },
  { path: ROUTES.RBAC_ROLES.slice(1), element: <RolesPage /> },
  { path: ROUTES.RBAC_MATRIX.slice(1), element: <PermissionMatrixPage /> },
  { path: ROUTES.RBAC_SIMULATOR.slice(1), element: <SimulatorPage /> },
  { path: ROUTES.RBAC_TEMPLATES.slice(1), element: <RoleTemplatesPage /> },
  { path: ROUTES.EMPLOYEES.slice(1), element: <EmployeesListPage /> },
  { path: ROUTES.EMPLOYEE_CREATE.slice(1), element: <EmployeeCreatePage /> },
  { path: `${ROUTES.EMPLOYEES.slice(1)}/:id`, element: <EmployeeDetailPage /> },
  { path: ROUTES.RECRUITMENT.slice(1), element: <RecruitmentDashboardPage /> },
  { path: ROUTES.RECRUITMENT_CANDIDATES.slice(1), element: <CandidatesListPage /> },
  { path: ROUTES.RECRUITMENT_CANDIDATE_CREATE.slice(1), element: <CandidateCreatePage /> },
  { path: `${ROUTES.RECRUITMENT_CANDIDATES.slice(1)}/:id`, element: <CandidateDetailPage /> },
  { path: ROUTES.RECRUITMENT_PIPELINE.slice(1), element: <PipelineKanbanPage /> },
  { path: ROUTES.RECRUITMENT_INTERVIEWS.slice(1), element: <InterviewsCalendarPage /> },
  { path: ROUTES.PROJECTS.slice(1), element: <ProjectsDashboardPage /> },
  { path: ROUTES.PROJECTS_LIST.slice(1), element: <ProjectsListPage /> },
  { path: `${ROUTES.PROJECTS.slice(1)}/:id`, element: <ProjectDetailPage /> },
  { path: ROUTES.LEAVE_EXIT.slice(1), element: <LeaveExitDashboardPage /> },
  { path: ROUTES.LEAVE_APPLY.slice(1), element: <ApplyLeavePage /> },
  { path: ROUTES.LEAVE_REQUESTS.slice(1), element: <LeaveRequestsPage /> },
  { path: ROUTES.LEAVE_CALENDAR.slice(1), element: <LeaveCalendarPage /> },
  { path: ROUTES.LEAVE_BALANCES.slice(1), element: <LeaveBalancesPage /> },
  { path: ROUTES.LEAVE_POLICIES.slice(1), element: <LeavePoliciesPage /> },
  { path: ROUTES.RESIGNATION.slice(1), element: <ResignationPage /> },
  { path: ROUTES.EXIT.slice(1), element: <ExitProgressPage /> },
  { path: ROUTES.APPROVAL_INBOX.slice(1), element: <ApprovalInboxPage /> },
  { path: ROUTES.APPROVAL_HISTORY.slice(1), element: <ApprovalHistoryPage /> },
  { path: ROUTES.APPROVAL_WORKFLOWS.slice(1), element: <ApprovalWorkflowsPage /> },
  { path: ROUTES.SESSIONS.slice(1), element: <SessionsPage /> },
  { path: ROUTES.ATTENDANCE.slice(1), element: <AttendancePortalPage /> },
  { path: ROUTES.ATTENDANCE_ADMIN.slice(1), element: <AttendanceEnterprisePage /> },
  { path: ROUTES.ATTENDANCE_HR.slice(1), element: <AttendanceHrPage /> },
  { path: ROUTES.ATTENDANCE_TEAM.slice(1), element: <AttendanceManagerPage /> },
  { path: ROUTES.WORKSPACE_ATTENDANCE.slice(1), element: <AttendanceWorkspacePage /> },
  { path: ROUTES.ATTENDANCE_REPORTS.slice(1), element: <AttendanceReportsPage /> },
  { path: ROUTES.PAYROLL.slice(1), element: <PayrollPortalPage /> },
  { path: ROUTES.PAYROLL_ADMIN.slice(1), element: <PayrollEnterprisePage /> },
  { path: ROUTES.PAYROLL_FINANCE.slice(1), element: <PayrollFinancePage /> },
  { path: ROUTES.PAYROLL_HR.slice(1), element: <PayrollHrPage /> },
  { path: ROUTES.WORKSPACE_PAYROLL.slice(1), element: <PayrollWorkspacePage /> },
  { path: ROUTES.PAYROLL_REPORTS.slice(1), element: <PayrollReportsPage /> },
  { path: ROUTES.SALES.slice(1), element: <SalesPortalPage /> },
  { path: ROUTES.SALES_ADMIN.slice(1), element: <SalesEnterprisePage /> },
  { path: ROUTES.SALES_MANAGER.slice(1), element: <SalesManagerPage /> },
  { path: ROUTES.SALES_EXECUTIVE.slice(1), element: <SalesExecutivePage /> },
  { path: ROUTES.SALES_REPORTS.slice(1), element: <SalesReportsPage /> },
  { path: `${ROUTES.SALES.slice(1)}/leads/:id`, element: <SalesLeadDetailPage /> },
  { path: ROUTES.COMMUNICATION.slice(1), element: <CommunicationPortalPage /> },
  { path: ROUTES.COMMUNICATION_ADMIN.slice(1), element: <CommunicationEnterprisePage /> },
  { path: ROUTES.COMMUNICATION_MANAGER.slice(1), element: <CommunicationManagerPage /> },
  { path: ROUTES.COMMUNICATION_INBOX.slice(1), element: <CommunicationInboxPage /> },
  { path: ROUTES.COMMUNICATION_REPORTS.slice(1), element: <CommunicationReportsPage /> },
  { path: ROUTES.COMMUNICATION_SEARCH.slice(1), element: <CommunicationSearchPage /> },
  { path: ROUTES.REPORTS.slice(1), element: <ReportsCatalogPage /> },
  { path: 'reports/portal', element: <ReportsPortalPage /> },
  { path: ROUTES.REPORTS_EXECUTIVE.slice(1), element: <ExecutiveDashboardPage /> },
  { path: `${ROUTES.REPORTS_DASHBOARD.slice(1)}/:role`, element: <RoleDashboardPage /> },
  { path: `${ROUTES.REPORTS_RUN.slice(1)}/:domain/:type`, element: <ReportDetailPage /> },
  { path: ROUTES.ANALYTICS.slice(1), element: <AnalyticsHubPage /> },
  { path: ROUTES.INTEGRATIONS.slice(1), element: <IntegrationDashboardPage /> },
  { path: ROUTES.INTEGRATION_CONNECTORS.slice(1), element: <IntegrationConnectorsPage /> },
  { path: ROUTES.API_KEYS.slice(1), element: <ApiKeysPage /> },
  { path: ROUTES.WEBHOOKS.slice(1), element: <WebhooksPage /> },
  { path: ROUTES.IMPORT_CENTER.slice(1), element: <ImportCenterPage /> },
  { path: ROUTES.EXPORT_CENTER.slice(1), element: <ExportCenterPage /> },
  { path: ROUTES.SCHEDULER.slice(1), element: <SchedulerPage /> },
  { path: ROUTES.INTEGRATION_LOGS.slice(1), element: <IntegrationLogsPage /> },
  { path: ROUTES.BACKUPS.slice(1), element: <BackupPage /> },
  { path: 'system/storage', element: <Navigate to={ROUTES.INTEGRATION_CONNECTORS} replace /> },
  { path: 'system/email', element: <Navigate to={ROUTES.INTEGRATION_CONNECTORS} replace /> },
];

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
          { path: `${ROUTES.RESET_PASSWORD}/:token`, element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <PortalLayout />,
    children: [
      { path: `${ROUTES.ONBOARDING}/:secureToken`, element: <OnboardingRoute /> },
      { path: `${ROUTES.ACCOUNT_ACTIVATION}/:secureToken`, element: <AccountActivationPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PortalGuard />,
        children: protectedAppRoutes,
      },
    ],
  },
  { path: ROUTES.UNAUTHORIZED, element: <UnauthorizedPage /> },
  { path: ROUTES.FORBIDDEN, element: <ForbiddenPage /> },
  { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
  { path: ROUTES.SESSION_EXPIRED, element: <SessionExpiredPage /> },
  { path: ROUTES.MAINTENANCE, element: <MaintenancePage /> },
  { path: '*', element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
