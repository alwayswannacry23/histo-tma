import React from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, FileText } from 'lucide-react';
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

export const TheoryTopicView: React.FC<TheoryTopicViewProps> = ({
  topic,
  fallbackBlocks = [],
  isDark,
  accentHex,
  onSelectTerm,
  onOpenQuestion,
}) => {
  const subCard = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-zinc-50 border border-black/[0.05]';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderCol = isDark ? 'border-white/[0.08]' : 'border-black/[0.08]';

  const renderBlock = (block: ContentBlock, idx: number) => {
    switch (block.type) {
      case 'summary':
        return (
          <div
            key={idx}
            className="rounded-[18px] p-3.5 space-y-1.5"
            style={{ backgroundColor: `${accentHex}14` }}
          >
            {block.title && (
              <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: accentHex }}>
                {block.title}
              </div>
            )}
            <div className="text-[13px] leading-relaxed">
              <RichGlossaryText accentHex={accentHex} onSelectTerm={onSelectTerm} text={block.text} />
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={idx} className={`rounded-[18px] p-3.5 space-y-1.5 ${subCard}`}>
            {block.title && <div className="font-bold text-[14px]">{block.title}</div>}
            <div className={`text-[13px] leading-relaxed whitespace-pre-line ${muted}`}>
              <RichGlossaryText accentHex={accentHex} onSelectTerm={onSelectTerm} text={block.text} />
            </div>
          </div>
        );

      case 'list':
        return (
          <div key={idx} className={`rounded-[18px] p-3.5 space-y-2 ${subCard}`}>
            {block.title && <div className="font-bold text-[14px]">{block.title}</div>}
            <div className="space-y-1.5">
              {block.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                  >
                    {block.ordered ? i + 1 : '•'}
                  </span>
                  <span className={muted}>
                    <RichGlossaryText accentHex={accentHex} onSelectTerm={onSelectTerm} text={item} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'table':
        return (
          <div key={idx} className={`rounded-[18px] overflow-hidden ${subCard}`}>
            {block.title && <div className="px-3.5 pt-3 pb-2 font-bold text-[14px]">{block.title}</div>}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className={`border-b ${borderCol}`}>
                    {block.headers.map((h, i) => (
                      <th key={i} className="py-2 px-3 font-bold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-black/[0.05]'}`}>
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className={`py-2 px-3 align-top leading-snug ${cIdx === 0 ? 'font-semibold' : muted}`}>
                          <RichGlossaryText accentHex={accentHex} onSelectTerm={onSelectTerm} text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'examTrap':
        return (
          <div
            key={idx}
            className="rounded-[18px] p-3.5 bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-[12.5px] leading-relaxed"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-400">{block.title || 'На чём валят на экзамене'}: </span>
              <RichGlossaryText accentHex={accentHex} onSelectTerm={onSelectTerm} text={block.text} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2.5">
      {topic.examQuestionIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] font-semibold flex items-center gap-1 mr-1 ${muted}`}>
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
      )}

      {topic.blocks.length > 0 ? (
        topic.blocks.map((block, idx) => renderBlock(block, idx))
      ) : fallbackBlocks.length > 0 ? (
        fallbackBlocks.map((fb) => (
          <div key={fb.id} className={`rounded-[18px] p-3.5 space-y-2 ${subCard}`}>
            <div className="font-bold text-[14px]">{fb.title}</div>
            <div className={`text-[13px] leading-relaxed whitespace-pre-line ${muted}`}>
              <RichGlossaryText accentHex={accentHex} onSelectTerm={onSelectTerm} text={fb.summary} />
            </div>
            {fb.examTip && (
              <div className="p-2.5 rounded-[12px] text-[12px]" style={{ backgroundColor: `${accentHex}14` }}>
                <span className="font-bold" style={{ color: accentHex }}>На экзамене: </span>
                <RichGlossaryText accentHex={accentHex} onSelectTerm={onSelectTerm} text={fb.examTip} />
              </div>
            )}
          </div>
        ))
      ) : (
        <div className={`rounded-[18px] p-4 text-center space-y-1.5 ${subCard}`}>
          <BookOpen className="w-5 h-5 mx-auto opacity-50" />
          <div className="text-[13px] font-bold">Конспект темы готов к заполнению</div>
          <div className={`text-[12px] leading-snug ${muted}`}>
            Слот привязан к программе НГМУ ({topic.subtitle}). Конспект будет добавлен строго по проверенным учебникам.
          </div>
        </div>
      )}

      {topic.blocks.length > 0 && (
        <div className={`flex items-center gap-1.5 text-[11px] px-1 ${muted}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Проверено по программе кафедры НГМУ
        </div>
      )}
    </div>
  );
};
