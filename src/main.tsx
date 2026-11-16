import React from 'react';
import ReactDOM from 'react-dom/client';
import { TelegramProvider } from './telegram/TelegramContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <TelegramProvider>
      <App />
    </TelegramProvider>
  </React.StrictMode>
);
