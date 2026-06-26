import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth-provider';
import { usePortalHomeRoute } from '@/app/hooks/use-resolved-portal';
import { ROUTES } from '@/config/app.config';
import { getPortalHomeRoute, resolvePortal } from '@/config/portals';
import { useAuthStore } from '@/shared/stores/app.store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Loading } from '@/shared/components/loading';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const portalHome = usePortalHomeRoute();
  const [companyCode, setCompanyCode] = useState('HRS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isInitialized) {
    return <Loading message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={portalHome} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ companyCode, email, password, rememberMe });
      const { hasAnyPermission } = useAuthStore.getState();
      navigate(getPortalHomeRoute(resolvePortal(hasAnyPermission)), { replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid credentials';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sign in</h2>
        <p className="text-sm text-muted-foreground">Enter your credentials to access the ERP.</p>
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Company Code</span>
          <Input value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} required />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Email</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Password</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          Remember this device
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <p className="text-center text-sm">
        <Link to={ROUTES.FORGOT_PASSWORD} className="text-primary hover:underline">
          Forgot password?
        </Link>
      </p>
    </div>
  );
}
