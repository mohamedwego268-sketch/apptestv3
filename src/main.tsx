import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminPortal from './features/AdminPortal.tsx';
import VendorPortal from './features/VendorPortal.tsx';
import { AppErrorBoundary } from './components/ErrorBoundary.tsx';
import { MasterControllerProvider } from './services/MasterAppController.ts';
import './index.css';
import './nekbaar-visual-quality.css';

const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');
const isVendorRoute = window.location.pathname === '/partner' || window.location.pathname.startsWith('/partner/');

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    {isAdminRoute ? (
      <AdminPortal />
    ) : isVendorRoute ? (
      <VendorPortal />
    ) : (
      <MasterControllerProvider>
        <App />
      </MasterControllerProvider>
    )}
  </AppErrorBoundary>
);
