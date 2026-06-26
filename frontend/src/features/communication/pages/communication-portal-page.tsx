import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { PORTAL, resolvePortal } from '@/config/portals';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

export function CommunicationPortalPage() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  useEffect(() => {
    if (hasPermission('notifications.broadcast') || hasPermission('settings.manage')) {
      navigate(ROUTES.COMMUNICATION_ADMIN, { replace: true });
      return;
    }
    const portal = resolvePortal(hasAnyPermission);
    if (portal === PORTAL.MANAGER && hasPermission('conversation.create')) {
      navigate(ROUTES.COMMUNICATION_MANAGER, { replace: true });
      return;
    }
    if (hasPermission('chat.message.send') || hasPermission('conversation.read')) {
      navigate(ROUTES.WORKSPACE_MESSAGES, { replace: true });
      return;
    }
    navigate(ROUTES.FORBIDDEN, { replace: true });
  }, [navigate, hasPermission, hasAnyPermission]);

  return <Loading message="Redirecting to communication..." />;
}
