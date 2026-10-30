import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoutes from './routes/AppRoutes';
import FirstVisitSplash from './components/FirstVisitSplash';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><FirstVisitSplash><AppRoutes /></FirstVisitSplash></React.StrictMode>);

// Installable shell only. The service worker never caches pages, Supabase, or admin data.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // The online website still works if service workers are unavailable.
    });
  });
}
