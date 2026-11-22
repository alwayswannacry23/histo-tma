import React, { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Search,
  X,
} from 'lucide-react';
import { CurriculumSectionId, SituationalTaskItem } from '../data/curriculumTypes';
import { GlossaryTerm, RichGlossaryText } from '../data/glossaryData';
import { getReadableAccent, hexWithAlpha } from '../utils/colorContrast';
import { PAGE_TRANSITION } from '../utils/motion';

const SOLVED_KEY = 'baza_solved_tasks';

const SECTION_LABELS: Record<CurriculumSectionId, string> = {
  sec_1_histotechnique: 'Гистотехника',
  sec_2_cytology: 'Цитология',
  sec_3_embryology: 'Эмбриология',
  sec_4_general_histo: 'Общая гистология',
  sec_5_special_histo: 'Частная гистология',
};

function readSolvedIds(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SOLVED_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSolvedIds(ids: string[]): void {
  try {
    localStorage.setItem(SOLVED_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

function triggerHaptic(style: 'light' | 'medium' = 'light'): void {
  try {
    (window as unknown as {
      Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } };
    }).Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style);
  } catch {
    // ignore
  }
}

export interface SituationalTasksModalProps {
  tasks: SituationalTaskItem[];
  isDark: boolean;
  accentHex: string;
  textOnAccent: string;
  topInsetPx: number;
  onSelectTerm: (term: GlossaryTerm) => void;
  onClose: () => void;
}

export const SituationalTasksModal: React.FC<SituationalTasksModalProps> = ({
  tasks,
  isDark,
  accentHex,
  textOnAccent,
  topInsetPx,
  onSelectTerm,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [openAnswers, setOpenAnswers] = useState<Record<string, boolean>>({});
  const [solvedIds, setSolvedIds] = useState<string[]>(readSolvedIds);

  const isTelegramEnv = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const wa = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
    return Boolean(wa?.initData);
  }, []);

  const accentInk = useMemo(() => getReadableAccent(accentHex, isDark), [accentHex, isDark]);
  const accentSoftBg = useMemo(() => hexWithAlpha(accentInk, isDark ? 0.14 : 0.08), [accentInk, isDark]);

  const availableSections = useMemo(() => {
    const present = new Set<CurriculumSectionId>();
    tasks.forEach((t) => present.add(t.sectionId));
    return (Object.keys(SECTION_LABELS) as CurriculumSectionId[]).filter((id) => present.has(id));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (sectionFilter !== 'all' && task.sectionId !== sectionFilter) return false;
      if (!q) return true;
      return (
        String(task.number).includes(q) ||
        task.condition.toLowerCase().includes(q) ||
        task.referenceAnswer.toLowerCase().includes(q) ||
        (task.keyTerms || []).some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [tasks, query, sectionFilter]);

  const toggleAnswer = (taskId: string) => {
    triggerHaptic('light');
    setOpenAnswers((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleSolved = (taskId: string) => {
    triggerHaptic('medium');
    setSolvedIds((prev) => {
      const next = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId];
      saveSolvedIds(next);
      return next;
    });
  };

  const pageBg = isDark ? 'bg-[#09090B] text-[#F4F4F5]' : 'bg-[#F4F4F6] text-[#18181B]';
  const headerBg = isDark
    ? 'bg-[#09090B]/92 border-white/[0.08]'
    : 'bg-[#F4F4F6]/94 border-black/[0.07]';
  const surface = isDark
    ? 'bg-[#131316] border border-white/[0.08]'
    : 'bg-white border border-black/[0.07]';
  const subSurface = isDark
    ? 'bg-white/[0.04] border border-white/[0.08] text-zinc-200'
    : 'bg-[#ECEEF2] border border-black/[0.06] text-zinc-800';
  const bodyText = isDark ? 'text-[#D4D4D8]' : 'text-[#27272A]';
  const mutedText = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const subtleText = isDark ? 'text-zinc-500' : 'text-zinc-500';
  const hairline = isDark ? 'border-white/[0.08]' : 'border-black/[0.07]';

  const headerTopPad = Math.max(topInsetPx, 12);
  const solvedCount = tasks.filter((t) => solvedIds.includes(t.id)).length;

  return (
    <m.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={PAGE_TRANSITION}
      data-testid="situational-tasks-modal"
      className={`fixed inset-0 z-40 flex flex-col select-none ${pageBg}`}
    >
      <header
        style={{ paddingTop: `${headerTopPad}px` }}
        className={`shrink-0 sticky top-0 z-20 backdrop-blur-md border-b ${headerBg}`}
      >
        <div className="max-w-md mx-auto px-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {!isTelegramEnv && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Назад"
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${subSurface}`}
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-[16px] font-semibold leading-tight truncate">
                Ситуационные задачи
              </h1>
              <p className={`text-[12px] tabular-nums ${subtleText}`}>
                {tasks.length > 0 ? `Решено ${solvedCount} из ${tasks.length}` : 'Экзаменационный банк НГМУ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть задачи"
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${subSurface}`}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-y-contain">
        <div className="max-w-md mx-auto px-4 py-4 pb-16 space-y-4">
          {tasks.length === 0 ? (
            <div className={`rounded-2xl p-6 text-center space-y-3 mt-4 ${surface}`}>
              <div
                className="w-11 h-11 rounded-2xl mx-auto flex items-center justify-center"
                style={{ backgroundColor: accentSoftBg, color: accentInk }}
              >
                <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h2 className="text-[16px] font-semibold">Банк из 55 задач готов к загрузке</h2>
                <p className={`text-[13px] leading-relaxed ${mutedText}`}>
                  Слот задач НГМУ подключён. После загрузки условий и эталонов они появятся здесь и в симуляторе экзамена.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className={`rounded-2xl px-3.5 h-11 flex items-center gap-2.5 ${surface}`}>
                <Search className={`w-4 h-4 ${subtleText}`} strokeWidth={1.5} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по номеру или условию"
                  className="w-full bg-transparent text-[14px] outline-none"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Очистить">
                    <X className={`w-4 h-4 ${subtleText}`} strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {availableSections.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {(['all', ...availableSections] as const).map((secId) => {
                    const isSelected = sectionFilter === secId;
                    const label = secId === 'all' ? 'Все' : SECTION_LABELS[secId];
                    const activeStyle = isSelected
                      ? {
                          backgroundColor: accentHex,
                          color: textOnAccent,
                          borderColor: accentHex,
                        }
                      : undefined;
                    return (
                      <button
                        key={secId}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setSectionFilter(secId);
                        }}
                        style={activeStyle}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-medium whitespace-nowrap border transition-colors ${
                          isSelected ? '' : subSurface
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredTasks.length === 0 ? (
                <div className={`rounded-2xl p-6 text-center text-[13px] ${surface} ${mutedText}`}>
                  По этому запросу задачи не найдены
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => {
                    const isOpen = Boolean(openAnswers[task.id]);
                    const isSolved = solvedIds.includes(task.id);
                    const chevronClass = isOpen
                      ? `w-4 h-4 shrink-0 transition-transform duration-200 rotate-180 ${subtleText}`
                      : `w-4 h-4 shrink-0 transition-transform duration-200 ${subtleText}`;
                    const barStyle = { backgroundColor: accentInk };
                    const badgeStyle = { backgroundColor: accentSoftBg, color: accentInk };
                    const solvedStyle = isSolved
                      ? { backgroundColor: accentSoftBg, color: accentInk }
                      : undefined;

                    return (
                      <div key={task.id} className={`rounded-2xl p-4 space-y-3 ${surface}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md font-medium shrink-0"
                              style={badgeStyle}
                            >
                              Задача №{task.number}
                            </span>
                            <span className={`text-[12px] truncate ${subtleText}`}>
                              {SECTION_LABELS[task.sectionId]}
                            </span>
                          </div>
                          {isSolved && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={1.5} />
                          )}
                        </div>

                        <div className={`text-[14px] leading-[1.6] font-normal ${bodyText}`}>
                          <RichGlossaryText text={task.condition} accentHex={accentInk} onSelectTerm={onSelectTerm} />
                        </div>

                        {task.questions.length > 0 && (
                          <ol className={`space-y-1.5 pl-1 text-[13px] leading-[1.55] ${mutedText}`}>
                            {task.questions.map((qText, qIdx) => (
                              <li key={qIdx} className="flex items-start gap-2">
                                <span className="font-mono tabular-nums shrink-0" style={{ color: accentInk }}>
                                  {qIdx + 1}.
                                </span>
                                <span>{qText}</span>
                              </li>
                            ))}
                          </ol>
                        )}

                        <div className={`pt-2 border-t flex items-center justify-between gap-2 ${hairline}`}>
                          <button
                            type="button"
                            onClick={() => toggleAnswer(task.id)}
                            className="inline-flex items-center gap-1.5 text-[13px] font-medium"
                            style={{ color: accentInk }}
                          >
                            <span>{isOpen ? 'Скрыть эталон' : 'Эталон ответа'}</span>
                            <ChevronDown className={chevronClass} strokeWidth={1.5} />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleSolved(task.id)}
                            style={solvedStyle}
                            className={`inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[12px] font-medium transition-colors ${
                              isSolved ? '' : subSurface
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>{isSolved ? 'Решено' : 'Отметить'}</span>
                          </button>
                        </div>

                        {isOpen && (
                          <div className={`relative overflow-hidden rounded-xl p-3.5 pl-4 space-y-2 ${subSurface}`}>
                            <span
                              aria-hidden="true"
                              className="absolute inset-y-0 left-0 w-[3px]"
                              style={barStyle}
                            />
                            <div className="text-[12px] font-semibold" style={{ color: accentInk }}>
                              Эталонный ответ
                            </div>
                            <div className={`text-[13px] leading-[1.6] whitespace-pre-line ${bodyText}`}>
                              <RichGlossaryText text={task.referenceAnswer} accentHex={accentInk} onSelectTerm={onSelectTerm} />
                            </div>
                            {task.keyTerms && task.keyTerms.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {task.keyTerms.map((kw) => (
                                  <span
                                    key={kw}
                                    className={`text-[11px] px-2 py-0.5 rounded-md ${
                                      isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-white text-zinc-700'
                                    }`}
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </m.div>
  );
};

export default SituationalTasksModal;
