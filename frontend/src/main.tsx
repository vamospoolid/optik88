import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import './pwa';
import App from './App.tsx';
import { useAuthStore } from './store/useAuthStore';

// Initialize session auth from localstorage
useAuthStore.getState().initialize();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive automatic re-queries on window focus
      retry: 1, // Only retry failed requests once
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
