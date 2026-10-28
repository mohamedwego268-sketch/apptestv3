import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/ErrorBoundary.tsx';
import { MasterControllerProvider } from './services/MasterAppController.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <MasterControllerProvider>
      <App />
    </MasterControllerProvider>
  </AppErrorBoundary>
);
