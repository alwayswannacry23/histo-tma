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
  const [trainerMode, setTrainerMode] = useState<'flashcard' | 'quiz'>('quiz');
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({ know: 0, doubt: 0, again: 0 });

  const currentSlide = slides[currentIndex];

  // Shuffle quiz options (title + 3 distractors) once per slide
  const quizOptions = useMemo(() => {
    if (!currentSlide) return [];
    const options = [currentSlide.title, ...currentSlide.quiz_distractors];
    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }, [currentSlide]);

  // Reset state on slide change
  useEffect(() => {
    setIsAnswerRevealed(false);
    setShowAnnotations(false);
    setSelectedQuizOption(null);
  }, [currentIndex]);

  if (!currentSlide || sessionCompleted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center safe-pt safe-pb">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
          <CheckCircle2 strokeWidth={1.5} className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Сессия завершена!</h2>
        <p className="text-xs text-slate-500 mb-6">
          Вы разобрали {slides.length} препаратов текущей сессии
        </p>

        {/* Breakdown of responses */}
        <div className="w-full max-w-xs grid grid-cols-3 gap-2 mb-8">
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
            <div className="text-lg font-bold text-emerald-700">{sessionStats.know}</div>
            <div className="text-[10px] text-emerald-800 uppercase font-semibold">Знаю</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
            <div className="text-lg font-bold text-amber-700">{sessionStats.doubt}</div>
            <div className="text-[10px] text-amber-800 uppercase font-semibold">Сомнение</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
            <div className="text-lg font-bold text-rose-700">{sessionStats.again}</div>
            <div className="text-[10px] text-rose-800 uppercase font-semibold">Повторить</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full max-w-xs py-3.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm"
        >
          Вернуться к модулям
        </button>
      </div>
    );
  }

  const handleRevealAnswer = () => {
    hapticFeedback.impactOccurred('light');
    setIsAnswerRevealed(true);
  };

  const handleSelectQuizOption = (option: string) => {
    if (selectedQuizOption) return; // already answered
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
    <div className="min-h-screen bg-white flex flex-col pb-36 safe-pt">
      {/* Top Navigation Bar */}
      <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              hapticFeedback.impactOccurred('light');
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {sessionTitle}
            </div>
            <div className="text-xs font-bold text-slate-800">
              Препарат {currentIndex + 1} из {slides.length}
            </div>
          </div>
        </div>

        {/* Mode switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setTrainerMode('quiz');
            }}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
              trainerMode === 'quiz'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
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
            className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
              trainerMode === 'flashcard'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Карточка
          </button>
        </div>
      </header>

      {/* Session Progress Line */}
      <div className="w-full bg-slate-100 h-1">
        <div
          className="bg-slate-900 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>

      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Photo Area with Pinch Zoom Pan */}
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs">
          <TransformWrapper
            initialScale={1}
            minScale={0.8}
            maxScale={4}
            centerOnInit
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Floating micro controls */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200 text-[11px] text-slate-700 shadow-xs">
                  <span className="font-semibold text-slate-900">Увеличение:</span>
                  <span>{currentSlide.magnification}</span>
                </div>

                <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-xs">
                  <button
                    onClick={() => zoomIn(0.3)}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
                    title="Приблизить"
                  >
                    <ZoomIn strokeWidth={1.5} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => zoomOut(0.3)}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
                    title="Отдалить"
                  >
                    <ZoomOut strokeWidth={1.5} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
                    title="Сброс масштаба"
                  >
                    <RotateCcw strokeWidth={1.5} className="w-4 h-4" />
                  </button>
                </div>

                {/* Transform component containing microscope slide */}
                <div className="h-64 sm:h-72 w-full flex items-center justify-center cursor-grab active:cursor-grabbing bg-slate-100 select-none">
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

                {/* Bottom Overlay Controls inside Photo Box */}
                <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">
                    Окраска: <strong className="text-slate-800">{currentSlide.stain}</strong>
                  </span>

                  {/* Toggle Annotations button */}
                  <button
                    onClick={handleToggleAnnotations}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      showAnnotations
                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {showAnnotations ? (
                      <>
                        <EyeOff strokeWidth={1.5} className="w-3.5 h-3.5" />
                        <span>Скрыть маркеры</span>
                      </>
                    ) : (
                      <>
                        <Eye strokeWidth={1.5} className="w-3.5 h-3.5" />
                        <span>Показать обозначения</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </TransformWrapper>
        </div>

        {/* Self-check Mode OR Quiz Mode */}
        {!isAnswerRevealed ? (
          trainerMode === 'flashcard' ? (
            /* Flashcard Self-Check */
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="text-xs text-slate-500">
                Изучите препарат, определите слои, ключевые структуры и назовите орган
              </div>
              <button
                onClick={handleRevealAnswer}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <BookOpen strokeWidth={1.5} className="w-4 h-4" />
                <span>Показать ответ и разбор</span>
              </button>
            </div>
          ) : (
            /* Quiz Mode (4 choices) */
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                Выберите диагноз препарата:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {quizOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectQuizOption(opt)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-all font-medium text-sm text-slate-800 flex items-center justify-between"
                  >
                    <span>{opt}</span>
                    <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-xs text-slate-400">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          /* Quiz Results feedback (if quiz mode was active) */
          trainerMode === 'quiz' && (
            <div className="space-y-1.5 mb-2">
              {quizOptions.map((opt, i) => {
                const isCorrect = opt === currentSlide.title;
                const isSelected = selectedQuizOption === opt;
                let btnStyle = 'border-slate-200 bg-slate-50 text-slate-500 opacity-60';

                if (isCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'border-rose-400 bg-rose-50 text-rose-900 font-semibold';
                }

                return (
                  <div
                    key={i}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
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

        {/* Structured Breakdown Card (Revealed after answer) */}
        {isAnswerRevealed && (
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 animate-fade-in">
            {/* Title & Badge */}
            <div className="border-b border-slate-200/80 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Экзаменационный эталон
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1.5">
                {currentSlide.title}
              </h3>
            </div>

            {/* Killer Feature (Главный отличительный признак) */}
            <div className="bg-white p-3.5 rounded-xl border border-blue-200/90 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles strokeWidth={1.5} className="w-3.5 h-3.5" />
                <span>Главный отличительный признак (Киллер-фича)</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {currentSlide.exam_checklist.killer_feature}
              </p>
            </div>

            {/* Layers (Оболочки и слои) */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <Layers strokeWidth={1.5} className="w-3.5 h-3.5" />
                <span>Оболочки и слои препарата:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                {currentSlide.exam_checklist.layers}
              </p>
            </div>

            {/* Key Cells (Ключевые клетки) */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <HelpCircle strokeWidth={1.5} className="w-3.5 h-3.5" />
                <span>Ключевые клеточные элементы:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                {currentSlide.exam_checklist.key_cells}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Spaced Repetition Panel */}
      {isAnswerRevealed && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 safe-pb shadow-lg">
          <div className="max-w-md mx-auto space-y-2">
            <div className="text-[11px] font-semibold text-center uppercase tracking-wider text-slate-400">
              Оцените степень запоминания
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* Again */}
              <button
                onClick={() => handleRating('again')}
                className="py-3 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold transition-all active:scale-[0.98] text-center"
              >
                <div>Не помню</div>
                <div className="text-[10px] font-normal text-rose-600 mt-0.5">Повтор: 1 день</div>
              </button>

              {/* Doubt */}
              <button
                onClick={() => handleRating('doubt')}
                className="py-3 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-all active:scale-[0.98] text-center"
              >
                <div>Сомневаюсь</div>
                <div className="text-[10px] font-normal text-amber-700 mt-0.5">Повтор: 3 дня</div>
              </button>

              {/* Know */}
              <button
                onClick={() => handleRating('know')}
                className="py-3 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold transition-all active:scale-[0.98] text-center"
              >
                <div>Знаю</div>
                <div className="text-[10px] font-normal text-emerald-700 mt-0.5">Повтор: 7+ дней</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
