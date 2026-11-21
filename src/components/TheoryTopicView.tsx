import React, { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, FileText, HelpCircle, Zap } from 'lucide-react';
import { ContentBlock, TheoryTopic } from '../data/curriculumTypes';
import { GlossaryTerm, RichGlossaryText } from '../data/glossaryData';

interface TheoryTopicViewProps {
  topic: TheoryTopic;
  fallbackBlocks?: Array<{ id: string; title: string; summary: string; examTip?: string }>;
  isDark: boolean;
  accentHex: string;
  onSelectTerm: (term: GlossaryTerm) => void;
  onOpenQuestion?: (questionNum: number) => void;
}

type TheoryViewMode = 'full' | 'brief';

const MODE_STORAGE_KEY = 'baza_theory_view_mode';
const MODE_SYNC_EVENT = 'baza-theory-mode-change';

function readTheoryMode(): TheoryViewMode {
  try {
    return localStorage.getItem(MODE_STORAGE_KEY) === 'brief' ? 'brief' : 'full';
  } catch {
    return 'full';
  }
}

function isComparisonTable(headers: string[]): boolean {
  if (headers.length !== 3) return false;
  const first = headers[0].toLowerCase();
  return (
    first.includes('признак') ||
    first.includes('критерий') ||
    first.includes('параметр') ||
    first.includes('период')
  );
}

