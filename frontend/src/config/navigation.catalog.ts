/**
 * @deprecated Use `@/config/module-registry` — navigation is generated from the module registry.
 */
export {
  buildNavigationForPortal as filterNavigation,
  DEFAULT_FEATURE_FLAGS,
} from '@/config/module-registry';

export type { ModuleNavGroup as NavGroup, ModuleNavItem as NavItem } from '@/config/module-registry/types';
