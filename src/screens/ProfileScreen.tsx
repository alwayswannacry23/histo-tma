import React, { useState } from 'react';
import {
  User,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Share2,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { useTelegram } from '../telegram/TelegramContext';
import { UserProgress, Slide } from '../types';

interface ProfileScreenProps {
  slides: Slide[];
  progress: Record<string, UserProgress>;
  onOpenPaywall: () => void;
  onResetProgress: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  slides,
  progress,
  onOpenPaywall,
  onResetProgress,
}) => {
  const { user, copyToClipboard, hapticFeedback } = useTelegram();
  const [copied, setCopied] = useState(false);

  const totalSlides = slides.length;
  const masteredCount = slides.filter((s) => progress[s.id]?.status === 'mastered').length;

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'baza_med_bot';
  const referralLink = `https://t.me/${botUsername}?start=ref_${user.id}`;

  const handleCopyLink = async () => {
    hapticFeedback.impactOccurred('light');
    const success = await copyToClipboard(referralLink);
    if (success) {
      setCopied(true);
      hapticFeedback.notificationOccurred('success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    hapticFeedback.impactOccurred('medium');
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink
    )}&text=${encodeURIComponent(
      'Тренажер препаратов по гистологии для медицинского вуза с микропрепаратами!'
    )}`;
    window.open(shareUrl, '_blank');
  };

  const handleResetClick = () => {
    hapticFeedback.notificationOccurred('warning');
    if (confirm('Сбросить весь сохраненный прогресс препаратов?')) {
      onResetProgress();
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-28 safe-pt">
      {/* Header */}
      <header className="px-5 pt-4 pb-2">
        <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 leading-tight">
          Профиль студента
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Статистика подготовки и реферальная программа
        </p>
      </header>

      <main className="px-5 pt-2 space-y-4 max-w-lg mx-auto">
        {/* User Card */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-indigo-600/25">
              {user.first_name ? user.first_name[0] : <User className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {user.first_name} {user.last_name || ''}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">
                  {user.username ? `@${user.username}` : `ID: ${user.id}`}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Студент меда
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[22px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0 space-y-1">
            <div className="flex items-center gap-2 text-indigo-600">
              <Award className="w-5 h-5" />
              <span className="text-xs font-semibold text-slate-400">Освоено</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {masteredCount} <span className="text-xs font-normal text-slate-400">/ {totalSlides}</span>
            </div>
          </div>

          <div className="bg-white rounded-[22px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0 space-y-1">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="w-5 h-5 fill-orange-500" />
              <span className="text-xs font-semibold text-slate-400">Ударный режим</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              3 дня <span className="text-xs font-normal text-slate-400">подряд</span>
            </div>
          </div>
        </div>

        {/* PRO Banner */}
        <div
          onClick={onOpenPaywall}
          className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-[24px] p-5 text-white shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Все 4 модуля</span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1">
                Полный доступ к Атласу
              </h3>
              <p className="text-xs text-indigo-100/90 max-w-[220px]">
                Пищеварительная и мочевыделительная системы, тесты ГОС
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-md">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">
                Пригласи одногруппника
              </h3>
              <p className="text-xs text-slate-400">
                Поделись ссылкой на бота и получи +1 модуль бесплатно
              </p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#F8FAFC] py-2.5 px-3.5 rounded-xl text-xs text-slate-600 font-mono truncate select-all">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="w-full py-3 bg-[#F2F4F7] hover:bg-slate-200/70 text-slate-800 rounded-xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Переслать в чат группы</span>
          </button>
        </div>

        {/* Reset Progress */}
        <div className="pt-2 text-center">
          <button
            onClick={handleResetClick}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 transition-colors py-2 px-3 rounded-xl active:bg-rose-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить прогресс изучения препаратов</span>
          </button>
        </div>
      </main>
    </div>
  );
};
