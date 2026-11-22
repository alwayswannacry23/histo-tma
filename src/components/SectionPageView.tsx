import React, { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Microscope,
  Cpu,
  Play,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { TheorySection, TheoryTopic } from '../data/curriculumTypes';
import { HistSlide } from '../data/histoData';
import { ElectronogramItem } from '../data/examContent';
import { getReadableAccent, hexWithAlpha } from '../utils/colorContrast';
import { IOS_SPRING, PAGE_TRANSITION_VARIANTS } from '../utils/motion';

export interface SectionPageViewProps {
  section: TheorySection;
  topics: TheoryTopic[];
  slides: HistSlide[];
  electronograms: ElectronogramItem[];
  favoriteIds?: string[];
  masteredIds?: string[];
  completedTopicIds?: string[];
  isDark?: boolean;
  accentHex?: string;
  accentTextColor?: string;
  topInsetPx?: number;
  onBack: () => void;
  onSelectTopic: (topic: TheoryTopic) => void;
  onSelectSlide: (slide: HistSlide) => void;
  onSelectEm?: (em: ElectronogramItem) => void;
  onStartSectionQuiz?: (slides: HistSlide[]) => void;
}

type SectionSubTab = 'topics' | 'slides' | 'em';

function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return `${n} ${forms[2]}`;
  if (n1 > 1 && n1 < 5) return `${n} ${forms[1]}`;
  if (n1 === 1) return `${n} ${forms[0]}`;
  return `${n} ${forms[2]}`;
}

