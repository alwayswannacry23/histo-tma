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
    { id: 'home' as ScreenTab, label: 'Темы', icon: LayoutGrid },
    { id: 'trainer' as ScreenTab, label: 'Тренажер', icon: Microscope },
    { id: 'cheatsheets' as ScreenTab, label: 'Атлас', icon: BookOpen },
    { id: 'profile' as ScreenTab, label: 'Профиль', icon: User },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center safe-pb">
      <nav className="pointer-events-auto w-full max-w-md mx-auto rounded-full bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border-0 py-1.5 px-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-full transition-all duration-200 outline-none select-none active:scale-95 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon
                strokeWidth={isActive ? 2 : 1.75}
                className="w-5 h-5 shrink-0"
              />
              {isActive && (
                <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
