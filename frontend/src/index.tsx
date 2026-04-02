
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                className: 'glass-card border-surface-border text-text-main font-black text-xs uppercase tracking-widest',
                style: {
                  background: 'var(--surface-glass)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--surface-border)',
                  backdropFilter: 'blur(16px)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--brand-tertiary)',
                    secondary: '#070d1f',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'var(--brand-secondary)',
                    secondary: '#070d1f',
                  },
                },
              }}
            />
            <App />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
