import { PORTAL } from '@/config/portals';
import { PortalShell } from '@/app/layouts/portal-shell';

export function EnterpriseLayout() {
  return <PortalShell portal={PORTAL.ENTERPRISE} />;
}
