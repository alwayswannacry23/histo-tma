import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  List,
  Microscope,
  X,
} from 'lucide-react';
import { ContentBlock, TheoryTopic } from '../data/curriculumTypes';
import { GlossaryTerm, RichGlossaryText } from '../data/glossaryData';
import { HistSlide } from '../data/histoData';
import { getReadableAccent, hexWithAlpha } from '../utils/colorContrast';
import { IOS_EASE, IOS_SPRING, PAGE_TRANSITION, SHEET_TRANSITION } from '../utils/motion';

type ReaderMode = 'full' | 'brief';

const READER_MODE_KEY = 'baza_reader_mode';

function readStoredMode(): ReaderMode {
  try {
    const val = localStorage.getItem(READER_MODE_KEY);
    return val === 'brief' ? 'brief' : 'full';
  } catch {
    return 'full';
  }
}

function saveStoredMode(mode: ReaderMode): void {
  try {
    localStorage.setItem(READER_MODE_KEY, mode);
  } catch {
    // ignore storage quota / private mode
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

function extractBriefSummary(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 200) return cleaned;
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length === 0) {
    return cleaned.slice(0, 196).trimEnd() + '…';
  }
  let acc = sentences[0].trim();
  if (acc.length < 110 && sentences[1]) {
    acc = `${acc} ${sentences[1].trim()}`;
  }
  if (acc.length > 240) {
    return acc.slice(0, 236).trimEnd() + '…';
  }
  return acc;
}

export interface TheoryReaderViewProps {
  topic: TheoryTopic;
  sectionTitle?: string;
  nextTopic?: TheoryTopic | null;
  relatedSlides?: HistSlide[];
  fallbackBlocks?: Array<{ id: string; title: string; summary: string; examTip?: string }>;
  isDark: boolean;
  accentHex: string;
  textOnAccent: string;
  topInsetPx: number;
  isCompleted?: boolean;
  onToggleCompleted?: (topicId: string) => void;
  onSelectTerm: (term: GlossaryTerm) => void;
  onOpenQuestion?: (questionNum: number) => void;
  onOpenSlide?: (slide: HistSlide) => void;
  onOpenNextTopic?: (topic: TheoryTopic) => void;
  onClose: () => void;
}

