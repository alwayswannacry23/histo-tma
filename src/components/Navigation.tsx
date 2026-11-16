import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pointer-events-none safe-pb">
      <nav className="max-w-sm mx-auto bg-white/90 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(15,23,42,0.12)] p-1.5 pointer-events-auto border border-white/60">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className="relative py-2.5 flex flex-col items-center justify-center transition-all outline-none rounded-full"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute inset-0 bg-slate-900 rounded-full"
                  />
                )}
                <div
                  className={`relative z-10 flex flex-col items-center transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon strokeWidth={1.5} className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-medium tracking-tight leading-none">
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
