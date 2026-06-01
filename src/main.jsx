import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './app/components/ui/sonner';
import { router } from './app/routes';
import { AuthProvider } from './context/AuthContext';
import { ServerStateProvider } from './context/ServerStateContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ServerStateProvider>
            <RouterProvider router={router} />
            <Toaster />
          </ServerStateProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
