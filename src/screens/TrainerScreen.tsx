import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Shuffle quiz options (title + 3 distractors) once per slide
  const quizOptions = useMemo(() => {
    if (!currentSlide) return [];
    const options = [currentSlide.title, ...currentSlide.quiz_distractors];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }, [currentSlide]);

  // Reset state on slide index change
  useEffect(() => {
    setIsAnswerRevealed(false);
    setShowAnnotations(false);
    setSelectedQuizOption(null);
  }, [currentIndex]);

  if (!currentSlide || sessionCompleted) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center p-6 text-center safe-pt safe-pb">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <CheckCircle2 strokeWidth={1.5} className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
            Сессия завершена
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Разобрано {slides.length} микропрепаратов
          </p>

          <div className="w-full grid grid-cols-3 gap-2 mb-6">
            <div className="bg-emerald-50/70 p-3 rounded-2xl text-center">
              <div className="text-lg font-bold text-emerald-700">{sessionStats.know}</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Знаю</div>
            </div>
            <div className="bg-amber-50/70 p-3 rounded-2xl text-center">
              <div className="text-lg font-bold text-amber-700">{sessionStats.doubt}</div>
              <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Сомнение</div>
            </div>
            <div className="bg-rose-50/70 p-3 rounded-2xl text-center">
              <div className="text-lg font-bold text-rose-700">{sessionStats.again}</div>
              <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Повтор</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]"
          >
            Вернуться к модулям
          </button>
        </motion.div>
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
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col pb-36 safe-pt">
      {/* Top Header Bar */}
      <header className="px-4 py-3 flex items-center justify-between sticky top-0 z-30 bg-[#F4F5F7]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              hapticFeedback.impactOccurred('light');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white shadow-ios flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all active:scale-95"
          >
            <X strokeWidth={1.5} className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {currentIndex + 1} из {slides.length}
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
              {sessionTitle}
            </div>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex items-center bg-white p-1 rounded-full shadow-ios">
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setTrainerMode('quiz');
            }}
            className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
              trainerMode === 'quiz'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Тест
          </button>
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setTrainerMode('flashcard');
            }}
            className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
              trainerMode === 'flashcard'
                ? 'bg-slate-900 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Карточка
          </button>
        </div>
      </header>

      {/* Dynamic Slide Container with Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="px-4 py-2 space-y-4 max-w-lg mx-auto w-full flex-1"
        >
          {/* Microscope Photo Viewer - Min 45% Height, Deep Dark Contrast BG */}
          <div className="relative rounded-3xl bg-[#0F172A] overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.16)] flex flex-col h-[46vh] min-h-[330px]">
            <TransformWrapper
              initialScale={1}
              minScale={0.8}
              maxScale={4}
              centerOnInit
              wheel={{ step: 0.1 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Top Glassmorphism Badges */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
                    <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white/90 border border-white/10 shadow-xs">
                      {currentSlide.magnification}
                    </span>
                    <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white/90 border border-white/10 shadow-xs">
                      {currentSlide.stain}
                    </span>
                  </div>

                  {/* Top Right Zoom Controls */}
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-xs">
                    <button
                      onClick={() => zoomIn(0.3)}
                      className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      title="Приблизить"
                    >
                      <ZoomIn strokeWidth={1.5} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => zoomOut(0.3)}
                      className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      title="Отдалить"
                    >
                      <ZoomOut strokeWidth={1.5} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      title="Сброс"
                    >
                      <RotateCcw strokeWidth={1.5} className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pan & Zoom Microscopic Section */}
                  <div className="flex-1 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden">
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      <img
                        src={currentImageUrl}
                        alt={currentSlide.title}
                        className="w-full h-full object-contain filter drop-shadow-md pointer-events-none"
                      />
                    </TransformComponent>
                  </div>

                  {/* Bottom Annotation Switcher Bar */}
                  <div className="p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between z-20">
                    <span className="text-[11px] text-white/60 font-medium tracking-wide">
                      Жест: 2 пальца для зума
                    </span>

                    <button
                      onClick={handleToggleAnnotations}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all backdrop-blur-md ${
                        showAnnotations
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white/20 hover:bg-white/30 text-white'
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
                          <span>Обозначения слоев</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </TransformWrapper>
          </div>

          {/* Practice Modes */}
          {!isAnswerRevealed ? (
            trainerMode === 'flashcard' ? (
              /* Flashcard Mode */
              <div className="bg-white p-5 rounded-3xl shadow-ios text-center space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Определите структуру среза, границы слоев и назовите орган
                </p>
                <button
                  onClick={handleRevealAnswer}
                  className="w-full min-h-[56px] py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <BookOpen strokeWidth={1.5} className="w-4 h-4" />
                  <span>Показать ответ и разбор</span>
                </button>
              </div>
            ) : (
              /* Quiz Mode (4 tactile options, min 56px height) */
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 gap-2.5">
                  {quizOptions.map((opt, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectQuizOption(opt)}
                      className="w-full min-h-[56px] text-left p-4 rounded-2xl bg-white hover:bg-slate-50/80 shadow-ios transition-all font-semibold text-sm text-slate-800 flex items-center justify-between"
                    >
                      <span className="leading-snug">{opt}</span>
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-400 shrink-0 ml-2">
                        {String.fromCharCode(65 + i)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )
          ) : (
            /* Quiz Mode Answer States */
            trainerMode === 'quiz' && (
              <div className="space-y-2 mb-2">
                {quizOptions.map((opt, i) => {
                  const isCorrect = opt === currentSlide.title;
                  const isSelected = selectedQuizOption === opt;
                  let cardStyle = 'bg-white/60 text-slate-400 opacity-60';

                  if (isCorrect) {
                    cardStyle = 'bg-emerald-50 text-emerald-950 font-bold shadow-sm';
                  } else if (isSelected && !isCorrect) {
                    cardStyle = 'bg-rose-50 text-rose-950 font-bold shadow-sm';
                  }

                  return (
                    <div
                      key={i}
                      className={`w-full min-h-[52px] text-left px-4 py-3 rounded-2xl transition-all text-xs flex items-center justify-between ${cardStyle}`}
                    >
                      <span className="leading-snug">{opt}</span>
                      {isCorrect ? (
                        <CheckCircle2 strokeWidth={1.5} className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                      ) : isSelected ? (
                        <AlertCircle strokeWidth={1.5} className="w-4 h-4 text-rose-500 shrink-0 ml-2" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Structured Clinical Breakdown Card */}
          {isAnswerRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-5 shadow-ios space-y-4"
            >
              {/* Title Header */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  Эталон ответа
                </span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-2 leading-snug">
                  {currentSlide.title}
                </h3>
              </div>

              {/* Главный отличительный признак */}
              <div className="bg-blue-50/60 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold">
                  <Sparkles strokeWidth={1.5} className="w-4 h-4 text-blue-600" />
                  <span>Главный отличительный признак</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {currentSlide.exam_checklist.killer_feature}
                </p>
              </div>

              {/* Слои и оболочки */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <Layers strokeWidth={1.5} className="w-3.5 h-3.5" />
                  <span>Оболочки и слои препарата:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pl-5">
                  {currentSlide.exam_checklist.layers}
                </p>
              </div>

              {/* Ключевые клетки */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <HelpCircle strokeWidth={1.5} className="w-3.5 h-3.5" />
                  <span>Ключевые клетки:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pl-5">
                  {currentSlide.exam_checklist.key_cells}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Fixed Bottom Spaced Repetition Panel */}
      {isAnswerRevealed && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl p-4 safe-pb shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
          <div className="max-w-md mx-auto space-y-2">
            <div className="text-[11px] font-medium text-center text-slate-400">
              Оцените степень запоминания
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Again */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleRating('again')}
                className="py-3.5 px-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold transition-all text-center"
              >
                <div>Не помню</div>
                <div className="text-[10px] font-normal text-rose-600 mt-0.5">Повтор: 1 д</div>
              </motion.button>

              {/* Doubt */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleRating('doubt')}
                className="py-3.5 px-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold transition-all text-center"
              >
                <div>Сомневаюсь</div>
                <div className="text-[10px] font-normal text-amber-700 mt-0.5">Повтор: 3 д</div>
              </motion.button>

              {/* Know */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleRating('know')}
                className="py-3.5 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold transition-all text-center"
              >
                <div>Знаю</div>
                <div className="text-[10px] font-normal text-emerald-700 mt-0.5">Повтор: 7+ д</div>
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
