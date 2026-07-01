import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { activateAccountRequest, fetchActivationStatus } from '@/features/auth/api/auth.api';
import { ROUTES } from '@/config/app.config';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Loading } from '@/shared/components/loading';
import { PASSWORD_POLICY_HINT, validatePasswordStrength } from '@/shared/auth/password-policy';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';

export function AccountActivationPage() {
  const { secureToken = '' } = useParams();
  const [status, setStatus] = useState<{ valid: boolean; expired: boolean; email?: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchActivationStatus(secureToken).then(setStatus);
  }, [secureToken]);

  if (!status) {
    return <Loading message="Validating activation link..." />;
  }

  if (!status.valid) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">{status.expired ? 'Link expired' : 'Invalid link'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Contact HR to request a new activation link.</p>
      </div>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await activateAccountRequest(secureToken, password);
      setMessage(result.message);
    } catch (e) {
      setError(parseMutationError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (message) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Account activated</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Link to={ROUTES.LOGIN} className="mt-4 inline-block text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h2 className="text-2xl font-bold">Activate your account</h2>
        {status.email ? <p className="text-sm text-muted-foreground">Account: {status.email}</p> : null}
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Create password</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <p className="text-xs text-muted-foreground">{PASSWORD_POLICY_HINT}</p>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Confirm password</span>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          Activate account
        </Button>
      </form>
    </div>
  );
}
