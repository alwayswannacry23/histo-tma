import React, { useState } from 'react';
import { m, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  HelpCircle,
  Zap,
  List,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { TheoryTopic } from '../data/curriculumTypes';
import { HistSlide } from '../data/histoData';
import { GlossaryTerm, RichGlossaryText } from '../data/glossaryData';
import { buildLessonSlides, LessonSlide } from '../utils/lessonSlidesAdapter';
import { SlideZoneCanvas } from './SlideZoneCanvas';
import { BottomSheet } from './BottomSheet';
import { SLIDE_TRANSITION_VARIANTS } from '../utils/motion';
import { TheoryTopicView } from './TheoryTopicView';

export interface InteractiveLessonViewProps {
  topic: TheoryTopic;
  fallbackBlocks?: Array<{ id: string; title: string; summary: string; examTip?: string }>;
  isDark?: boolean;
  accentHex?: string;
  onClose: () => void;
  onSelectTerm: (term: GlossaryTerm) => void;
  onOpenQuestion?: (qNum: number) => void;
  onOpenSlide?: (slide: HistSlide) => void;
}

export const InteractiveLessonView: React.FC<InteractiveLessonViewProps> = ({
  topic,
  fallbackBlocks = [],
  isDark = true,
  accentHex = '#2DD4BF',
  onClose,
  onSelectTerm,
  onOpenQuestion,
  onOpenSlide,
}) => {
  const slides: LessonSlide[] = React.useMemo(
    () => buildLessonSlides(topic, fallbackBlocks),
    [topic, fallbackBlocks]
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [showTocSheet, setShowTocSheet] = useState(false);
  const [sliderOpacity, setSliderOpacity] = useState(100);
  const [activeLayerNumber, setActiveLayerNumber] = useState<number | null>(null);

  const currentSlide: LessonSlide = slides[currentIdx] || slides[0];
  const linkedSlide = currentSlide?.relatedSlide || null;

  const goToSlide = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= slides.length) return;
    setDirection(newIdx > currentIdx ? 1 : -1);
    setCurrentIdx(newIdx);
    setActiveLayerNumber(null);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -40 || info.velocity.x < -300) {
      goToSlide(currentIdx + 1);
    } else if (info.offset.x > 40 || info.velocity.x > 300) {
      goToSlide(currentIdx - 1);
    }
  };

  const subCard = isDark
    ? 'bg-white/[0.03] border border-white/[0.08]'
    : 'bg-zinc-50 border border-black/[0.06]';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const textSubtle = isDark ? 'text-zinc-500' : 'text-zinc-400';

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col select-none overflow-hidden ${
        isDark ? 'bg-[#09090B] text-white' : 'bg-[#F4F4F6] text-zinc-900'
      }`}
    >
      {/* 1. TOP HEADER */}
      <div
        className={`px-3 py-2.5 flex items-center justify-between gap-3 border-b ${
          isDark ? 'border-white/[0.08] bg-[#09090B]/90' : 'border-black/[0.07] bg-[#F4F4F6]/90'
        } backdrop-blur-md shrink-0`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 ${
            isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-zinc-200 text-zinc-700'
          }`}
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Segmented Progress Dashes */}
        {!isContinuousMode ? (
          <div className="flex-1 flex items-center gap-1 max-w-[200px]">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goToSlide(idx)}
                className="flex-1 h-1 rounded-full transition-all duration-200"
                style={{
                  backgroundColor:
                    idx === currentIdx
                      ? accentHex
                      : idx < currentIdx
                      ? isDark
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(0,0,0,0.3)'
                      : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.08)',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-[13px] font-semibold truncate flex-1 text-center">
            {topic.title}
          </div>
        )}

        {/* Toggle Mode: Slides vs Continuous */}
        <button
          type="button"
          onClick={() => setIsContinuousMode(!isContinuousMode)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition active:scale-95 ${
            isDark
              ? 'bg-white/[0.06] text-zinc-300 hover:text-white'
              : 'bg-zinc-200 text-zinc-700 hover:text-zinc-900'
          }`}
        >
          {isContinuousMode ? 'Слайды' : 'Сплошной'}
        </button>
      </div>

      {/* 2. MAIN BODY */}
      {isContinuousMode ? (
        // Continuous reading mode
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-16 space-y-4">
          <TheoryTopicView
            topic={topic}
            fallbackBlocks={fallbackBlocks}
            isDark={isDark}
            accentHex={accentHex}
            onSelectTerm={onSelectTerm}
            onOpenQuestion={onOpenQuestion}
          />
        </div>
      ) : (
        // Interactive Slides mode
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top visual zone (~42-46% height) */}
          <div className="p-3 shrink-0 relative">
            <SlideZoneCanvas
              slide={linkedSlide}
              activeLayerNumber={activeLayerNumber}
              onSelectLayer={(l) => setActiveLayerNumber(l.number)}
              sliderOpacity={sliderOpacity}
              onSliderOpacityChange={setSliderOpacity}
              fallbackTitle={currentSlide.title}
              fallbackText={currentSlide.text}
              isDark={isDark}
              accentHex={accentHex}
              heightClass="h-[210px] sm:h-[250px]"
            />
            {linkedSlide && onOpenSlide && (
              <button
                type="button"
                onClick={() => onOpenSlide(linkedSlide)}
                aria-label="Открыть в полном микроскопе"
                className="absolute top-5 right-5 z-20 flex items-center gap-1 px-2.5 py-1 rounded-[10px] bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium shadow-sm hover:bg-black/80 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Микроскоп</span>
              </button>
            )}
          </div>

          {/* Bottom Theory zone (Scrollable) */}
          <div className="flex-1 px-3 pb-2 overflow-y-auto overscroll-contain">
            <AnimatePresence custom={direction} mode="wait">
              <m.div
                key={currentSlide.id}
                custom={direction}
                variants={SLIDE_TRANSITION_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className={`rounded-[20px] p-4 space-y-3 border ${
                  isDark
                    ? 'bg-[#131316] text-white border-white/[0.08]'
                    : 'bg-white text-zinc-900 border-black/[0.07]'
                }`}
              >
                {/* Badges / Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentSlide.badge && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${accentHex}1A`, color: accentHex }}
                      >
                        {currentSlide.badge}
                      </span>
                    )}

                    {currentSlide.examQuestionIds && currentSlide.examQuestionIds.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
                        {currentSlide.examQuestionIds.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => onOpenQuestion?.(q)}
                            className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-400 hover:text-white transition"
                          >
                            №{q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className={`text-[11px] font-mono tabular-nums ${textSubtle}`}>
                    {currentIdx + 1} / {slides.length}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-[15px] font-semibold leading-snug tracking-tight">
                  {currentSlide.title}
                </h2>

                {/* Slide Content rendering by type */}
                {currentSlide.type === 'trap' && (
                  <div className="rounded-[16px] p-3 bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-[12.5px] leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div className="space-y-1">
                      <span className="font-semibold text-amber-400">На экзамене:</span>
                      <div className="text-zinc-300">
                        <RichGlossaryText
                          text={currentSlide.text || ''}
                          accentHex={accentHex}
                          onSelectTerm={onSelectTerm}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentSlide.type === 'qa' && currentSlide.qaItems && (
                  <div className="space-y-2">
                    {currentSlide.qaItems.map((item, qIdx) => (
                      <div key={qIdx} className={`rounded-[14px] p-3 space-y-1.5 ${subCard}`}>
                        <div className="flex items-start gap-2 text-[12.5px] font-semibold leading-snug">
                          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentHex }} strokeWidth={1.5} />
                          <span>{item.q}</span>
                        </div>
                        <div className={`text-[12px] leading-relaxed pl-6 ${textMuted}`}>
                          <RichGlossaryText
                            text={item.a}
                            accentHex={accentHex}
                            onSelectTerm={onSelectTerm}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentSlide.type === 'table' && currentSlide.tableData && (
                  <div className="space-y-2">
                    {currentSlide.tableData.rows.map((row, rIdx) => (
                      <div key={rIdx} className={`rounded-[14px] p-3 space-y-1.5 ${subCard}`}>
                        <div className="text-[12px] font-semibold" style={{ color: accentHex }}>
                          <RichGlossaryText
                            text={row[0] || ''}
                            accentHex={accentHex}
                            onSelectTerm={onSelectTerm}
                          />
                        </div>
                        <div className="space-y-1">
                          {row.slice(1).map((cell, cIdx) => (
                            <div key={cIdx} className={`text-[12px] leading-snug ${textMuted}`}>
                              {currentSlide.tableData!.headers[cIdx + 1] && (
                                <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                  {currentSlide.tableData!.headers[cIdx + 1]}:{' '}
                                </span>
                              )}
                              <RichGlossaryText
                                text={cell || ''}
                                accentHex={accentHex}
                                onSelectTerm={onSelectTerm}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentSlide.type === 'brief' && currentSlide.items && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold tracking-tight" style={{ color: accentHex }}>
                      <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Выжимка за 60 секунд</span>
                    </div>
                    {currentSlide.items.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                          style={{ backgroundColor: accentHex }}
                        />
                        <span className={textMuted}>
                          <RichGlossaryText
                            text={pt}
                            accentHex={accentHex}
                            onSelectTerm={onSelectTerm}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {currentSlide.type !== 'trap' &&
                  currentSlide.type !== 'qa' &&
                  currentSlide.type !== 'table' &&
                  currentSlide.type !== 'brief' && (
                    <div className={`text-[13px] leading-relaxed whitespace-pre-line ${textMuted}`}>
                      <RichGlossaryText
                        text={currentSlide.text || currentSlide.subtitle || ''}
                        accentHex={accentHex}
                        onSelectTerm={onSelectTerm}
                      />
                    </div>
                  )}

                {/* Layer Chips: Link directly to zones on the canvas */}
                {linkedSlide?.layers && linkedSlide.layers.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                    <div className={`text-[11px] font-medium tracking-wide uppercase ${textSubtle}`}>
                      Зоны на препарате:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {linkedSlide.layers.map((layer) => {
                        const isSelected = activeLayerNumber === layer.number;
                        return (
                          <button
                            key={layer.number}
                            type="button"
                            onClick={() =>
                              setActiveLayerNumber(isSelected ? null : layer.number)
                            }
                            className={`px-2 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition active:scale-95 ${
                              isSelected
                                ? 'bg-white text-zinc-900 shadow-sm'
                                : subCard
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: layer.color || accentHex }}
                            />
                            <span>{layer.short_name || layer.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </m.div>
            </AnimatePresence>
          </div>

          {/* 3. BOTTOM NAVIGATION BAR */}
          <div
            className={`px-4 py-2.5 border-t flex items-center justify-between gap-3 ${
              isDark ? 'bg-[#09090B] border-white/[0.08]' : 'bg-[#F4F4F6] border-black/[0.07]'
            } shrink-0`}
          >
            <button
              type="button"
              onClick={() => setShowTocSheet(true)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 ${
                isDark ? 'bg-white/[0.06] text-zinc-300' : 'bg-zinc-200 text-zinc-700'
              }`}
              aria-label="Оглавление"
            >
              <List className="w-4 h-4" strokeWidth={1.5} />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => goToSlide(currentIdx - 1)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 ${
                  currentIdx === 0
                    ? 'opacity-30 cursor-not-allowed'
                    : isDark
                    ? 'bg-white/[0.06] text-white'
                    : 'bg-zinc-200 text-zinc-800'
                }`}
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentIdx === slides.length - 1) {
                    onClose();
                  } else {
                    goToSlide(currentIdx + 1);
                  }
                }}
                className="px-4 py-2 rounded-full text-[13px] font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
                style={{ backgroundColor: accentHex, color: isDark ? '#09090B' : '#FFFFFF' }}
              >
                <span>{currentIdx === slides.length - 1 ? 'Завершить' : 'Далее'}</span>
                {currentIdx < slides.length - 1 && <ChevronRight className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table of Contents Bottom Sheet */}
      <BottomSheet
        isOpen={showTocSheet}
        onClose={() => setShowTocSheet(false)}
        title="Оглавление конспекта"
        isDark={isDark}
      >
        <div className="space-y-1.5 py-1">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                goToSlide(idx);
                setShowTocSheet(false);
              }}
              className={`w-full p-2.5 rounded-[14px] text-left flex items-center justify-between gap-3 transition active:scale-[0.98] ${
                idx === currentIdx
                  ? isDark
                    ? 'bg-white/[0.08] text-white'
                    : 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-[11px] text-zinc-500 w-5">
                  {idx + 1}.
                </span>
                <span className="text-[13px] truncate">{s.title}</span>
              </div>
              {idx === currentIdx && (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" strokeWidth={1.5} />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};
