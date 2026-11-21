import React from 'react';
import { ArrowRight, X } from 'lucide-react';
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

const SHORT_HINTS: Record<DiagnosticId, string> = {
  1: 'Ткани, кровь, кость',
  2: 'Мышцы и ЦНС',
  3: 'Чувства, ССС, гормоны',
  4: 'ЖКТ, почка, половая',
};

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
  const bg = isDark ? 'bg-[#09090B] text-white' : 'bg-[#F4F4F6] text-zinc-900';
  const card = isDark
    ? 'bg-[#131316] border-white/[0.08] active:bg-[#1C1C21]'
    : 'bg-white border-black/[0.07] active:bg-zinc-50';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const subtle = isDark ? 'text-zinc-500' : 'text-zinc-400';

  return (
    <div
      style={{ paddingTop: `${topInsetPx}px` }}
      className={`min-h-screen ${bg} px-4 pb-8 select-none transition-colors duration-200`}
    >
      <div className="max-w-md mx-auto space-y-6">
        {/* Шапка */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <h1 className="text-[22px] font-semibold tracking-tight leading-tight">
            Выбор цели обучения
          </h1>
          {onClose && currentMode && (
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition active:scale-95 ${card}`}
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Диагностика 1–4 (сетка 2x2) */}
        <div className="space-y-2">
          <div className={`text-[12px] font-medium px-1 ${subtle}`}>Рубежные контроли</div>
          <div className="grid grid-cols-2 gap-3">
            {DIAGNOSTICS_CONFIG.map((diag) => {
              const prog = diagProgress[diag.id] || { done: 0, total: diag.expectedSlidesCount };
              const isSelected = currentMode === diag.mode;

              return (
                <button
                  key={diag.id}
                  type="button"
                  onClick={() => onSelectMode(diag.mode)}
                  style={isSelected ? { borderColor: accentHex } : undefined}
                  className={`rounded-[20px] p-4 text-left flex flex-col justify-between gap-4 border transition active:scale-[0.98] ${card}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold"
                      style={{
                        backgroundColor: isSelected ? accentHex : `${accentHex}1A`,
                        color: isSelected ? textOnAccent : accentHex,
                      }}
                    >
                      {diag.id}
                    </span>
                    <span className={`text-[11px] font-mono tabular-nums ${subtle}`}>
                      {prog.done}/{prog.total}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-semibold text-[14px] leading-snug">
                      Диагностика {diag.id}
                    </div>
                    <div className={`text-[11.5px] leading-snug truncate ${muted}`}>
                      {SHORT_HINTS[diag.id]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Экзамен */}
        <div className="space-y-2">
          <div className={`text-[12px] font-medium px-1 ${subtle}`}>Итоговая аттестация</div>
          <button
            type="button"
            onClick={() => onSelectMode('exam')}
            style={currentMode === 'exam' ? { borderColor: accentHex } : undefined}
            className={`w-full rounded-[20px] p-4 text-left flex items-center justify-between gap-4 border transition active:scale-[0.98] ${card}`}
          >
            <div className="space-y-1 min-w-0">
              <div className="text-[15px] font-semibold leading-snug">
                Экзамен по гистологии
              </div>
              <div className={`text-[12px] tabular-nums ${muted}`}>
                {examProgress.total} препаратов · {examProgress.emCount} ЭМ · {examProgress.questionsCount} билетов
              </div>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: accentHex, color: textOnAccent }}
            >
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
