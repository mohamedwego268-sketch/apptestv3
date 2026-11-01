import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

function getSafeDiagnostic(message: string | null): string {
  if (!message) return 'Unexpected runtime error';
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, '[email]')
    .replace(/\\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\b/gi, '[id]')
    .replace(/https?:\\/\\/\\S+/gi, '[url]')
    .replace(/\\beyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\b/g, '[token]')
    .slice(0, 180);
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
    console.error('Nekbaar UI render failure:', error);
  }

  handleResetAndRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const diagnostic = getSafeDiagnostic(this.state.errorMessage);

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
            <div className="space-y-2">
              <h1 className="text-lg font-black">
                واجه التطبيق مشكلة أثناء عرض الصفحة
              </h1>
              <p className="text-xs font-semibold text-slate-600 dark:text-[#CBD5E1] leading-relaxed">
                لم يتم حذف بيانات الأسرة بسبب ظهور هذه الشاشة. أعد تشغيل التطبيق، وإذا تكررت المشكلة أرسل لنا رمز التشخيص التالي.
              </p>
              <div
                dir="ltr"
                data-testid="app-error-diagnostic"
                className="rounded-lg bg-slate-100 dark:bg-[#0B141A] px-3 py-2 text-left text-[11px] font-mono text-slate-700 dark:text-slate-300 break-words"
              >
                {diagnostic}
              </div>
            </div>
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={this.handleResetAndRetry}
                className="min-h-[48px] px-5 py-2.5 rounded-xl text-xs font-black bg-[#0d9488] hover:bg-[#0f766e] text-white transition cursor-pointer"
              >
                إعادة تشغيل التطبيق
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
