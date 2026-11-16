import React, { useState, useEffect, useMemo } from 'react';
import {
  TransformWrapper,
  TransformComponent,
} from 'react-zoom-pan-pinch';
import {
  X,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Slide, ReviewRating } from '../types';
import { useTelegram } from '../telegram/TelegramContext';

interface TrainerScreenProps {
  slides: Slide[];
  sessionTitle?: string;
  onClose: () => void;
  onRecordReview: (slideId: string, rating: ReviewRating) => Promise<void>;
}

export const TrainerScreen: React.FC<TrainerScreenProps> = ({
  slides,
  sessionTitle = 'Тренажер препаратов',
  onClose,
  onRecordReview,
}) => {
  const { hapticFeedback } = useTelegram();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [trainerMode, setTrainerMode] = useState<'quiz' | 'flashcard'>('quiz');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({ know: 0, doubt: 0, again: 0 });

  const currentSlide = slides[currentIndex];

  const quizOptions = useMemo(() => {
    if (!currentSlide) return [];
    const options = [currentSlide.title, ...currentSlide.quiz_distractors];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }, [currentSlide]);

  useEffect(() => {
    setIsAnswerRevealed(false);
    setShowAnnotations(false);
    setSelectedQuizOption(null);
  }, [currentIndex]);

  if (!currentSlide || sessionCompleted) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center safe-pt safe-pb">
        <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 strokeWidth={1.5} className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
            Сессия завершена
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Разобрано препаратов: {slides.length}
          </p>

          <div className="w-full grid grid-cols-3 gap-2 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-lg font-bold text-emerald-700">{sessionStats.know}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Знаю</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-lg font-bold text-amber-700">{sessionStats.doubt}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Сомнение</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-lg font-bold text-rose-700">{sessionStats.again}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Повторить</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors shadow-xs active:scale-[0.99]"
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
    hapticFeedback.impactOccurred('light');
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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col pb-36 safe-pt">
      {/* Top Header Bar */}
      <header className="px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 bg-[#F8F9FA]/95 backdrop-blur-md border-b border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              hapticFeedback.impactOccurred('light');
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors active:scale-95"
          >
            <X strokeWidth={1.5} className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {currentIndex + 1} из {slides.length}
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
              {sessionTitle}
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-white border border-slate-200/80 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setTrainerMode('quiz');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              trainerMode === 'quiz'
                ? 'bg-slate-900 text-white font-semibold'
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
            className={`px-2.5 py-1 rounded-md transition-colors ${
              trainerMode === 'flashcard'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Карточка
          </button>
        </div>
      </header>

      {/* Main Study Container */}
      <div className="px-4 py-3 space-y-3.5 max-w-lg mx-auto w-full flex-1">
        {/* Microscope Stage Viewport */}
        <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Top Info Bar of the Stage */}
          <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{currentSlide.stain}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{currentSlide.magnification}</span>
            </div>

            {/* Annotation Switcher Button */}
            <button
              onClick={handleToggleAnnotations}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                showAnnotations
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {showAnnotations ? (
                <>
                  <EyeOff strokeWidth={1.5} className="w-3.5 h-3.5" />
                  <span>Скрыть метки</span>
                </>
              ) : (
                <>
                  <Eye strokeWidth={1.5} className="w-3.5 h-3.5" />
                  <span>Обозначения</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Zoomable Slide Container */}
          <div className="relative bg-[#0F172A] h-64 sm:h-72 w-full flex items-center justify-center select-none overflow-hidden">
            <TransformWrapper
              initialScale={1}
              minScale={0.8}
              maxScale={4}
              centerOnInit
              wheel={{ step: 0.1 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Floating Zoom Controls */}
                  <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => zoomIn(0.3)}
                      className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10"
                      title="Приблизить"
                    >
                      <ZoomIn strokeWidth={1.5} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => zoomOut(0.3)}
                      className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10"
                      title="Отдалить"
                    >
                      <ZoomOut strokeWidth={1.5} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10"
                      title="Сброс"
                    >
                      <RotateCcw strokeWidth={1.5} className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      <img
                        src={currentImageUrl}
                        alt={currentSlide.title}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </TransformComponent>
                  </div>
                </>
              )}
            </TransformWrapper>
          </div>

          <div className="px-3.5 py-1.5 bg-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Зум двумя пальцами по экрану</span>
            <span>Интерактивный срез</span>
          </div>
        </div>

        {/* Question & Options Area */}
        {!isAnswerRevealed ? (
          trainerMode === 'flashcard' ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Изучите препарат, определите слои стенки и назовите орган
              </p>
              <button
                onClick={handleRevealAnswer}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <BookOpen strokeWidth={1.5} className="w-4 h-4" />
                <span>Показать ответ и разбор</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-600 px-0.5">
                Выберите диагноз препарата:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {quizOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectQuizOption(opt)}
                    className="w-full min-h-[50px] text-left px-4 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 active:border-slate-300 transition-colors font-medium text-xs text-slate-800 flex items-center justify-between gap-2"
                  >
                    <span className="leading-snug">{opt}</span>
                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-400 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          trainerMode === 'quiz' && (
            <div className="space-y-1.5">
              {quizOptions.map((opt, i) => {
                const isCorrect = opt === currentSlide.title;
                const isSelected = selectedQuizOption === opt;
                let cardStyle = 'bg-white border-slate-200/60 text-slate-400 opacity-60';

                if (isCorrect) {
                  cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                } else if (isSelected && !isCorrect) {
                  cardStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-semibold';
                }

                return (
                  <div
                    key={i}
                    className={`w-full min-h-[46px] text-left px-4 py-2.5 rounded-xl border transition-colors text-xs flex items-center justify-between gap-2 ${cardStyle}`}
                  >
                    <span className="leading-snug">{opt}</span>
                    {isCorrect ? (
                      <CheckCircle2 strokeWidth={1.5} className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isSelected ? (
                      <AlertCircle strokeWidth={1.5} className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Structured Diagnostic Breakdown Card */}
        {isAnswerRevealed && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                Эталонный разбор
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight mt-1.5">
                {currentSlide.title}
              </h3>
            </div>

            {/* Главный отличительный признак */}
            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold">
                <Sparkles strokeWidth={1.5} className="w-3.5 h-3.5 text-blue-600" />
                <span>Главный отличительный признак</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {currentSlide.exam_checklist.killer_feature}
              </p>
            </div>

            {/* Слои и оболочки */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <Layers strokeWidth={1.5} className="w-3.5 h-3.5" />
                <span>Оболочки и слои препарата:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl">
                {currentSlide.exam_checklist.layers}
              </p>
            </div>

            {/* Ключевые клетки */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <HelpCircle strokeWidth={1.5} className="w-3.5 h-3.5" />
                <span>Ключевые клетки:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl">
                {currentSlide.exam_checklist.key_cells}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Docked Bottom Spaced Repetition Panel */}
      {isAnswerRevealed && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3.5 safe-pb shadow-md">
          <div className="max-w-md mx-auto space-y-1.5">
            <div className="text-[11px] font-medium text-center text-slate-400">
              Оцените степень запоминания
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRating('again')}
                className="py-3 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-900 text-xs font-semibold transition-colors text-center active:scale-98"
              >
                <div>Не помню</div>
                <div className="text-[10px] text-rose-600 font-normal">1 день</div>
              </button>

              <button
                onClick={() => handleRating('doubt')}
                className="py-3 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/60 text-amber-950 text-xs font-semibold transition-colors text-center active:scale-98"
              >
                <div>Сомневаюсь</div>
                <div className="text-[10px] text-amber-700 font-normal">3 дня</div>
              </button>

              <button
                onClick={() => handleRating('know')}
                className="py-3 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 text-emerald-950 text-xs font-semibold transition-colors text-center active:scale-98"
              >
                <div>Знаю</div>
                <div className="text-[10px] text-emerald-700 font-normal">7+ дней</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
