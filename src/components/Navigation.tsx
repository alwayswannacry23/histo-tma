import React from 'react';
import { LayoutGrid, Microscope, BookOpen, User } from 'lucide-react';
import { useTelegram } from '../telegram/TelegramContext';

export type ScreenTab = 'home' | 'trainer' | 'cheatsheets' | 'profile';

interface NavigationProps {
  currentTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const { hapticFeedback } = useTelegram();

  const handleTabClick = (tab: ScreenTab) => {
    if (tab !== currentTab) {
      hapticFeedback.selectionChanged();
      onTabChange(tab);
    }
  };

  const navItems = [
    { id: 'home' as ScreenTab, label: 'Модули', icon: LayoutGrid },
    { id: 'trainer' as ScreenTab, label: 'Тренажер', icon: Microscope },
    { id: 'cheatsheets' as ScreenTab, label: 'Атлас', icon: BookOpen },
    { id: 'profile' as ScreenTab, label: 'Профиль', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 safe-pb">
      <nav className="max-w-md mx-auto grid grid-cols-4 px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className="flex flex-col items-center justify-center py-1.5 transition-colors relative outline-none"
            >
              <Icon
                strokeWidth={1.5}
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-slate-900' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-[11px] mt-1 tracking-tight leading-none transition-colors ${
                  isActive ? 'font-semibold text-slate-900' : 'font-normal text-slate-400'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 bg-slate-900 rounded-full mt-1" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
