import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Search,
  Palette,
  ArrowLeft,
  Eye,
  Play,
  CheckCircle2,
  BookOpen,
  Microscope,
  Sparkles,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  MODULES,
  THEORY_BLOCKS,
  EXAM_SLIDES,
  HistSlide,
  HistoModule,
} from './data/histoData';
import { MicroscopeViewerModal } from './components/MicroscopeViewerModal';

type ThemeKey = 'indigo' | 'eosin' | 'hematoxylin' | 'emerald' | 'slate';

const THEMES: Record<
  ThemeKey,
  { name: string; primary: string; soft: string; badgeText: string }
> = {
  indigo: {
    name: 'Индиго (База)',
    primary: '#4F46E5',
    soft: '#EEF2FF',
    badgeText: '#4338CA',
  },
  eosin: {
    name: 'Эозин (Розовый)',
    primary: '#EC4899',
    soft: '#FDF2F8',
    badgeText: '#BE185D',
  },
  hematoxylin: {
    name: 'Гематоксилин',
    primary: '#7C3AED',
    soft: '#F5F3FF',
    badgeText: '#6D28D9',
  },
  emerald: {
    name: 'Изумруд',
    primary: '#10B981',
    soft: '#ECFDF5',
    badgeText: '#047857',
  },
  slate: {
    name: 'Графит',
    primary: '#0F172A',
    soft: '#F1F5F9',
    badgeText: '#0F172A',
  },
};

