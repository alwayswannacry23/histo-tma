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
  Palette,
  Sun,
  Moon,
} from 'lucide-react';
import { useTelegram } from '../telegram/TelegramContext';
import { useAppTheme, ACCENT_PRESETS, AccentPresetId } from '../theme/ThemeContext';
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
  const { accent, setAccent, mode, setMode } = useAppTheme();
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
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] pb-28 safe-pt transition-colors duration-200">
      {/* Header */}
      <header className="px-5 pt-4 pb-2">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
          Профиль студента
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
          Статистика подготовки, темы оформления и рефералы
        </p>
      </header>

      <main className="px-5 pt-2 space-y-4 max-w-lg mx-auto">
        {/* User Card */}
        <div className="bg-[var(--bg-card)] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary)] text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-[var(--accent-shadow)]">
              {user.first_name ? user.first_name[0] : <User className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                {user.first_name} {user.last_name || ''}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--text-muted)]">
                  {user.username ? `@${user.username}` : `ID: ${user.id}`}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Студент меда
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-card)] rounded-[22px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-[var(--border-subtle)] space-y-1">
            <div className="flex items-center gap-2 text-[var(--accent-primary)]">
              <Award className="w-5 h-5" />
              <span className="text-xs font-semibold text-[var(--text-muted)]">Освоено</span>
            </div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)]">
              {masteredCount} <span className="text-xs font-normal text-[var(--text-muted)]">/ {totalSlides}</span>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-[22px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-[var(--border-subtle)] space-y-1">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="w-5 h-5 fill-orange-500" />
              <span className="text-xs font-semibold text-[var(--text-muted)]">Ударный режим</span>
            </div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)]">
              3 дня <span className="text-xs font-normal text-[var(--text-muted)]">подряд</span>
            </div>
          </div>
        </div>

        {/* Theme Picker Widget */}
        <div className="bg-[var(--bg-card)] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Тема оформления
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Акцент и режим отображения
                </p>
              </div>
            </div>

            {/* Light / Dark Mode Toggle */}
            <div className="flex items-center bg-[var(--bg-page)] p-1 rounded-full border border-[var(--border-subtle)]">
              <button
                onClick={() => {
                  hapticFeedback.selectionChanged();
                  setMode('light');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  mode === 'light'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Светлая тема"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden xs:inline">Светлая</span>
              </button>
              <button
                onClick={() => {
                  hapticFeedback.selectionChanged();
                  setMode('dark');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  mode === 'dark'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Тёмная тема"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xs:inline">Тёмная</span>
              </button>
            </div>
          </div>

          {/* 5 Accent Presets Chips */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-[var(--text-muted)] px-0.5">
              Цветовой акцент:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(ACCENT_PRESETS) as AccentPresetId[]).map((key) => {
                const preset = ACCENT_PRESETS[key];
                const isSelected = accent === key;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      hapticFeedback.selectionChanged();
                      setAccent(preset.id);
                    }}
                    className={`p-2.5 rounded-2xl text-left transition-all duration-200 flex items-center justify-between border active:scale-98 ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] shadow-xs ring-1 ring-[var(--accent-primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-page)]/50 hover:bg-[var(--bg-page)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-5 h-5 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white"
                        style={{ backgroundColor: preset.primary }}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {preset.name}
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : preset.soft,
                        color: mode === 'dark' ? '#F8FAFC' : preset.softText,
                      }}
                    >
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PRO Banner */}
        <div
          onClick={onOpenPaywall}
          className="bg-[var(--accent-primary)] rounded-[24px] p-5 text-white shadow-lg shadow-[var(--accent-shadow)] cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
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
              <p className="text-xs text-white/90 max-w-[220px]">
                Пищеварительная и мочевыделительная системы, тесты ГОС
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white text-[var(--accent-primary)] flex items-center justify-center shrink-0 shadow-md">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Referral Card */}
        <div className="bg-[var(--bg-card)] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-[var(--border-subtle)] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Пригласи одногруппника
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Поделись ссылкой на бота и получи +1 модуль бесплатно
              </p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[var(--bg-page)] py-2.5 px-3.5 rounded-xl text-xs text-[var(--text-primary)] font-mono truncate select-all border border-[var(--border-subtle)]">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] shadow-sm'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="w-full py-3 bg-[var(--bg-page)] hover:bg-slate-200/50 dark:hover:bg-slate-800 text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5 border border-[var(--border-subtle)]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Переслать в чат группы</span>
          </button>
        </div>

        {/* Reset Progress */}
        <div className="pt-2 text-center">
          <button
            onClick={handleResetClick}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-rose-500 transition-colors py-2 px-3 rounded-xl active:bg-rose-500/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить прогресс изучения препаратов</span>
          </button>
        </div>
      </main>
    </div>
  );
};
