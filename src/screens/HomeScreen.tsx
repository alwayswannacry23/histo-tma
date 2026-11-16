import React from 'react';
import {
  Zap,
  Lock,
  ChevronRight,
  Wind,
  Layers,
  Utensils,
  Activity,
  Flame,
  CheckCircle2,
  Sparkles,
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

  const totalSlides = slides.length;
  const masteredCount = slides.filter((s) => progress[s.id]?.status === 'mastered').length;
  const reviewingCount = slides.filter((s) => progress[s.id]?.status === 'reviewing').length;
  const progressPercent = totalSlides > 0 ? Math.round((masteredCount / totalSlides) * 100) : 0;

  // Custom module style metadata matching prompt requirements
  const getModuleVisuals = (id: string) => {
    switch (id) {
      case 'mod_epithelium':
        return {
          icon: Layers,
          boxClass: 'bg-violet-50 text-violet-600',
        };
      case 'mod_resp':
        return {
          icon: Wind,
          boxClass: 'bg-sky-50 text-sky-600',
        };
      case 'mod_digestive':
        return {
          icon: Utensils,
          boxClass: 'bg-amber-50 text-amber-600',
        };
      case 'mod_urinary':
        return {
          icon: Activity,
          boxClass: 'bg-rose-50 text-rose-600',
        };
      default:
        return {
          icon: Layers,
          boxClass: 'bg-indigo-50 text-indigo-600',
        };
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
    hapticFeedback.impactOccurred('heavy');
    onStartSpeedrun();
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] text-slate-900 pb-28 safe-pt">
      {/* Top Greeting Header */}
      <header className="px-5 pt-4 pb-2">
        <div className="text-xs font-semibold text-slate-500 tracking-tight flex items-center gap-1.5">
          <span>Привет, {user.first_name || 'доктор'}</span>
          <span className="inline-block animate-wave">👋</span>
        </div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 leading-tight mt-0.5">
          Гистология
        </h1>
      </header>

      <main className="px-5 pt-2 space-y-4 max-w-lg mx-auto">
        {/* Bento Hero Progress Card (T-Bank style) */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                Готовность к ГОСам
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {progressPercent}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {masteredCount} из {totalSlides} микропрепаратов
                </span>
              </div>
            </div>

            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" strokeWidth={1.75} />
            </div>
          </div>

          {/* Thick smooth progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(4, progressPercent)}%` }}
            />
          </div>

          {/* Mini-Stats Pill Badges */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span>3 дня ударный режим</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Повторений: {reviewingCount}</span>
            </div>
          </div>
        </div>

        {/* Big Juicy CTA Button (Duolingo / Tinkoff style) */}
        <button
          onClick={handleSpeedrun}
          className="w-full py-4 px-5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-[22px] shadow-lg shadow-indigo-600/25 flex items-center justify-between transition-all duration-200"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div className="text-left">
              <div className="text-base font-bold leading-tight">Начать тренировку</div>
              <div className="text-xs text-indigo-100/90 leading-tight mt-0.5">
                Случайные препараты и распознавание
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
        </button>

        {/* Modules Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Разделы атласа
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {modules.length} модуля
            </span>
          </div>

          <div className="space-y-2.5">
            {modules.map((mod) => {
              const modSlides = slides.filter((s) => s.module_id === mod.id);
              const modMastered = modSlides.filter(
                (s) => progress[s.id]?.status === 'mastered'
              ).length;
              const hasSlides = modSlides.length > 0;
              const visual = getModuleVisuals(mod.id);
              const Icon = visual.icon;

              return (
                <div
                  key={mod.id}
                  onClick={() => handleModuleClick(mod)}
                  className="bg-white rounded-[22px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3.5 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-[44px] h-[44px] rounded-2xl flex items-center justify-center shrink-0 ${visual.boxClass}`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {mod.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {hasSlides
                          ? `${modSlides.length} препарата • ${modMastered} изучено`
                          : 'В разработке кафедры'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {mod.is_free ? (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        Бесплатно
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        PRO
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