export const SectionPageView: React.FC<SectionPageViewProps> = ({
  section,
  topics,
  slides,
  electronograms,
  favoriteIds = [],
  masteredIds = [],
  completedTopicIds = [],
  isDark = true,
  accentHex = '#2DD4BF',
  topInsetPx = 14,
  onBack,
  onSelectTopic,
  onSelectSlide,
  onSelectEm,
  onStartSectionQuiz,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SectionSubTab>('topics');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const isTelegramEnv = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const wa = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
    return Boolean(wa?.initData);
  }, []);

  const accentInk = useMemo(() => getReadableAccent(accentHex, isDark), [accentHex, isDark]);
  const accentSoftBg = useMemo(() => hexWithAlpha(accentInk, isDark ? 0.14 : 0.1), [accentInk, isDark]);

  const cardBg = isDark
    ? 'bg-[#131316] border-white/[0.08] active:bg-[#1C1C21]'
    : 'bg-white border-black/[0.07] active:bg-zinc-50';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const textSubtle = isDark ? 'text-zinc-500' : 'text-zinc-500';

  const subTabs: { id: SectionSubTab; label: string; count: number }[] = [
    { id: 'topics', label: 'Конспекты', count: topics.length },
    ...(slides.length > 0
      ? [{ id: 'slides' as SectionSubTab, label: 'Препараты', count: slides.length }]
      : []),
    ...(electronograms.length > 0
      ? [{ id: 'em' as SectionSubTab, label: 'ЭМ-схемы', count: electronograms.length }]
      : []),
  ];

  const headerTopPad = Math.max(topInsetPx, 12);

  return (
    <m.div
      variants={PAGE_TRANSITION_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen flex flex-col select-none pb-12 ${
        isDark ? 'bg-[#09090B] text-[#F4F4F5]' : 'bg-[#F4F4F6] text-[#18181B]'
      }`}
    >
      {/* 1. Фиксированная шапка с безопасным отступом */}
      <header
        style={{ paddingTop: `${headerTopPad}px` }}
        className={`sticky top-0 z-30 border-b backdrop-blur-md ${
          isDark
            ? 'bg-[#09090B]/90 border-white/[0.08]'
            : 'bg-[#F4F4F6]/92 border-black/[0.07]'
        }`}
      >
        <div className="max-w-md mx-auto px-4 pb-3 flex items-center justify-between gap-3">
          {!isTelegramEnv ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Назад"
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-black/[0.05] text-zinc-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
          ) : (
            <div className="w-1 shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-semibold truncate leading-tight tracking-tight">
              {section.title}
            </h1>
            <p className={`text-[12px] truncate mt-0.5 tabular-nums ${textSubtle}`}>
              {pluralRu(topics.length, ['тема', 'темы', 'тем'])}
              {slides.length > 0 ? ` · ${pluralRu(slides.length, ['препарат', 'препарата', 'препаратов'])}` : ''}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto w-full px-4 pt-4 space-y-4">
        {/* 2. Подвкладки раздела (показываем только если вкладок больше 1) */}
        {subTabs.length > 1 && (
          <div
            className={`relative p-1 rounded-2xl grid ${
              subTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
            } gap-1 ${
              isDark
                ? 'bg-[#131316] border border-white/[0.08]'
                : 'bg-[#E6E8EE] border border-black/[0.05]'
            }`}
          >
            {subTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`relative py-2 px-2 rounded-xl text-[12px] font-medium transition-colors z-10 flex items-center justify-center gap-1.5 ${
                    isActive
                      ? isDark
                        ? 'text-white'
                        : 'text-[#18181B]'
                      : textMuted
                  }`}
                >
                  {isActive && (
                    <m.span
                      layoutId="section-subtab-indicator"
                      transition={IOS_SPRING}
                      className={`absolute inset-0 rounded-xl ${
                        isDark ? 'bg-[#242429]' : 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                      }`}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span className="relative z-10 text-[11px] font-mono tabular-nums opacity-65">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Контент активной подвкладки */}
        {activeSubTab === 'topics' && (
          <div className="space-y-2.5">
            {topics.map((topic) => {
              const isDone = completedTopicIds.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onSelectTopic(topic)}
                  className={`w-full p-4 rounded-2xl text-left border flex items-center justify-between gap-3 transition-transform active:scale-[0.98] ${cardBg}`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {topic.lessonNumber != null && (
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md tabular-nums"
                          style={{ backgroundColor: accentSoftBg, color: accentInk }}
                        >
                          Занятие {topic.lessonNumber}
                        </span>
                      )}
                      {topic.examQuestionIds.length > 0 && (
                        <span className={`text-[11px] font-mono tabular-nums ${textSubtle}`}>
                          Билеты {topic.examQuestionIds.map((q) => `№${q}`).join(', ')}
                        </span>
                      )}
                    </div>

                    <h2 className="text-[15px] font-semibold leading-snug tracking-tight">
                      {topic.title}
                    </h2>
                    <p className={`text-[13px] leading-snug line-clamp-2 ${textMuted}`}>
                      {topic.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isDone && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
                    )}
                    <ChevronRight className={`w-4 h-4 ${textSubtle}`} strokeWidth={1.5} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {activeSubTab === 'slides' && (
          <div className="space-y-3">
            {slides.length > 0 && onStartSectionQuiz && (
              <button
                type="button"
                onClick={() => onStartSectionQuiz(slides)}
                className="w-full h-11 px-4 rounded-xl font-medium text-[13px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                style={{ backgroundColor: accentSoftBg, color: accentInk }}
              >
                <Play className="w-4 h-4" strokeWidth={1.5} />
                <span>Тест по разделу ({pluralRu(slides.length, ['препарат', 'препарата', 'препаратов'])})</span>
              </button>
            )}

            <div className="space-y-2">
              {slides.map((slide) => {
                const hasImage = Boolean(slide.imageUrl && slide.imageUrl.trim()) && !brokenImages[slide.id];
                const isFavorite = favoriteIds.includes(slide.id);
                const isMastered = masteredIds.includes(slide.id);

                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => onSelectSlide(slide)}
                    className={`w-full p-3 rounded-2xl text-left border flex items-center gap-3 transition-transform active:scale-[0.98] ${cardBg}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl shrink-0 overflow-hidden flex items-center justify-center border ${
                        isDark ? 'bg-black border-white/[0.06]' : 'bg-zinc-100 border-black/[0.05]'
                      }`}
                    >
                      {hasImage ? (
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [slide.id]: true }))
                          }
                          className="w-full h-full object-cover select-none"
                          loading="lazy"
                        />
                      ) : (
                        <Microscope className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[12px] font-mono tabular-nums font-medium shrink-0"
                          style={{ color: accentInk }}
                        >
                          №{slide.examNumber}
                        </span>
                        {slide.stain && (
                          <span className={`text-[12px] truncate ${textSubtle}`}>
                            {slide.stain}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[14px] font-medium leading-snug truncate">
                        {slide.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isFavorite && (
                        <Bookmark className="w-4 h-4" strokeWidth={1.5} style={{ color: accentInk, fill: accentInk }} />
                      )}
                      {isMastered && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
                      )}
                      <ChevronRight className={`w-4 h-4 ${textSubtle}`} strokeWidth={1.5} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'em' && (
          <div className="space-y-2">
            {electronograms.map((em) => {
              const hasImg = Boolean(em.imageUrl) && !brokenImages[em.id];
              return (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => onSelectEm?.(em)}
                  className={`w-full p-3 rounded-2xl text-left border flex items-center gap-3 transition-transform active:scale-[0.98] ${cardBg}`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl shrink-0 overflow-hidden flex items-center justify-center border ${
                      isDark ? 'bg-black border-white/[0.06]' : 'bg-zinc-100 border-black/[0.05]'
                    }`}
                  >
                    {hasImg ? (
                      <img
                        src={em.imageUrl}
                        alt={em.title}
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [em.id]: true }))
                        }
                        className="w-full h-full object-cover select-none"
                        loading="lazy"
                      />
                    ) : (
                      <Cpu className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div
                      className="text-[12px] font-mono tabular-nums font-medium"
                      style={{ color: accentInk }}
                    >
                      ЭМ №{em.number}
                    </div>
                    <h3 className="text-[14px] font-medium leading-snug truncate">{em.title}</h3>
                    <p className={`text-[12px] leading-snug line-clamp-1 ${textMuted}`}>
                      {em.keyFeature || em.description}
                    </p>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 ${textSubtle}`} strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </m.div>
  );
};