import React, { createContext, useContext, useEffect, useState } from 'react';
import { TelegramUser } from '../types';

interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TelegramContextValue {
  user: TelegramUser;
  isTelegram: boolean;
  themeParams: TelegramThemeParams;
  hapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  backButton: {
    show: (callback: () => void) => void;
    hide: () => void;
  };
  expand: () => void;
  close: () => void;
  openLink: (url: string) => void;
  copyToClipboard: (text: string) => Promise<boolean>;
}

const defaultMockUser: TelegramUser = {
  id: 742194812,
  first_name: 'Студент',
  last_name: 'Медик',
  username: 'med_student',
  photo_url: undefined,
};

const TelegramContext = createContext<TelegramContextValue | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser>(defaultMockUser);
  const [isTelegram, setIsTelegram] = useState(false);
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({
    bg_color: '#FFFFFF',
    text_color: '#0F172A',
    secondary_bg_color: '#F8FAFC',
    button_color: '#0F172A',
    button_text_color: '#FFFFFF',
  });

  useEffect(() => {
    // Check if running inside Telegram WebApp
    const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
    
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      setIsTelegram(true);
      const tgUser = tg.initDataUnsafe.user;
      setUser({
        id: tgUser.id,
        first_name: tgUser.first_name || 'Студент',
        last_name: tgUser.last_name,
        username: tgUser.username,
        language_code: tgUser.language_code,
        photo_url: tgUser.photo_url,
      });

      if (tg.themeParams) {
        setThemeParams(tg.themeParams);
      }

      tg.ready();
      tg.expand();

      if (typeof tg.disableVerticalSwipes === 'function') {
        try {
          tg.disableVerticalSwipes();
        } catch (e) {
          console.warn('Could not disable vertical swipes', e);
        }
      }

      // Configure Telegram header and background if available
      try {
        tg.setHeaderColor?.('#F2F4F7');
        tg.setBackgroundColor?.('#F2F4F7');
      } catch (e) {
        console.warn('Could not set TG header color', e);
      }

      // Synchronize Telegram safe areas with CSS variables for iOS devices
      const updateSafeAreas = () => {
        if (tg.contentSafeAreaInset?.top !== undefined) {
          const topInset = Math.max(56, tg.contentSafeAreaInset.top);
          document.documentElement.style.setProperty(
            '--tg-content-safe-area-inset-top',
            `${topInset}px`
          );
        }
        if (tg.safeAreaInset?.top !== undefined) {
          document.documentElement.style.setProperty(
            '--tg-safe-area-inset-top',
            `${tg.safeAreaInset.top}px`
          );
        }
      };

      updateSafeAreas();
      try {
        tg.onEvent?.('contentSafeAreaChanged', updateSafeAreas);
        tg.onEvent?.('safeAreaChanged', updateSafeAreas);
      } catch {
        // ignore
      }
    } else {
      // Browser fallback mode
      console.log('Running in browser development mode with mock Telegram user:', defaultMockUser);
    }
  }, []);

  const backButton = {
    show: (callback: () => void) => {
      const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
      if (tg?.BackButton) {
        tg.BackButton.show();
        // Remove previous callbacks to prevent stacking
        tg.BackButton.offClick?.(callback);
        tg.BackButton.onClick(callback);
      }
    },
    hide: () => {
      const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
      if (tg?.BackButton) {
        tg.BackButton.hide();
      }
    },
  };

  const hapticFeedback = {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
      const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        try {
          tg.HapticFeedback.impactOccurred(style);
          return;
        } catch {
          // ignore
        }
      }
      // Browser fallback using vibration API if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(style === 'heavy' ? 25 : style === 'medium' ? 15 : 8);
        } catch {
          // ignore
        }
      }
    },
    notificationOccurred: (type: 'error' | 'success' | 'warning') => {
      const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        try {
          tg.HapticFeedback.notificationOccurred(type);
          return;
        } catch {
          // ignore
        }
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(type === 'error' ? [30, 50, 30] : [15, 30, 15]);
        } catch {
          // ignore
        }
      }
    },
    selectionChanged: () => {
      const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        try {
          tg.HapticFeedback.selectionChanged();
          return;
        } catch {
          // ignore
        }
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(5);
        } catch {
          // ignore
        }
      }
    },
  };

  const expand = () => {
    const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
    tg?.expand?.();
  };

  const close = () => {
    const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
    tg?.close?.();
  };

  const openLink = (url: string) => {
    const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
    if (tg?.openTelegramLink && url.includes('t.me/')) {
      tg.openTelegramLink(url);
    } else if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        hapticFeedback.notificationOccurred('success');
        return true;
      }
    } catch {
      // fallback
    }
    return false;
  };

  return (
    <TelegramContext.Provider
      value={{
        user,
        isTelegram,
        themeParams,
        hapticFeedback,
        backButton,
        expand,
        close,
        openLink,
        copyToClipboard,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};
