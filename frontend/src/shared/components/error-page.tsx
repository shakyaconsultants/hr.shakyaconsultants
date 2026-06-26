import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

interface ErrorPageProps {
  title?: string;
  message?: string;
}

export function ErrorPage({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again later.',
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-md text-muted-foreground">{message}</p>
      <Button asChild>
        <Link to={ROUTES.HOME}>Go home</Link>
      </Button>
    </div>
  );
}
