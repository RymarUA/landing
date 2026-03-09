"use client";

/**
 * components/error-boundary.tsx
 *
 * Generic React Error Boundary with a branded FamilyHub Market fallback UI.
 * Wrap any API-driven block to gracefully handle runtime errors without
 * crashing the whole page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeDangerousComponent />
 *   </ErrorBoundary>
 *
 *   // Custom fallback:
 *   <ErrorBoundary fallback={<p>Щось пішло не так</p>}>
 *     <SomeDangerousComponent />
 *   </ErrorBoundary>
 */

import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback UI. If omitted, the built-in branded card is shown. */
  fallback?: ReactNode;
  /** Optional label shown in the default fallback (e.g. "Каталог") */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] caught:", error, info.componentStack);
    
    // В продакшене отправляем в систему мониторинга
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, info);
    }
  }

  async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: this.props.label,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        }),
      });
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={28} className="text-orange-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-base">
              {this.props.label
                ? `Не вдалося завантажити «${this.props.label}»`
                : "Щось пішло не так"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Спробуйте оновити сторінку або повторіть пізніше.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl border border-orange-100 transition-colors"
          >
            <RefreshCw size={15} />
            Спробувати ще раз
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight wrapper that combines ErrorBoundary + React Suspense,
 * so you only need one component for both loading & error states.
 *
 * Usage:
 *   <AsyncBlock fallback={<Skeleton />} label="Трекінг">
 *     <TrackingWidget />
 *   </AsyncBlock>
 */
interface AsyncBlockProps {
  children: ReactNode;
  /** Suspense loading fallback */
  fallback?: ReactNode;
  /** Label for the error card */
  label?: string;
  /** Custom error UI */
  errorFallback?: ReactNode;
}

export function AsyncBlock({ children, fallback, label, errorFallback }: AsyncBlockProps) {
  return (
    <ErrorBoundary label={label} fallback={errorFallback}>
      <React.Suspense fallback={fallback ?? <DefaultSuspenseFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

function DefaultSuspenseFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
