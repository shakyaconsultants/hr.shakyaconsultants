import { PORTAL } from '@/config/portals';
import { PortalShell } from '@/app/layouts/portal-shell';

export function ManagerLayout() {
  return <PortalShell portal={PORTAL.MANAGER} />;
}
