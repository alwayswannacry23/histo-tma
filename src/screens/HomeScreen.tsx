import React from 'react';
import {
  Zap,
  Lock,
  ChevronRight,
  Wind,
  Layers,
  Utensils,
  Activity,
  CheckCircle,
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

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'mod_resp':
        return <Wind className="w-5 h-5 text-slate-700" strokeWidth={1.5} />;
      case 'mod_digestive':
        return <Utensils className="w-5 h-5 text-slate-700" strokeWidth={1.5} />;
      case 'mod_urinary':
        return <Activity className="w-5 h-5 text-slate-700" strokeWidth={1.5} />;
      default:
        return <Layers className="w-5 h-5 text-slate-700" strokeWidth={1.5} />;
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
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-24 safe-pt">
      {/* Top Header */}
      <header className="px-5 pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Гистология
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {user.first_name ? `Студент: ${user.first_name}` : 'Тренажер к зачету и экзамену'}
        </p>
      </header>

      <main className="px-5 pt-3 space-y-4 max-w-lg mx-auto">
        {/* Readiness Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Готовность к зачету</span>
            <span className="text-sm font-bold text-slate-900">{progressPercent}%</span>
          </div>

          {/* Simple, readable linear progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(3, progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
              Выучено: <strong>{masteredCount}</strong> из {totalSlides}
            </span>
            <span>Повторение: {reviewingCount}</span>
          </div>
        </div>

        {/* Primary Action Button: Fast Workout */}
        <button
          onClick={handleSpeedrun}
          className="w-full h-13 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs flex items-center justify-between active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" strokeWidth={1.5} />
            <div className="text-left">
              <div className="text-sm font-semibold leading-tight">Быстрая тренировка</div>
              <div className="text-[11px] text-slate-400 leading-tight">Случайные препараты на время</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
        </button>

        {/* Modules Section */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-sm font-bold text-slate-900">Разделы</h2>
            <span className="text-xs text-slate-400">{modules.length} раздела</span>
          </div>

          <div className="space-y-2">
            {modules.map((mod) => {
              const modSlides = slides.filter((s) => s.module_id === mod.id);
              const modMastered = modSlides.filter(
                (s) => progress[s.id]?.status === 'mastered'
              ).length;
              const hasSlides = modSlides.length > 0;

              return (
                <div
                  key={mod.id}
                  onClick={() => handleModuleClick(mod)}
                  className="bg-white rounded-xl p-4 border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3 active:bg-slate-50"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {getModuleIcon(mod.id)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {mod.title}
                        </h3>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {hasSlides ? (
                          <span>
                            {modSlides.length} препарата • {modMastered} выучено
                          </span>
                        ) : (
                          <span>В разработке</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {mod.is_free ? (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Доступно
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-3 h-3" strokeWidth={1.5} /> PRO
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
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