export const TheoryTopicView: React.FC<TheoryTopicViewProps> = ({
  topic,
  fallbackBlocks = [],
  isDark,
  accentHex,
  onSelectTerm,
  onOpenQuestion,
}) => {
  const [viewMode, setViewMode] = useState<TheoryViewMode>(readTheoryMode);
  const [openQaKeys, setOpenQaKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onSync = (e: Event) => {
      const next = (e as CustomEvent<TheoryViewMode>).detail;
      if (next === 'full' || next === 'brief') setViewMode(next);
    };
    window.addEventListener(MODE_SYNC_EVENT, onSync);
    return () => window.removeEventListener(MODE_SYNC_EVENT, onSync);
  }, []);

  const changeViewMode = (mode: TheoryViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // ignore storage errors in restricted WebView
    }
    window.dispatchEvent(new CustomEvent<TheoryViewMode>(MODE_SYNC_EVENT, { detail: mode }));
  };

  const toggleQa = (key: string) =>
    setOpenQaKeys((prev) => ({ ...prev, [key]: !prev[key] }));

  const subCard = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-zinc-50 border border-black/[0.05]';
  const innerCard = isDark
    ? 'bg-white/[0.025] border border-white/[0.06]'
    : 'bg-white border border-black/[0.05]';
  const pillBg = isDark ? 'bg-white/[0.06]' : 'bg-zinc-200/75';
  const pillActive = isDark ? 'bg-[#222227] text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const subtle = isDark ? 'text-zinc-500' : 'text-zinc-400';
  const borderCol = isDark ? 'border-white/[0.06]' : 'border-black/[0.06]';

  const renderTableAsCards = (
    block: Extract<ContentBlock, { type: 'table' }>,
    idx: number
  ) => {
    const compareMode = isComparisonTable(block.headers);

    return (
      <div
        key={idx}
        data-block-id={block.id || undefined}
        className={`rounded-[18px] p-3.5 space-y-2.5 ${subCard}`}
      >
        {block.title && <div className="font-bold text-[14px] leading-snug">{block.title}</div>}

        <div className="space-y-2">
          {block.rows.map((row, rIdx) => {
            if (compareMode) {
              return (
                <div key={rIdx} className={`rounded-[14px] p-3 space-y-2 ${innerCard}`}>
                  <div className="text-[12px] font-extrabold leading-snug" style={{ color: accentHex }}>
                    {row[0]}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[1, 2].map((cIdx) => (
                      <div key={cIdx} className="space-y-0.5 min-w-0">
                        <div className={`text-[10.5px] font-bold uppercase tracking-wide ${subtle}`}>
                          {block.headers[cIdx]}
                        </div>
                        <div className={`text-[12px] leading-snug whitespace-pre-line ${muted}`}>
                          <RichGlossaryText text={row[cIdx] || ''} accentHex={accentHex} onSelectTerm={onSelectTerm} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={rIdx} className={`rounded-[14px] p-3 space-y-1.5 ${innerCard}`}>
                <div className="font-bold text-[13px] leading-snug">
                  <RichGlossaryText text={row[0] || ''} accentHex={accentHex} onSelectTerm={onSelectTerm} />
                </div>
                {row.slice(1).map((cell, offset) => {
                  const headerLabel = block.headers[offset + 1];
                  const showLabel = block.headers.length > 2 && Boolean(headerLabel);
                  return (
                    <div key={offset} className={`text-[12.5px] leading-relaxed whitespace-pre-line ${muted}`}>
                      {showLabel && (
                        <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                          {headerLabel}:{' '}
                        </span>
                      )}
                      <RichGlossaryText text={cell || ''} accentHex={accentHex} onSelectTerm={onSelectTerm} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case 'summary':
        return (
          <div
            key={idx}
            data-block-id={block.id || undefined}
            className="rounded-[18px] p-3.5 space-y-1.5"
            style={{ backgroundColor: `${accentHex}14` }}
          >
            {block.title && (
              <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: accentHex }}>
                {block.title}
              </div>
            )}
            <div className="text-[13px] leading-relaxed whitespace-pre-line">
              <RichGlossaryText text={block.text} accentHex={accentHex} onSelectTerm={onSelectTerm} />
            </div>
          </div>
        );

      case 'text':
        return (
          <div
            key={idx}
            data-block-id={block.id || undefined}
            className={`rounded-[18px] p-3.5 space-y-1.5 ${subCard}`}
          >
            {block.title && <div className="font-bold text-[14px]">{block.title}</div>}
            <div className={`text-[13px] leading-relaxed whitespace-pre-line ${muted}`}>
              <RichGlossaryText text={block.text} accentHex={accentHex} onSelectTerm={onSelectTerm} />
            </div>
          </div>
        );

      case 'list':
        return (
          <div
            key={idx}
            data-block-id={block.id || undefined}
            className={`rounded-[18px] p-3.5 space-y-2 ${subCard}`}
          >
            {block.title && <div className="font-bold text-[14px]">{block.title}</div>}
            <div className="space-y-2">
              {block.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                  >
                    {block.ordered ? i + 1 : '•'}
                  </span>
                  <span className={muted}>
                    <RichGlossaryText text={item} accentHex={accentHex} onSelectTerm={onSelectTerm} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'table':
        return renderTableAsCards(block, idx);

      case 'examTrap':
        return (
          <div
            key={idx}
            data-block-id={block.id || undefined}
            className="rounded-[18px] p-3.5 bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-[12.5px] leading-relaxed whitespace-pre-line"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-400">{block.title || 'На чём валят на экзамене'}: </span>
              <RichGlossaryText text={block.text} accentHex={accentHex} onSelectTerm={onSelectTerm} />
            </div>
          </div>
        );

      case 'qa':
        return (
          <div
            key={idx}
            data-block-id={block.id || undefined}
            className={`rounded-[18px] p-3.5 space-y-2 ${subCard}`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[14px]">
              <HelpCircle className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
              <span>{block.title || 'Дополнительные вопросы на экзамене'}</span>
            </div>
            <div className="space-y-1.5">
              {block.items.map((item, i) => {
                const qaKey = `${idx}_${i}`;
                const isOpen = !!openQaKeys[qaKey];
                return (
                  <div key={qaKey} className={`rounded-[14px] overflow-hidden ${innerCard}`}>
                    <button
                      type="button"
                      onClick={() => toggleQa(qaKey)}
                      className="w-full px-3 py-2.5 text-left flex items-start justify-between gap-2 text-[13px] font-semibold leading-snug"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 mt-0.5 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        } ${muted}`}
                      />
                    </button>
                    {isOpen && (
                      <div className={`px-3 pb-3 pt-2 text-[12.5px] leading-relaxed border-t ${borderCol} ${muted}`}>
                        <RichGlossaryText text={item.a} accentHex={accentHex} onSelectTerm={onSelectTerm} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
    }
  };

  const hasStructuredContent = topic.blocks.length > 0;
  const briefBlocks = topic.blocks.filter((b) => b.type === 'examTrap' || b.type === 'qa');
  const summaryFallback = topic.blocks.filter((b) => b.type === 'summary');

  return (
    <div className="space-y-3">
      {/* Верхняя строка: номера билетов + переключатель Подробно / Кратко */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {topic.examQuestionIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            <span className={`text-[11px] font-semibold flex items-center gap-1 mr-0.5 ${muted}`}>
              <FileText className="w-3 h-3" /> Билеты:
            </span>
            {topic.examQuestionIds.map((qNum) => (
              <button
                key={qNum}
                type="button"
                onClick={() => onOpenQuestion?.(qNum)}
                className="text-[11px] font-bold px-2 py-0.5 rounded-md transition active:scale-95"
                style={{ backgroundColor: `${accentHex}1A`, color: accentHex }}
              >
                №{qNum}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}

        {hasStructuredContent && (
          <div className={`inline-grid grid-cols-2 p-0.5 rounded-[12px] shrink-0 ${pillBg}`}>
            <button
              type="button"
              onClick={() => changeViewMode('full')}
              className={`px-2.5 py-1 rounded-[10px] text-[11.5px] font-bold transition-all ${
                viewMode === 'full' ? pillActive : muted
              }`}
            >
              Подробно
            </button>
            <button
              type="button"
              onClick={() => changeViewMode('brief')}
              className={`px-2.5 py-1 rounded-[10px] text-[11.5px] font-bold transition-all ${
                viewMode === 'brief' ? pillActive : muted
              }`}
            >
              Кратко
            </button>
          </div>
        )}
      </div>

      {hasStructuredContent ? (
        viewMode === 'brief' ? (
          <div className="space-y-2.5 animate-fadeIn">
            {topic.briefPoints && topic.briefPoints.length > 0 ? (
              <div className={`rounded-[18px] p-3.5 space-y-2.5 ${subCard}`}>
                <div className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider" style={{ color: accentHex }}>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Выжимка за 60 секунд</span>
                </div>
                <div className="space-y-2">
                  {topic.briefPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 mt-2"
                        style={{ backgroundColor: accentHex }}
                      />
                      <span>
                        <RichGlossaryText text={pt} accentHex={accentHex} onSelectTerm={onSelectTerm} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              summaryFallback.map((b, i) => renderBlock(b, i))
            )}

            {briefBlocks.map((b, i) => renderBlock(b, 100 + i))}
          </div>
        ) : (
          <div className="space-y-2.5 animate-fadeIn">
            {topic.blocks.map((block, idx) => renderBlock(block, idx))}
          </div>
        )
      ) : fallbackBlocks.length > 0 ? (
        fallbackBlocks.map((fb) => (
          <div key={fb.id} className={`rounded-[18px] p-3.5 space-y-2 ${subCard}`}>
            <div className="font-bold text-[14px]">{fb.title}</div>
            <div className={`text-[13px] leading-relaxed whitespace-pre-line ${muted}`}>
              <RichGlossaryText text={fb.summary} accentHex={accentHex} onSelectTerm={onSelectTerm} />
            </div>
            {fb.examTip && (
              <div className="p-2.5 rounded-[12px] text-[12px]" style={{ backgroundColor: `${accentHex}14` }}>
                <span className="font-bold" style={{ color: accentHex }}>На экзамене: </span>
                <RichGlossaryText text={fb.examTip} accentHex={accentHex} onSelectTerm={onSelectTerm} />
              </div>
            )}
          </div>
        ))
      ) : (
        <div className={`rounded-[18px] p-4 text-center space-y-1.5 ${subCard}`}>
          <BookOpen className="w-5 h-5 mx-auto opacity-50" />
          <div className="text-[13px] font-bold">Конспект темы готовится</div>
          <div className={`text-[12px] leading-snug ${muted}`}>{topic.subtitle}</div>
        </div>
      )}

      {hasStructuredContent && (
        <div className={`flex items-center gap-1.5 text-[11px] px-1 ${muted}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Проверено по программе кафедры НГМУ
        </div>
      )}
    </div>
  );
};
