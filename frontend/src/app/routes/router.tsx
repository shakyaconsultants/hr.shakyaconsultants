import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthLayout, PortalLayout } from '@/app/layouts/auth-layout';
import { PortalGuard } from '@/app/routes/portal-guard';
import { ProtectedRoute } from '@/app/routes/protected-route';
import { PublicRoute } from '@/app/routes/public-route';
import { protectedAppRoutes } from '@/app/routes/protected-routes';
import { ROUTES } from '@/config/app.config';
import { LoginPage } from '@/features/auth/pages/login-page';
import { OnboardingPortalRoutePage } from '@/features/auth/pages/onboarding-portal-page';
import {
  DataLoadFailurePage,
  ForbiddenPage,
  MaintenancePage,
  ModuleLoadFailurePage,
  NetworkErrorPage,
  NotFoundPage,
  OfflinePage,
  ServerErrorPage,
  SessionExpiredPage,
  UnexpectedErrorPage,
  UnauthorizedPage,
} from '@/shared/pages/status-pages';
import { RouteErrorFallback } from '@/app/components/route-error-fallback';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { lazyRoute } from '@/app/routes/lazy-route';

function OnboardingRoute() {
  return <OnboardingPortalRoutePage />;
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorFallback />,
    hydrateFallbackElement: (
      <div className="flex min-h-screen items-center justify-center p-6">
        <PageSkeleton />
      </div>
    ),
    children: [
      {
        element: <PublicRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: ROUTES.LOGIN, element: <LoginPage /> },
              {
                path: ROUTES.FORGOT_PASSWORD,
                ...lazyRoute(
                  () => import('@/features/auth/pages/forgot-password-page'),
                  'ForgotPasswordPage',
                ),
              },
              {
                path: `${ROUTES.RESET_PASSWORD}/:token`,
                ...lazyRoute(
                  () => import('@/features/auth/pages/reset-password-page'),
                  'ResetPasswordPage',
                ),
              },
            ],
          },
        ],
      },
      {
        element: <PortalLayout />,
        children: [
          { path: `${ROUTES.ONBOARDING}/:secureToken`, element: <OnboardingRoute /> },
          {
            path: `${ROUTES.ACCOUNT_ACTIVATION}/:secureToken`,
            ...lazyRoute(
              () => import('@/features/auth/pages/account-activation-page'),
              'AccountActivationPage',
            ),
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        errorElement: <RouteErrorFallback />,
        children: [
          {
            element: <PortalGuard />,
            errorElement: <RouteErrorFallback />,
            children: protectedAppRoutes,
          },
        ],
      },
      { path: ROUTES.UNAUTHORIZED, element: <UnauthorizedPage /> },
      { path: ROUTES.FORBIDDEN, element: <ForbiddenPage /> },
      { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
      { path: ROUTES.SESSION_EXPIRED, element: <SessionExpiredPage /> },
      { path: ROUTES.MAINTENANCE, element: <MaintenancePage /> },
      { path: ROUTES.SERVER_ERROR, element: <ServerErrorPage /> },
      { path: ROUTES.NETWORK_ERROR, element: <NetworkErrorPage /> },
      { path: ROUTES.OFFLINE, element: <OfflinePage /> },
      { path: ROUTES.MODULE_LOAD_FAILURE, element: <ModuleLoadFailurePage /> },
      { path: ROUTES.DATA_LOAD_FAILURE, element: <DataLoadFailurePage /> },
      { path: ROUTES.UNEXPECTED_ERROR, element: <UnexpectedErrorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6">
          <PageSkeleton />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}
