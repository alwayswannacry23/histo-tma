import React, { useState, useEffect, useMemo } from 'react';
import {
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
  ArrowLeft,
  Stethoscope,
  Compass,
  PlayCircle,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Slide, ReviewRating } from '../types';
import { useTelegram } from '../telegram/TelegramContext';
import { createHistologyFallbackSvg } from '../data/mockSlides';

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

  // Helper fallbacks for enriched fields
  const killerFeature =
    currentSlide?.exam_checklist?.killer_feature || currentSlide?.killerFeature || '';
  const layersText =
    currentSlide?.exam_checklist?.layers || currentSlide?.layers || '';
  const keyCellsText =
    currentSlide?.exam_checklist?.key_cells || currentSlide?.keyCells || '';
  const diffDiag =
    currentSlide?.differential_diagnosis ||
    currentSlide?.differentialDiagnosis ||
    currentSlide?.exam_checklist?.differential_diagnosis ||
    '';
  const clinical =
    currentSlide?.clinical_note ||
    currentSlide?.clinicalNote ||
    currentSlide?.exam_checklist?.clinical_note ||
    '';
  const videoQuery =
    currentSlide?.video_hint_query ||
    currentSlide?.videoHintQuery ||
    `${currentSlide?.title || ''} гистология препарат разбор`;

  // Generate 4 randomized quiz distractors
  const quizOptions = useMemo(() => {
    if (!currentSlide) return [];
    const pool = new Set<string>();
    pool.add(currentSlide.title);

    const distractors =
      currentSlide.quiz_distractors || currentSlide.distractors || [];
    distractors.forEach((d) => pool.add(d));

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
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 text-center safe-pt pb-28 transition-colors duration-200">
        <div className="bg-[var(--bg-card)] rounded-[24px] p-6 max-w-sm w-full shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-[var(--border-subtle)] space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Тренировка завершена!
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {sessionTitle} — все препараты пройдены
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-emerald-500/10 p-3 rounded-2xl text-center">
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{sessionStats.know}</div>
              <div className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 font-medium mt-0.5">Знаю</div>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-2xl text-center">
              <div className="text-lg font-black text-amber-600 dark:text-amber-400">{sessionStats.doubt}</div>
              <div className="text-[11px] text-amber-600/90 dark:text-amber-400/90 font-medium mt-0.5">Сомнение</div>
            </div>
            <div className="bg-rose-500/10 p-3 rounded-2xl text-center">
              <div className="text-lg font-black text-rose-600 dark:text-rose-400">{sessionStats.again}</div>
              <div className="text-[11px] text-rose-600/90 dark:text-rose-400/90 font-medium mt-0.5">Повторить</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-[22px] font-bold text-sm transition-all shadow-lg shadow-[var(--accent-shadow)] active:scale-[0.98]"
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

  const handleOpenYoutube = () => {
    hapticFeedback.impactOccurred('medium');
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(videoQuery)}`;
    window.open(url, '_blank');
  };

  const imageSrc = currentSlide.image_clean_url || currentSlide.imageUrl || '';

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col safe-pt transition-colors duration-200">
      {/* Top Header Bar (Safe area aware, avoiding native Telegram iOS button collision) */}
      <header className="px-4 pt-1 pb-2 flex items-center justify-between sticky top-0 z-30 bg-[var(--bg-page)]/95 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          {/* Always visible Exit button back to Home */}
          <button
            onClick={() => {
              hapticFeedback.impactOccurred('light');
              onClose();
            }}
            className="h-8 px-2.5 rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 border border-[var(--border-subtle)]"
            title="Выйти в меню"
          >
            <ArrowLeft strokeWidth={2.2} className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>

          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">
              Срез {currentIndex + 1} из {slides.length}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium truncate max-w-[130px] sm:max-w-[200px]">
              {sessionTitle}
            </div>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex items-center bg-[var(--bg-card)] shadow-xs p-1 rounded-full text-xs border border-[var(--border-subtle)]">
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setTrainerMode('quiz');
            }}
            className={`px-3 py-1 rounded-full transition-all font-bold ${
              trainerMode === 'quiz'
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Тест
          </button>
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setTrainerMode('flashcard');
            }}
            className={`px-3 py-1 rounded-full transition-all font-bold ${
              trainerMode === 'flashcard'
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Карточка
          </button>
        </div>
      </header>

      {/* Main Study Container: Adjusted height so 4 answers fit on phone screens */}
      <div className="px-4 py-1 space-y-3 max-w-lg mx-auto w-full flex-1 pb-44">
        {/* Microscope Stage Viewport (Compact 34vh, dark lens #090D16, no white bars) */}
        <div className="rounded-[22px] bg-[#090D16] overflow-hidden shadow-lg relative flex flex-col h-[34vh] min-h-[220px] max-h-[300px] border-0">
          <TransformWrapper
            initialScale={1}
            minScale={0.8}
            maxScale={4.5}
            centerOnInit
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Floating Translucent Zoom Controls */}
                <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/45 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-md">
                  <button
                    onClick={() => zoomIn(0.3)}
                    className="w-7 h-7 flex items-center justify-center text-white/90 hover:text-white rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    title="Приблизить"
                  >
                    <ZoomIn strokeWidth={1.75} className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => zoomOut(0.3)}
                    className="w-7 h-7 flex items-center justify-center text-white/90 hover:text-white rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    title="Отдалить"
                  >
                    <ZoomOut strokeWidth={1.75} className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="w-7 h-7 flex items-center justify-center text-white/90 hover:text-white rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    title="Сброс"
                  >
                    <RotateCcw strokeWidth={1.75} className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Top-left stain & magnification badge */}
                <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-white text-[10px] font-medium shadow-md">
                  <span>{currentSlide.stain}</span>
                  <span className="text-white/40">•</span>
                  <span>{currentSlide.magnification}</span>
                </div>

                {/* Floating Pill Toggle Button at bottom center of photo */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20">
                  <button
                    onClick={handleToggleAnnotations}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95 border-0 backdrop-blur-md ${
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
                    <div className="relative inline-block max-w-full max-h-full">
                      <img
                        src={imageSrc}
                        alt={currentSlide.title}
                        onError={(e) => {
                          e.currentTarget.src = createHistologyFallbackSvg(
                            currentSlide.title,
                            currentSlide.stain
                          );
                        }}
                        className="max-h-[34vh] max-w-full object-contain pointer-events-none select-none transition-opacity duration-300"
                      />

                      {/* Interactive Layer Pin Overlays */}
                      {showAnnotations &&
                        currentSlide.layer_annotations &&
                        currentSlide.layer_annotations.map((layer) => (
                          <div
                            key={layer.id}
                            style={{
                              left: `${layer.pin_x}%`,
                              top: `${layer.pin_y}%`,
                            }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-30"
                          >
                            <span
                              className="absolute -inset-1 rounded-full animate-ping opacity-35"
                              style={{ backgroundColor: layer.color }}
                            />
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md ring-2 ring-white/90"
                              style={{ backgroundColor: layer.color }}
                            >
                              {layer.number}
                            </div>
                            <div className="absolute top-6.5 left-1/2 -translate-x-1/2 bg-black/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                              {layer.short_name}
                            </div>
                          </div>
                        ))}
                    </div>
                  </TransformComponent>
                </div>
              </>
            )}
          </TransformWrapper>
        </div>

        {/* Question & Duolingo-style Answer Cards */}
        {!isAnswerRevealed ? (
          trainerMode === 'flashcard' ? (
            <div className="bg-[var(--bg-card)] p-5 rounded-[22px] shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-[var(--border-subtle)] text-center space-y-3">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                Изучите срез ткани, обратите внимание на окраску и назовите препарат
              </p>
              <button
                onClick={handleRevealAnswer}
                className="w-full py-3.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-[20px] text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[var(--accent-shadow)]"
              >
                <BookOpen strokeWidth={1.75} className="w-4 h-4" />
                <span>Показать ответ и разбор</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[var(--text-muted)] px-1">
                Выберите диагноз микропрепарата:
              </div>
              <div className="grid grid-cols-1 gap-2">
                {quizOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectQuizOption(opt)}
                    className="w-full rounded-2xl bg-[var(--bg-card)] py-3 px-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] border border-[var(--border-subtle)] active:scale-[0.98] hover:shadow-md transition-all text-left flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent-primary)] flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 transition-colors">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] leading-snug truncate">
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
                  cardStyle =
                    'bg-emerald-500 text-white font-bold border-2 border-emerald-500 shadow-lg shadow-emerald-500/20';
                  badgeStyle = 'bg-white/20 text-white';
                } else if (isSelected && !isCorrect) {
                  cardStyle =
                    'bg-rose-500 text-white font-bold border-2 border-rose-500 shadow-lg shadow-rose-500/20';
                  badgeStyle = 'bg-white/20 text-white';
                }

                return (
                  <div
                    key={i}
                    className={`w-full rounded-2xl py-3 px-4 transition-all duration-300 flex items-center justify-between gap-3 ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${badgeStyle}`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-xs sm:text-sm leading-snug truncate">{opt}</span>
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

        {/* Enriched Diagnostic Breakdown Card */}
        {isAnswerRevealed && (
          <div className="bg-[var(--bg-card)] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-soft)] px-3 py-1 rounded-full">
                  Эталонный разбор
                </span>
                <h3 className="text-lg font-extrabold text-[var(--text-primary)] tracking-tight mt-2">
                  {currentSlide.title}
                </h3>
              </div>
              {selectedQuizOption && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    selectedQuizOption === currentSlide.title
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {selectedQuizOption === currentSlide.title ? 'Верно! 🎉' : 'Ошибка 💡'}
                </span>
              )}
            </div>

            {/* Главный отличительный признак */}
            <div className="bg-[var(--accent-soft)] p-4 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-[var(--accent-primary)] text-xs font-bold">
                <Sparkles strokeWidth={1.75} className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Главный отличительный признак</span>
              </div>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                {killerFeature}
              </p>
            </div>

            {/* Дифференциальный диагноз (за 3 секунды) */}
            {diffDiag && (
              <div className="bg-amber-50/70 p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                  <Compass strokeWidth={1.75} className="w-4 h-4 text-amber-600" />
                  <span>Дифференциальная диагностика на зачете</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {diffDiag}
                </p>
              </div>
            )}

            {/* Клиническая значимость */}
            {clinical && (
              <div className="bg-emerald-50/70 p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-900 text-xs font-bold">
                  <Stethoscope strokeWidth={1.75} className="w-4 h-4 text-emerald-600" />
                  <span>Клиническая значимость</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {clinical}
                </p>
              </div>
            )}

            {/* Слои и оболочки */}
            {layersText && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold px-0.5">
                  <Layers strokeWidth={1.75} className="w-3.5 h-3.5" />
                  <span>Оболочки и слои препарата:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-2xl">
                  {layersText}
                </p>
              </div>
            )}

            {/* Ключевые клетки */}
            {keyCellsText && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold px-0.5">
                  <HelpCircle strokeWidth={1.75} className="w-3.5 h-3.5" />
                  <span>Ключевые клетки:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-2xl">
                  {keyCellsText}
                </p>
              </div>
            )}

            {/* Кнопка «Смотреть разбор на YouTube» */}
            <button
              onClick={handleOpenYoutube}
              className="w-full py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <PlayCircle className="w-4 h-4 text-red-600" />
              <span>Смотреть видеоразбор на YouTube</span>
            </button>
          </div>
        )}
      </div>

      {/* Docked Spaced Repetition Panel */}
      {isAnswerRevealed && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] p-4 safe-pb shadow-lg">
          <div className="max-w-md mx-auto space-y-2">
            <div className="text-[11px] font-bold text-center text-[var(--text-muted)]">
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
