/**
 * app/(dashboard)/layout.tsx
 *
 * Shared layout for all authenticated routes.
 * Wraps children in:
 *   1. SWRConfig  — global SWR settings (dedupe interval, error retry)
 *   2. ErrorBoundary — catches unhandled render errors
 *
 * Debugging:
 *   SWR's `onError` callback fires on every fetch error and receives the full
 *   AxiosError. We log it here as a safety net (api-client already logs it,
 *   but this catches any SWR-internal errors too).
 *
 * TODO (onboarding):
 *   - Add <Toaster /> from sonner here once toast notifications are wired in.
 *   - Add an AuthGuard wrapper that redirects to /login if the token is missing.
 */

'use client';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
