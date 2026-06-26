import type { LucideIcon } from 'lucide-react';
import type { PortalType } from '@/config/portals';

export interface ModuleNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  permission?: string;
  permissionsAny?: string[];
  portals: PortalType[];
  featureFlag?: string;
  children?: ModuleNavItem[];
}

export interface ModuleNavGroup {
  id: string;
  label: string;
  portals: PortalType[];
  items: ModuleNavItem[];
}

export interface ModuleRouteMeta {
  path: string;
  portals: PortalType[];
  permission?: string;
  permissionsAny?: string[];
}

export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  portals: PortalType[];
  permission?: string;
  permissionsAny?: string[];
  featureFlag?: string;
  defaultColSpan?: 1 | 2 | 3 | 4;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  icon: LucideIcon;
  portals: PortalType[];
  featureFlag?: string;
  navigation: ModuleNavGroup[];
  routes: ModuleRouteMeta[];
  dashboardWidgets?: DashboardWidgetDefinition[];
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface NavigationFilterContext {
  portal: PortalType;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  featureFlags?: FeatureFlags;
}
