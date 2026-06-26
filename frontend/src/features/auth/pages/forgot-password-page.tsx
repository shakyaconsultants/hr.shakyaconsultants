import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '@/features/auth/api/auth.api';
import { ROUTES } from '@/config/app.config';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export function ForgotPasswordPage() {
  const [companyCode, setCompanyCode] = useState('HRS');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await forgotPasswordRequest(companyCode, email);
      setMessage(result.message);
    } catch {
      setMessage('If the account exists, a password reset email has been sent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Forgot password</h2>
        <p className="text-sm text-muted-foreground">We will email you a secure reset link if the account exists.</p>
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Company Code</span>
          <Input value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} required />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Email</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          Send reset link
        </Button>
      </form>
      <p className="text-center text-sm">
        <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