export function App() {
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('baza_theme') as ThemeKey) || 'eosin';
  });
  const theme = THEMES[themeKey] || THEMES.eosin;

  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('baza_mastered') || '[]');
    } catch {
      return [];
    }
  });

  const [activeModule, setActiveModule] = useState<HistoModule | null>(null);
  const [moduleTab, setModuleTab] = useState<'slides' | 'theory'>('slides');
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Окуляр микроскопа
  const [viewerSlide, setViewerSlide] = useState<HistSlide | null>(null);

  // Состояние теста / спидрана
  const [quizDeck, setQuizDeck] = useState<HistSlide[] | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand?.();
      tg.disableVerticalSwipes?.();
    }
  }, []);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    const handleBack = () => {
      if (viewerSlide) {
        setViewerSlide(null);
      } else if (quizDeck) {
        setQuizDeck(null);
      } else if (activeModule) {
        setActiveModule(null);
      }
    };

    if (viewerSlide || quizDeck || activeModule) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [viewerSlide, quizDeck, activeModule]);

  const changeTheme = (key: ThemeKey) => {
    setThemeKey(key);
    localStorage.setItem('baza_theme', key);
    (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  };

  const toggleMastered = (slideId: string, remember: boolean) => {
    setMasteredIds((prev) => {
      const next = remember
        ? Array.from(new Set([...prev, slideId]))
        : prev.filter((id) => id !== slideId);
      localStorage.setItem('baza_mastered', JSON.stringify(next));
      return next;
    });
  };

  const startSpeedrun = (slidesPool: HistSlide[], limit = 15) => {
    const shuffled = [...slidesPool].sort(() => Math.random() - 0.5).slice(0, limit);
    if (shuffled.length === 0) return;
    setViewerSlide(null);
    setQuizDeck(shuffled);
    setQuizIndex(0);
    setSelectedOption(null);
    (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  // Варианты ответа для текущего слайда в тесте
  const currentQuizSlide = quizDeck ? quizDeck[quizIndex] : null;
  const quizOptions = useMemo(() => {
    if (!currentQuizSlide) return [];
    const pool =
      currentQuizSlide.distractors && currentQuizSlide.distractors.length >= 3
        ? currentQuizSlide.distractors.slice(0, 3)
        : EXAM_SLIDES.filter((s) => s.id !== currentQuizSlide.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map((s) => s.title);
    return [currentQuizSlide.title, ...pool].sort(() => Math.random() - 0.5);
  }, [currentQuizSlide]);

  const safeTopStyle: React.CSSProperties = {
    paddingTop:
      'calc(var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, 52px)) + 8px)',
  };

  const filteredSlides = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return EXAM_SLIDES.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        String(s.examNumber) === q.trim() ||
        s.killerFeature.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const readinessPercent = Math.round(
    (masteredIds.length / Math.max(1, EXAM_SLIDES.length)) * 100
  );

  // ================= ЭКРАН ТЕСТА / СПИДРАНА =================
  if (quizDeck && currentQuizSlide) {
    const isAnswered = selectedOption !== null;
    const isCorrect = selectedOption === currentQuizSlide.title;

    const handleNext = (remembered: boolean) => {
      toggleMastered(currentQuizSlide.id, remembered);
      if (quizIndex + 1 < quizDeck.length) {
        setQuizIndex((i) => i + 1);
        setSelectedOption(null);
      } else {
        setQuizDeck(null);
      }
    };

    return (
      <div className="min-h-screen bg-[#F2F4F7] text-slate-900 flex flex-col">
        {/* Верхняя шапка с явной кнопкой выхода ниже кнопок Telegram */}
        <div
          style={safeTopStyle}
          className="px-4 pb-3 bg-white/90 backdrop-blur-md flex items-center justify-between gap-3 sticky top-0 z-20 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
        >
          <button
            onClick={() => setQuizDeck(null)}
            className="px-3.5 h-10 rounded-full bg-slate-100 text-slate-800 font-bold text-[13px] flex items-center gap-1.5 active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Выйти
          </button>

          <div className="text-[13px] font-extrabold text-slate-700">
            Препарат {quizIndex + 1} из {quizDeck.length}
          </div>

          <button
            onClick={() => setViewerSlide(currentQuizSlide)}
            style={{ backgroundColor: theme.soft, color: theme.badgeText }}
            className="px-3 h-10 rounded-full font-bold text-[12px] flex items-center gap-1.5 active:scale-95 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            В окуляр
          </button>
        </div>

        <div className="flex-1 px-4 pt-3 pb-36 max-w-md mx-auto w-full space-y-3.5">
          {/* Вьювер микропрепарата без белых полос */}
          <div
            onClick={() => setViewerSlide(currentQuizSlide)}
            className="relative h-[34vh] w-full rounded-[24px] bg-[#090D16] overflow-hidden shadow-md cursor-pointer group"
          >
            <img
              src={currentQuizSlide.imageUrl}
              alt="Микропрепарат"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
              Окраска: {currentQuizSlide.stain}
            </div>
            <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/90 text-slate-900 text-[11px] font-extrabold flex items-center gap-1.5 shadow">
              <Microscope className="w-3.5 h-3.5" />
              Зум и метки
            </div>
          </div>

          {/* 4 варианта ответа */}
          <div className="space-y-2">
            {quizOptions.map((opt, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              let btnStyle = 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.04)]';
              if (isAnswered) {
                if (opt === currentQuizSlide.title) {
                  btnStyle = 'bg-emerald-500 text-white shadow-md';
                } else if (opt === selectedOption) {
                  btnStyle = 'bg-rose-500 text-white shadow-md';
                } else {
                  btnStyle = 'bg-white/60 text-slate-400';
                }
              }

              return (
                <button
                  key={opt}
                  disabled={isAnswered}
                  onClick={() => {
                    setSelectedOption(opt);
                    const tg = (window as any).Telegram?.WebApp?.HapticFeedback;
                    if (opt === currentQuizSlide.title) {
                      tg?.notificationOccurred?.('success');
                    } else {
                      tg?.notificationOccurred?.('error');
                    }
                  }}
                  className={`w-full rounded-2xl p-3.5 text-left font-bold text-[14px] flex items-center gap-3 transition active:scale-[0.99] ${btnStyle}`}
                >
                  <span
                    className={`w-7 h-7 rounded-full text-[12px] font-extrabold flex items-center justify-center shrink-0 ${
                      isAnswered && opt === currentQuizSlide.title
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Карточка разбора после ответа */}
          {isAnswered && (
            <div className="bg-white rounded-[24px] p-4 shadow-sm space-y-2 text-[13px]">
              <div className="font-extrabold text-[15px] text-slate-900">
                {isCorrect ? 'Верно!' : 'Запомни этот препарат:'} №{currentQuizSlide.examNumber}{' '}
                {currentQuizSlide.title}
              </div>
              <div>
                <span className="font-bold text-slate-500">Главный признак: </span>
                <span className="text-slate-800">{currentQuizSlide.killerFeature}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500">Слои: </span>
                <span className="text-slate-700">{currentQuizSlide.layersText}</span>
              </div>
              {currentQuizSlide.youtubeTimestampUrl && (
                <a
                  href={currentQuizSlide.youtubeTimestampUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-rose-600 font-bold text-[12px] pt-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Видеоразбор на таймкоде YouTube
                </a>
              )}
            </div>
          )}
        </div>

        {/* Фиксированная нижняя панель оценки памяти */}
        {isAnswered && (
          <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60 p-3 pb-6 z-20">
            <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
              <button
                onClick={() => handleNext(false)}
                className="py-3 rounded-2xl bg-rose-50 text-rose-600 font-extrabold text-[13px]"
              >
                Не помню
              </button>
              <button
                onClick={() => handleNext(false)}
                className="py-3 rounded-2xl bg-amber-50 text-amber-700 font-extrabold text-[13px]"
              >
                Сомневаюсь
              </button>
              <button
                onClick={() => handleNext(true)}
                className="py-3 rounded-2xl bg-emerald-500 text-white font-extrabold text-[13px]"
              >
                Железно знаю
              </button>
            </div>
          </div>
        )}

        {viewerSlide && (
          <MicroscopeViewerModal
            slide={viewerSlide}
            onClose={() => setViewerSlide(null)}
            onStartTest={(s) => {
              setViewerSlide(null);
              startSpeedrun([s], 1);
            }}
          />
        )}
      </div>
    );
  }

  // ================= ЭКРАН ВНУТРИ МОДУЛЯ =================
  if (activeModule) {
    const moduleSlides = EXAM_SLIDES.filter((s) => s.moduleId === activeModule.id).sort(
      (a, b) => a.examNumber - b.examNumber
    );
    const moduleTheory = THEORY_BLOCKS.filter((t) => t.moduleId === activeModule.id);

    return (
      <div className="min-h-screen bg-[#F2F4F7] text-slate-900 pb-12">
        <div
          style={safeTopStyle}
          className="px-4 pb-3 bg-white sticky top-0 z-20 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setActiveModule(null)}
              className="px-3.5 h-10 rounded-full bg-slate-100 text-slate-800 font-bold text-[13px] flex items-center gap-1.5 active:scale-95 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Все модули
            </button>

            <button
              onClick={() => startSpeedrun(moduleSlides, moduleSlides.length)}
              style={{ backgroundColor: theme.primary }}
              className="px-4 h-10 rounded-full text-white font-bold text-[13px] flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <Zap className="w-4 h-4" />
              Тест по модулю
            </button>
          </div>

          <h1 className="text-[20px] font-extrabold tracking-tight leading-snug">
            {activeModule.title}
          </h1>

          {/* Переключатель Препараты / Теория */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setModuleTab('slides')}
              className={`py-2 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-1.5 transition ${
                moduleTab === 'slides' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Microscope className="w-4 h-4" />
              Препараты ({moduleSlides.length})
            </button>
            <button
              onClick={() => setModuleTab('theory')}
              className={`py-2 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-1.5 transition ${
                moduleTab === 'theory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Теория и схемы ({moduleTheory.length})
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 pt-4 space-y-3">
          {moduleTab === 'slides' ? (
            moduleSlides.map((slide) => {
              const isDone = masteredIds.includes(slide.id);
              return (
                <div
                  key={slide.id}
                  className="bg-white rounded-[24px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      onClick={() => setViewerSlide(slide)}
                      className="relative w-24 h-24 rounded-2xl bg-[#090D16] overflow-hidden shrink-0 cursor-pointer"
                    >
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white font-extrabold text-[10px]">
                        №{slide.examNumber}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-400">
                          {slide.stain}
                        </span>
                        {isDone && (
                          <span className="text-emerald-600 flex items-center gap-0.5 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Изучено
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-extrabold text-slate-900 leading-snug mt-0.5">
                        {slide.title}
                      </h3>
                      <p className="text-[12px] text-slate-600 line-clamp-2 mt-1 leading-snug">
                        {slide.killerFeature}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setViewerSlide(slide)}
                      style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                      className="flex-1 py-2.5 rounded-xl font-extrabold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <Eye className="w-4 h-4" />
                      В микроскоп
                    </button>

                    <button
                      onClick={() => startSpeedrun([slide], 1)}
                      style={{ backgroundColor: theme.primary }}
                      className="px-4 py-2.5 rounded-xl text-white font-extrabold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Тест
                    </button>

                    {slide.youtubeTimestampUrl && (
                      <a
                        href={slide.youtubeTimestampUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"
                        title="Разбор на YouTube"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-3">
              {moduleTheory.map((block) => (
                <div
                  key={block.id}
                  className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-2.5"
                >
                  <h3 className="text-[16px] font-extrabold text-slate-900">{block.title}</h3>
                  <div className="text-[13px] text-slate-700 whitespace-pre-line leading-relaxed">
                    {block.summary}
                  </div>
                  {block.examTip && (
                    <div
                      style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                      className="rounded-2xl p-3 text-[12px] font-semibold leading-snug"
                    >
                      На что смотрит препод: {block.examTip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {viewerSlide && (
          <MicroscopeViewerModal
            slide={viewerSlide}
            onClose={() => setViewerSlide(null)}
            onStartTest={(s) => {
              setViewerSlide(null);
              startSpeedrun([s], 1);
            }}
          />
        )}
      </div>
    );
  }

  // ================= ГЛАВНЫЙ ЭКРАН (ПЛИТКИ БЕЗ НИЖНЕГО ТАБ-БАРА) =================
  return (
    <div className="min-h-screen bg-[#F2F4F7] text-slate-900 pb-12">
      {/* Шапка */}
      <div
        style={safeTopStyle}
        className="px-4 pb-3 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Кафедральный атлас и тренажёр
            </div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 leading-none mt-0.5">
              База · Гистология
            </h1>
          </div>

          <button
            onClick={() => setShowThemeModal(true)}
            style={{ backgroundColor: theme.soft, color: theme.badgeText }}
            className="px-3.5 h-10 rounded-full font-extrabold text-[12px] flex items-center gap-1.5 active:scale-95 transition"
          >
            <Palette className="w-4 h-4" />
            Тема
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Поиск по всем 70 препаратам */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру (1–70) или названию препарата..."
            className="w-full bg-white rounded-2xl pl-10 pr-9 py-3.5 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 shadow-[0_2px_12px_rgba(15,23,42,0.04)] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Быстрая выдача поиска */}
        {searchQuery.trim() !== '' && (
          <div className="space-y-2">
            {filteredSlides.map((slide) => (
              <div
                key={slide.id}
                onClick={() => setViewerSlide(slide)}
                className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-xs cursor-pointer active:scale-[0.99] transition"
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-900 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-400">
                    Препарат №{slide.examNumber} · {slide.stain}
                  </div>
                  <div className="text-[14px] font-extrabold text-slate-900 truncate">
                    {slide.title}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Hero Bento-виджет прогресса и Спидрана */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[12px] font-bold text-slate-400">
                Готовность к зимней сессии
              </span>
              <div className="text-[28px] font-extrabold text-slate-900 leading-tight">
                {readinessPercent}%{' '}
                <span className="text-[13px] font-bold text-slate-400">
                  ({masteredIds.length} из {EXAM_SLIDES.length})
                </span>
              </div>
            </div>
            <div
              style={{ backgroundColor: theme.soft, color: theme.badgeText }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{
                width: `${Math.max(4, readinessPercent)}%`,
                backgroundColor: theme.primary,
              }}
              className="h-full rounded-full transition-all duration-300"
            />
          </div>

          <button
            onClick={() => startSpeedrun(EXAM_SLIDES, 15)}
            style={{ backgroundColor: theme.primary }}
            className="w-full py-4 rounded-[20px] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] transition"
          >
            <Zap className="w-5 h-5 fill-current" />
            Спидран: 15 случайных препаратов
          </button>
        </div>

        {/* Раздел 1: Общая гистология */}
        <div className="space-y-2.5">
          <h2 className="text-[18px] font-extrabold text-slate-900 px-1">
            Общая гистология
          </h2>
          {MODULES.filter((m) => m.section === 'general').map((mod) => {
            const modSlides = EXAM_SLIDES.filter((s) => s.moduleId === mod.id);
            const doneCount = modSlides.filter((s) => masteredIds.includes(s.id)).length;
            return (
              <div
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod);
                  setModuleTab('slides');
                }}
                className="bg-white rounded-[24px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex items-center gap-3.5 cursor-pointer active:scale-[0.99] transition"
              >
                <div
                  style={{ backgroundColor: `${mod.badgeColor}18`, color: mod.badgeColor }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-[15px]"
                >
                  <Microscope className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-extrabold text-slate-900 leading-snug">
                    {mod.title}
                  </h3>
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">{mod.subtitle}</p>
                  <div className="text-[11px] font-bold text-slate-400 mt-1">
                    Изучено: {doneCount} / {modSlides.length || mod.count}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Раздел 2: Частная гистология */}
        <div className="space-y-2.5 pt-1">
          <h2 className="text-[18px] font-extrabold text-slate-900 px-1">
            Частная гистология
          </h2>
          {MODULES.filter((m) => m.section === 'private').map((mod) => {
            const modSlides = EXAM_SLIDES.filter((s) => s.moduleId === mod.id);
            const doneCount = modSlides.filter((s) => masteredIds.includes(s.id)).length;
            return (
              <div
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod);
                  setModuleTab('slides');
                }}
                className="bg-white rounded-[24px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex items-center gap-3.5 cursor-pointer active:scale-[0.99] transition"
              >
                <div
                  style={{ backgroundColor: `${mod.badgeColor}18`, color: mod.badgeColor }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                >
                  <Microscope className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-extrabold text-slate-900 leading-snug">
                    {mod.title}
                  </h3>
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">{mod.subtitle}</p>
                  <div className="text-[11px] font-bold text-slate-400 mt-1">
                    Изучено: {doneCount} / {modSlides.length || mod.count}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Модалка выбора цветовой темы (включая Розовый Эозин) */}
      {showThemeModal && (
        <div
          onClick={() => setShowThemeModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-[28px] p-5 pb-8 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold text-slate-900">
                Цветовая схема «Базы»
              </h3>
              <button
                onClick={() => setShowThemeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
                const item = THEMES[k];
                const active = themeKey === k;
                return (
                  <button
                    key={k}
                    onClick={() => changeTheme(k)}
                    className={`p-3.5 rounded-2xl flex items-center justify-between border transition ${
                      active ? 'border-slate-900 bg-slate-50' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: item.primary }}
                      />
                      <span className="font-bold text-[14px] text-slate-900">{item.name}</span>
                    </div>
                    {active && <CheckCircle2 className="w-5 h-5 text-slate-900" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewerSlide && (
        <MicroscopeViewerModal
          slide={viewerSlide}
          onClose={() => setViewerSlide(null)}
          onStartTest={(s) => {
            setViewerSlide(null);
            startSpeedrun([s], 1);
          }}
        />
      )}
    </div>
  );
}

export default App;
