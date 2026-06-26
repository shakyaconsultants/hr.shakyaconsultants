export interface NavigationItemDefault {
  id: string;
  label: string;
  groupId: string;
  enabled: boolean;
  sortOrder: number;
  icon?: string;
  portals?: string[];
  permission?: string;
}

export const DEFAULT_NAVIGATION_ITEMS: NavigationItemDefault[] = [
  { id: 'dashboard', label: 'Dashboard', groupId: 'core', enabled: true, sortOrder: 1, icon: 'layout-dashboard', portals: ['admin', 'employee'] },
  { id: 'employees', label: 'Employees', groupId: 'hr', enabled: true, sortOrder: 10, icon: 'users', permission: 'employee.read' },
  { id: 'organization', label: 'Organization', groupId: 'hr', enabled: true, sortOrder: 20, icon: 'building', permission: 'company.read' },
  { id: 'attendance', label: 'Attendance', groupId: 'hr', enabled: true, sortOrder: 30, icon: 'clock', permission: 'attendance.read' },
  { id: 'leave', label: 'Leave', groupId: 'hr', enabled: true, sortOrder: 40, icon: 'calendar', permission: 'leave.read' },
  { id: 'payroll', label: 'Payroll', groupId: 'hr', enabled: true, sortOrder: 50, icon: 'wallet', permission: 'payroll.read' },
  { id: 'recruitment', label: 'Recruitment', groupId: 'talent', enabled: true, sortOrder: 60, icon: 'user-plus', permission: 'recruitment.read' },
  { id: 'projects', label: 'Projects', groupId: 'operations', enabled: true, sortOrder: 70, icon: 'folder-kanban', permission: 'project.read' },
  { id: 'sales', label: 'Sales', groupId: 'operations', enabled: true, sortOrder: 80, icon: 'trending-up', permission: 'sales.read' },
  { id: 'communication', label: 'Communication', groupId: 'collaboration', enabled: true, sortOrder: 90, icon: 'message-square', permission: 'communication.read' },
  { id: 'reports', label: 'Reports', groupId: 'analytics', enabled: true, sortOrder: 100, icon: 'bar-chart', permission: 'reports.read' },
  { id: 'settings', label: 'Settings', groupId: 'admin', enabled: true, sortOrder: 110, icon: 'settings', permission: 'settings.read' },
];

export const NAVIGATION_SETTING_KEY = 'navigation.menu_overrides';
