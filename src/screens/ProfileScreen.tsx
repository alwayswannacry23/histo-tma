import React, { useState } from 'react';
import {
  User,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Share2,
  Lock,
  ChevronRight,
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
    <div className="min-h-screen bg-[#F8F9FA] pb-24 safe-pt">
      {/* Header */}
      <header className="px-5 pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Профиль
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Статистика подготовки и реферальная программа
        </p>
      </header>

      <main className="px-5 pt-3 space-y-4 max-w-lg mx-auto">
        {/* User Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base">
              {user.first_name ? user.first_name[0] : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {user.first_name} {user.last_name || ''}
              </h2>
              {user.username && (
                <div className="text-xs text-slate-500 mt-0.5">@{user.username}</div>
              )}
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                ID: {user.id}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Статус аккаунта</div>
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Базовый доступ</span>
              </div>
            </div>
            <button
              onClick={onOpenPaywall}
              className="py-1.5 px-3 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 active:scale-98"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Сессия PRO</span>
            </button>
          </div>
        </div>

        {/* Study Stats Matrix */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-0.5">
            Матрица подготовки
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-xl font-bold text-emerald-600">{masteredCount}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Освоено</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-xl font-bold text-amber-600">{reviewingCount}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Повторение</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs text-center">
              <div className="text-xl font-bold text-slate-700">{learningCount}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">В процессе</div>
            </div>
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Share2 strokeWidth={1.5} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Пригласи одногруппника
              </h3>
              <p className="text-[11px] text-slate-500">
                Поделитесь ссылкой и получите PRO-доступ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 pl-3">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="bg-transparent text-xs text-slate-700 w-full focus:outline-none font-mono truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
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
            </button>
          </div>
        </div>

        {/* PRO Access Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Lock strokeWidth={1.5} className="w-3 h-3" /> Полный тариф
            </span>
            <span className="text-xs font-semibold text-slate-300">199 Stars</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Пакет «Сессия Без Пересдач»
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Открывает 50+ препаратов всех систем органов и генератор экзаменационных билетов.
            </p>
          </div>
          <button
            onClick={onOpenPaywall}
            className="w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 active:scale-99"
          >
            <span>Подробнее о тарифе</span>
            <ChevronRight strokeWidth={1.5} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Developer Reset Helper */}
        <div className="pt-2 text-center">
          <button
            onClick={handleResetClick}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 transition-colors"
          >
            <RotateCcw strokeWidth={1.5} className="w-3.5 h-3.5" />
            <span>Сбросить прогресс (DEV)</span>
          </button>
        </div>
      </main>
    </div>
  );
};
