import React, { useState } from 'react';
import {
  User,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Share2,
  Lock,
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

  const referralBotUsername = 'histology_exam_bot';
  const referralLink = `https://t.me/${referralBotUsername}?start=ref_${user.id}`;

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
    <div className="min-h-screen bg-white pb-28 safe-pt">
      {/* Header */}
      <header className="px-5 pt-4 pb-3 border-b border-slate-100">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Аккаунт студента
        </span>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Профиль и доступ
        </h1>
      </header>

      <main className="px-5 pt-5 space-y-6">
        {/* User Info Card */}
        <section className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {user.first_name ? user.first_name[0] : <User className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
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

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Текущий статус
              </div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Базовый доступ</span>
              </div>
            </div>
            <button
              onClick={onOpenPaywall}
              className="py-1.5 px-3 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Сессия PRO</span>
            </button>
          </div>
        </section>

        {/* Study Stats Matrix */}
        <section className="space-y-2">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Статистика подготовки
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <div className="text-xl font-bold text-emerald-600">{masteredCount}</div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">Освоено</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <div className="text-xl font-bold text-amber-600">{reviewingCount}</div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">Повторение</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <div className="text-xl font-bold text-slate-700">{learningCount}</div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">В процессе</div>
            </div>
          </div>
        </section>

        {/* Referral Program */}
        <section className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Share2 strokeWidth={1.5} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Реферальная программа
              </h3>
              <p className="text-[11px] text-slate-500">
                Пригласи 2 одногруппников и получи доступ PRO бесплатно
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 pl-3">
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
        </section>

        {/* PRO Access Banner */}
        <section className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Lock strokeWidth={1.5} className="w-3 h-3" /> Полный тариф
            </span>
            <span className="text-xs font-semibold text-slate-300">199 Stars</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Пакет «Сессия Без Пересдач»</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Открывает пищеварительную, мочевыделительную, нервную системы и генератор экзаменационных билетов.
            </p>
          </div>
          <button
            onClick={onOpenPaywall}
            className="w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
          >
            Подробнее о тарифе
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
