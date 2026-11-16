import React from 'react';
import ReactDOM from 'react-dom/client';
import { TelegramProvider } from './telegram/TelegramContext';
import { ThemeProvider } from './theme/ThemeContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <TelegramProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </TelegramProvider>
  </React.StrictMode>
);
