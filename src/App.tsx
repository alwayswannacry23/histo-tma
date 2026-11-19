import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Zap,
  BookOpen,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Microscope,
  CheckCircle2,
  X,
  Layers,
  User,
  Home,
  Palette,
  Moon,
  Sun,
  Award,
  BookMarked,
  Play,
  Info,
} from 'lucide-react';
import { MODULES, EXAM_SLIDES, THEORY_BLOCKS, HistSlide } from './data/histoData';
import { GLOSSARY_TERMS, GlossaryTerm, RichGlossaryText } from './data/glossaryData';
import { MicroscopeViewerModal } from './components/MicroscopeViewerModal';

const getTg = () => (window as any).Telegram?.WebApp;

const ACCENTS = [
  { id: 'teal', name: 'Бирюза', hex: '#2DD4BF', textOnAccent: '#042F2E' },
  { id: 'eosin', name: 'Эозин', hex: '#EC4899', textOnAccent: '#FFFFFF' },
  { id: 'indigo', name: 'Индиго', hex: '#6366F1', textOnAccent: '#FFFFFF' },
  { id: 'hematoxylin', name: 'Гематоксилин', hex: '#A855F7', textOnAccent: '#FFFFFF' },
  { id: 'emerald', name: 'Изумруд', hex: '#10B981', textOnAccent: '#052E16' },
];

type TabId = 'home' | 'search' | 'glossary' | 'appearance' | 'profile';

const DOCK_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'search', label: 'Поиск', icon: Search },
  { id: 'glossary', label: 'Словарь', icon: BookMarked },
  { id: 'appearance', label: 'Темы', icon: Palette },
  { id: 'profile', label: 'Профиль', icon: User },
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatSlideLayers(slide: any): string {
  if (typeof slide?.layersText === 'string' && slide.layersText.trim()) {
    return slide.layersText;
  }
  if (typeof slide?.layers === 'string') {
    return slide.layers;
  }
  if (Array.isArray(slide?.layers)) {
    return slide.layers
      .map((l: any) =>
        typeof l === 'string'
          ? l
          : [l?.name || l?.short_name, l?.description].filter(Boolean).join(' — ')
      )
      .filter(Boolean)
      .join('; ');
  }
  if (typeof slide?.exam_checklist?.layers === 'string') {
    return slide.exam_checklist.layers;
  }
  return '';
}

