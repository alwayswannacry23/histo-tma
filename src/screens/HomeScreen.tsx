import React from 'react';
import { Zap, Lock, ChevronRight, CheckCircle2, BookOpen } from 'lucide-react';
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
  onOpenCheatSheets,
}) => {
  const { user, hapticFeedback } = useTelegram();

  // Statistics calculation
  const totalSlidesCount = slides.length;
  const masteredSlidesCount = slides.filter(
    (s) => progress[s.id]?.status === 'mastered'
  ).length;
  const progressPercent = totalSlidesCount > 0 
    ? Math.round((masteredSlidesCount / totalSlidesCount) * 100) 
    : 0;

  const handleModuleClick = (mod: Module) => {
    if (mod.is_free) {
      hapticFeedback.impactOccurred('light');
      onStartModule(mod.id);
    } else {
      hapticFeedback.impactOccurred('medium');
      onOpenPaywall(mod.title);
    }
  };

  const handleSpeedrunClick = () => {
    hapticFeedback.impactOccurred('heavy');
    onStartSpeedrun();
  };

  return (
    <div className="min-h-screen bg-white pb-24 safe-pt">
      {/* Header */}
      <header className="px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Гистология • Экзамен
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {user.first_name ? `Привет, ${user.first_name}` : 'Каталог модулей'}
            </h1>
          </div>
          <button 
            onClick={onOpenCheatSheets}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <BookOpen strokeWidth={1.5} className="w-4 h-4 text-blue-600" />
            <span>Атлас</span>
          </button>
        </div>
      </header>

      <main className="px-5 pt-5 space-y-6">
        {/* Progress Card */}
        <section className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-medium text-slate-500">Общий прогресс освоения</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {masteredSlidesCount} из {totalSlidesCount} препаратов{' '}
                <span className="text-sm font-normal text-slate-500">({progressPercent}%)</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 strokeWidth={1.5} className="w-5 h-5" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-200/60">
            <span>Интервальное повторение: активно</span>
            <span>Готовы к сдаче: {masteredSlidesCount}</span>
          </div>
        </section>

        {/* Speedrun Primary CTA */}
        <section>
          <button
            onClick={handleSpeedrunClick}
            className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white p-4 rounded-2xl flex items-center justify-between transition-all shadow-sm group"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                <Zap strokeWidth={1.5} className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <div className="font-semibold text-sm tracking-tight text-white">
                  Спидран (15 случайных препаратов)
                </div>
                <div className="text-xs text-slate-300">
                  Экспресс-диагностика на время к коллоквиуму
                </div>
              </div>
            </div>
            <ChevronRight strokeWidth={1.5} className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </section>

        {/* Modules List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Учебные модули
            </h2>
            <span className="text-xs text-slate-400">{modules.length} курса</span>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => {
              const moduleSlides = slides.filter((s) => s.module_id === mod.id);
              const moduleMastered = moduleSlides.filter(
                (s) => progress[s.id]?.status === 'mastered'
              ).length;
              const hasSlides = moduleSlides.length > 0;

              return (
                <div
                  key={mod.id}
                  onClick={() => handleModuleClick(mod)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    mod.is_free
                      ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm active:bg-slate-50'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-slate-900 tracking-tight">
                          {mod.title}
                        </h3>
                        {mod.is_free ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                            Бесплатно
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full flex items-center gap-1">
                            <Lock strokeWidth={1.5} className="w-2.5 h-2.5" /> PRO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    <div className="shrink-0 text-slate-400 mt-1">
                      {mod.is_free ? (
                        <ChevronRight strokeWidth={1.5} className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Lock strokeWidth={1.5} className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Progress indicator per module */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {hasSlides
                        ? `${moduleMastered} из ${moduleSlides.length} препаратов освоено`
                        : 'Материалы формируются'}
                    </span>
                    {hasSlides && (
                      <span className="font-medium text-slate-700">
                        {Math.round((moduleMastered / moduleSlides.length) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
