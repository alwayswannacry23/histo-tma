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
  const bg = isDark ? 'bg-[#09090B] text-white' : 'bg-[#F3F4F6] text-zinc-900';
  const card = isDark
    ? 'bg-[#141417] active:bg-[#1C1C21]'
    : 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:bg-zinc-50';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const subtle = isDark ? 'text-zinc-500' : 'text-zinc-400';

  return (
    <div
      style={{ paddingTop: `${topInsetPx}px` }}
      className={`min-h-screen ${bg} px-4 pb-8 transition-colors duration-300`}
    >
      <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
        {/* Чистая шапка без лишнего текста */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <h1 className="text-[26px] font-extrabold tracking-tight leading-tight">
            К чему готовимся?
          </h1>
          {onClose && currentMode && (
            <button
              type="button"
              onClick={onClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${card}`}
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Диагностика 1–4 (компактная сетка 2x2) */}
        <div className="space-y-2.5">
          <div className={`text-[12px] font-semibold px-1 ${muted}`}>Диагностика</div>
          <div className="grid grid-cols-2 gap-2.5">
            {DIAGNOSTICS_CONFIG.map((diag) => {
              const prog = diagProgress[diag.id] || { done: 0, total: diag.expectedSlidesCount };
              const isSelected = currentMode === diag.mode;

              return (
                <button
                  key={diag.id}
                  type="button"
                  onClick={() => onSelectMode(diag.mode)}
                  style={isSelected ? { boxShadow: `inset 0 0 0 1.5px ${accentHex}` } : undefined}
                  className={`rounded-[20px] p-3.5 text-left flex flex-col justify-between gap-4 transition duration-200 active:scale-[0.97] ${card}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{
                        backgroundColor: isSelected ? accentHex : `${accentHex}1C`,
                        color: isSelected ? textOnAccent : accentHex,
                      }}
                    >
                      {diag.id}
                    </span>
                    <span className={`text-[11px] font-medium tabular-nums ${subtle}`}>
                      {prog.done}/{prog.total}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="font-bold text-[15px] leading-snug">
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

        {/* Экзамен (одна чистая карточка без тегов и бейджей) */}
        <div className="space-y-2.5">
          <div className={`text-[12px] font-semibold px-1 ${muted}`}>Экзамен</div>
          <button
            type="button"
            onClick={() => onSelectMode('exam')}
            style={currentMode === 'exam' ? { boxShadow: `inset 0 0 0 1.5px ${accentHex}` } : undefined}
            className={`w-full rounded-[22px] p-4 text-left flex items-center justify-between gap-4 transition duration-200 active:scale-[0.98] ${card}`}
          >
            <div className="space-y-1 min-w-0">
              <div className="text-[17px] font-bold leading-snug">
                Подготовка к экзамену
              </div>
              <div className={`text-[12px] ${muted}`}>
                {examProgress.total} стекол · {examProgress.emCount} ЭМ · {examProgress.questionsCount} билетов
              </div>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: accentHex, color: textOnAccent }}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
