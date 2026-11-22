import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  List,
  Microscope,
  X,
  Zap,
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

function firstSentence(text: string, maxLen = 140): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences[0] && sentences[0].trim().length <= maxLen + 20) {
    return sentences[0].trim();
  }
  return cleaned.slice(0, maxLen - 1).trimEnd() + '…';
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
  const [openQaKeys, setOpenQaKeys] = useState<Record<string, boolean>>({});
  const [expandedBriefRows, setExpandedBriefRows] = useState<Record<string, boolean>>({});
  const [brokenSlideImages, setBrokenSlideImages] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isTelegramEnv = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const wa = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
    return Boolean(wa?.initData);
  }, []);

  const accentInk = useMemo(() => getReadableAccent(accentHex, isDark), [accentHex, isDark]);
  const accentSoftBg = useMemo(() => hexWithAlpha(accentInk, isDark ? 0.14 : 0.1), [accentInk, isDark]);
  const accentBorder = useMemo(() => hexWithAlpha(accentInk, isDark ? 0.3 : 0.24), [accentInk, isDark]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
      setReadProgress(0);
    }
    setTocOpen(false);
    setOpenQaKeys({});
    setExpandedBriefRows({});
  }, [topic.id]);

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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hasExplicitBriefPoints = Boolean(topic.briefPoints && topic.briefPoints.length > 0);

  const tocItems = useMemo(() => {
    const items: Array<{ id: string; title: string }> = [];
    if (mode === 'brief' && hasExplicitBriefPoints) {
      items.push({ id: 'reader-brief-points', title: 'Выжимка за 60 секунд' });
      topic.blocks.forEach((block, idx) => {
        if (block.type === 'examTrap' || block.type === 'qa') {
          items.push({
            id: `reader-block-${idx}`,
            title:
              block.title?.trim() ||
              (block.type === 'examTrap' ? 'На чём валят на экзамене' : 'Вопросы самопроверки'),
          });
        }
      });
    } else {
      topic.blocks.forEach((block, idx) => {
        const label =
          block.title?.trim() ||
          (block.type === 'summary'
            ? 'Суть темы'
            : block.type === 'examTrap'
            ? 'На чём валят на экзамене'
            : block.type === 'table'
            ? 'Сравнение'
            : block.type === 'qa'
            ? 'Вопросы самопроверки'
            : null);
        if (label) {
          items.push({ id: `reader-block-${idx}`, title: label });
        }
      });
    }
    if (relatedSlides.length > 0) {
      items.push({ id: 'reader-related-slides', title: 'Препараты по теме' });
    }
    return items;
  }, [topic.blocks, mode, hasExplicitBriefPoints, relatedSlides.length]);

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

  const pageBg = isDark ? 'bg-[#09090B] text-[#F4F4F5]' : 'bg-[#F4F4F6] text-[#18181B]';
  const headerBg = isDark
    ? 'bg-[#09090B]/92 border-white/[0.08]'
    : 'bg-[#F4F4F6]/94 border-black/[0.07]';
  const surface = isDark
    ? 'bg-[#131316] border border-white/[0.08]'
    : 'bg-white border border-black/[0.07]';
  const subtleSurface = isDark ? 'bg-[#1C1C21]' : 'bg-[#E6E8EE]';
  const bodyText = isDark ? 'text-[#D4D4D8]' : 'text-[#27272A]';
  const secondaryText = isDark ? 'text-[#A1A1AA]' : 'text-[#52525B]';
  const mutedText = isDark ? 'text-[#71717A]' : 'text-[#71717A]';
  const hairline = isDark ? 'border-white/[0.08]' : 'border-black/[0.07]';

  const renderQaBlock = (block: Extract<ContentBlock, { type: 'qa' }>, idx: number) => (
    <section key={idx} id={`reader-block-${idx}`} className="space-y-3">
      <h2 className="text-[17px] font-semibold leading-snug tracking-tight">
        {block.title || 'Вопросы на экзамене'}
      </h2>
      <div className="space-y-2">
        {block.items.map((item, qIdx) => {
          const qaKey = `${idx}_${qIdx}`;
          const isOpen = Boolean(openQaKeys[qaKey]);
          return (
            <div key={qaKey} className={`rounded-2xl overflow-hidden ${surface}`}>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setOpenQaKeys((prev) => ({ ...prev, [qaKey]: !prev[qaKey] }));
                }}
                className="w-full p-4 text-left flex items-start justify-between gap-3"
              >
                <span className="text-[14px] font-medium leading-snug">{item.q}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${mutedText}`} strokeWidth={1.5} />
              </button>
              {isOpen && (
                <div
                  className={`px-4 pb-4 pt-3 text-[14px] leading-[1.6] border-t ${hairline} ${bodyText}`}
                >
                  <RichGlossaryText text={item.a} accentHex={accentInk} onSelectTerm={onSelectTerm} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderExamTrap = (block: Extract<ContentBlock, { type: 'examTrap' }>, idx: number) => (
    <section
      key={idx}
      id={`reader-block-${idx}`}
      className={`rounded-2xl p-4 flex items-start gap-3 ${
        isDark
          ? 'bg-[#1D1810] border border-amber-500/20'
          : 'bg-[#FFFBEB] border border-amber-600/20'
      }`}
      style={{ borderLeftWidth: '3px', borderLeftColor: isDark ? '#F59E0B' : '#B45309' }}
    >
      <AlertTriangle className={`w-4 h-4 mt-1 shrink-0 ${isDark ? "text-amber-400" : "text-amber-700"}`} strokeWidth={1.5} />
      <div className="space-y-1 min-w-0">
        <div
          className={`text-[13px] font-semibold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}
        >
          {block.title || 'На чём валят на экзамене'}
        </div>
        <div className={`text-[14px] leading-[1.6] font-normal ${bodyText}`}>
          <RichGlossaryText text={block.text} accentHex={accentInk} onSelectTerm={onSelectTerm} />
        </div>
      </div>
    </section>
  );

  const renderFullBlock = (block: ContentBlock, idx: number) => {
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
              <RichGlossaryText text={block.text} accentHex={accentInk} onSelectTerm={onSelectTerm} />
            </div>
          </section>
        );

      case 'text':
        return (
          <section key={idx} id={anchorId} className="space-y-2">
            {block.title && (
              <h2 className="text-[17px] font-semibold leading-snug tracking-tight">
                {block.title}
              </h2>
            )}
            <div className={`text-[15px] leading-[1.65] font-normal whitespace-pre-line ${bodyText}`}>
              <RichGlossaryText text={block.text} accentHex={accentInk} onSelectTerm={onSelectTerm} />
            </div>
          </section>
        );

      case 'list':
        return (
          <section key={idx} id={anchorId} className="space-y-3">
            {block.title && (
              <h2 className="text-[17px] font-semibold leading-snug tracking-tight">
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
                    <RichGlossaryText text={item} accentHex={accentInk} onSelectTerm={onSelectTerm} />
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
              <h2 className="text-[17px] font-semibold leading-snug tracking-tight">
                {block.title}
              </h2>
            )}
            <div className="space-y-3">
              {block.rows.map((row, rIdx) => (
                <div key={rIdx} className={`rounded-2xl p-4 space-y-2.5 ${surface}`}>
                  <div className="text-[15px] font-semibold leading-snug">
                    <RichGlossaryText text={row[0] || ""} accentHex={accentInk} onSelectTerm={onSelectTerm} />
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
                            <RichGlossaryText text={cell} accentHex={accentInk} onSelectTerm={onSelectTerm} />
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
        return renderExamTrap(block, idx);

      case 'qa':
        return renderQaBlock(block, idx);

      default:
        return null;
    }
  };

  // Режим «Кратко» для тем без готового topic.briefPoints: реально сжимает ВСЕ типы блоков
  const renderBriefFallbackBlock = (block: ContentBlock, idx: number) => {
    const anchorId = `reader-block-${idx}`;

    switch (block.type) {
      case 'summary':
        return (
          <section
            key={idx}
            id={anchorId}
            className={`rounded-2xl p-4 space-y-1.5 ${surface}`}
            style={{ borderLeftWidth: '3px', borderLeftColor: accentInk }}
          >
            <div className="text-[13px] font-semibold" style={{ color: accentInk }}>
              {block.title || 'Суть темы'}
            </div>
            <div className={`text-[14px] leading-[1.55] ${bodyText}`}>
              <RichGlossaryText text={block.text} accentHex={accentInk} onSelectTerm={onSelectTerm} />
            </div>
          </section>
        );

      case 'text':
        return (
          <section key={idx} id={anchorId} className="space-y-1">
            {block.title && (
              <h2 className="text-[15px] font-semibold leading-snug">{block.title}</h2>
            )}
            <div className="flex items-start gap-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                style={{ backgroundColor: accentInk }}
              />
              <div className={`text-[14px] leading-[1.5] ${bodyText}`}>
                <RichGlossaryText text={firstSentence(block.text, 130)} accentHex={accentInk} onSelectTerm={onSelectTerm} />
              </div>
            </div>
          </section>
        );

      case 'list': {
        const listKey = `list_${idx}`;
        const isExpanded = Boolean(expandedBriefRows[listKey]);
        const visibleItems = isExpanded ? block.items : block.items.slice(0, 3);
        const hiddenCount = block.items.length - visibleItems.length;

        return (
          <section key={idx} id={anchorId} className="space-y-2">
            {block.title && (
              <h2 className="text-[15px] font-semibold leading-snug">{block.title}</h2>
            )}
            <ul className="space-y-1.5">
              {visibleItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] leading-[1.45]">
                  <span
                    className="text-[12px] font-mono tabular-nums shrink-0 mt-0.5"
                    style={{ color: accentInk }}
                  >
                    {block.ordered ? `${i + 1}.` : '·'}
                  </span>
                  <span className={bodyText}>
                    <RichGlossaryText text={firstSentence(item, 110)} accentHex={accentInk} onSelectTerm={onSelectTerm} />
                  </span>
                </li>
              ))}
            </ul>
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  setExpandedBriefRows((prev) => ({ ...prev, [listKey]: true }))
                }
                className="text-[12px] font-medium"
                style={{ color: accentInk }}
              >
                Показать ещё {hiddenCount}
              </button>
            )}
          </section>
        );
      }

      case 'table':
        return (
          <section key={idx} id={anchorId} className="space-y-2">
            {block.title && (
              <h2 className="text-[15px] font-semibold leading-snug">{block.title}</h2>
            )}
            <div className={`rounded-2xl overflow-hidden divide-y ${surface} ${isDark ? 'divide-white/[0.06]' : 'divide-black/[0.06]'}`}>
              {block.rows.map((row, rIdx) => {
                const rowKey = `tbl_${idx}_${rIdx}`;
                const expanded = Boolean(expandedBriefRows[rowKey]);
                return (
                  <button
                    key={rIdx}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setExpandedBriefRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
                    }}
                    className="w-full px-3.5 py-2.5 text-left space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold leading-snug">{row[0]}</span>
                      <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${expanded ? "rotate-180" : ""} ${mutedText}`} strokeWidth={1.5} />
                    </div>
                    {!expanded ? (
                      <div className={`text-[12px] truncate ${secondaryText}`}>
                        {firstSentence(row[1] || '', 72)}
                      </div>
                    ) : (
                      <div className="pt-1 space-y-1.5">
                        {row.slice(1).map((cell, cOffset) => (
                          <div key={cOffset} className="text-[13px] leading-[1.45]">
                            {block.headers[cOffset + 1] && (
                              <span className={`font-medium ${mutedText}`}>
                                {block.headers[cOffset + 1]}:{' '}
                              </span>
                            )}
                            <span className={bodyText}>{cell}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );

      case 'examTrap':
        return renderExamTrap(block, idx);

      case 'qa':
        return renderQaBlock(block, idx);

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

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-y-contain"
      >
        <article className="max-w-md mx-auto px-4 pt-5 pb-16">
          {/* Заголовок и метаданные темы */}
          <div className={`space-y-3 pb-5 border-b mb-6 ${hairline}`}>
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

            {mode === 'brief' && hasContent && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium"
                style={{ backgroundColor: accentSoftBg, color: accentInk }}
              >
                <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Шпаргалка · только тезисы и ловушки</span>
              </div>
            )}
          </div>

          {/* Тело конспекта */}
          {hasContent ? (
            mode === 'brief' && hasExplicitBriefPoints ? (
              <div className="space-y-6">
                <section
                  id="reader-brief-points"
                  className={`rounded-2xl p-4 space-y-3 ${surface}`}
                  style={{ borderLeftWidth: '3px', borderLeftColor: accentInk }}
                >
                  <div className="text-[13px] font-semibold" style={{ color: accentInk }}>
                    Выжимка за 60 секунд
                  </div>
                  <ul className="space-y-2.5">
                    {topic.briefPoints!.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] leading-[1.55]">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                          style={{ backgroundColor: accentInk }}
                        />
                        <span className={bodyText}>
                          <RichGlossaryText text={pt} accentHex={accentInk} onSelectTerm={onSelectTerm} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                {topic.blocks.map((block, idx) => {
                  if (block.type === 'examTrap') return renderExamTrap(block, idx);
                  if (block.type === 'qa') return renderQaBlock(block, idx);
                  return null;
                })}
              </div>
            ) : (
              <div className={mode === 'brief' ? 'space-y-5' : 'space-y-7'}>
                {topic.blocks.length > 0
                  ? topic.blocks.map((block, idx) =>
                      mode === 'brief' ? renderBriefFallbackBlock(block, idx) : renderFullBlock(block, idx)
                    )
                  : fallbackBlocks.map((fb) => (
                      <section key={fb.id} className="space-y-2">
                        <h2 className="text-[17px] font-semibold leading-snug">{fb.title}</h2>
                        <div className={`text-[15px] leading-[1.65] whitespace-pre-line ${bodyText}`}>
                          <RichGlossaryText text={mode === "brief" ? firstSentence(fb.summary, 140) : fb.summary} accentHex={accentInk} onSelectTerm={onSelectTerm} />
                        </div>
                        {fb.examTip && (
                          <div
                            className={`rounded-2xl p-4 text-[14px] leading-[1.55] ${surface}`}
                            style={{ borderLeftWidth: '3px', borderLeftColor: accentInk }}
                          >
                            <span className="font-semibold" style={{ color: accentInk }}>
                              На экзамене:{' '}
                            </span>
                            <RichGlossaryText text={fb.examTip} accentHex={accentInk} onSelectTerm={onSelectTerm} />
                          </div>
                        )}
                      </section>
                    ))}
              </div>
            )
          ) : (
            <div className={`rounded-2xl p-6 text-center space-y-2 ${surface}`}>
              <BookOpen className={`w-5 h-5 mx-auto ${mutedText}`} strokeWidth={1.5} />
              <div className="text-[15px] font-semibold">Конспект готовится</div>
              <p className={`text-[14px] leading-relaxed ${secondaryText}`}>
                Раздел привязан к программе НГМУ и будет заполнен по кафедральным материалам.
              </p>
            </div>
          )}

          {/* Реальные препараты по теме */}
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
                            className="text-[12px] font-mono font-medium tabular-nums shrink-0"
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

          {/* Подвал статьи */}
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
                    <span className={`text-[12px] font-mono font-medium tabular-nums w-5 shrink-0 ${mutedText}`}>
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