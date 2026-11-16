import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Share2,
  Lock,
  ArrowRight,
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

  // Compute stats
  const masteredCount = slides.filter((s) => progress[s.id]?.status === 'mastered').length;
  const reviewingCount = slides.filter((s) => progress[s.id]?.status === 'reviewing').length;
  const learningCount = slides.filter((s) => progress[s.id]?.status === 'learning').length;

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'baza_med_bot';
  const referralLink = `https://t.me/${botUsername}?start=ref_${user.id}`;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(referralLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetClick = () => {
    hapticFeedback.notificationOccurred('warning');
    if (confirm('Сбросить весь сохраненный прогресс препаратов?')) {
      onResetProgress();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-28 safe-pt">
      {/* Header */}
      <header className="px-5 pt-3 pb-2">
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
          Профиль
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Статистика подготовки и реферальная программа
        </p>
      </header>

      <main className="px-5 pt-4 space-y-4 max-w-lg mx-auto">
        {/* User Card */}
        <section className="bg-white rounded-3xl p-5 shadow-ios">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {user.first_name ? user.first_name[0] : <User className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {user.first_name} {user.last_name || ''}
              </h2>
              {user.username && (
                <div className="text-xs text-slate-400 mt-0.5">@{user.username}</div>
              )}
              <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                ID: {user.id}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Статус аккаунта</div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Базовый доступ</span>
              </div>
            </div>
            <button
              onClick={onOpenPaywall}
              className="py-2 px-3.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Сессия PRO</span>
            </button>
          </div>
        </section>

        {/* Study Stats Matrix */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 px-1">
            Матрица подготовки
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white p-4 rounded-2xl shadow-ios text-center">
              <div className="text-2xl font-bold text-emerald-600">{masteredCount}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Освоено</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-ios text-center">
              <div className="text-2xl font-bold text-amber-500">{reviewingCount}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Повторение</div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-ios text-center">
              <div className="text-2xl font-bold text-slate-700">{learningCount}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">В процессе</div>
            </div>
          </div>
        </section>

        {/* Referral Program */}
        <section className="bg-white rounded-3xl p-5 shadow-ios space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Share2 strokeWidth={1.5} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Пригласи одногруппника
              </h3>
              <p className="text-xs text-slate-400 leading-snug">
                Поделитесь тренажером и получите полный PRO-доступ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#F4F5F7] rounded-2xl p-2 pl-3">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="bg-transparent text-xs text-slate-700 w-full focus:outline-none font-mono truncate"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              {copied ? (
                <>
                  <Check strokeWidth={1.5} className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <Copy strokeWidth={1.5} className="w-3.5 h-3.5" />
                  <span>Копия</span>
                </>
              )}
            </motion.button>
          </div>
        </section>

        {/* PRO Access Card */}
        <section className="bg-slate-900 text-white rounded-3xl p-5 space-y-3 shadow-[0_8px_30px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
              <Lock strokeWidth={1.5} className="w-3 h-3" /> Полный тариф
            </span>
            <span className="text-xs font-semibold text-slate-300">199 Stars</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Пакет «Сессия Без Пересдач»
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Открывает 50+ препаратов, пищеварительную, мочевыделительную системы и симулятор практического зачета.
            </p>
          </div>
          <button
            onClick={onOpenPaywall}
            className="w-full py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Подробнее о тарифе</span>
            <ArrowRight strokeWidth={1.5} className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* Developer Reset Helper */}
        <section className="pt-2 text-center">
          <button
            onClick={handleResetClick}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 transition-colors"
          >
            <RotateCcw strokeWidth={1.5} className="w-3.5 h-3.5" />
            <span>Сбросить тестовый прогресс (DEV)</span>
          </button>
        </section>
      </main>
    </div>
  );
};
