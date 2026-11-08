import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/ErrorBoundary.tsx';

const AdminPortal = lazy(() => import('./features/AdminPortal.tsx'));
const VendorPortal = lazy(() => import('./features/VendorPortal.tsx'));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" aria-hidden="true" />
        <span>جاري تحميل المساحة...</span>
      </div>
    </div>
  );
}
import { MasterControllerProvider } from './services/MasterAppController.ts';
import './index.css';
import './nekbaar-visual-quality.css';

const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
const isVendorRoute = window.location.pathname === '/partner' || window.location.pathname.startsWith('/partner/');

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <Suspense fallback={<RouteLoadingFallback />}>
      {isAdminRoute ? (
        <AdminPortal />
      ) : isVendorRoute ? (
        <VendorPortal />
      ) : (
        <MasterControllerProvider>
          <App />
        </MasterControllerProvider>
      )}
    </Suspense>
  </AppErrorBoundary>
);
