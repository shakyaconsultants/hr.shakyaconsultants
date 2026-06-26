import { PORTAL } from '@/config/portals';
import { PortalShell } from '@/app/layouts/portal-shell';

export function WorkspaceLayout() {
  return <PortalShell portal={PORTAL.WORKSPACE} />;
}
