import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import './styles.css';

// Clear any lingering service workers or stale caches to ensure fresh data loads
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const r of registrations) r.unregister();
  }).catch(() => {});
  if ('caches' in window) {
    caches.keys().then(keys => {
      for (const k of keys) caches.delete(k);
    }).catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </BrowserRouter>
);
