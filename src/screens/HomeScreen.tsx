import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Lock,
  Wind,
  Layers,
  Utensils,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Module, Slide, UserProgress } from '../types';
import { useTelegram } from '../telegram/TelegramContext';

interface HomeScreenProps {
  modules: Module[];
  slides: Slide[];
  progress: Record<string, UserProgress>;
  onStartModule: (moduleId: string) => void;
  onStartSpeedrun: () => void;
  onOpenPaywall: (moduleName: string) => void;
  onOpenCheatSheets: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  modules,
  slides,
  progress,
  onStartModule,
  onStartSpeedrun,
  onOpenPaywall,
}) => {
  const { user, hapticFeedback } = useTelegram();

  // Statistics calculation
  const totalSlides = slides.length;
  const masteredCount = slides.filter((s) => progress[s.id]?.status === 'mastered').length;
  const reviewingCount = slides.filter((s) => progress[s.id]?.status === 'reviewing').length;
  const progressPercent = totalSlides > 0 ? Math.round((masteredCount / totalSlides) * 100) : 0;

  // SVG Circular Ring Progress parameters
  const ringSize = 68;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'mod_resp':
        return <Wind className="w-5 h-5 text-sky-600" strokeWidth={1.5} />;
      case 'mod_digestive':
        return <Utensils className="w-5 h-5 text-amber-600" strokeWidth={1.5} />;
      case 'mod_urinary':
        return <Activity className="w-5 h-5 text-indigo-600" strokeWidth={1.5} />;
      default:
        return <Layers className="w-5 h-5 text-blue-600" strokeWidth={1.5} />;
    }
  };

  const getModuleBg = (id: string) => {
    switch (id) {
      case 'mod_resp':
        return 'bg-sky-50 text-sky-700';
      case 'mod_digestive':
        return 'bg-amber-50 text-amber-700';
      case 'mod_urinary':
        return 'bg-indigo-50 text-indigo-700';
      default:
        return 'bg-blue-50 text-blue-700';
    }
  };

  const handleModuleClick = (mod: Module) => {
    if (mod.is_free) {
      hapticFeedback.impactOccurred('light');
      onStartModule(mod.id);
    } else {
      hapticFeedback.impactOccurred('medium');
      onOpenPaywall(mod.title);
    }
  };

  const handleSpeedrun = () => {
    hapticFeedback.impactOccurred('medium');
    onStartSpeedrun();
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 pb-28 safe-pt">
      {/* Top Header */}
      <header className="px-5 pt-3 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
            {user.first_name ? `Привет, ${user.first_name}` : 'Гистология'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Подготовка к практическому зачету
          </p>
        </div>
      </header>

      <main className="px-5 pt-4 space-y-4 max-w-lg mx-auto">
        {/* Compact Hero Block with Ring Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center gap-4">
            {/* SVG Circular Progress Ring */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg width={ringSize} height={ringSize} className="transform -rotate-90">
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke="#0F172A"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-slate-900 leading-none">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="flex-1 space-y-1">
              <div className="text-base font-bold text-slate-900 leading-tight">
                {masteredCount} из {totalSlides} препаратов
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                {masteredCount === totalSlides && totalSlides > 0
                  ? 'Все препараты успешно освоены!'
                  : 'Освоено на отлично для сдачи зачета'}
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {masteredCount} выучено
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {reviewingCount} на повторе
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* High-Impact Tactical CTA Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSpeedrun}
          className="w-full bg-slate-900 text-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(15,23,42,0.15)] flex items-center justify-between text-left transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Zap strokeWidth={1.5} className="w-5 h-5 fill-amber-300" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white">
                Быстрая тренировка
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Случайная выборка микропрепаратов
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80">
            <ArrowRight strokeWidth={1.5} className="w-4 h-4" />
          </div>
        </motion.button>

        {/* Modules Section */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Разделы атласа
            </h2>
            <span className="text-xs font-medium text-slate-400">
              {modules.length} курса
            </span>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => {
              const modSlides = slides.filter((s) => s.module_id === mod.id);
              const modMastered = modSlides.filter(
                (s) => progress[s.id]?.status === 'mastered'
              ).length;
              const hasSlides = modSlides.length > 0;
              const modPercent = hasSlides
                ? Math.round((modMastered / modSlides.length) * 100)
                : 0;

              return (
                <motion.div
                  key={mod.id}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleModuleClick(mod)}
                  className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      {/* System/Organ Icon */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${getModuleBg(
                          mod.id
                        )}`}
                      >
                        {getModuleIcon(mod.id)}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 leading-snug">
                            {mod.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      {mod.is_free ? (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Доступно
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Lock strokeWidth={1.5} className="w-3 h-3" /> PRO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Module Progress Bar */}
                  {hasSlides && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Прогресс изучения</span>
                        <span className="font-semibold text-slate-700">
                          {modMastered}/{modSlides.length} ({modPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, modPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
