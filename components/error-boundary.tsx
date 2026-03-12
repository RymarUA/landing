"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-800 font-semibold">
            {this.props.label
              ? `Помилка завантаження: ${this.props.label}`
              : "Щось пішло не так"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Спробувати знову
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
