import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically register service worker and cache entire application for offline operation
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('FeedCalc Pro is ready for 100% offline usage.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
