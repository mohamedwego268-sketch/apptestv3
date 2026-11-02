import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminPortal from './features/AdminPortal.tsx';
import { AppErrorBoundary } from './components/ErrorBoundary.tsx';
import { MasterControllerProvider } from './services/MasterAppController.ts';
import './index.css';
import './nekbaar-visual-quality.css';

const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    {isAdminRoute ? (
      <AdminPortal />
    ) : (
      <MasterControllerProvider>
        <App />
      </MasterControllerProvider>
    )}
  </AppErrorBoundary>
);