function getSlideImage(slide: any): string {
  return slide?.imageUrl || slide?.image_clean_url || '';
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  // Иерархическое раскрытие разделов и внутренних вкладок на Главной
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(
    () => MODULES[0]?.id || null
  );
  const [moduleInnerTab, setModuleInnerTab] = useState<Record<string, 'theory' | 'slides'>>({});
  const [expandedSlideId, setExpandedSlideId] = useState<string | null>(null);

  // Оформление: 'dark' (OLED по умолчанию) или 'light'
  const [colorMode, setColorMode] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('baza_color_mode') as 'dark' | 'light') || 'dark'
  );
  const [accentId, setAccentId] = useState<string>(
    () => localStorage.getItem('baza_accent') || 'teal'
  );

  // Прогресс изучения
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('baza_mastered') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Состояния поиска, словаря, сброса, микроскопа и тренажёра
  const [searchQuery, setSearchQuery] = useState('');
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeMicroscopeSlide, setActiveMicroscopeSlide] = useState<HistSlide | null>(null);

  const [quizState, setQuizState] = useState<{
    slides: HistSlide[];
    title: string;
    index: number;
    selected: string | null;
    options: string[];
  } | null>(null);

  // Безопасный отступ сверху под системные кнопки Telegram iOS / Desktop
  const [topInsetPx, setTopInsetPx] = useState<number>(14);

  const accent = ACCENTS.find((a) => a.id === accentId) || ACCENTS[0];
  const isDark = colorMode === 'dark';

  const tgUser = getTg()?.initDataUnsafe?.user;
  const userName = tgUser?.first_name || 'Студент';
  const userHandle = tgUser?.username ? `@${tgUser.username}` : 'Учебный профиль';
  const userInitial = (userName?.[0] || 'Б').toUpperCase();

  useEffect(() => {
    localStorage.setItem('baza_color_mode', colorMode);
    const tg = getTg();
    if (tg?.setHeaderColor) {
      tg.setHeaderColor(colorMode === 'dark' ? '#09090B' : '#F3F4F6');
    }
    if (tg?.setBackgroundColor) {
      tg.setBackgroundColor(colorMode === 'dark' ? '#09090B' : '#F3F4F6');
    }
  }, [colorMode]);

  useEffect(() => {
    localStorage.setItem('baza_accent', accentId);
  }, [accentId]);

  useEffect(() => {
    localStorage.setItem('baza_mastered', JSON.stringify(masteredIds));
  }, [masteredIds]);

  // Сброс скролла вверх при переключении вкладок
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setConfirmReset(false);
  }, [activeTab]);

  // Блокировка скролла фона при открытом bottom sheet словарика
  useEffect(() => {
    if (!selectedTerm) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedTerm]);

  // Инициализация Telegram WebApp и safe-area
  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();

    const updateSafeArea = () => {
      const contentTop = tg.contentSafeAreaInset?.top || 0;
      const systemTop = tg.safeAreaInset?.top || 0;
      const total = contentTop + systemTop;
      setTopInsetPx(total > 0 ? total + 8 : 14);
    };

    updateSafeArea();
    tg.onEvent?.('contentSafeAreaChanged', updateSafeArea);
    tg.onEvent?.('safeAreaChanged', updateSafeArea);

    return () => {
      tg.offEvent?.('contentSafeAreaChanged', updateSafeArea);
      tg.offEvent?.('safeAreaChanged', updateSafeArea);
    };
  }, []);

  // Нативная кнопка Назад в Telegram
  useEffect(() => {
    const tg = getTg();
    if (!tg) return;

    const onBack = () => {
      if (selectedTerm) {
        setSelectedTerm(null);
      } else if (activeMicroscopeSlide) {
        setActiveMicroscopeSlide(null);
      } else if (quizState) {
        setQuizState(null);
      } else if (activeTab !== 'home') {
        setActiveTab('home');
      }
    };

    const showBack =
      Boolean(selectedTerm) ||
      Boolean(activeMicroscopeSlide) ||
      Boolean(quizState) ||
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
  }, [activeTab, quizState, activeMicroscopeSlide, selectedTerm]);

  const haptic = (type: 'light' | 'medium' | 'success' | 'error') => {
    const tg = getTg();
    if (!tg?.HapticFeedback) return;
    if (type === 'success' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  };

  const buildOptions = (slide: HistSlide): string[] => {
    const seen = new Set<string>([slide.title]);
    const distractors: string[] = [];

    if (Array.isArray(slide.distractors)) {
      for (const d of slide.distractors) {
        if (d && !seen.has(d)) {
          seen.add(d);
          distractors.push(d);
        }
      }
    }

    if (distractors.length < 3) {
      const fallbacks = shuffleArray(EXAM_SLIDES.filter((s) => s.id !== slide.id));
      for (const s of fallbacks) {
        if (distractors.length >= 3) break;
        if (s.title && !seen.has(s.title)) {
          seen.add(s.title);
          distractors.push(s.title);
        }
      }
    }

    return shuffleArray([slide.title, ...distractors.slice(0, 3)]);
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

  const handleResetProgress = () => {
    const tg = getTg();
    if (tg?.showConfirm) {
      tg.showConfirm('Сбросить прогресс изученных препаратов?', (confirmed: boolean) => {
        if (confirmed) {
          haptic('medium');
          setMasteredIds([]);
        }
      });
      return;
    }

    if (!confirmReset) {
      haptic('light');
      setConfirmReset(true);
    } else {
      haptic('medium');
      setMasteredIds([]);
      setConfirmReset(false);
    }
  };

  const filteredSlides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return EXAM_SLIDES;
    return EXAM_SLIDES.filter((s) => {
      const title = (s.title || '').toLowerCase();
      const stain = (s.stain || '').toLowerCase();
      const killer = (s.killerFeature || '').toLowerCase();
      const num = String((s as any).examNumber ?? '');
      return title.includes(q) || stain.includes(q) || killer.includes(q) || num === q;
    });
  }, [searchQuery]);

  const filteredGlossary = useMemo(() => {
    const q = glossaryQuery.trim().toLowerCase();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [glossaryQuery]);

  const hasExplicitModuleIds = useMemo(
    () => THEORY_BLOCKS.some((t: any) => Boolean(t?.moduleId)),
    []
  );

  const totalSlides = EXAM_SLIDES.length || 70;
  const masteredCount = masteredIds.length;
  const readinessPct = Math.round((masteredCount / Math.max(totalSlides, 1)) * 100);
  const activeTabIndex = Math.max(
    0,
    DOCK_TABS.findIndex((t) => t.id === activeTab)
  );

  const ui = {
    bg: isDark ? 'bg-[#09090B] text-white' : 'bg-[#F3F4F6] text-zinc-900',
    card: isDark
      ? 'bg-[#141417] border border-white/[0.06]'
      : 'bg-white border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)]',
    cardInteractive: isDark
      ? 'bg-[#141417] border border-white/[0.06] active:bg-[#1C1C21]'
      : 'bg-white border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] active:bg-zinc-50',
    subCard: isDark
      ? 'bg-white/[0.03] border border-white/[0.05]'
      : 'bg-zinc-50 border border-black/[0.04]',
    iconCircle: isDark ? 'bg-white/[0.06] text-zinc-200' : 'bg-zinc-100 text-zinc-700',
    muted: isDark ? 'text-zinc-400' : 'text-zinc-500',
    subtle: isDark ? 'text-zinc-500' : 'text-zinc-400',
    divider: isDark ? 'divide-white/[0.06]' : 'divide-zinc-100',
    ctaBtn: isDark ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-white',
    pillBg: isDark ? 'bg-white/[0.06]' : 'bg-zinc-200/70',
    pillActive: isDark ? 'bg-[#222227] text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm',
  };

  return (
    <div
      className={`min-h-screen ${ui.bg} font-sans antialiased selection:bg-teal-500/20 pb-32 transition-colors duration-300`}
    >
      {/* ==================== ЭКРАН ТРЕНАЖЁРА ==================== */}
      {quizState ? (
        <div
          style={{ paddingTop: `${topInsetPx}px` }}
          className="max-w-md mx-auto px-4 pb-8 min-h-screen flex flex-col animate-fadeIn"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => setQuizState(null)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.card} active:scale-95 transition`}
              aria-label="Выйти из теста"
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

          {(() => {
            const slide = quizState.slides[quizState.index];
            const imgSrc = getSlideImage(slide);
            return (
              <>
                <div className="relative w-full h-[35vh] rounded-[26px] overflow-hidden bg-black border border-white/10 mb-4 shadow-lg">
                  {imgSrc && (
                    <img src={imgSrc} alt={slide.title} className="w-full h-full object-cover" />
                  )}
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
                        key={`${idx}-${opt}`}
                        disabled={Boolean(quizState.selected)}
                        onClick={() => handleAnswer(opt)}
                        className={`w-full rounded-[20px] p-3.5 text-left font-semibold text-[14px] flex items-center gap-3 transition-all duration-200 active:scale-[0.98] ${stateClass}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${ui.iconCircle}`}
                        >
                          {['A', 'B', 'C', 'D'][idx] || idx + 1}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {quizState.selected && (
                  <div className={`mt-4 rounded-[24px] p-4 ${ui.card} space-y-3 animate-slideUp`}>
                    <div className="text-[13px] leading-relaxed">
                      <span className={`font-bold ${ui.muted}`}>Главный признак: </span>
                      <RichGlossaryText
                        text={slide.killerFeature}
                        onSelectTerm={setSelectedTerm}
                        accentHex={accent.hex}
                      />
                    </div>
                    <button
                      onClick={nextQuizSlide}
                      style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                      className="w-full py-3.5 rounded-[16px] font-bold text-[14px] active:scale-[0.98] transition"
                    >
                      {quizState.index + 1 < quizState.slides.length
                        ? 'Дальше →'
                        : 'Завершить тренировку'}
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        /* ==================== ОСНОВНЫЕ ВКЛАДКИ ==================== */
        <div style={{ paddingTop: `${topInsetPx}px` }} className="max-w-md mx-auto px-4">
          {/* 1. ГЛАВНАЯ */}
          {activeTab === 'home' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Верхняя шапка */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    haptic('light');
                    setActiveTab('profile');
                  }}
                  style={{ backgroundColor: accent.hex, color: accent.textOnAccent }}
                  className="w-9 h-9 rounded-full font-extrabold text-[14px] flex items-center justify-center shadow-sm active:scale-95 transition"
                  aria-label="Профиль"
                >
                  {userInitial}
                </button>

                <span className="text-[12px] font-extrabold tracking-[0.22em] uppercase">
                  БАЗА
                </span>

                <button
                  onClick={() => {
                    haptic('light');
                    setActiveTab('appearance');
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${ui.cardInteractive} active:scale-95 transition`}
                  aria-label="Оформление"
                >
                  <Palette className="w-4 h-4" style={{ color: accent.hex }} />
                </button>
              </div>

              {/* Центральный индикатор готовности */}
              <div className="text-center py-2">
                <p className={`text-[13px] font-medium ${ui.muted}`}>Ваша готовность</p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-[44px] font-extrabold tracking-tight leading-none">
                    {masteredCount}
                  </span>
                  <span className={`text-[24px] font-bold ${ui.subtle}`}>/{totalSlides}</span>
                </div>
                <p className={`text-[12px] mt-1.5 ${ui.subtle}`}>
                  Усвоено к экзамену: {readinessPct}%
                </p>
              </div>

              {/* 4 уникальные быстрые плитки */}
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  {
                    label: 'Поиск',
                    icon: Search,
                    onClick: () => setActiveTab('search'),
                  },
                  {
                    label: 'Теория',
                    icon: BookOpen,
                    onClick: () => {
                      const firstId = MODULES[0]?.id;
                      if (firstId) {
                        setExpandedModuleId(firstId);
                        setModuleInnerTab((prev) => ({ ...prev, [firstId]: 'theory' }));
                      }
                      document
                        .getElementById('curriculum-tree')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    },
                  },
                  {
                    label: 'Словарь',
                    icon: BookMarked,
                    onClick: () => setActiveTab('glossary'),
                  },
                  {
                    label: 'Темы',
                    icon: Palette,
                    onClick: () => setActiveTab('appearance'),
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

              {/* Единственная главная CTA-карточка тренировки */}
              <div
                className={`rounded-[24px] p-4 space-y-3.5 relative overflow-hidden ${ui.card}`}
                style={{
                  backgroundImage: isDark
                    ? `radial-gradient(circle at 85% 20%, ${accent.hex}1F 0%, transparent 60%)`
                    : `radial-gradient(circle at 85% 20%, ${accent.hex}16 0%, transparent 60%)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: accent.hex }} />
                    <span className="font-extrabold text-[16px]">Спидран по препаратам</span>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${accent.hex}20`, color: accent.hex }}
                  >
                    15 стекол
                  </span>
                </div>
                <p className={`text-[13px] leading-relaxed ${ui.muted}`}>
                  Слепая диагностика случайных микропрепаратов с разбором слоёв, клеток и ключевых
                  отличий.
                </p>
                <button
                  onClick={() => {
                    const random15 = shuffleArray(EXAM_SLIDES).slice(0, 15);
                    startQuiz(random15, 'Спидран · 15 стекол');
                  }}
                  className={`w-full py-3.5 rounded-[16px] font-bold text-[14px] transition active:scale-[0.98] ${ui.ctaBtn}`}
                >
                  Начать проверку
                </button>
              </div>

              {/* ИЕРАРХИЧЕСКИЕ БЛОКИ: СНАЧАЛА ТЕОРИЯ -> ВНУТРИ ПРЕПАРАТЫ И РАЗБОРЫ */}
              <div id="curriculum-tree" className="space-y-3 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="font-extrabold text-[16px]">Программа и разборы</span>
                  <span className={`text-[12px] ${ui.muted}`}>Нажмите на раздел</span>
                </div>

                {MODULES.map((mod, mIdx) => {
                  const isOpen = expandedModuleId === mod.id;
                  const modSlides = EXAM_SLIDES.filter((s) => s.moduleId === mod.id);
                  const modTheory = hasExplicitModuleIds
                    ? THEORY_BLOCKS.filter((t: any) => t?.moduleId === mod.id)
                    : THEORY_BLOCKS[mIdx]
                    ? [THEORY_BLOCKS[mIdx]]
                    : [];
                  const done = modSlides.filter((s) => masteredIds.includes(s.id)).length;
                  const currentSubTab = moduleInnerTab[mod.id] || 'theory';

                  return (
                    <div
                      key={mod.id}
                      className={`rounded-[24px] overflow-hidden transition-all duration-300 ${ui.card}`}
                    >
                      <button
                        onClick={() => {
                          haptic('light');
                          setExpandedModuleId(isOpen ? null : mod.id);
                        }}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left transition active:opacity-80"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[13px]"
                            style={{
                              backgroundColor: isOpen ? accent.hex : `${accent.hex}1A`,
                              color: isOpen ? accent.textOnAccent : accent.hex,
                            }}
                          >
                            {mIdx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[15px] leading-snug">
                              {mod.title}
                            </div>
                            <div className={`text-[12px] ${ui.muted} mt-0.5`}>
                              Теория · {modSlides.length} препаратов ({done}/{modSlides.length})
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          } ${ui.subtle}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 space-y-3.5 animate-fadeIn">
                          <div className={`grid grid-cols-2 p-1 rounded-[16px] ${ui.pillBg}`}>
                            <button
                              onClick={() => {
                                haptic('light');
                                setModuleInnerTab((prev) => ({ ...prev, [mod.id]: 'theory' }));
                              }}
                              className={`py-2 rounded-[12px] text-[12px] font-bold transition-all ${
                                currentSubTab === 'theory' ? ui.pillActive : ui.muted
                              }`}
                            >
                              1. Теория раздела
                            </button>
                            <button
                              onClick={() => {
                                haptic('light');
                                setModuleInnerTab((prev) => ({ ...prev, [mod.id]: 'slides' }));
                              }}
                              className={`py-2 rounded-[12px] text-[12px] font-bold transition-all ${
                                currentSubTab === 'slides' ? ui.pillActive : ui.muted
                              }`}
                            >
                              2. Препараты ({modSlides.length})
                            </button>
                          </div>

                          {/* ВКЛАДКА 1: КОНСПЕКТ ТЕОРИИ */}
                          {currentSubTab === 'theory' && (
                            <div className="space-y-3">
                              {modTheory.length > 0 ? (
                                modTheory.map((block: any) => (
                                  <div
                                    key={block.id}
                                    className={`rounded-[18px] p-3.5 space-y-2 ${ui.subCard}`}
                                  >
                                    <div className="font-bold text-[14px]">{block.title}</div>
                                    <div
                                      className={`text-[13px] leading-relaxed whitespace-pre-line ${ui.muted}`}
                                    >
                                      <RichGlossaryText
                                        text={block.summary}
                                        onSelectTerm={setSelectedTerm}
                                        accentHex={accent.hex}
                                      />
                                    </div>
                                    {block.examTip && (
                                      <div
                                        className="p-2.5 rounded-[12px] text-[12px] leading-snug"
                                        style={{ backgroundColor: `${accent.hex}14` }}
                                      >
                                        <span className="font-bold" style={{ color: accent.hex }}>
                                          На экзамене:{' '}
                                        </span>
                                        <RichGlossaryText
                                          text={block.examTip}
                                          onSelectTerm={setSelectedTerm}
                                          accentHex={accent.hex}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div
                                  className={`rounded-[18px] p-3.5 text-[13px] leading-relaxed ${ui.subCard} ${ui.muted}`}
                                >
                                  <RichGlossaryText
                                    text={`Раздел «${mod.title}» включает изучение структурной организации тканей, их клеток и взаимодействия с базальной мембраной или тинкториальных свойств (оксифилия и базофилия). Нажмите на любой подсвеченный термин, чтобы открыть его определение, или перейдите во вкладку «Препараты».`}
                                    onSelectTerm={setSelectedTerm}
                                    accentHex={accent.hex}
                                  />
                                </div>
                              )}

                              <button
                                onClick={() => {
                                  haptic('light');
                                  setModuleInnerTab((prev) => ({ ...prev, [mod.id]: 'slides' }));
                                }}
                                style={{ backgroundColor: `${accent.hex}1A`, color: accent.hex }}
                                className="w-full py-2.5 rounded-[14px] font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.99] transition"
                              >
                                Перейти к препаратам раздела ({modSlides.length}) →
                              </button>
                            </div>
                          )}

                          {/* ВКЛАДКА 2: ПРЕПАРАТЫ И РАЗБОРЫ */}
                          {currentSubTab === 'slides' && (
                            <div className="space-y-2.5">
                              {modSlides.map((slide) => {
                                const isSlideOpen = expandedSlideId === slide.id;
                                const isDone = masteredIds.includes(slide.id);
                                const imgSrc = getSlideImage(slide);
                                const layersSummary = formatSlideLayers(slide);

                                return (
                                  <div
                                    key={slide.id}
                                    className={`rounded-[18px] overflow-hidden transition-all ${ui.subCard}`}
                                  >
                                    <button
                                      onClick={() => {
                                        haptic('light');
                                        setExpandedSlideId(isSlideOpen ? null : slide.id);
                                      }}
                                      className="w-full p-3 flex items-center gap-3 text-left"
                                    >
                                      {imgSrc ? (
                                        <img
                                          src={imgSrc}
                                          alt={slide.title}
                                          className="w-12 h-12 rounded-[12px] object-cover bg-black shrink-0 border border-white/10"
                                        />
                                      ) : (
                                        <div
                                          className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 ${ui.iconCircle}`}
                                        >
                                          <Microscope className="w-5 h-5" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          {(slide as any).examNumber !== undefined && (
                                            <span
                                              className="text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                                              style={{
                                                backgroundColor: `${accent.hex}20`,
                                                color: accent.hex,
                                              }}
                                            >
                                              №{(slide as any).examNumber}
                                            </span>
                                          )}
                                          <span className={`text-[11px] truncate ${ui.muted}`}>
                                            {slide.stain}
                                          </span>
                                        </div>
                                        <div className="font-bold text-[13px] leading-snug mt-0.5 line-clamp-2">
                                          {slide.title}
                                        </div>
                                      </div>
                                      {isDone ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                      ) : (
                                        <ChevronDown
                                          className={`w-4 h-4 shrink-0 transition-transform ${
                                            isSlideOpen ? 'rotate-180' : ''
                                          } ${ui.subtle}`}
                                        />
                                      )}
                                    </button>

                                    {isSlideOpen && (
                                      <div className="px-3.5 pb-3.5 pt-2 space-y-2.5 border-t border-white/[0.05] text-[12px] leading-relaxed animate-fadeIn">
                                        {layersSummary && (
                                          <div>
                                            <span className={`font-bold ${ui.muted}`}>
                                              Слои и строение:{' '}
                                            </span>
                                            <RichGlossaryText
                                              text={layersSummary}
                                              onSelectTerm={setSelectedTerm}
                                              accentHex={accent.hex}
                                            />
                                          </div>
                                        )}
                                        {slide.keyCells && (
                                          <div>
                                            <span className={`font-bold ${ui.muted}`}>
                                              Ключевые клетки:{' '}
                                            </span>
                                            <RichGlossaryText
                                              text={slide.keyCells}
                                              onSelectTerm={setSelectedTerm}
                                              accentHex={accent.hex}
                                            />
                                          </div>
                                        )}
                                        {slide.killerFeature && (
                                          <div>
                                            <span
                                              className="font-bold"
                                              style={{ color: accent.hex }}
                                            >
                                              Главный признак:{' '}
                                            </span>
                                            <RichGlossaryText
                                              text={slide.killerFeature}
                                              onSelectTerm={setSelectedTerm}
                                              accentHex={accent.hex}
                                            />
                                          </div>
                                        )}

                                        <div className="flex items-center gap-2 pt-1">
                                          <button
                                            onClick={() => setActiveMicroscopeSlide(slide)}
                                            style={{
                                              backgroundColor: accent.hex,
                                              color: accent.textOnAccent,
                                            }}
                                            className="flex-1 py-2.5 rounded-[12px] font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition"
                                          >
                                            <Microscope className="w-3.5 h-3.5" />
                                            В микроскоп
                                          </button>
                                          {(slide as any).youtubeTimestampUrl && (
                                            <a
                                              href={(slide as any).youtubeTimestampUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="py-2.5 px-3 rounded-[12px] bg-rose-500/15 text-rose-400 font-bold text-[12px] flex items-center gap-1"
                                            >
                                              <Play className="w-3.5 h-3.5 fill-current" />
                                              Разбор
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {modSlides.length > 0 && (
                                <button
                                  onClick={() => startQuiz(modSlides, mod.title)}
                                  className={`w-full py-3 rounded-[14px] font-bold text-[13px] mt-1 transition active:scale-[0.98] ${ui.ctaBtn}`}
                                >
                                  Пройти тест по разделу ({modSlides.length})
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. ПОИСК */}
          {activeTab === 'search' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="pt-1">
                <h1 className="text-[30px] font-extrabold tracking-tight leading-none">Поиск</h1>
                <p className={`text-[13px] ${ui.muted} mt-1.5`}>
                  Номер билета, препарат, окраска или признак
                </p>
              </div>

              <div className={`rounded-[20px] px-4 py-3 flex items-center gap-3 ${ui.card}`}>
                <Search className={`w-4 h-4 ${ui.muted}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Например: трахея, мезотелий, 15..."
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} aria-label="Очистить поиск">
                    <X className={`w-4 h-4 ${ui.muted}`} />
                  </button>
                )}
              </div>

              <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                {filteredSlides.length > 0 ? (
                  filteredSlides.map((slide) => (
                    <div key={slide.id} className="p-4 space-y-2">
                      <div
                        onClick={() => setActiveMicroscopeSlide(slide)}
                        className="flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {(slide as any).examNumber !== undefined && (
                              <span
                                className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                                style={{ backgroundColor: `${accent.hex}20`, color: accent.hex }}
                              >
                                №{(slide as any).examNumber}
                              </span>
                            )}
                            <span className={`text-[11px] ${ui.muted}`}>{slide.stain}</span>
                          </div>
                          <div className="font-bold text-[15px]">{slide.title}</div>
                        </div>
                        <ChevronRight className={`w-4 h-4 mt-1 shrink-0 ${ui.subtle}`} />
                      </div>
                      {slide.killerFeature && (
                        <div className={`text-[12px] leading-relaxed ${ui.muted}`}>
                          <RichGlossaryText
                            text={slide.killerFeature}
                            onSelectTerm={setSelectedTerm}
                            accentHex={accent.hex}
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={`p-6 text-center text-[13px] ${ui.muted}`}>
                    По запросу «{searchQuery}» ничего не найдено
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. СЛОВАРЬ ТЕРМИНОВ */}
          {activeTab === 'glossary' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="pt-1">
                <h1 className="text-[30px] font-extrabold tracking-tight leading-none">Словарь</h1>
                <p className={`text-[13px] ${ui.muted} mt-1.5`}>
                  Термины гистологии — нажимайте на подсвеченные слова в конспектах
                </p>
              </div>

              <div className={`rounded-[20px] px-4 py-3 flex items-center gap-3 ${ui.card}`}>
                <Search className={`w-4 h-4 ${ui.muted}`} />
                <input
                  type="text"
                  value={glossaryQuery}
                  onChange={(e) => setGlossaryQuery(e.target.value)}
                  placeholder="Найти термин (остеон, уротелий, метахромазия...)"
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-zinc-500"
                />
                {glossaryQuery && (
                  <button onClick={() => setGlossaryQuery('')} aria-label="Очистить поиск">
                    <X className={`w-4 h-4 ${ui.muted}`} />
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {filteredGlossary.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      haptic('light');
                      setSelectedTerm(item);
                    }}
                    className={`w-full rounded-[22px] p-4 text-left space-y-1.5 transition active:scale-[0.99] ${ui.cardInteractive}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[15px]" style={{ color: accent.hex }}>
                        {item.term}
                      </span>
                      <span className={`text-[11px] font-medium ${ui.subtle}`}>
                        {item.category}
                      </span>
                    </div>
                    <p className={`text-[13px] leading-snug line-clamp-2 ${ui.muted}`}>
                      {item.definition}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. ОТДЕЛЬНАЯ ВКЛАДКА «ОФОРМЛЕНИЕ» */}
          {activeTab === 'appearance' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="pt-1">
                <h1 className="text-[30px] font-extrabold tracking-tight leading-none">
                  Оформление
                </h1>
                <p className={`text-[13px] ${ui.muted} mt-1.5`}>
                  Настройте тему и акцент приложения под себя
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="px-1 font-bold text-[14px]">Тема экрана</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      haptic('light');
                      setColorMode('dark');
                    }}
                    className={`rounded-[22px] p-4 text-left space-y-3 transition active:scale-[0.98] ${
                      isDark
                        ? 'bg-[#141417] border-2'
                        : 'bg-zinc-900 text-white border border-black/10 opacity-85'
                    }`}
                    style={isDark ? { borderColor: accent.hex } : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <Moon className="w-5 h-5 text-zinc-200" />
                      {isDark && <CheckCircle2 className="w-4 h-4" style={{ color: accent.hex }} />}
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-white">Тёмная</div>
                      <div className="text-[11px] text-zinc-400">OLED Dark</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      haptic('light');
                      setColorMode('light');
                    }}
                    className={`rounded-[22px] p-4 text-left space-y-3 transition active:scale-[0.98] ${
                      !isDark
                        ? 'bg-white text-zinc-900 border-2 shadow-sm'
                        : 'bg-white text-zinc-900 border border-white/10 opacity-85'
                    }`}
                    style={!isDark ? { borderColor: accent.hex } : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <Sun className="w-5 h-5 text-amber-500" />
                      {!isDark && (
                        <CheckCircle2 className="w-4 h-4" style={{ color: accent.hex }} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[14px] text-zinc-900">Светлая</div>
                      <div className="text-[11px] text-zinc-500">iOS Light</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="px-1 font-bold text-[14px]">Акцентный цвет</div>
                <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                  {ACCENTS.map((item) => {
                    const active = item.id === accentId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          haptic('light');
                          setAccentId(item.id);
                        }}
                        className="w-full p-4 flex items-center justify-between text-left transition active:opacity-75"
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            style={{ backgroundColor: item.hex }}
                            className="w-7 h-7 rounded-full shadow-sm shrink-0"
                          />
                          <span className="font-bold text-[14px]">{item.name}</span>
                        </div>
                        {active && <CheckCircle2 className="w-5 h-5" style={{ color: item.hex }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 5. ПРОФИЛЬ (ТОЛЬКО ЧИСТЫЙ ЗАГОЛОВОК) */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="pt-1">
                <h1 className="text-[30px] font-extrabold tracking-tight leading-none">Профиль</h1>
              </div>

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

              <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}
                    >
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Изучено препаратов</div>
                      <div className={`text-[12px] ${ui.muted}`}>Экзаменационный список</div>
                    </div>
                  </div>
                  <div className="font-extrabold text-[14px]">
                    {masteredCount} / {totalSlides}
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}
                    >
                      <BookMarked className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Терминов в словаре</div>
                      <div className={`text-[12px] ${ui.muted}`}>Интерактивные подсказки</div>
                    </div>
                  </div>
                  <div className="font-extrabold text-[14px]">{GLOSSARY_TERMS.length}</div>
                </div>
              </div>

              <div className={`rounded-[24px] overflow-hidden ${ui.card}`}>
                <button
                  onClick={handleResetProgress}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left transition active:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="font-bold text-[14px] text-rose-400">
                      {confirmReset ? 'Нажмите ещё раз для сброса' : 'Сбросить прогресс'}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${ui.subtle}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== НИЖНЯЯ ПАНЕЛЬ LIQUID GLASS СО СКОЛЬЗЯЩИМ ПОЛЗУНКОМ ==================== */}
      {!quizState && (
        <div
          style={{ bottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
          className="fixed left-4 right-4 z-40 pointer-events-none flex justify-center"
        >
          <nav
            className={`pointer-events-auto relative w-full max-w-[396px] rounded-full p-1.5 grid grid-cols-5 items-center ${
              isDark ? 'liquid-glass-dark' : 'liquid-glass-light'
            }`}
          >
            {/* Плавно скользящая капсула активной вкладки */}
            <div
              aria-hidden="true"
              style={{
                width: 'calc((100% - 12px) / 5)',
                transform: `translateX(${activeTabIndex * 100}%)`,
                transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
              }}
              className={`absolute left-1.5 top-1.5 bottom-1.5 rounded-full transition-transform duration-300 pointer-events-none ${
                isDark
                  ? 'bg-white/[0.14] border border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_4px_12px_rgba(0,0,0,0.3)]'
                  : 'bg-zinc-900 shadow-[0_4px_14px_rgba(0,0,0,0.18)]'
              }`}
            />

            {DOCK_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic('light');
                    setActiveTab(tab.id);
                  }}
                  className={`relative z-10 py-2 px-1 rounded-full flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 ${
                    isActive
                      ? 'text-white'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2]" />
                  <span className="text-[10px] font-semibold tracking-tight truncate max-w-full">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* ==================== BOTTOM SHEET СЛОВАРИКА ТЕРМИНОВ ==================== */}
      {selectedTerm && (
        <div
          onClick={() => setSelectedTerm(null)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-[30px] p-5 pb-9 space-y-3.5 animate-slideUp ${
              isDark
                ? 'bg-[#16161A]/95 backdrop-blur-2xl border-t border-white/15 text-white'
                : 'bg-white/95 backdrop-blur-2xl border-t border-black/10 text-zinc-900'
            }`}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-500/30 mx-auto mb-1" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accent.hex}20`, color: accent.hex }}
                >
                  {selectedTerm.category}
                </span>
                <h3 className="text-[20px] font-extrabold mt-1.5 leading-tight">
                  {selectedTerm.term}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTerm(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ui.iconCircle}`}
                aria-label="Закрыть подсказку"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-[14px] leading-relaxed ${ui.muted}`}>{selectedTerm.definition}</p>

            <div
              className="p-3.5 rounded-[18px] text-[13px] leading-snug flex items-start gap-2.5"
              style={{ backgroundColor: `${accent.hex}14` }}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent.hex }} />
              <div>
                <span className="font-bold" style={{ color: accent.hex }}>
                  Важно на экзамене:{' '}
                </span>
                <span>{selectedTerm.examNote}</span>
              </div>
            </div>
          </div>
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
