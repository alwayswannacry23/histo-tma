import React, { useState } from 'react';
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
import { IOS_SPRING, PAGE_TRANSITION_VARIANTS } from '../utils/motion';

export interface SectionPageViewProps {
  section: TheorySection;
  topics: TheoryTopic[];
  slides: HistSlide[];
  electronograms: ElectronogramItem[];
  favoriteIds?: string[];
  masteredIds?: string[];
  isDark?: boolean;
  accentHex?: string;
  accentTextColor?: string;
  onBack: () => void;
  onSelectTopic: (topic: TheoryTopic) => void;
  onSelectSlide: (slide: HistSlide) => void;
  onSelectEm?: (em: ElectronogramItem) => void;
  onStartSectionQuiz?: (slides: HistSlide[]) => void;
}

type SectionSubTab = 'topics' | 'slides' | 'em';

export const SectionPageView: React.FC<SectionPageViewProps> = ({
  section,
  topics,
  slides,
  electronograms,
  favoriteIds = [],
  masteredIds = [],
  isDark = true,
  accentHex = '#2DD4BF',
  onBack,
  onSelectTopic,
  onSelectSlide,
  onSelectEm,
  onStartSectionQuiz,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SectionSubTab>('topics');

  const cardBg = isDark
    ? 'bg-[#131316] border-white/[0.08]'
    : 'bg-white border-black/[0.07]';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const textSubtle = isDark ? 'text-zinc-500' : 'text-zinc-400';

  const subTabs: { id: SectionSubTab; label: string; count: number }[] = [
    { id: 'topics', label: 'Конспекты', count: topics.length },
    { id: 'slides', label: 'Препараты', count: slides.length },
    ...(electronograms.length > 0
      ? [{ id: 'em' as SectionSubTab, label: 'ЭМ-схемы', count: electronograms.length }]
      : []),
  ];

  return (
    <m.div
      variants={PAGE_TRANSITION_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen flex flex-col select-none pb-24 ${
        isDark ? 'bg-[#09090B] text-white' : 'bg-[#F4F4F6] text-zinc-900'
      }`}
    >
      {/* 1. TOP FIXED HEADER */}
      <div
        className={`sticky top-0 z-30 px-3 py-2.5 flex items-center justify-between gap-3 border-b backdrop-blur-md ${
          isDark
            ? 'bg-[#09090B]/90 border-white/[0.08]'
            : 'bg-[#F4F4F6]/90 border-black/[0.07]'
        }`}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
          className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 ${
            isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-zinc-200 text-zinc-700'
          }`}
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="flex-1 text-center min-w-0">
          <h1 className="text-[14.5px] font-semibold truncate leading-tight tracking-tight">
            {section.title}
          </h1>
          <p className={`text-[11px] truncate ${textSubtle}`}>
            {topics.length} {topics.length === 1 ? 'тема' : 'тем'} · {slides.length} препаратов
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* 2. SUBTABS SEGMENTED CONTROL */}
      <div className="px-4 pt-3 pb-1">
        <div
          className={`relative p-1 rounded-[16px] grid ${
            subTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          } gap-1 ${
            isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-zinc-200/80 border border-black/[0.04]'
          }`}
        >
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`relative py-1.5 px-2 rounded-[12px] text-[12px] font-semibold transition-colors duration-150 z-10 flex items-center justify-center gap-1.5 ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-zinc-900'
                    : textMuted
                }`}
              >
                {isActive && (
                  <m.div
                    layoutId="section-subtab-indicator"
                    transition={IOS_SPRING}
                    className={`absolute inset-0 rounded-[12px] shadow-sm ${
                      isDark ? 'bg-[#222227]' : 'bg-white'
                    }`}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
                <span
                  className={`relative z-10 text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? isDark
                        ? 'bg-white/15 text-white'
                        : 'bg-black/10 text-zinc-900'
                      : 'opacity-50'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="p-4 space-y-3">
        {activeSubTab === 'topics' && (
          <div className="space-y-2.5">
            {topics.map((topic) => {
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onSelectTopic(topic)}
                  className={`w-full p-3.5 rounded-[18px] text-left border flex items-center justify-between gap-3 transition active:scale-[0.98] ${cardBg}`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {topic.lessonNumber && (
                        <span
                          className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${accentHex}1A`, color: accentHex }}
                        >
                          Занятие {topic.lessonNumber}
                        </span>
                      )}
                      {topic.examQuestionIds && topic.examQuestionIds.length > 0 && (
                        <span className={`text-[10.5px] font-mono ${textSubtle}`}>
                          Билеты: {topic.examQuestionIds.map((q) => `№${q}`).join(', ')}
                        </span>
                      )}
                    </div>

                    <h2 className="text-[14px] font-semibold leading-snug tracking-tight">
                      {topic.title}
                    </h2>
                    <p className={`text-[12px] leading-snug line-clamp-1 ${textMuted}`}>
                      {topic.subtitle}
                    </p>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 ${textSubtle}`} strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
        )}

        {activeSubTab === 'slides' && (
          <div className="space-y-3">
            {/* Quick action: Quiz this section */}
            {slides.length > 0 && onStartSectionQuiz && (
              <button
                type="button"
                onClick={() => onStartSectionQuiz(slides)}
                className="w-full py-2.5 px-3 rounded-[16px] font-semibold text-[13px] flex items-center justify-center gap-2 transition active:scale-[0.98]"
                style={{ backgroundColor: `${accentHex}1A`, color: accentHex }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Тест по разделу ({slides.length} препаратов)</span>
              </button>
            )}

            <div className="space-y-2">
              {slides.map((slide) => {
                const hasImage = Boolean(slide.imageUrl && slide.imageUrl.trim());
                const isFavorite = favoriteIds.includes(slide.id);
                const isMastered = masteredIds.includes(slide.id);

                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => onSelectSlide(slide)}
                    className={`w-full p-2.5 rounded-[18px] text-left border flex items-center gap-3 transition active:scale-[0.98] ${cardBg}`}
                  >
                    {/* Image Preview / Placeholder */}
                    <div
                      className={`w-12 h-12 rounded-[14px] shrink-0 overflow-hidden flex items-center justify-center border ${
                        isDark ? 'bg-black border-white/[0.06]' : 'bg-zinc-100 border-black/[0.05]'
                      }`}
                    >
                      {hasImage ? (
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="w-full h-full object-cover select-none"
                          loading="lazy"
                        />
                      ) : (
                        <Microscope className="w-5 h-5 text-zinc-500 opacity-60" strokeWidth={1.5} />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-zinc-400">
                          №{slide.examNumber}
                        </span>
                        {slide.stain && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium truncate max-w-[140px] ${
                              isDark ? 'bg-white/[0.06] text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {slide.stain}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[13px] font-semibold leading-snug truncate">
                        {slide.title}
                      </h3>
                    </div>

                    {/* Status icons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isFavorite && (
                        <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      )}
                      {isMastered && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
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
            {electronograms.map((em) => (
              <button
                key={em.id}
                type="button"
                onClick={() => onSelectEm?.(em)}
                className={`w-full p-3 rounded-[18px] text-left border flex items-center gap-3 transition active:scale-[0.98] ${cardBg}`}
              >
                <div
                  className={`w-12 h-12 rounded-[14px] shrink-0 overflow-hidden flex items-center justify-center border ${
                    isDark ? 'bg-black border-white/[0.06]' : 'bg-zinc-100 border-black/[0.05]'
                  }`}
                >
                  {em.imageUrl ? (
                    <img
                      src={em.imageUrl}
                      alt={em.title}
                      className="w-full h-full object-cover select-none"
                      loading="lazy"
                    />
                  ) : (
                    <Cpu className="w-5 h-5 text-zinc-500 opacity-60" strokeWidth={1.5} />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="text-[10.5px] font-mono text-zinc-400">
                    Электроннограмма №{em.number}
                  </div>
                  <h3 className="text-[13px] font-semibold leading-snug truncate">
                    {em.title}
                  </h3>
                  <p className={`text-[11.5px] leading-snug line-clamp-1 ${textMuted}`}>
                    {em.description || em.keyFeature}
                  </p>
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 ${textSubtle}`} strokeWidth={1.5} />
              </button>
            ))}
          </div>
        )}
      </div>
    </m.div>
  );
};
