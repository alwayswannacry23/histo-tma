import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Zap,
  BookOpen,
  RotateCcw,
  ChevronRight,
  Microscope,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  User,
  Home,
  FileText,
  Moon,
  Sun,
  Award,
  Clock,
} from 'lucide-react';
import { MODULES, EXAM_SLIDES, THEORY_BLOCKS, HistSlide } from './data/histoData';
import { MicroscopeViewerModal } from './components/MicroscopeViewerModal';

const getTg = () => (window as any).Telegram?.WebApp;

// Акцентные палитры (включая бирюзовый из Eagle Eye и розовый Эозин)
const ACCENTS = [
  { id: 'teal', name: 'Бирюза (Eagle)', hex: '#2DD4BF', textOnAccent: '#042F2E' },
  { id: 'eosin', name: 'Эозин (Розовый)', hex: '#EC4899', textOnAccent: '#FFFFFF' },
  { id: 'indigo', name: 'Индиго (База)', hex: '#6366F1', textOnAccent: '#FFFFFF' },
  { id: 'hematoxylin', name: 'Гематоксилин', hex: '#A855F7', textOnAccent: '#FFFFFF' },
  { id: 'emerald', name: 'Изумруд', hex: '#10B981', textOnAccent: '#052E16' },
];

type TabId = 'home' | 'search' | 'modules' | 'theory' | 'profile';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Тема оформления: 'dark' (по умолчанию как на референсе) или 'light'
  const [colorMode, setColorMode] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('baza_color_mode') as 'dark' | 'light') || 'dark'
  );
  const [accentId, setAccentId] = useState<string>(
    () => localStorage.getItem('baza_accent') || 'teal'
  );

  // Прогресс изучения
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('baza_mastered') || '[]');
    } catch {
      return [];
    }
  });

  // Состояние поиска, микроскопа и тренажера
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMicroscopeSlide, setActiveMicroscopeSlide] = useState<HistSlide | null>(null);
  const [quizState, setQuizState] = useState<{
    slides: HistSlide[];
    title: string;
    index: number;
    selected: string | null;
    options: string[];
  } | null>(null);

  const accent = ACCENTS.find((a) => a.id === accentId) || ACCENTS[0];
  const isDark = colorMode === 'dark';

  // Данные пользователя из Telegram
  const tgUser = getTg()?.initDataUnsafe?.user;
  const userName = tgUser?.first_name || 'Студент';
  const userHandle = tgUser?.username ? `@${tgUser.username}` : 'Личный кабинет';
  const userInitial = (userName?.[0] || '1').toUpperCase();

  useEffect(() => {
    localStorage.setItem('baza_color_mode', colorMode);
    const tg = getTg();
    if (tg?.setHeaderColor) {
      tg.setHeaderColor(colorMode === 'dark' ? '#09090B' : '#F4F4F5');
    }
    if (tg?.setBackgroundColor) {
      tg.setBackgroundColor(colorMode === 'dark' ? '#09090B' : '#F4F4F5');
    }
  }, [colorMode]);

  useEffect(() => {
    localStorage.setItem('baza_accent', accentId);
  }, [accentId]);

  useEffect(() => {
    localStorage.setItem('baza_mastered', JSON.stringify(masteredIds));
  }, [masteredIds]);

  // Нативная кнопка «Назад» в Telegram
  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();

    const onBack = () => {
      if (activeMicroscopeSlide) {
        setActiveMicroscopeSlide(null);
      } else if (quizState) {
        setQuizState(null);
      } else if (selectedModuleId) {
        setSelectedModuleId(null);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      }
    };

    const showBack =
      Boolean(activeMicroscopeSlide) ||
      Boolean(quizState) ||
      Boolean(selectedModuleId) ||
      activeTab !== 'home';

    if (showBack) {
      tg.BackButton?.show();
      tg.BackButton?.onClick(onBack);
    } else {
      tg.BackButton?.hide();
    }

    return () => {
      tg.BackButton?.offClick(onBack);
    };
  }, [activeTab, selectedModuleId, quizState, activeMicroscopeSlide]);

  const haptic = (type: 'light' | 'medium' | 'success' | 'error') => {
    const tg = getTg();
    if (!tg?.HapticFeedback) return;
    if (type === 'success' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  };

  const buildOptions = (slide: HistSlide) => {
    const pool = slide.distractors?.length
      ? slide.distractors
      : EXAM_SLIDES.filter((s) => s.id !== slide.id)
          .slice(0, 3)
          .map((s) => s.title);
    return [slide.title, ...pool.slice(0, 3)].sort(() => Math.random() - 0.5);
  };

  const startQuiz = (slides: HistSlide[], title: string) => {
    if (!slides.length) return;
    haptic('medium');
    setQuizState({
      slides,
      title,
      index: 0,
      selected: null,
      options: buildOptions(slides[0]),
    });
  };

  const handleAnswer = (option: string) => {
    if (!quizState || quizState.selected) return;
    const current = quizState.slides[quizState.index];
    const isCorrect = option === current.title;
    haptic(isCorrect ? 'success' : 'error');

    if (isCorrect && !masteredIds.includes(current.id)) {
      setMasteredIds((prev) => [...prev, current.id]);
    }
    setQuizState({ ...quizState, selected: option });
  };

  const nextQuizSlide = () => {
    if (!quizState) return;
    haptic('light');
    if (quizState.index + 1 < quizState.slides.length) {
      const nextIdx = quizState.index + 1;
      setQuizState({
        ...quizState,
        index: nextIdx,
        selected: null,
        options: buildOptions(quizState.slides[nextIdx]),
      });
    } else {
      setQuizState(null);
    }
  };

  const filteredSlides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return EXAM_SLIDES;
    return EXAM_SLIDES.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.stain.toLowerCase().includes(q) ||
        s.killerFeature.toLowerCase().includes(q) ||
        String(s.examNumber) === q
    );
  }, [searchQuery]);

  const totalSlides = EXAM_SLIDES.length || 70;
  const masteredCount = masteredIds.length;
  const readinessPct = Math.round((masteredCount / Math.max(totalSlides, 1)) * 100);

  // Токены поверхностей под Dark (Eagle Eye) и Light (iOS)
  const ui = {
    bg: isDark ? 'bg-[#09090B] text-white' : 'bg-[#F3F4F6] text-zinc-900',
    card: isDark
      ? 'bg-[#141417] border border-white/[0.06]'
      : 'bg-white border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]',
    cardInteractive: isDark
      ? 'bg-[#141417] border border-white/[0.06] active:bg-[#1C1C21]'
      : 'bg-white border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] active:bg-zinc-50',
    iconCircle: isDark ? 'bg-white/[0.06] text-zinc-200' : 'bg-zinc-100 text-zinc-700',
    muted: isDark ? 'text-zinc-400' : 'text-zinc-500',
    subtle: isDark ? 'text-zinc-500' : 'text-zinc-400',
    divider: isDark ? 'divide-white/[0.06]' : 'divide-zinc-100',
    dock: isDark
      ? 'bg-[#18181C]/85 border-white/[0.1] text-zinc-400 shadow-[0_12px_40px_rgba(0,0,0,0.65)]'
      : 'bg-white/85 border-black/[0.08] text-zinc-500 shadow-[0_10px_30px_rgba(0,0,0,0.08)]',
    dockActive: isDark ? 'bg-white/[0.12] text-white' : 'bg-zinc-900 text-white',
    ctaBtn: isDark ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-white',
  };

  // Безопасный отступ под системные кнопки Telegram
  const safeTopStyle: React.CSSProperties = {
    paddingTop: 'calc(var(--tg-content-safe-area-inset-top, 0px) + 14px)',
  };

  return (
    <div className={`min-h-screen ${ui.bg} font-sans antialiased selection:bg-teal-500/20 pb-28 transition-colors duration-300`}>
      {/* ==================== МОДАЛКА ТРЕНАЖЕРА ==================== */}
      {quizState ? (
        <div style={safeTopStyle} className="max-w-md mx-auto px-4 pb-8 min-h-screen flex flex-col animate-fadeIn">
          {/* Верхняя панель */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => setQuizState(null)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.card} active:scale-95 transition`}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-500/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((quizState.index + 1) / quizState.slides.length) * 100}%`,
                  backgroundColor: accent.hex,
                }}
              />
            </div>
            <span className={`text-[12px] font-bold ${ui.muted}`}>
              {quizState.index + 1} / {quizState.slides.length}
            </span>
          </div>

          {/* Фото микропрепарата */}
          {(() => {
            const slide = quizState.slides[quizState.index];
            return (
              <>
                <div className="relative w-full h-[36vh] rounded-[26px] overflow-hidden bg-black border border-white/10 mb-4 shadow-lg">
                  <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
                    {slide.stain}
                  </div>
                  <button
                    onClick={() => setActiveMicroscopeSlide(slide)}
                    className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[12px] font-bold flex items-center gap-1.5 border border-white/15 active:scale-95 transition"
                  >
                    <Layers className="w-3.5 h-3.5" style={{ color: accent.hex }} />
                    Слои и зум
                  </button>
                </div>

                {/* Варианты ответов */}
                <div className="space-y-2.5 flex-1">
                  {quizState.options.map((opt, idx) => {
                    const isSelected = quizState.selected === opt;
                    const isCorrect = opt === slide.title;
                    let stateClass = ui.cardInteractive;

                    if (quizState.selected) {
                      if (isCorrect) {
                        stateClass = 'bg-emerald-500/20 border border-emerald-500 text-emerald-400';
                      } else if (isSelected) {
                        stateClass = 'bg-rose-500/20 border border-rose-500 text-rose-400';
                      } else {
                        stateClass = `${ui.card} opacity-45`;
                      }
                    }

                    return (
                      <button
                        key={opt}
                        disabled={Boolean(quizState.selected)}
                        onClick={() => handleAnswer(opt)}
                        className={`w-full rounded-[20px] p-3.5 text-left font-semibold text-[14px] flex items-center gap-3 transition-all duration-200 active:scale-[0.98] ${stateClass}`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${ui.iconCircle}`}>
                          {['A', 'B', 'C', 'D'][idx]}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Разбор после клика */}
                {quizState.selected && (
                  <div className={`mt-4 rounded-[24px] p-4 ${ui.card} space-y-3 animate-slideUp`}>
                    <div className="text-[13px] leading-snug">
                      <span className={`font-bold ${ui.muted}`}>Главный признак: </span>
                      <span>{slide.killerFeature}</span>
                    </div>
                    <button
                      onClick={nextQuizSlide}
                      style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                      className="w-full py-3.5 rounded-[16px] font-bold text-[14px] active:scale-[0.98] transition"
                    >
                      {quizState.index + 1 < quizState.slides.length ? 'Дальше →' : 'Завершить тренировку'}
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        /* ==================== ОСНОВНЫЕ ВКЛАДКИ ==================== */
        <div style={safeTopStyle} className="max-w-md mx-auto px-4">
          {/* 1. ГЛАВНАЯ (В СТИЛЕ EAGLE EYE) */}
          {activeTab === 'home' && !selectedModuleId && (
            <div className="space-y-5 animate-fadeIn">
              {/* Верхняя шапка: Аватар слева, БАЗА по центру, Тема справа */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    haptic('light');
                    setActiveTab('profile');
                  }}
                  style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                  className="w-9 h-9 rounded-full font-extrabold text-[14px] flex items-center justify-center shadow-sm active:scale-95 transition"
                >
                  {userInitial}
                </button>

                <span className="text-[12px] font-extrabold tracking-[0.22em] uppercase">
                  БАЗА
                </span>

                <button
                  onClick={() => {
                    haptic('light');
                    setColorMode(isDark ? 'light' : 'dark');
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${ui.cardInteractive} active:scale-95 transition`}
                  aria-label="Переключить тему"
                >
                  {isDark ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-700" />}
                </button>
              </div>

              {/* Центральный блок готовности (как Баланс в Eagle Eye) */}
              <div className="text-center py-3">
                <p className={`text-[13px] font-medium ${ui.muted}`}>Ваша готовность</p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-[44px] font-extrabold tracking-tight leading-none">
                    {masteredCount}
                  </span>
                  <span className={`text-[24px] font-bold ${ui.subtle}`}>
                    /{totalSlides}
                  </span>
                </div>
                <p className={`text-[12px] mt-1.5 ${ui.subtle}`}>
                  Усвоено к экзамену: {readinessPct}%
                </p>
              </div>

              {/* 4 быстрые кнопки в ряд */}
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  {
                    label: 'Поиск',
                    icon: Search,
                    onClick: () => setActiveTab('search'),
                  },
                  {
                    label: 'Спидран',
                    icon: Zap,
                    onClick: () => {
                      const random15 = [...EXAM_SLIDES].sort(() => Math.random() - 0.5).slice(0, 15);
                      startQuiz(random15, 'Спидран · 15 препаратов');
                    },
                  },
                  {
                    label: 'Теория',
                    icon: BookOpen,
                    onClick: () => setActiveTab('theory'),
                  },
                  {
                    label: 'Атлас',
                    icon: Microscope,
                    onClick: () => setActiveTab('modules'),
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        haptic('light');
                        item.onClick();
                      }}
                      className={`rounded-[20px] py-3.5 px-2 flex flex-col items-center justify-center gap-2 transition duration-200 active:scale-95 ${ui.cardInteractive}`}
                    >
                      <Icon className="w-5 h-5 stroke-[1.8]" />
                      <span className="text-[12px] font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Поисковый баннер с мягким свечением */}
              <button
                onClick={() => {
                  haptic('light');
                  setActiveTab('search');
                }}
                className={`w-full rounded-[24px] p-4 text-left flex items-center justify-between relative overflow-hidden transition active:scale-[0.99] ${ui.card}`}
                style={{
                  backgroundImage: isDark
                    ? `radial-gradient(circle at 80% 50%, ${accent.hex}22 0%, transparent 65%)`
                    : `radial-gradient(circle at 80% 50%, ${accent.hex}18 0%, transparent 65%)`,
                }}
              >
                <div className="space-y-1 pr-4">
                  <div className="font-extrabold text-[16px] leading-snug">
                    Найдите нужный препарат
                  </div>
                  <div className={`text-[12px] ${ui.muted}`}>
                    Всё начинается с номера, окраски или признака →
                  </div>
                </div>
                <Search className="w-10 h-10 opacity-25 shrink-0 stroke-[1.5]" />
              </button>

              {/* Акцентная карточка тренировки (как Eagle Eye Plus) */}
              <div className={`rounded-[24px] p-4 space-y-3.5 ${ui.card}`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: accent.hex }} />
                  <span className="font-extrabold text-[16px]">Режим коллоквиума</span>
                </div>
                <p className={`text-[13px] leading-relaxed ${ui.muted}`}>
                  15 случайных микропрепаратов в режиме слепой диагностики с разбором слоёв, клеток и тинкториальных признаков.
                </p>
                <button
                  onClick={() => {
                    const random15 = [...EXAM_SLIDES].sort(() => Math.random() - 0.5).slice(0, 15);
                    startQuiz(random15, 'Коллоквиум · 15 стекол');
                  }}
                  className={`w-full py-3.5 rounded-[16px] font-bold text-[14px] transition active:scale-[0.98] ${ui.ctaBtn}`}
                >
                  Начать проверку
                </button>
              </div>

              {/* Секция модулей в едином сгруппированном контейнере iOS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="font-bold text-[15px]">Разделы гистологии</span>
                  <button
                    onClick={() => setActiveTab('modules')}
                    className={`text-[12px] font-medium ${ui.muted}`}
                  >
                    Все {totalSlides} стекол
                  </button>
                </div>

                <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                  {MODULES.map((mod) => {
                    const modSlides = EXAM_SLIDES.filter((s) => s.moduleId === mod.id);
                    const done = modSlides.filter((s) => masteredIds.includes(s.id)).length;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => {
                          haptic('light');
                          setSelectedModuleId(mod.id);
                        }}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left transition active:opacity-75"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ui.iconCircle}`}>
                            <Microscope className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[14px] truncate">{mod.title}</div>
                            <div className={`text-[12px] ${ui.muted} mt-0.5`}>
                              {mod.section === 'general' ? 'Общая гистология' : 'Частная гистология'} · {done}/{modSlides.length}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${ui.subtle}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ПРОСМОТР КОНКРЕТНОГО МОДУЛЯ */}
          {selectedModuleId && (() => {
            const mod = MODULES.find((m) => m.id === selectedModuleId)!;
            const modSlides = EXAM_SLIDES.filter((s) => s.moduleId === mod.id);
            return (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => setSelectedModuleId(null)}
                      className={`text-[12px] font-bold tracking-wider uppercase ${ui.muted} flex items-center gap-1`}
                    >
                      ← Назад к разделам
                    </button>
                    <h1 className="text-[24px] font-extrabold tracking-tight mt-1">{mod.title}</h1>
                  </div>
                  <button
                    onClick={() => startQuiz(modSlides, mod.title)}
                    style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                    className="px-4 py-2.5 rounded-full font-bold text-[13px] shrink-0 active:scale-95 transition"
                  >
                    Тест ({modSlides.length})
                  </button>
                </div>

                <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                  {modSlides.map((slide) => {
                    const isDone = masteredIds.includes(slide.id);
                    return (
                      <button
                        key={slide.id}
                        onClick={() => {
                          haptic('light');
                          setActiveMicroscopeSlide(slide);
                        }}
                        className="w-full p-3.5 flex items-center gap-3.5 text-left transition active:opacity-75"
                      >
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="w-14 h-14 rounded-[16px] object-cover bg-zinc-900 shrink-0 border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-extrabold px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: `${accent.hex}20`, color: accent.hex }}
                            >
                              №{slide.examNumber}
                            </span>
                            <span className={`text-[11px] truncate ${ui.muted}`}>{slide.stain}</span>
                          </div>
                          <div className="font-bold text-[14px] leading-snug mt-1 line-clamp-2">
                            {slide.title}
                          </div>
                        </div>
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <ChevronRight className={`w-4 h-4 shrink-0 ${ui.subtle}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 2. ВКЛАДКА ПОИСКА */}
          {activeTab === 'search' && !selectedModuleId && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-[11px] font-bold tracking-[0.18em] uppercase ${ui.muted}`}>БАЗА</div>
                  <h1 className="text-[28px] font-extrabold tracking-tight leading-none mt-1">Поиск</h1>
                  <p className={`text-[13px] ${ui.muted} mt-1`}>Быстрый поиск по 70 препаратам</p>
                </div>
                <div
                  style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                  className="w-9 h-9 rounded-full font-extrabold text-[14px] flex items-center justify-center"
                >
                  {userInitial}
                </div>
              </div>

              <div className={`rounded-[20px] px-4 py-3 flex items-center gap-3 ${ui.card}`}>
                <Search className={`w-4 h-4 ${ui.muted}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Номер, название, окраска или признак..."
                  autoFocus
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X className={`w-4 h-4 ${ui.muted}`} />
                  </button>
                )}
              </div>

              <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                {filteredSlides.map((slide) => (
                  <button
                    key={slide.id}
                    onClick={() => setActiveMicroscopeSlide(slide)}
                    className="w-full p-4 flex items-start justify-between gap-3 text-left transition active:opacity-75"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: `${accent.hex}20`, color: accent.hex }}
                        >
                          №{slide.examNumber}
                        </span>
                        <span className={`text-[11px] ${ui.muted}`}>{slide.stain}</span>
                      </div>
                      <div className="font-bold text-[15px]">{slide.title}</div>
                      <div className={`text-[12px] ${ui.muted} line-clamp-2`}>
                        {slide.killerFeature}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 mt-1 shrink-0 ${ui.subtle}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. ВКЛАДКА АТЛАС (ВСЕ РАЗДЕЛЫ) */}
          {activeTab === 'modules' && !selectedModuleId && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-[11px] font-bold tracking-[0.18em] uppercase ${ui.muted}`}>БАЗА</div>
                  <h1 className="text-[28px] font-extrabold tracking-tight leading-none mt-1">Атлас</h1>
                  <p className={`text-[13px] ${ui.muted} mt-1`}>Общая и частная гистология</p>
                </div>
                <div
                  style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                  className="w-9 h-9 rounded-full font-extrabold text-[14px] flex items-center justify-center"
                >
                  {userInitial}
                </div>
              </div>

              <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                {MODULES.map((mod) => {
                  const modSlides = EXAM_SLIDES.filter((s) => s.moduleId === mod.id);
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedModuleId(mod.id)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left transition active:opacity-75"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ui.iconCircle}`}>
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[15px] truncate">{mod.title}</div>
                          <div className={`text-[12px] ${ui.muted}`}>
                            Препаратов в модуле: {modSlides.length}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${ui.subtle}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. ВКЛАДКА ШПОРЫ / ТЕОРИЯ */}
          {activeTab === 'theory' && !selectedModuleId && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-[11px] font-bold tracking-[0.18em] uppercase ${ui.muted}`}>БАЗА</div>
                  <h1 className="text-[28px] font-extrabold tracking-tight leading-none mt-1">Шпоры</h1>
                  <p className={`text-[13px] ${ui.muted} mt-1`}>Выжимки для ответа преподавателю</p>
                </div>
                <div
                  style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                  className="w-9 h-9 rounded-full font-extrabold text-[14px] flex items-center justify-center"
                >
                  {userInitial}
                </div>
              </div>

              <div className="space-y-3">
                {THEORY_BLOCKS.map((block) => (
                  <div key={block.id} className={`rounded-[24px] p-4 space-y-2.5 ${ui.card}`}>
                    <div className="font-extrabold text-[16px]">{block.title}</div>
                    <p className={`text-[13px] leading-relaxed whitespace-pre-line ${ui.muted}`}>
                      {block.summary}
                    </p>
                    {block.examTip && (
                      <div
                        className="p-3 rounded-[16px] text-[12px] font-medium"
                        style={{ backgroundColor: `${accent.hex}18`, color: accent.hex }}
                      >
                        На что смотрит препод: {block.examTip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. ВКЛАДКА ПРОФИЛЬ (ОДИН В ОДИН ПО ВТОРОМУ СКРИНУ EAGLE EYE) */}
          {activeTab === 'profile' && !selectedModuleId && (
            <div className="space-y-6 animate-fadeIn">
              {/* Верхний заголовок как в Eagle Eye */}
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-[11px] font-bold tracking-[0.18em] uppercase ${ui.muted}`}>
                    БАЗА
                  </div>
                  <h1 className="text-[30px] font-extrabold tracking-tight leading-none mt-1">
                    Профиль
                  </h1>
                  <p className={`text-[13px] ${ui.muted} mt-1.5`}>
                    Ваше учебное пространство База
                  </p>
                </div>
                <div
                  style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                  className="w-9 h-9 rounded-full font-extrabold text-[14px] flex items-center justify-center shrink-0"
                >
                  {userInitial}
                </div>
              </div>

              {/* Большой центральный аватар */}
              <div className="flex flex-col items-center text-center py-2">
                <div
                  style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                  className="w-20 h-20 rounded-full font-extrabold text-[30px] flex items-center justify-center shadow-lg"
                >
                  {userInitial}
                </div>
                <div className="text-[20px] font-extrabold mt-3">{userName}</div>
                <div className={`text-[13px] ${ui.muted}`}>{userHandle}</div>
              </div>

              {/* Сгруппированный блок статуса и темы */}
              <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}>
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Изучено препаратов</div>
                      <div className={`text-[12px] ${ui.muted}`}>Прогресс по экзаменационному списку</div>
                    </div>
                  </div>
                  <div className="font-extrabold text-[14px]">
                    {masteredCount} / {totalSlides}
                  </div>
                </div>

                <button
                  onClick={() => {
                    haptic('light');
                    setColorMode(isDark ? 'light' : 'dark');
                  }}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left transition active:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}>
                      {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Тема интерфейса</div>
                      <div className={`text-[12px] ${ui.muted}`}>
                        Сейчас: {isDark ? 'Тёмная (OLED Dark)' : 'Светлая (iOS Light)'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${ui.subtle}`} />
                </button>
              </div>

              {/* Выбор акцентного цвета */}
              <div className="space-y-2.5">
                <div className="px-1 font-bold text-[14px]">Акцентный цвет</div>
                <div className={`rounded-[24px] p-4 flex items-center justify-between ${ui.card}`}>
                  {ACCENTS.map((item) => {
                    const active = item.id === accentId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          haptic('light');
                          setAccentId(item.id);
                        }}
                        className="flex flex-col items-center gap-1.5 active:scale-90 transition"
                      >
                        <span
                          style={{ backgroundColor: item.hex }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                            active ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110' : 'opacity-70'
                          }`}
                        />
                        <span className={`text-[10px] font-semibold ${active ? '' : ui.muted}`}>
                          {item.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Сгруппированный блок "Управление" */}
              <div className="space-y-2.5">
                <div className="px-1 font-bold text-[14px]">Управление</div>
                <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                  <button
                    onClick={() => {
                      const random15 = [...EXAM_SLIDES].sort(() => Math.random() - 0.5).slice(0, 15);
                      startQuiz(random15, 'Быстрый тест');
                    }}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-[14px]">Запустить Спидран (15 стекол)</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${ui.subtle}`} />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Сбросить прогресс изученных препаратов?')) {
                        setMasteredIds([]);
                      }
                    }}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}>
                        <RotateCcw className="w-4 h-4 text-rose-400" />
                      </div>
                      <span className="font-bold text-[14px] text-rose-400">Сбросить прогресс</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${ui.subtle}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== ПАРЯЩИЙ ДОК (КАК В EAGLE EYE) ==================== */}
      {!quizState && (
        <div className="fixed bottom-4 left-4 right-4 z-40 pointer-events-none flex justify-center">
          <nav
            className={`pointer-events-auto w-full max-w-[390px] rounded-full p-1.5 backdrop-blur-2xl border flex items-center justify-between transition-colors duration-300 ${ui.dock}`}
          >
            {[
              { id: 'home', label: 'Главная', icon: Home },
              { id: 'search', label: 'Поиск', icon: Search },
              { id: 'modules', label: 'Атлас', icon: Microscope },
              { id: 'theory', label: 'Шпоры', icon: FileText },
              { id: 'profile', label: 'Профиль', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && !selectedModuleId;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic('light');
                    setSelectedModuleId(null);
                    setActiveTab(tab.id as TabId);
                  }}
                  className={`flex-1 py-2 px-1 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                    isActive ? ui.dockActive : 'hover:opacity-80'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2]" />
                  <span className="text-[10px] font-semibold tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* ==================== ВИРТУАЛЬНЫЙ МИКРОСКОП ==================== */}
      {activeMicroscopeSlide && (
        <MicroscopeViewerModal
          slide={activeMicroscopeSlide}
          onClose={() => setActiveMicroscopeSlide(null)}
          onStartTest={(slide) => {
            setActiveMicroscopeSlide(null);
            startQuiz([slide], slide.title);
          }}
        />
      )}
    </div>
  );
}

export default App;

