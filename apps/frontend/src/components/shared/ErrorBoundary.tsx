/**
 * components/shared/ErrorBoundary.tsx
 *
 * React error boundary for catching unhandled render errors.
 * Wraps top-level pages so a single component crash doesn't blank the whole app.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <MyPage />
 *   </ErrorBoundary>
 *
 * Debugging:
 *   The `componentDidCatch` method receives the full error + component stack.
 *   In production, forward both to your monitoring tool (e.g. Sentry) here.
 *
 * TODO (onboarding):
 *   - Plug in Sentry.captureException() inside componentDidCatch.
 *   - Optionally add a "retry" button that calls this.setState({ hasError: false }).
 */

'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  /** Optional fallback — if omitted, a generic error card is shown. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // ── Structured log — always include component stack ───────────────────
    console.error('[ErrorBoundary]', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });

    // TODO (onboarding): forward to Sentry
    // Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Une erreur inattendue est survenue</AlertTitle>
            <AlertDescription className="mt-1 text-xs font-mono">
              {this.state.message}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }
}
