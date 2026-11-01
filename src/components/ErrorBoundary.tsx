import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Unexpected runtime error',
    };
  }

  componentDidCatch(error: unknown) {
    // Keep console diagnostic minimal without crashing UI
    console.warn('Nekbaar ErrorBoundary caught error:', error);
  }

  handleResetAndRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          role="alert"
          data-testid="app-error-boundary-fallback"
          className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2] dark:bg-[#0B141A] text-slate-900 dark:text-[#F8FAFC]"
        >
          <div className="w-full max-w-md rounded-3xl border border-teal-500/35 bg-white dark:bg-[#101D26] p-6 space-y-4 text-center shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/15 text-[#0d9488] flex items-center justify-center text-2xl">
              🛡️
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-black">
                حدث انقطاع مؤقت أثناء تحديث العرض
              </h1>
              <p className="text-xs font-semibold text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
                بيانات أسرتك وأطفالك (أحمد، مريم، حمزة، ليلى، ويوسف) محفوظة بأمان. اضغط أدناه لإعادة المحاولة فوراً.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleResetAndRetry}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#0d9488] hover:bg-[#0f766e] text-white transition cursor-pointer"
              >
                إعادة المحاولة / Retry
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold border border-slate-300 dark:border-[#1E3646] hover:border-[#0d9488] transition cursor-pointer"
              >
                تحديث الصفحة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
