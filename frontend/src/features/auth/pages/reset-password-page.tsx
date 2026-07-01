import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { resetPasswordRequest } from '@/features/auth/api/auth.api';
import { ROUTES } from '@/config/app.config';
import { Button } from '@/shared/components/ui/button';
import { PasswordInput } from '@/shared/components/ui/password-input';
import { PASSWORD_POLICY_HINT, validatePasswordStrength } from '@/shared/auth/password-policy';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';

export function ResetPasswordPage() {
  const { token = '' } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      const result = await resetPasswordRequest(token, password);
      setMessage(result.message);
    } catch (e) {
      setError(parseMutationError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reset password</h2>
        <p className="text-sm text-muted-foreground">Choose a strong new password for your account.</p>
      </div>
      {message ? (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p>{message}</p>
          <Link to={ROUTES.LOGIN} className="mt-3 inline-block text-primary hover:underline">
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">New password</span>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            <p className="text-xs text-muted-foreground">{PASSWORD_POLICY_HINT}</p>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Confirm password</span>
            <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={submitting || !token}>
            Reset password
          </Button>
        </form>
      )}
    </div>
  );
}