export const TheoryReaderView: React.FC<TheoryReaderViewProps> = ({
  topic,
  sectionTitle,
  nextTopic,
  relatedSlides = [],
  fallbackBlocks = [],
  isDark,
  accentHex,
  textOnAccent,
  topInsetPx,
  isCompleted = false,
  onToggleCompleted,
  onSelectTerm,
  onOpenQuestion,
  onOpenSlide,
  onOpenNextTopic,
  onClose,
}) => {
  const [mode, setMode] = useState<ReaderMode>(readStoredMode);
  const [tocOpen, setTocOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [brokenSlideImages, setBrokenSlideImages] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isTelegramEnv = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const wa = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
    return Boolean(wa?.initData);
  }, []);

  const accentInk = useMemo(() => getReadableAccent(accentHex, isDark), [accentHex, isDark]);
  const accentSoftBg = useMemo(() => hexWithAlpha(accentInk, isDark ? 0.14 : 0.09), [accentInk, isDark]);
  const accentBorder = useMemo(() => hexWithAlpha(accentInk, isDark ? 0.28 : 0.22), [accentInk, isDark]);

  // Сброс скролла при переключении на следующую тему
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
      setReadProgress(0);
    }
    setTocOpen(false);
  }, [topic.id]);

  // Прогресс чтения по скроллу
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 16) {
      setReadProgress(1);
      return;
    }
    setReadProgress(Math.max(0, Math.min(1, el.scrollTop / maxScroll)));
  };

  const handleModeChange = (nextMode: ReaderMode) => {
    if (nextMode === mode) return;
    triggerHaptic('light');
    setMode(nextMode);
    saveStoredMode(nextMode);
  };

  const tocItems = useMemo(() => {
    const items: Array<{ id: string; title: string; kind: ContentBlock['type'] | 'slides' }> = [];
    topic.blocks.forEach((block, idx) => {
      const label =
        block.title?.trim() ||
        (block.type === 'summary'
          ? 'Краткая суть'
          : block.type === 'examTrap'
          ? 'На чём валят на экзамене'
          : block.type === 'table'
          ? 'Сравнительная таблица'
          : null);
      if (label) {
        items.push({ id: `reader-block-${idx}`, title: label, kind: block.type });
      }
    });
    if (relatedSlides.length > 0) {
      items.push({ id: 'reader-related-slides', title: 'Препараты по теме', kind: 'slides' });
    }
    return items;
  }, [topic.blocks, relatedSlides.length]);

  const scrollToAnchor = (anchorId: string) => {
    setTocOpen(false);
    triggerHaptic('light');
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      const target = document.getElementById(anchorId);
      if (!container || !target) return;
      const headerAllowance = Math.max(topInsetPx, 12) + 64;
      const offsetTop =
        target.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        headerAllowance;
      container.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
    });
  };

  // Палитра нейтралей по /unslop
  const pageBg = isDark ? 'bg-[#09090B] text-[#F4F4F5]' : 'bg-[#F5F5F7] text-[#18181B]';
  const headerBg = isDark
    ? 'bg-[#09090B]/90 border-white/[0.08]'
    : 'bg-[#F5F5F7]/92 border-black/[0.07]';
  const surface = isDark
    ? 'bg-[#131316] border border-white/[0.08]'
    : 'bg-white border border-black/[0.07]';
  const subtleSurface = isDark ? 'bg-[#1C1C21]' : 'bg-[#E9EBF0]';
  const bodyText = isDark ? 'text-[#D4D4D8]' : 'text-[#27272A]';
  const secondaryText = isDark ? 'text-[#A1A1AA]' : 'text-[#52525B]';
  const mutedText = isDark ? 'text-[#71717A]' : 'text-[#71717A]';
  const hairline = isDark ? 'border-white/[0.08]' : 'border-black/[0.07]';

  const renderBlock = (block: ContentBlock, idx: number) => {
    const anchorId = `reader-block-${idx}`;

    switch (block.type) {
      case 'summary':
        return (
          <section
            key={idx}
            id={anchorId}
            className={`rounded-2xl p-4 space-y-2 ${surface}`}
            style={{ borderLeftWidth: '3px', borderLeftColor: accentInk }}
          >
            <div className="text-[13px] font-semibold" style={{ color: accentInk }}>
              {block.title || 'Суть темы'}
            </div>
            <div className={`text-[15px] leading-[1.6] font-normal ${bodyText}`}>
              <RichGlossaryText text={block.text} onSelectTerm={onSelectTerm} accentHex={accentInk} />
            </div>
          </section>
        );

      case 'text':
        if (mode === 'brief') {
          return (
            <section key={idx} id={anchorId} className="space-y-1.5">
              {block.title && (
                <h2 className="text-[16px] font-semibold leading-snug tracking-[-0.01em]">
                  {block.title}
                </h2>
              )}
              <div className="flex items-start gap-3">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-2.5"
                  style={{ backgroundColor: accentInk }}
                />
                <div className={`text-[15px] leading-[1.55] font-normal ${bodyText}`}>
                  <RichGlossaryText
                    text={extractBriefSummary(block.text)}
                    onSelectTerm={onSelectTerm}
                    accentHex={accentInk}
                  />
                </div>
              </div>
            </section>
          );
        }

        return (
          <section key={idx} id={anchorId} className="space-y-2">
            {block.title && (
              <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">
                {block.title}
              </h2>
            )}
            <div className={`text-[15px] leading-[1.65] font-normal whitespace-pre-line ${bodyText}`}>
              <RichGlossaryText text={block.text} onSelectTerm={onSelectTerm} accentHex={accentInk} />
            </div>
          </section>
        );

      case 'list':
        return (
          <section key={idx} id={anchorId} className="space-y-3">
            {block.title && (
              <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">
                {block.title}
              </h2>
            )}
            <ol className="space-y-2.5">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.6] font-normal">
                  {block.ordered ? (
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-semibold tabular-nums shrink-0 mt-0.5"
                      style={{ backgroundColor: accentSoftBg, color: accentInk }}
                    >
                      {i + 1}
                    </span>
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-2.5 ml-1"
                      style={{ backgroundColor: accentInk }}
                    />
                  )}
                  <span className={bodyText}>
                    <RichGlossaryText text={item} onSelectTerm={onSelectTerm} accentHex={accentInk} />
                  </span>
                </li>
              ))}
            </ol>
          </section>
        );

      case 'table':
        return (
          <section key={idx} id={anchorId} className="space-y-3">
            {block.title && (
              <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">
                {block.title}
              </h2>
            )}
            {/* Мобильные сравнительные карточки вместо сжатой таблицы */}
            <div className="space-y-3">
              {block.rows.map((row, rIdx) => (
                <div key={rIdx} className={`rounded-2xl p-4 space-y-3 ${surface}`}>
                  <div className="text-[15px] font-semibold leading-snug">
                    <RichGlossaryText
                      text={row[0] || ''}
                      onSelectTerm={onSelectTerm}
                      accentHex={accentInk}
                    />
                  </div>
                  <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-black/[0.06]'}`}>
                    {row.slice(1).map((cell, cOffset) => {
                      const colLabel = block.headers[cOffset + 1];
                      return (
                        <div key={cOffset} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                          {colLabel && (
                            <div className={`text-[12px] font-medium ${mutedText}`}>{colLabel}</div>
                          )}
                          <div className={`text-[14px] leading-[1.55] font-normal ${bodyText}`}>
                            <RichGlossaryText text={cell} onSelectTerm={onSelectTerm} accentHex={accentInk} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'examTrap':
        return (
          <section
            key={idx}
            id={anchorId}
            className={`rounded-2xl p-4 flex items-start gap-3 ${
              isDark
                ? 'bg-[#1D1810] border border-amber-500/20'
                : 'bg-[#FFFBEB] border border-amber-600/20'
            }`}
            style={{ borderLeftWidth: '3px', borderLeftColor: isDark ? '#F59E0B' : '#B45309' }}
          >
            <AlertTriangle
              className={`w-4 h-4 mt-1 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}
              strokeWidth={1.5}
            />
            <div className="space-y-1 min-w-0">
              <div
                className={`text-[13px] font-semibold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}
              >
                {block.title || 'На чём валят на экзамене'}
              </div>
              <div className={`text-[14px] leading-[1.6] font-normal ${bodyText}`}>
                <RichGlossaryText text={block.text} onSelectTerm={onSelectTerm} accentHex={accentInk} />
              </div>
            </div>
          </section>
        );

      case 'qa':
        return (
          <section key={idx} id={anchorId} className="space-y-3">
            {block.title && (
              <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">
                {block.title}
              </h2>
            )}
            <div className="space-y-2.5">
              {block.items.map((item, qIdx) => (
                <div key={qIdx} className={`rounded-2xl p-4 space-y-2 ${surface}`}>
                  <div className="text-[14px] font-semibold" style={{ color: accentInk }}>
                    {item.q}
                  </div>
                  <div className={`text-[14px] leading-[1.6] font-normal ${bodyText}`}>
                    <RichGlossaryText text={item.a} onSelectTerm={onSelectTerm} accentHex={accentInk} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const hasContent = topic.blocks.length > 0 || fallbackBlocks.length > 0;
  const stickyTopPad = Math.max(topInsetPx, 12);

  return (
    <m.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={PAGE_TRANSITION}
      className={`fixed inset-0 z-40 flex flex-col ${pageBg}`}
    >
      {/* Липкая компактная шапка без дублирующего крестика */}
      <header
        style={{ paddingTop: `${stickyTopPad}px` }}
        className={`shrink-0 sticky top-0 z-20 backdrop-blur-md border-b ${headerBg}`}
      >
        <div className="max-w-md mx-auto px-4 pb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!isTelegramEnv && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Назад к разделу"
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${subtleSurface} ${secondaryText}`}
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}

            {/* Сегментированный переключатель Подробно | Кратко */}
            <div className={`inline-flex items-center p-1 rounded-xl ${subtleSurface}`}>
              {(
                [
                  { id: 'full', label: 'Подробно' },
                  { id: 'brief', label: 'Кратко' },
                ] as const
              ).map((tab) => {
                const active = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleModeChange(tab.id)}
                    className={`relative px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                      active
                        ? isDark
                          ? 'text-white'
                          : 'text-[#18181B]'
                        : secondaryText
                    }`}
                  >
                    {active && (
                      <m.span
                        layoutId="reader-mode-pill"
                        transition={IOS_SPRING}
                        className={`absolute inset-0 rounded-lg ${
                          isDark ? 'bg-[#27272D]' : 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                        }`}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {tocItems.length > 1 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTocOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors shrink-0 ${subtleSurface} ${secondaryText}`}
            >
              <List className="w-4 h-4" strokeWidth={1.5} />
              <span>Оглавление</span>
            </button>
          )}
        </div>

        {/* Тонкая GPU-полоска прогресса чтения */}
        <div className="h-[2px] w-full bg-transparent overflow-hidden">
          <div
            className="h-full w-full origin-left transition-transform duration-150"
            style={{
              transform: `scaleX(${readProgress})`,
              backgroundColor: accentInk,
            }}
          />
        </div>
      </header>

      {/* Полотно журнальной статьи */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-y-contain"
      >
        <article className="max-w-md mx-auto px-4 pt-6 pb-16">
          {/* Заголовок и метаданные темы */}
          <div
            className="space-y-3 pb-6 border-b mb-6"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}
          >
            <div className={`flex flex-wrap items-center gap-2 text-[12px] font-medium ${mutedText}`}>
              {topic.lessonNumber != null && (
                <span className="tabular-nums">Занятие {topic.lessonNumber}</span>
              )}
              {topic.lessonNumber != null && sectionTitle && <span>·</span>}
              {sectionTitle && <span className="truncate">{sectionTitle}</span>}
            </div>

            <h1 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.015em]">
              {topic.title}
            </h1>

            {topic.subtitle && (
              <p className={`text-[14px] leading-[1.5] font-normal ${secondaryText}`}>
                {topic.subtitle}
              </p>
            )}

            {topic.examQuestionIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className={`text-[12px] font-medium mr-1 ${mutedText}`}>Билеты</span>
                {topic.examQuestionIds.map((qNum) => (
                  <button
                    key={qNum}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onOpenQuestion?.(qNum);
                    }}
                    style={{
                      backgroundColor: accentSoftBg,
                      color: accentInk,
                      borderColor: accentBorder,
                    }}
                    className="px-2 py-0.5 rounded-md border text-[12px] font-medium tabular-nums transition-transform active:scale-95"
                  >
                    №{qNum}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Тело конспекта */}
          {hasContent ? (
            <div className="space-y-7">
              {topic.blocks.length > 0
                ? topic.blocks.map((block, idx) => renderBlock(block, idx))
                : fallbackBlocks.map((fb) => (
                    <section key={fb.id} className="space-y-2">
                      <h2 className="text-[17px] font-semibold leading-snug">{fb.title}</h2>
                      <div className={`text-[15px] leading-[1.65] whitespace-pre-line ${bodyText}`}>
                        <RichGlossaryText
                          text={mode === 'brief' ? extractBriefSummary(fb.summary) : fb.summary}
                          onSelectTerm={onSelectTerm}
                          accentHex={accentInk}
                        />
                      </div>
                      {fb.examTip && (
                        <div
                          className={`rounded-2xl p-4 text-[14px] leading-[1.55] ${surface}`}
                          style={{ borderLeftWidth: '3px', borderLeftColor: accentInk }}
                        >
                          <span className="font-semibold" style={{ color: accentInk }}>
                            На экзамене:{' '}
                          </span>
                          <RichGlossaryText
                            text={fb.examTip}
                            onSelectTerm={onSelectTerm}
                            accentHex={accentInk}
                          />
                        </div>
                      )}
                    </section>
                  ))}
            </div>
          ) : (
            <div className={`rounded-2xl p-6 text-center space-y-2 ${surface}`}>
              <BookOpen className={`w-5 h-5 mx-auto ${mutedText}`} strokeWidth={1.5} />
              <div className="text-[15px] font-semibold">Конспект готовится</div>
              <p className={`text-[14px] leading-relaxed ${secondaryText}`}>
                Раздел привязан к программе НГМУ и будет заполнен по кафедральным материалам.
              </p>
            </div>
          )}

          {/* Реальные препараты по этой теме (только если есть) */}
          {relatedSlides.length > 0 && (
            <section
              id="reader-related-slides"
              className={`mt-10 pt-6 border-t space-y-3 ${hairline}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold">Препараты по теме</h2>
                <span className={`text-[12px] font-medium tabular-nums ${mutedText}`}>
                  {relatedSlides.length}
                </span>
              </div>

              <div className="space-y-2">
                {relatedSlides.map((slide) => {
                  const showImg = Boolean(slide.imageUrl) && !brokenSlideImages[slide.id];
                  return (
                    <m.button
                      key={slide.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        triggerHaptic('light');
                        onOpenSlide?.(slide);
                      }}
                      className={`w-full rounded-2xl p-3 flex items-center gap-3 text-left transition-colors ${surface}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${subtleSurface}`}
                      >
                        {showImg ? (
                          <img
                            src={slide.imageUrl}
                            alt={slide.title}
                            loading="lazy"
                            onError={() =>
                              setBrokenSlideImages((prev) => ({ ...prev, [slide.id]: true }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Microscope className={`w-4 h-4 ${mutedText}`} strokeWidth={1.5} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[12px] font-medium tabular-nums shrink-0"
                            style={{ color: accentInk }}
                          >
                            №{slide.examNumber}
                          </span>
                          <span className="text-[14px] font-medium truncate">{slide.title}</span>
                        </div>
                        <div className={`text-[12px] truncate ${mutedText}`}>{slide.stain}</div>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 ${mutedText}`} strokeWidth={1.5} />
                    </m.button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Подвал статьи: отметка изучения и переход к следующей теме */}
          <footer className={`mt-10 pt-6 border-t space-y-3 ${hairline}`}>
            {onToggleCompleted && (
              <m.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic('medium');
                  onToggleCompleted(topic.id);
                }}
                style={
                  isCompleted
                    ? { backgroundColor: accentSoftBg, color: accentInk, borderColor: accentBorder }
                    : { backgroundColor: accentHex, color: textOnAccent, borderColor: accentHex }
                }
                className="w-full h-12 rounded-xl border px-4 flex items-center justify-center gap-2 text-[14px] font-medium transition-colors"
              >
                <Check className="w-4 h-4" strokeWidth={1.5} />
                <span>{isCompleted ? 'Тема изучена' : 'Отметить тему изученной'}</span>
              </m.button>
            )}

            {nextTopic && onOpenNextTopic && (
              <m.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  triggerHaptic('light');
                  onOpenNextTopic(nextTopic);
                }}
                className={`w-full rounded-2xl p-4 flex items-center justify-between gap-3 text-left transition-colors ${surface}`}
              >
                <div className="min-w-0 space-y-0.5">
                  <div className={`text-[12px] font-medium ${mutedText}`}>Следующая тема</div>
                  <div className="text-[14px] font-medium truncate">{nextTopic.title}</div>
                </div>
                <ArrowRight className={`w-4 h-4 shrink-0 ${secondaryText}`} strokeWidth={1.5} />
              </m.button>
            )}
          </footer>
        </article>
      </div>

      {/* Шторка оглавления */}
      <AnimatePresence>
        {tocOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: IOS_EASE }}
              onClick={() => setTocOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />
            <m.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SHEET_TRANSITION}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.35 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 72 || info.velocity.y > 400) {
                  setTocOpen(false);
                }
              }}
              className={`relative z-10 w-full max-w-md rounded-t-3xl border-t max-h-[72vh] flex flex-col ${
                isDark ? 'bg-[#131316] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-[#18181B]'
              }`}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className={`w-9 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/15'}`} />
              </div>

              <div className={`px-4 py-3 flex items-center justify-between border-b ${hairline}`}>
                <span className="text-[15px] font-semibold">Оглавление</span>
                <button
                  type="button"
                  onClick={() => setTocOpen(false)}
                  aria-label="Закрыть оглавление"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${subtleSurface} ${secondaryText}`}
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="overflow-y-auto p-3 space-y-1 pb-8">
                {tocItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToAnchor(item.id)}
                    className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-left transition-colors ${
                      isDark ? 'active:bg-white/[0.06]' : 'active:bg-black/[0.04]'
                    }`}
                  >
                    <span className={`text-[12px] font-medium tabular-nums w-5 shrink-0 ${mutedText}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[14px] font-normal leading-snug flex-1">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </m.div>
  );
};

export default TheoryReaderView;
