import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Slide, ReviewRating } from '../types';
import { useTelegram } from '../telegram/TelegramContext';

interface TrainerScreenProps {
  slides: Slide[];
  allSlides?: Slide[];
  sessionTitle: string;
  onRecordReview: (slideId: string, rating: ReviewRating) => Promise<void>;
  onClose: () => void;
}

export const TrainerScreen: React.FC<TrainerScreenProps> = ({
  slides,
  allSlides = slides,
  sessionTitle,
  onRecordReview,
  onClose,
}) => {
  const { hapticFeedback } = useTelegram();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [trainerMode, setTrainerMode] = useState<'quiz' | 'flashcard'>('quiz');

  const [sessionStats, setSessionStats] = useState({
    know: 0,
    doubt: 0,
    again: 0,
  });

  const currentSlide = slides[currentIndex];

  // Generate 4 randomized quiz distractors
  const quizOptions = useMemo(() => {
    if (!currentSlide) return [];
    const pool = new Set<string>();
    pool.add(currentSlide.title);

    currentSlide.quiz_distractors.forEach((d) => pool.add(d));

    if (pool.size < 4) {
      allSlides
        .filter((s) => s.id !== currentSlide.id)
        .forEach((s) => {
          if (pool.size < 4) pool.add(s.title);
        });
    }

    const arr = Array.from(pool).slice(0, 4);
    // Deterministic shuffle per slide id
    return arr.sort((a, b) => {
      const hashA = (a.length * 31 + a.charCodeAt(0)) % 100;
      const hashB = (b.length * 31 + b.charCodeAt(0)) % 100;
      return hashA - hashB;
    });
  }, [currentSlide, allSlides]);

  // Reset states on slide index change
  useEffect(() => {
    setShowAnnotations(false);
    setIsAnswerRevealed(false);
    setSelectedQuizOption(null);
  }, [currentIndex]);

  if (!currentSlide || sessionCompleted) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex flex-col items-center justify-center p-6 text-center safe-pt pb-24">
        <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0 space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Тренировка завершена!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {sessionTitle} — все препараты пройдены
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-emerald-50 p-3 rounded-2xl text-center">
              <div className="text-lg font-black text-emerald-700">{sessionStats.know}</div>
              <div className="text-[11px] text-emerald-600/90 font-medium mt-0.5">Знаю</div>
            </div>
            <div className="bg-amber-50 p-3 rounded-2xl text-center">
              <div className="text-lg font-black text-amber-700">{sessionStats.doubt}</div>
              <div className="text-[11px] text-amber-600/90 font-medium mt-0.5">Сомнение</div>
            </div>
            <div className="bg-rose-50 p-3 rounded-2xl text-center">
              <div className="text-lg font-black text-rose-700">{sessionStats.again}</div>
              <div className="text-[11px] text-rose-600/90 font-medium mt-0.5">Повторить</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 text-white rounded-[22px] font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            Вернуться к разделам
          </button>
        </div>
      </div>
    );
  }

  const handleRevealAnswer = () => {
    hapticFeedback.impactOccurred('light');
    setIsAnswerRevealed(true);
  };

  const handleSelectQuizOption = (option: string) => {
    if (selectedQuizOption) return;
    setSelectedQuizOption(option);
    setIsAnswerRevealed(true);

    if (option === currentSlide.title) {
      hapticFeedback.notificationOccurred('success');
    } else {
      hapticFeedback.notificationOccurred('error');
    }
  };

  const handleToggleAnnotations = () => {
    hapticFeedback.impactOccurred('light');
    setShowAnnotations((prev) => !prev);
  };

  const handleRating = async (rating: ReviewRating) => {
    hapticFeedback.impactOccurred(rating === 'know' ? 'light' : 'medium');
    setSessionStats((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
    }));

    await onRecordReview(currentSlide.id, rating);

    if (currentIndex + 1 < slides.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const currentImageUrl = showAnnotations
    ? currentSlide.image_annotated_url
    : currentSlide.image_clean_url;

  return (
    <div className="min-h-screen bg-[#F2F4F7] flex flex-col pb-36 safe-pt">
      {/* Top Header Bar */}
      <header className="px-5 py-3 flex items-center justify-between sticky top-0 z-30 bg-[#F2F4F7]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              hapticFeedback.impactOccurred('light');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all active:scale-95"
          >
            <X strokeWidth={2} className="w-4 h-4" />
          </button>

          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              Срез {currentIndex + 1} из {slides.length}
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
              {sessionTitle}
            </div>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex items-center bg-white shadow-xs p-1 rounded-full text-xs">
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setTrainerMode('quiz');
            }}
            className={`px-3 py-1 rounded-full transition-all font-semibold ${
              trainerMode === 'quiz'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Тест
          </button>
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setTrainerMode('flashcard');
            }}
            className={`px-3 py-1 rounded-full transition-all font-semibold ${
              trainerMode === 'flashcard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Карточка
          </button>
        </div>
      </header>

      {/* Main Study Container */}
      <div className="px-4 py-2 space-y-3.5 max-w-lg mx-auto w-full flex-1">
        {/* Microscope Stage Viewport (46vh, rounded-24, deep dark lens #090D16) */}
        <div className="rounded-[24px] bg-[#090D16] overflow-hidden shadow-lg relative flex flex-col h-[46vh] min-h-[300px] border-0">
          <TransformWrapper
            initialScale={1}
            minScale={0.8}
            maxScale={4.5}
            centerOnInit
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Floating Translucent Zoom Controls (top-right over photo) */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-md">
                  <button
                    onClick={() => zoomIn(0.3)}
                    className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    title="Приблизить"
                  >
                    <ZoomIn strokeWidth={1.75} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => zoomOut(0.3)}
                    className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    title="Отдалить"
                  >
                    <ZoomOut strokeWidth={1.75} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    title="Сброс"
                  >
                    <RotateCcw strokeWidth={1.75} className="w-4 h-4" />
                  </button>
                </div>

                {/* Top-left stain & magnification badge over photo */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-[11px] font-medium shadow-md">
                  <span>{currentSlide.stain}</span>
                  <span className="text-white/40">•</span>
                  <span>{currentSlide.magnification}</span>
                </div>

                {/* Floating Pill Toggle Button at bottom center of photo */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                  <button
                    onClick={handleToggleAnnotations}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95 border-0 backdrop-blur-md ${
                      showAnnotations
                        ? 'bg-indigo-600 text-white shadow-indigo-600/40'
                        : 'bg-white/90 text-slate-800 hover:bg-white'
                    }`}
                  >
                    {showAnnotations ? (
                      <>
                        <EyeOff strokeWidth={1.75} className="w-3.5 h-3.5" />
                        <span>Скрыть разметку</span>
                      </>
                    ) : (
                      <>
                        <Eye strokeWidth={1.75} className="w-3.5 h-3.5" />
                        <span>Показать слои</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Slide Viewport Canvas */}
                <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden">
                  <TransformComponent
                    wrapperClass="!w-full !h-full"
                    contentClass="!w-full !h-full flex items-center justify-center"
                  >
                    <img
                      src={currentImageUrl}
                      alt={currentSlide.title}
                      className="w-full h-full object-contain pointer-events-none transition-opacity duration-300"
                    />
                  </TransformComponent>
                </div>
              </>
            )}
          </TransformWrapper>
        </div>

        {/* Question & Duolingo-style Answer Cards */}
        {!isAnswerRevealed ? (
          trainerMode === 'flashcard' ? (
            <div className="bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0 text-center space-y-3.5">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Изучите препарат в окуляре, сопоставьте слои стенки и назовите орган
              </p>
              <button
                onClick={handleRevealAnswer}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[22px] text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-indigo-600/20"
              >
                <BookOpen strokeWidth={1.75} className="w-4 h-4" />
                <span>Показать ответ и разбор</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-500 px-1">
                Выберите диагноз микропрепарата:
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {quizOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectQuizOption(opt)}
                    className="w-full rounded-2xl bg-white py-3.5 px-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] border-2 border-transparent active:scale-[0.98] hover:shadow-md transition-all text-left flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 transition-colors">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 leading-snug truncate">
                        {opt}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          trainerMode === 'quiz' && (
            <div className="space-y-2">
              {quizOptions.map((opt, i) => {
                const isCorrect = opt === currentSlide.title;
                const isSelected = selectedQuizOption === opt;

                let cardStyle =
                  'bg-white/60 text-slate-400 opacity-50 border-2 border-transparent';
                let badgeStyle = 'bg-slate-100 text-slate-400';

                if (isCorrect) {
                  // Duolingo-style smooth emerald green flood
                  cardStyle =
                    'bg-emerald-500 text-white font-bold border-2 border-emerald-500 shadow-lg shadow-emerald-500/20';
                  badgeStyle = 'bg-white/20 text-white';
                } else if (isSelected && !isCorrect) {
                  // Duolingo-style smooth coral red flood
                  cardStyle =
                    'bg-rose-500 text-white font-bold border-2 border-rose-500 shadow-lg shadow-rose-500/20';
                  badgeStyle = 'bg-white/20 text-white';
                }

                return (
                  <div
                    key={i}
                    className={`w-full rounded-2xl py-3.5 px-4 transition-all duration-300 flex items-center justify-between gap-3 ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${badgeStyle}`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm leading-snug truncate">{opt}</span>
                    </div>
                    {isCorrect ? (
                      <CheckCircle2 strokeWidth={2} className="w-5 h-5 text-white shrink-0" />
                    ) : isSelected ? (
                      <AlertCircle strokeWidth={2} className="w-5 h-5 text-white shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Explanatory Breakdown Card */}
        {isAnswerRevealed && (
          <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Эталонный разбор
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-2">
                  {currentSlide.title}
                </h3>
              </div>
              {selectedQuizOption && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    selectedQuizOption === currentSlide.title
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {selectedQuizOption === currentSlide.title ? 'Верно! 🎉' : 'Ошибка 💡'}
                </span>
              )}
            </div>

            {/* Главный отличительный признак */}
            <div className="bg-indigo-50/70 p-4 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-900 text-xs font-bold">
                <Sparkles strokeWidth={1.75} className="w-4 h-4 text-indigo-600" />
                <span>Главный отличительный признак</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {currentSlide.exam_checklist.killer_feature}
              </p>
            </div>

            {/* Слои и оболочки */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold px-0.5">
                <Layers strokeWidth={1.75} className="w-3.5 h-3.5" />
                <span>Оболочки и слои препарата:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-2xl">
                {currentSlide.exam_checklist.layers}
              </p>
            </div>

            {/* Ключевые клетки */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold px-0.5">
                <HelpCircle strokeWidth={1.75} className="w-3.5 h-3.5" />
                <span>Ключевые клетки:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-2xl">
                {currentSlide.exam_checklist.key_cells}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Docked Spaced Repetition Panel (Duolingo style 3 ratings) */}
      {isAnswerRevealed && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100 p-4 safe-pb shadow-lg">
          <div className="max-w-md mx-auto space-y-2">
            <div className="text-[11px] font-bold text-center text-slate-400">
              Оцените степень запоминания:
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleRating('again')}
                className="py-3 px-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all text-center active:scale-95"
              >
                <div>Не помню</div>
                <div className="text-[10px] text-rose-500 font-medium">1 день</div>
              </button>

              <button
                onClick={() => handleRating('doubt')}
                className="py-3 px-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all text-center active:scale-95"
              >
                <div>Сомневаюсь</div>
                <div className="text-[10px] text-amber-600 font-medium">3 дня</div>
              </button>

              <button
                onClick={() => handleRating('know')}
                className="py-3 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-all text-center active:scale-95"
              >
                <div>Знаю</div>
                <div className="text-[10px] text-emerald-600 font-medium">7+ дней</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
