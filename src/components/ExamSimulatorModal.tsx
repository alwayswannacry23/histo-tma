import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Eye, Microscope, RefreshCw, X } from 'lucide-react';
import { SituationalTaskItem } from '../data/curriculumTypes';

interface ExamSimulatorModalProps {
  questions: any[];
  slides: any[];
  electronograms: any[];
  tasks: SituationalTaskItem[];
  isDark: boolean;
  accentHex: string;
  textOnAccent: string;
  topInsetPx: number;
  onOpenSlide: (slide: any) => void;
  onClose: () => void;
}

function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTwoDistinct<T>(arr: T[]): T[] {
  if (arr.length <= 2) return arr;
  const copy = [...arr];
  const res: T[] = [];
  for (let i = 0; i < 2; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    res.push(copy.splice(idx, 1)[0]);
  }
  return res;
}

export const ExamSimulatorModal: React.FC<ExamSimulatorModalProps> = ({
  questions,
  slides,
  electronograms,
  tasks,
  isDark,
  accentHex,
  textOnAccent,
  topInsetPx,
  onOpenSlide,
  onClose,
}) => {
  const generateTicket = () => {
    const qPrivate = questions.filter((q) => Number(q.number || q.id) >= 58);
    const qGeneral = questions.filter((q) => {
      const n = Number(q.number || q.id);
      return n >= 18 && n <= 45;
    });
    const qCytoEmbryo = questions.filter((q) => {
      const n = Number(q.number || q.id);
      return (n >= 1 && n <= 17) || (n >= 46 && n <= 57);
    });

    return {
      q1: pickRandom(qPrivate.length ? qPrivate : questions),
      q2: pickRandom(qGeneral.length ? qGeneral : questions),
      q3: pickRandom(qCytoEmbryo.length ? qCytoEmbryo : questions),
      task: pickRandom(tasks),
      slides: pickTwoDistinct(slides),
      em: pickRandom(electronograms),
    };
  };

  const [ticket, setTicket] = useState(generateTicket);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [ticket]);

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const regenerate = () => {
    setTicket(generateTicket());
    setRevealedKeys({});
    setSecondsLeft(20 * 60);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const bg = isDark ? 'bg-[#09090B] text-white' : 'bg-[#F3F4F6] text-zinc-900';
  const card = isDark
    ? 'bg-[#141417] border border-white/[0.06]'
    : 'bg-white border border-black/[0.05] shadow-sm';
  const muted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div
      style={{ paddingTop: `${topInsetPx}px` }}
      className={`fixed inset-0 z-50 overflow-y-auto ${bg} px-4 pb-10`}
    >
      <div className="max-w-md mx-auto space-y-4 animate-fadeIn">
        {/* Шапка */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${card}`}
            aria-label="Закрыть симулятор"
          >
            <X className="w-4 h-4" />
          </button>
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[13px] font-bold"
            style={{ backgroundColor: `${accentHex}1F`, color: accentHex }}
          >
            <Clock className="w-3.5 h-3.5" />
            {mm}:{ss}
          </div>
          <button
            type="button"
            onClick={regenerate}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${card}`}
            aria-label="Новый билет"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h2 className="text-[22px] font-semibold tracking-tight">Симулятор билета НГМУ</h2>
          <p className={`text-[12.5px] mt-0.5 ${muted}`}>
            2-й этап экзамена: 3 вопроса · 1 задача · 2 слепых стекла · 1 ЭМ
          </p>
        </div>

        {/* Критическое правило кафедры */}
        <div className="rounded-[18px] p-3.5 bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-[12px] leading-snug">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-amber-400">Правило кафедры:</strong> незнание 1-го вопроса билета
            (Частная гистология) автоматически ведёт к оценке «неудовлетворительно».
          </span>
        </div>

        {/* 3 вопроса билета */}
        <div className={`rounded-[22px] p-4 space-y-3 ${card}`}>
          <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: accentHex }}>
            Теоретическая часть (3 вопроса)
          </div>
          {[
            { key: 'q1', label: 'Вопрос 1 · Частная гистология', item: ticket.q1 },
            { key: 'q2', label: 'Вопрос 2 · Общая гистология', item: ticket.q2 },
            { key: 'q3', label: 'Вопрос 3 · Цитология / Эмбриология / Методы', item: ticket.q3 },
          ].map(({ key, label, item }) => (
            <div key={key} className={`rounded-[16px] p-3 space-y-2 ${isDark ? 'bg-white/[0.03]' : 'bg-zinc-50'}`}>
              <div className={`text-[11px] font-bold ${muted}`}>{label}</div>
              <div className="font-bold text-[13.5px] leading-snug">
                {item ? `№${item.number || ''} ${item.title || item.question}` : 'Вопрос не загружен'}
              </div>
              {item && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleReveal(key)}
                    className="text-[12px] font-bold flex items-center gap-1"
                    style={{ color: accentHex }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {revealedKeys[key] ? 'Скрыть тезисы' : 'Показать тезисы ответа'}
                  </button>
                  {revealedKeys[key] && (
                    <div className={`text-[12.5px] leading-relaxed whitespace-pre-line pt-1 ${muted}`}>
                      {item.answer || item.summary || 'Краткий ответ готовится к загрузке.'}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Ситуационная задача */}
        <div className={`rounded-[22px] p-4 space-y-2.5 ${card}`}>
          <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: accentHex }}>
            Ситуационная задача
          </div>
          {ticket.task ? (
            <>
              <p className="text-[13.5px] leading-relaxed">{ticket.task.condition}</p>
              <button
                type="button"
                onClick={() => toggleReveal('task')}
                className="text-[12px] font-bold flex items-center gap-1"
                style={{ color: accentHex }}
              >
                <Eye className="w-3.5 h-3.5" />
                {revealedKeys.task ? 'Скрыть эталон' : 'Проверить эталон ответа'}
              </button>
              {revealedKeys.task && (
                <div className={`text-[12.5px] leading-relaxed ${muted}`}>{ticket.task.referenceAnswer}</div>
              )}
            </>
          ) : (
            <p className={`text-[12.5px] ${muted}`}>
              Слот под 55 ситуационных задач НГМУ подключён. После загрузки задач они будут выпадать здесь автоматически.
            </p>
          )}
        </div>

        {/* Практика: 2 немых препарата + 1 ЭМ */}
        <div className={`rounded-[22px] p-4 space-y-3 ${card}`}>
          <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: accentHex }}>
            Практические навыки (2 стекла + 1 ЭМ)
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {ticket.slides.map((slide, idx) => {
              const sKey = `slide_${idx}`;
              const revealed = revealedKeys[sKey];
              const imgSrc = slide?.imageUrl || slide?.image_clean_url || '';
              return (
                <div key={sKey} className={`rounded-[16px] overflow-hidden ${isDark ? 'bg-white/[0.03]' : 'bg-zinc-50'}`}>
                  <div className={`h-24 relative flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-zinc-100'}`}>
                    {imgSrc ? (
                      <img src={imgSrc} alt="Слепой препарат" className="w-full h-full object-cover" />
                    ) : (
                      <Microscope className="w-6 h-6 opacity-40 text-zinc-400" />
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenSlide(slide)}
                      className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-black/75 text-white flex items-center justify-center"
                      aria-label="Открыть в микроскопе"
                    >
                      <Microscope className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 space-y-1.5">
                    <div className="text-[11px] font-bold">Стекло #{idx + 1}</div>
                    {revealed ? (
                      <div className="text-[11.5px] font-semibold leading-snug">{slide.title}</div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleReveal(sKey)}
                        className="text-[11.5px] font-bold"
                        style={{ color: accentHex }}
                      >
                        Узнать название
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {ticket.em && (
            <div className={`rounded-[16px] p-3 space-y-1.5 ${isDark ? 'bg-white/[0.03]' : 'bg-zinc-50'}`}>
              <div className={`text-[11px] font-bold ${muted}`}>Электроннограмма</div>
              <div className="font-bold text-[13.5px]">
                {revealedKeys.em ? ticket.em.title : '«Немая» ЭМ — нажмите, чтобы проверить себя'}
              </div>
              <button
                type="button"
                onClick={() => toggleReveal('em')}
                className="text-[12px] font-bold flex items-center gap-1"
                style={{ color: accentHex }}
              >
                <Eye className="w-3.5 h-3.5" />
                {revealedKeys.em ? 'Скрыть ответ' : 'Показать разбор ЭМ'}
              </button>
              {revealedKeys.em && (
                <div className={`text-[12px] leading-relaxed ${muted}`}>
                  {ticket.em.keyFeature || ticket.em.description || ticket.em.summary}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={regenerate}
          style={{ backgroundColor: accentHex, color: textOnAccent }}
          className="w-full py-3.5 rounded-[18px] font-bold text-[14px] active:scale-[0.98] transition"
        >
          Вытянуть другой билет
        </button>
      </div>
    </div>
  );
};
