import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth-provider';
import { usePortalHomeRoute } from '@/app/hooks/use-resolved-portal';
import { ROUTES } from '@/config/app.config';
import { AUTH_STATUS } from '@/shared/auth/auth-status.constants';
import { useAuthStore } from '@/shared/stores/app.store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { PasswordInput } from '@/shared/components/ui/password-input';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const authStatus = useAuthStore((s) => s.authStatus);
  const portalHome = usePortalHomeRoute();
  const [companyCode, setCompanyCode] = useState('HRS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authStatus === AUTH_STATUS.LOADING) {
    return null;
  }

  if (authStatus === AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to={portalHome} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ companyCode, email, password, rememberMe });
      navigate(useAuthStore.getState().homeRoute ?? portalHome, { replace: true });
    } catch (e) {
      const parsed = parseMutationError(e);
      setError(parsed.description ? `${parsed.message} ${parsed.description}` : parsed.message);
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
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
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
