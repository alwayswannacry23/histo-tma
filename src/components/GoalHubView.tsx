import React from 'react';
import { ArrowRight, GraduationCap, Microscope, Sparkles, X } from 'lucide-react';
import { DIAGNOSTICS_CONFIG } from '../data/curriculumConfig';
import { DiagnosticId, StudyMode } from '../data/curriculumTypes';

interface GoalHubViewProps {
  currentMode: StudyMode | null;
  isDark: boolean;
  accentHex: string;
  textOnAccent: string;
  topInsetPx: number;
  diagProgress: Record<DiagnosticId, { done: number; total: number }>;
  examProgress: { done: number; total: number; emCount: number; questionsCount: number; tasksCount: number };
  onSelectMode: (mode: StudyMode) => void;
  onClose?: () => void;
}

export const GoalHubView: React.FC<GoalHubViewProps> = ({
  currentMode,
  isDark,
  accentHex,
  textOnAccent,
  topInsetPx,
  diagProgress,
  examProgress,
  onSelectMode,
  onClose,
}) => {
  const bg = isDark ? 'bg-[#09090B] text-white' : 'bg-[#F3F4F6] text-zinc-900';
  const card = isDark
    ? 'bg-[#141417] border border-white/[0.06] active:bg-[#1C1C21]'
    : 'bg-white border border-black/[0.05] shadow-[0_2px_12px_rgba(0,0,0,0.03)] active:bg-zinc-50';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const subtle = isDark ? 'text-zinc-500' : 'text-zinc-400';

  const examPct = Math.round((examProgress.done / Math.max(examProgress.total, 1)) * 100);

  return (
    <div
      style={{ paddingTop: `${topInsetPx}px` }}
      className={`min-h-screen ${bg} px-4 pb-10 transition-colors duration-300`}
    >
      <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
        {/* Шапка хаба */}
        <div className="flex items-start justify-between gap-3 pt-2">
          <div>
            <span className={`text-[11px] font-extrabold tracking-[0.2em] uppercase ${subtle}`}>
              БАЗА · НГМУ
            </span>
            <h1 className="text-[28px] font-extrabold tracking-tight leading-tight mt-1">
              К чему готовимся?
            </h1>
            <p className={`text-[13px] mt-1 ${muted}`}>
              Выберите цель — меню и база подстроятся автоматически
            </p>
          </div>
          {onClose && currentMode && (
            <button
              type="button"
              onClick={onClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-1 ${card}`}
              aria-label="Закрыть выбор режима"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* БЛОК 1: ПОДГОТОВКА К ДИАГНОСТИКЕ (2x2) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Microscope className="w-4 h-4" style={{ color: accentHex }} />
              <span className="font-extrabold text-[15px]">Подготовка к диагностике</span>
            </div>
            <span className={`text-[11px] ${subtle}`}>Стекла · ЭМ · Теория</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DIAGNOSTICS_CONFIG.map((diag) => {
              const prog = diagProgress[diag.id] || { done: 0, total: diag.expectedSlidesCount };
              const isSelected = currentMode === diag.mode;
              const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;

              return (
                <button
                  key={diag.id}
                  type="button"
                  onClick={() => onSelectMode(diag.mode)}
                  style={isSelected ? { borderColor: accentHex } : undefined}
                  className={`rounded-[22px] p-4 text-left flex flex-col justify-between gap-3 transition duration-200 active:scale-[0.97] ${card} ${
                    isSelected ? 'border-2' : ''
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold"
                        style={{
                          backgroundColor: isSelected ? accentHex : `${accentHex}1C`,
                          color: isSelected ? textOnAccent : accentHex,
                        }}
                      >
                        {diag.id}
                      </span>
                      <span className={`text-[10px] font-semibold ${subtle}`}>{diag.lessonLabel}</span>
                    </div>
                    <div className="font-extrabold text-[15px] leading-snug pt-0.5">
                      {diag.shortTitle}
                    </div>
                    <div className={`text-[11.5px] leading-snug line-clamp-2 ${muted}`}>
                      {diag.subtitle}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={subtle}>
                        {prog.done}/{prog.total} стекол
                      </span>
                      <span style={{ color: accentHex }}>{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-500/20 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: accentHex }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* БЛОК 2: ПОДГОТОВКА К ЭКЗАМЕНУ */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <GraduationCap className="w-4 h-4" style={{ color: accentHex }} />
            <span className="font-extrabold text-[15px]">Полный режим сессии</span>
          </div>

          <button
            type="button"
            onClick={() => onSelectMode('exam')}
            style={{
              borderColor: currentMode === 'exam' ? accentHex : undefined,
              backgroundImage: isDark
                ? `radial-gradient(circle at 90% 15%, ${accentHex}26 0%, transparent 62%)`
                : `radial-gradient(circle at 90% 15%, ${accentHex}18 0%, transparent 62%)`,
            }}
            className={`w-full rounded-[26px] p-5 text-left space-y-4 transition duration-200 active:scale-[0.98] ${card} ${
              currentMode === 'exam' ? 'border-2' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-2"
                  style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                >
                  <Sparkles className="w-3 h-3" /> Зимняя сессия
                </div>
                <div className="text-[20px] font-extrabold leading-tight">
                  Подготовка к экзамену
                </div>
                <p className={`text-[12.5px] mt-1 leading-relaxed ${muted}`}>
                  Все 5 разделов курса, билеты, симулятор экзамена НГМУ, ситуационные задачи и тесты СДО.
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: accentHex, color: textOnAccent }}
              >
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                `${examProgress.total} стекол`,
                `${examProgress.emCount} ЭМ`,
                `${examProgress.questionsCount} билетов`,
                '55 задач',
                'Тесты СДО',
              ].map((tag) => (
                <span
                  key={tag}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    isDark ? 'bg-white/[0.06] text-zinc-200' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[12px] font-bold">
                <span className={muted}>Общая готовность по стеклам</span>
                <span style={{ color: accentHex }}>
                  {examProgress.done} / {examProgress.total} ({examPct}%)
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-500/20 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${examPct}%`, backgroundColor: accentHex }}
                />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
