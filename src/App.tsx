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
  Smartphone,
  Award,
  BookMarked,
  Play,
  Info,
  Bookmark,
  AlertCircle,
  Shuffle,
  Pipette,
  FileText,
} from 'lucide-react';
import { MODULES, EXAM_SLIDES, THEORY_BLOCKS, HistSlide } from './data/histoData';
import { GLOSSARY_TERMS, GlossaryTerm, RichGlossaryText } from './data/glossaryData';
import { ELECTRONOGRAMS, EXAM_TICKETS } from './data/examContent';
const MicroscopeViewerModal = React.lazy(() => import('./components/MicroscopeViewerModal'));


const safeSetItem = (key: string, value: string) => {
  try {
    safeSetItem(key, value);
  } catch (e) {
    console.warn('localStorage access failed:', e);
  }
};

const ImageWithFallback: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
}> = ({ src, alt, className = '', fallbackIcon, fallbackText = 'Фото недоступно' }) => {
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1.5 bg-black/40 border border-white/10 text-center select-none ${className}`}
      >
        {fallbackIcon || <Microscope className="w-5 h-5 opacity-40 text-white" />}
        {fallbackText ? (
          <span className="text-[11px] font-medium text-white/50">{fallbackText}</span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={className}
      loading="lazy"
    />
  );
};

const getTg = () => (window as any).Telegram?.WebApp;

type ThemeMode = 'dark' | 'light' | 'system';
type AccentId = 'mono' | 'mint' | 'blue' | 'pink' | 'violet' | 'custom';
type TabId = 'home' | 'em' | 'tickets' | 'glossary' | 'profile';

const DOCK_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'em', label: 'ЭМ-схемы', icon: Layers },
  { id: 'tickets', label: 'Билеты', icon: FileText },
  { id: 'glossary', label: 'Словарь', icon: BookMarked },
  { id: 'profile', label: 'Профиль', icon: User },
];

const PRESET_ACCENTS: { id: Exclude<AccentId, 'custom'>; label: string; darkHex: string; lightHex: string }[] = [
  { id: 'mono', label: 'Монохром', darkHex: '#FFFFFF', lightHex: '#18181B' },
  { id: 'mint', label: 'Мята', darkHex: '#2DD4BF', lightHex: '#0D9488' },
  { id: 'blue', label: 'Синий', darkHex: '#3B82F6', lightHex: '#2563EB' },
  { id: 'pink', label: 'Розовый', darkHex: '#EC4899', lightHex: '#DB2777' },
  { id: 'violet', label: 'Фиолетовый', darkHex: '#8B5CF6', lightHex: '#7C3AED' },
];

function getContrastText(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#FFFFFF';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#09090B' : '#FFFFFF';
}

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

function readStoredIds(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  // Глобальные оверлеи и шторки
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAppearanceSheet, setShowAppearanceSheet] = useState(false);
  const [showFavoritesSheet, setShowFavoritesSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Иерархическое раскрытие разделов, ЭМ и билетов
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(
    () => MODULES[0]?.id || null
  );
  const [moduleInnerTab, setModuleInnerTab] = useState<Record<string, 'theory' | 'slides'>>({});
  const [expandedSlideId, setExpandedSlideId] = useState<string | null>(null);
  const [expandedEmId, setExpandedEmId] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [ticketBlockFilter, setTicketBlockFilter] = useState<string>('Все');

  // Тема и акцент
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem('baza_theme_mode') as ThemeMode) || 'dark'
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    const tgScheme = getTg()?.colorScheme;
    if (tgScheme === 'light') return false;
    if (tgScheme === 'dark') return true;
    return typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true;
  });
  const [accentId, setAccentId] = useState<AccentId>(
    () => (localStorage.getItem('baza_accent_v2') as AccentId) || 'mint'
  );
  const [customHex, setCustomHex] = useState<string>(
    () => localStorage.getItem('baza_custom_hex') || '#F59E0B'
  );

  // Прогресс, избранное, ошибки
  const [masteredIds, setMasteredIds] = useState<string[]>(() => readStoredIds('baza_mastered'));
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readStoredIds('baza_favorites'));
  const [mistakeIds, setMistakeIds] = useState<string[]>(() => readStoredIds('baza_mistakes'));

  // Поиск, словарь, сброс, микроскоп, квиз
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

  const isDark = themeMode === 'system' ? systemPrefersDark : themeMode === 'dark';

  const activeAccentHex = useMemo(() => {
    if (accentId === 'custom') return customHex;
    const found = PRESET_ACCENTS.find((p) => p.id === accentId) || PRESET_ACCENTS[1];
    return isDark ? found.darkHex : found.lightHex;
  }, [accentId, customHex, isDark]);

  const accentTextColor = useMemo(() => getContrastText(activeAccentHex), [activeAccentHex]);

  const tgUser = getTg()?.initDataUnsafe?.user;
  const userName = tgUser?.first_name || 'Студент';
  const userHandle = tgUser?.username ? `@${tgUser.username}` : 'Учебный профиль';
  const userInitial = (userName?.[0] || 'Б').toUpperCase();

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2400);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Отслеживание системной темы
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onMqChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq?.addEventListener?.('change', onMqChange);

    const tg = getTg();
    const onTgTheme = () => {
      if (tg?.colorScheme === 'dark') setSystemPrefersDark(true);
      if (tg?.colorScheme === 'light') setSystemPrefersDark(false);
    };
    tg?.onEvent?.('themeChanged', onTgTheme);

    return () => {
      mq?.removeEventListener?.('change', onMqChange);
      tg?.offEvent?.('themeChanged', onTgTheme);
    };
  }, []);

  useEffect(() => {
    safeSetItem('baza_theme_mode', themeMode);
    const tg = getTg();
    const bgHex = isDark ? '#09090B' : '#F3F4F6';
    tg?.setHeaderColor?.(bgHex);
    tg?.setBackgroundColor?.(bgHex);
  }, [themeMode, isDark]);

  useEffect(() => {
    safeSetItem('baza_accent_v2', accentId);
  }, [accentId]);

  useEffect(() => {
    safeSetItem('baza_custom_hex', customHex);
  }, [customHex]);

  useEffect(() => {
    safeSetItem('baza_mastered', JSON.stringify(masteredIds));
  }, [masteredIds]);

  useEffect(() => {
    safeSetItem('baza_favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    safeSetItem('baza_mistakes', JSON.stringify(mistakeIds));
  }, [mistakeIds]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setConfirmReset(false);
  }, [activeTab]);

  // Блокировка фонового скролла при открытых шторках
  useEffect(() => {
    const hasSheet = Boolean(selectedTerm || showAppearanceSheet || showFavoritesSheet || isSearchOpen);
    if (!hasSheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedTerm, showAppearanceSheet, showFavoritesSheet, isSearchOpen]);

  // Safe area Telegram WebApp
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
      if (selectedTerm) setSelectedTerm(null);
      else if (showAppearanceSheet) setShowAppearanceSheet(false);
      else if (showFavoritesSheet) setShowFavoritesSheet(false);
      else if (isSearchOpen) setIsSearchOpen(false);
      else if (activeMicroscopeSlide) setActiveMicroscopeSlide(null);
      else if (quizState) setQuizState(null);
      else if (activeTab !== 'home') setActiveTab('home');
    };

    const showBack =
      Boolean(selectedTerm) ||
      showAppearanceSheet ||
      showFavoritesSheet ||
      isSearchOpen ||
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
  }, [
    activeTab,
    quizState,
    activeMicroscopeSlide,
    selectedTerm,
    showAppearanceSheet,
    showFavoritesSheet,
    isSearchOpen,
  ]);

  const haptic = (type: 'light' | 'medium' | 'success' | 'error') => {
    const tg = getTg();
    if (!tg?.HapticFeedback) return;
    if (type === 'success' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  };

  const toggleFavorite = (slideId: string) => {
    haptic('light');
    setFavoriteIds((prev) =>
      prev.includes(slideId) ? prev.filter((id) => id !== slideId) : [...prev, slideId]
    );
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

    if (isCorrect) {
      if (!masteredIds.includes(current.id)) {
        setMasteredIds((prev) => [...prev, current.id]);
      }
      if (mistakeIds.includes(current.id)) {
        setMistakeIds((prev) => prev.filter((id) => id !== current.id));
      }
    } else {
      if (!mistakeIds.includes(current.id)) {
        setMistakeIds((prev) => [...prev, current.id]);
      }
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
      tg.showConfirm('Сбросить прогресс изучения и список ошибок?', (confirmed: boolean) => {
        if (confirmed) {
          haptic('medium');
          setMasteredIds([]);
          setMistakeIds([]);
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
      setMistakeIds([]);
      setConfirmReset(false);
    }
  };

  const openTicketOfTheDay = () => {
    haptic('light');
    if (!EXAM_TICKETS.length) {
      showToast('База билетов скоро пополнится');
      return;
    }
    const randomTicket = EXAM_TICKETS[Math.floor(Math.random() * EXAM_TICKETS.length)];
    setTicketBlockFilter('Все');
    setExpandedTicketId(randomTicket.id);
    setActiveTab('tickets');
  };

  const startMistakesQuiz = () => {
    const mistakeSlides = EXAM_SLIDES.filter((s) => mistakeIds.includes(s.id));
    if (!mistakeSlides.length) {
      haptic('light');
      showToast('Ошибок пока нет — пройдите Спидран');
      return;
    }
    startQuiz(shuffleArray(mistakeSlides), `Работа над ошибками (${mistakeSlides.length})`);
  };

  // Глобальный поиск по препаратам, ЭМ, билетам и словарю
  const globalSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        slides: EXAM_SLIDES.slice(0, 8),
        ems: [],
        tickets: [],
        terms: [],
      };
    }

    return {
      slides: EXAM_SLIDES.filter((s) => {
        const num = String((s as any).examNumber ?? '');
        return (
          (s.title || '').toLowerCase().includes(q) ||
          (s.stain || '').toLowerCase().includes(q) ||
          (s.killerFeature || '').toLowerCase().includes(q) ||
          num === q
        );
      }),
      ems: ELECTRONOGRAMS.filter(
        (em) =>
          em.title.toLowerCase().includes(q) ||
          em.topic.toLowerCase().includes(q) ||
          em.description.toLowerCase().includes(q)
      ),
      tickets: EXAM_TICKETS.filter(
        (t) =>
          t.question.toLowerCase().includes(q) ||
          t.answer.toLowerCase().includes(q) ||
          String(t.number) === q
      ),
      terms: GLOSSARY_TERMS.filter(
        (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
      ),
    };
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

  const ticketBlocks = useMemo(() => {
    const unique = Array.from(new Set(EXAM_TICKETS.map((t) => t.block)));
    return ['Все', ...unique];
  }, []);

  const filteredTickets = useMemo(() => {
    if (ticketBlockFilter === 'Все') return EXAM_TICKETS;
    return EXAM_TICKETS.filter((t) => t.block === ticketBlockFilter);
  }, [ticketBlockFilter]);

  const favoriteSlides = useMemo(
    () => EXAM_SLIDES.filter((s) => favoriteIds.includes(s.id)),
    [favoriteIds]
  );

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

  const themeModeLabel =
    themeMode === 'dark' ? 'Тёмная' : themeMode === 'light' ? 'Светлая' : 'Системная';

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
                  backgroundColor: activeAccentHex,
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
            const isFav = favoriteIds.includes(slide.id);
            return (
              <>
                <div className="relative w-full h-[35vh] rounded-[26px] overflow-hidden bg-black border border-white/10 mb-4 shadow-lg">
                  <ImageWithFallback
                    src={imgSrc}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    fallbackIcon={<Microscope className="w-8 h-8 text-white/40 mb-1" />}
                    fallbackText="Фото препарата временно недоступно"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
                    {slide.stain}
                  </div>
                  <button
                    onClick={() => toggleFavorite(slide.id)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/65 backdrop-blur-md text-white flex items-center justify-center border border-white/10 active:scale-95 transition"
                    aria-label="В избранное"
                  >
                    <Bookmark
                      className="w-4 h-4"
                      style={isFav ? { fill: activeAccentHex, color: activeAccentHex } : undefined}
                    />
                  </button>
                  <button
                    onClick={() => setActiveMicroscopeSlide(slide)}
                    className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[12px] font-bold flex items-center gap-1.5 border border-white/15 active:scale-95 transition"
                  >
                    <Layers className="w-3.5 h-3.5" style={{ color: activeAccentHex }} />
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
                        accentHex={activeAccentHex}
                      />
                    </div>
                    <button
                      onClick={nextQuizSlide}
                      style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
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
              {/* Верхняя шапка: Аватар | БАЗА | Поиск */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    haptic('light');
                    setActiveTab('profile');
                  }}
                  style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
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
                    setIsSearchOpen(true);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${ui.cardInteractive} active:scale-95 transition`}
                  aria-label="Поиск по приложению"
                >
                  <Search className="w-4 h-4" />
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

              {/* 4 полезные плитки без дубликатов */}
              <div className="grid grid-cols-4 gap-2.5">
                {[
                  {
                    label: 'Теория',
                    icon: BookOpen,
                    badge: null as number | null,
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
                    label: 'Избранное',
                    icon: Bookmark,
                    badge: favoriteIds.length || null,
                    onClick: () => setShowFavoritesSheet(true),
                  },
                  {
                    label: 'Ошибки',
                    icon: AlertCircle,
                    badge: mistakeIds.length || null,
                    onClick: startMistakesQuiz,
                  },
                  {
                    label: 'Билет дня',
                    icon: Shuffle,
                    badge: null as number | null,
                    onClick: openTicketOfTheDay,
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
                      className={`relative rounded-[20px] py-3.5 px-1.5 flex flex-col items-center justify-center gap-2 transition duration-200 active:scale-95 ${ui.cardInteractive}`}
                    >
                      {item.badge !== null && (
                        <span
                          style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                          className="absolute top-2 right-2 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center"
                        >
                          {item.badge}
                        </span>
                      )}
                      <Icon className="w-5 h-5 stroke-[1.8]" />
                      <span className="text-[11px] font-bold tracking-tight truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Единственная главная CTA-карточка тренировки */}
              <div
                className={`rounded-[24px] p-4 space-y-3.5 relative overflow-hidden ${ui.card}`}
                style={{
                  backgroundImage: isDark
                    ? `radial-gradient(circle at 85% 20%, ${activeAccentHex}1F 0%, transparent 60%)`
                    : `radial-gradient(circle at 85% 20%, ${activeAccentHex}14 0%, transparent 60%)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" style={{ color: activeAccentHex }} />
                    <span className="font-extrabold text-[16px]">Спидран по препаратам</span>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${activeAccentHex}20`, color: activeAccentHex }}
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
                              backgroundColor: isOpen ? activeAccentHex : `${activeAccentHex}1A`,
                              color: isOpen ? accentTextColor : activeAccentHex,
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

                          {/* ВКЛАДКА 1: ТЕОРИЯ */}
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
                                        accentHex={activeAccentHex}
                                      />
                                    </div>
                                    {block.examTip && (
                                      <div
                                        className="p-2.5 rounded-[12px] text-[12px] leading-snug"
                                        style={{ backgroundColor: `${activeAccentHex}14` }}
                                      >
                                        <span
                                          className="font-bold"
                                          style={{ color: activeAccentHex }}
                                        >
                                          На экзамене:{' '}
                                        </span>
                                        <RichGlossaryText
                                          text={block.examTip}
                                          onSelectTerm={setSelectedTerm}
                                          accentHex={activeAccentHex}
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
                                    text={`Раздел «${mod.title}»: изучите организацию тканей и клеток, их связь с базальной мембраной и тинкториальные свойства (оксифилия или базофилия). Нажмите на любой подсвеченный термин или откройте вкладку «Препараты».`}
                                    onSelectTerm={setSelectedTerm}
                                    accentHex={activeAccentHex}
                                  />
                                </div>
                              )}

                              <button
                                onClick={() => {
                                  haptic('light');
                                  setModuleInnerTab((prev) => ({ ...prev, [mod.id]: 'slides' }));
                                }}
                                style={{
                                  backgroundColor: `${activeAccentHex}1A`,
                                  color: activeAccentHex,
                                }}
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
                                const isFav = favoriteIds.includes(slide.id);
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
                                      <ImageWithFallback
                                        src={imgSrc}
                                        alt={slide.title}
                                        className="w-12 h-12 rounded-[12px] object-cover bg-black shrink-0 border border-white/10"
                                        fallbackIcon={<Microscope className="w-5 h-5 text-white/40" />}
                                        fallbackText=""
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          {(slide as any).examNumber !== undefined && (
                                            <span
                                              className="text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                                              style={{
                                                backgroundColor: `${activeAccentHex}20`,
                                                color: activeAccentHex,
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
                                      <div className="px-3.5 pb-3.5 pt-2 space-y-2.5 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'} text-[12px] leading-relaxed animate-fadeIn">
                                        {layersSummary && (
                                          <div>
                                            <span className={`font-bold ${ui.muted}`}>
                                              Слои и строение:{' '}
                                            </span>
                                            <RichGlossaryText
                                              text={layersSummary}
                                              onSelectTerm={setSelectedTerm}
                                              accentHex={activeAccentHex}
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
                                              accentHex={activeAccentHex}
                                            />
                                          </div>
                                        )}
                                        {slide.killerFeature && (
                                          <div>
                                            <span
                                              className="font-bold"
                                              style={{ color: activeAccentHex }}
                                            >
                                              Главный признак:{' '}
                                            </span>
                                            <RichGlossaryText
                                              text={slide.killerFeature}
                                              onSelectTerm={setSelectedTerm}
                                              accentHex={activeAccentHex}
                                            />
                                          </div>
                                        )}

                                        <div className="flex items-center gap-2 pt-1">
                                          <button
                                            onClick={() => setActiveMicroscopeSlide(slide)}
                                            style={{
                                              backgroundColor: activeAccentHex,
                                              color: accentTextColor,
                                            }}
                                            className="flex-1 py-2.5 rounded-[12px] font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition"
                                          >
                                            <Microscope className="w-3.5 h-3.5" />
                                            В микроскоп
                                          </button>
                                          <button
                                            onClick={() => toggleFavorite(slide.id)}
                                            className={`py-2.5 px-3 rounded-[12px] flex items-center justify-center transition active:scale-95 ${ui.card}`}
                                            aria-label="В избранное"
                                          >
                                            <Bookmark
                                              className="w-4 h-4"
                                              style={isFav ? { fill: activeAccentHex, color: activeAccentHex } : undefined}
                                            />
                                          </button>
                                          {(slide as any).youtubeTimestampUrl && (
                                            <a
                                              href={(slide as any).youtubeTimestampUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="py-2.5 px-3 rounded-[12px] bg-rose-500/15 text-rose-400 font-bold text-[12px] flex items-center gap-1"
                                            >
                                              <Play className="w-3.5 h-3.5 fill-current" />
                                              Видео
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

          {/* 2. ЭЛЕКТРОННОГРАММЫ */}
          {activeTab === 'em' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="pt-1">
                <h1 className="text-[28px] font-extrabold tracking-tight leading-none">
                  Электроннограммы
                </h1>
                <p className={`text-[13px] ${ui.muted} mt-1.5`}>
                  Ультраструктура клеток, барьеров и органелл
                </p>
              </div>

              <div className="space-y-3">
                {ELECTRONOGRAMS.map((em) => {
                  const isOpen = expandedEmId === em.id;
                  return (
                    <div
                      key={em.id}
                      className={`rounded-[24px] overflow-hidden transition-all ${ui.card}`}
                    >
                      <button
                        onClick={() => {
                          haptic('light');
                          setExpandedEmId(isOpen ? null : em.id);
                        }}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-extrabold px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: `${activeAccentHex}20`,
                                color: activeAccentHex,
                              }}
                            >
                              ЭМ №{em.number}
                            </span>
                            <span className={`text-[11px] ${ui.muted}`}>{em.topic}</span>
                          </div>
                          <div className="font-extrabold text-[15px] mt-1 leading-snug">
                            {em.title}
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          } ${ui.subtle}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 space-y-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'} animate-fadeIn">
                          {em.imageUrl && (
                            <ImageWithFallback
                              src={em.imageUrl}
                              alt={em.title}
                              className="w-full h-44 rounded-[18px] object-cover bg-black border border-white/10"
                              fallbackIcon={<Microscope className="w-7 h-7 text-white/40" />}
                              fallbackText="Схема временно недоступна"
                            />
                          )}
                          {em.keyFeature && (
                            <div
                              style={{
                                backgroundColor: `${activeAccentHex}14`,
                                borderColor: `${activeAccentHex}30`,
                              }}
                              className="p-3.5 rounded-[18px] border space-y-1"
                            >
                              <div
                                style={{ color: accentTextColor }}
                                className="text-[11px] font-extrabold uppercase tracking-wide"
                              >
                                Главный признак на ЭМ
                              </div>
                              <div className={`text-[13px] leading-relaxed font-medium ${isDark ? 'text-white/95' : 'text-zinc-900'}`}>
                                <RichGlossaryText
                                  text={em.keyFeature}
                                  onSelectTerm={setSelectedTerm}
                                  accentHex={activeAccentHex}
                                />
                              </div>
                            </div>
                          )}
                          <div className={`text-[13px] leading-relaxed ${ui.muted}`}>
                            <RichGlossaryText
                              text={em.description}
                              onSelectTerm={setSelectedTerm}
                              accentHex={activeAccentHex}
                            />
                          </div>
                          {em.markers.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[12px] font-bold">Что показывать на схеме:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {em.markers.map((marker, idx) => (
                                  <span
                                    key={marker}
                                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${ui.subCard}`}
                                  >
                                    {idx + 1}. {marker}
                                  </span>
                                ))}
                              </div>
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

          {/* 3. БИЛЕТЫ К ЭКЗАМЕНУ */}
          {activeTab === 'tickets' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="pt-1 flex items-center justify-between gap-2">
                <div>
                  <h1 className="text-[30px] font-extrabold tracking-tight leading-none">Билеты</h1>
                  <p className={`text-[13px] ${ui.muted} mt-1.5`}>
                    Вопросы к экзамену с интерактивными терминами
                  </p>
                </div>
                <button
                  onClick={openTicketOfTheDay}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${ui.cardInteractive} active:scale-95 transition`}
                  aria-label="Случайный билет"
                >
                  <Shuffle className="w-4 h-4" style={{ color: activeAccentHex }} />
                </button>
              </div>

              {/* Фильтр по блокам программы */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {ticketBlocks.map((block) => {
                  const active = ticketBlockFilter === block;
                  return (
                    <button
                      key={block}
                      onClick={() => {
                        haptic('light');
                        setTicketBlockFilter(block);
                      }}
                      style={
                        active
                          ? { backgroundColor: activeAccentHex, color: accentTextColor }
                          : undefined
                      }
                      className={`px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition active:scale-95 ${
                        active ? '' : `${ui.card} ${ui.muted}`
                      }`}
                    >
                      {block}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                {filteredTickets.map((ticket) => {
                  const isOpen = expandedTicketId === ticket.id;
                  return (
                    <div
                      key={ticket.id}
                      className={`rounded-[24px] overflow-hidden transition-all ${ui.card}`}
                    >
                      <button
                        onClick={() => {
                          haptic('light');
                          setExpandedTicketId(isOpen ? null : ticket.id);
                        }}
                        className="w-full p-4 flex items-start justify-between gap-3 text-left"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-extrabold px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: `${activeAccentHex}20`,
                                color: activeAccentHex,
                              }}
                            >
                              Вопрос №{ticket.number}
                            </span>
                            <span className={`text-[11px] ${ui.muted}`}>{ticket.block}</span>
                          </div>
                          <div className="font-bold text-[14px] leading-snug">
                            {ticket.question}
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 mt-0.5 shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          } ${ui.subtle}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-2 space-y-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'} animate-fadeIn">
                          <div className={`text-[13px] leading-relaxed whitespace-pre-line ${ui.muted}`}>
                            <RichGlossaryText
                              text={ticket.answer}
                              onSelectTerm={setSelectedTerm}
                              accentHex={activeAccentHex}
                            />
                          </div>
                          {ticket.keyTip && (
                            <div
                              className="p-3 rounded-[16px] text-[12px] leading-snug"
                              style={{ backgroundColor: `${activeAccentHex}14` }}
                            >
                              <span className="font-bold" style={{ color: activeAccentHex }}>
                                На что смотрит препод:{' '}
                              </span>
                              <RichGlossaryText
                                text={ticket.keyTip}
                                onSelectTerm={setSelectedTerm}
                                accentHex={activeAccentHex}
                              />
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

          {/* 4. СЛОВАРЬ ТЕРМИНОВ */}
          {activeTab === 'glossary' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="pt-1">
                <h1 className="text-[30px] font-extrabold tracking-tight leading-none">Словарь</h1>
                <p className={`text-[13px] ${ui.muted} mt-1.5`}>
                  Нажимайте на подсвеченные термины в любых конспектах
                </p>
              </div>

              <div className={`rounded-[20px] px-4 py-3 flex items-center gap-3 ${ui.card}`}>
                <Search className={`w-4 h-4 ${ui.muted}`} />
                <input
                  type="text"
                  value={glossaryQuery}
                  onChange={(e) => setGlossaryQuery(e.target.value)}
                  placeholder="Остеон, уротелий, метахромазия..."
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span
                          className="font-extrabold text-[15px] block leading-tight"
                          style={{ color: activeAccentHex }}
                        >
                          {item.term}
                        </span>
                        {item.latin && (
                          <span className={`text-[12px] italic block mt-0.5 ${ui.subtle}`}>
                            {item.latin}
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] font-medium shrink-0 ${ui.subtle}`}>
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

          {/* 5. ПРОФИЛЬ (ЧИСТЫЙ ЗАГОЛОВОК + ОФОРМЛЕНИЕ ВНУТРИ МЕНЮ) */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="pt-1">
                <h1 className="text-[30px] font-extrabold tracking-tight leading-none">Профиль</h1>
              </div>

              <div className="flex flex-col items-center text-center py-2">
                <div
                  style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                  className="w-20 h-20 rounded-full font-extrabold text-[30px] flex items-center justify-center shadow-lg"
                >
                  {userInitial}
                </div>
                <div className="text-[20px] font-extrabold mt-3">{userName}</div>
                <div className={`text-[13px] ${ui.muted}`}>{userHandle}</div>
              </div>

              {/* Основной блок меню и статистики */}
              <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                {/* Строка Оформление -> открывает компактную шторку */}
                <button
                  onClick={() => {
                    haptic('light');
                    setShowAppearanceSheet(true);
                  }}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left transition active:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}
                    >
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Оформление</div>
                      <div className={`text-[12px] ${ui.muted}`}>{themeModeLabel}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: activeAccentHex }}
                      className="w-4 h-4 rounded-full border border-white/20"
                    />
                    <ChevronRight className={`w-4 h-4 ${ui.subtle}`} />
                  </div>
                </button>

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

                <button
                  onClick={() => {
                    haptic('light');
                    setShowFavoritesSheet(true);
                  }}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left transition active:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Избранные стекла</div>
                      <div className={`text-[12px] ${ui.muted}`}>Закладки для повторения</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[14px]">{favoriteIds.length}</span>
                    <ChevronRight className={`w-4 h-4 ${ui.subtle}`} />
                  </div>
                </button>
              </div>

              {/* Сброс прогресса */}
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
                  <span className="text-[9.5px] font-semibold tracking-tight truncate max-w-full">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* ==================== КОМПАКТНАЯ ШТОРКА «ОФОРМЛЕНИЕ» ==================== */}
      {showAppearanceSheet && (
        <div
          onClick={() => setShowAppearanceSheet(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-[30px] p-5 pb-9 space-y-5 animate-slideUp ${
              isDark
                ? 'bg-[#16161A]/95 backdrop-blur-2xl border-t border-white/15 text-white'
                : 'bg-white/95 backdrop-blur-2xl border-t border-black/10 text-zinc-900'
            }`}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-500/30 mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-extrabold">Оформление</h3>
              <button
                onClick={() => setShowAppearanceSheet(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${ui.iconCircle}`}
                aria-label="Закрыть оформление"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Переключатель: Тёмная / Светлая / Системная */}
            <div className="space-y-2">
              <div className={`text-[12px] font-bold ${ui.muted}`}>Тема</div>
              <div className={`grid grid-cols-3 p-1 rounded-[18px] ${ui.pillBg}`}>
                {(
                  [
                    { id: 'dark', label: 'Тёмная', icon: Moon },
                    { id: 'light', label: 'Светлая', icon: Sun },
                    { id: 'system', label: 'Системная', icon: Smartphone },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = themeMode === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        haptic('light');
                        setThemeMode(item.id);
                      }}
                      className={`py-2.5 rounded-[14px] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                        active ? ui.pillActive : ui.muted
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Компактная строка акцентных кружков + пипетка */}
            <div className="space-y-2.5">
              <div className={`text-[12px] font-bold ${ui.muted}`}>Акцент</div>
              <div className="flex items-center justify-between gap-2 pt-1">
                {PRESET_ACCENTS.map((preset) => {
                  const dotHex = isDark ? preset.darkHex : preset.lightHex;
                  const active = accentId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        haptic('light');
                        setAccentId(preset.id);
                      }}
                      aria-label={preset.label}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                        active
                          ? isDark
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16161A] scale-105'
                            : 'ring-2 ring-zinc-900 ring-offset-2 ring-offset-white scale-105'
                          : 'opacity-85'
                      }`}
                      style={{
                        backgroundColor: dotHex,
                        border:
                          preset.id === 'mono' && isDark
                            ? '1px solid rgba(255,255,255,0.2)'
                            : undefined,
                      }}
                    >
                      {active && (
                        <CheckCircle2 className="w-5 h-5" style={{ color: getContrastText(dotHex) }} />
                      )}
                    </button>
                  );
                })}

                {/* Свой цвет (пипетка) */}
                <label
                  aria-label="Выбрать свой цвет"
                  className={`relative w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-90 ${
                    accentId === 'custom'
                      ? isDark
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16161A] scale-105'
                        : 'ring-2 ring-zinc-900 ring-offset-2 ring-offset-white scale-105'
                      : 'opacity-90'
                  }`}
                  style={{
                    background:
                      accentId === 'custom'
                        ? customHex
                        : 'conic-gradient(from 90deg, #EC4899, #8B5CF6, #3B82F6, #2DD4BF, #F59E0B, #EC4899)',
                  }}
                >
                  <Pipette
                    className="w-4 h-4"
                    style={{ color: accentId === 'custom' ? getContrastText(customHex) : '#FFFFFF' }}
                  />
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      setAccentId('custom');
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ОВЕРЛЕЙ ГЛОБАЛЬНОГО ПОИСКА ==================== */}
      {isSearchOpen && (
        <div
          style={{ paddingTop: `${topInsetPx}px` }}
          className={`fixed inset-0 z-50 ${ui.bg} overflow-y-auto px-4 pb-10 animate-fadeIn`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center gap-2.5">
              <div className={`flex-1 rounded-[20px] px-4 py-3 flex items-center gap-3 ${ui.card}`}>
                <Search className={`w-4 h-4 ${ui.muted}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Препарат, ЭМ, билет или термин..."
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} aria-label="Очистить">
                    <X className={`w-4 h-4 ${ui.muted}`} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${ui.card}`}
                aria-label="Закрыть поиск"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Результаты: Препараты */}
            {globalSearchResults.slides.length > 0 && (
              <div className="space-y-2">
                <div className={`px-1 text-[12px] font-bold uppercase tracking-wider ${ui.muted}`}>
                  Препараты ({globalSearchResults.slides.length})
                </div>
                <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                  {globalSearchResults.slides.map((slide) => (
                    <button
                      key={slide.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setActiveMicroscopeSlide(slide);
                      }}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {(slide as any).examNumber !== undefined && (
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: `${activeAccentHex}20`,
                                color: activeAccentHex,
                              }}
                            >
                              №{(slide as any).examNumber}
                            </span>
                          )}
                          <span className={`text-[11px] truncate ${ui.muted}`}>{slide.stain}</span>
                        </div>
                        <div className="font-bold text-[14px] mt-1">{slide.title}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${ui.subtle} shrink-0`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Результаты: ЭМ-схемы */}
            {globalSearchResults.ems.length > 0 && (
              <div className="space-y-2">
                <div className={`px-1 text-[12px] font-bold uppercase tracking-wider ${ui.muted}`}>
                  Электроннограммы ({globalSearchResults.ems.length})
                </div>
                <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                  {globalSearchResults.ems.map((em) => (
                    <button
                      key={em.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setExpandedEmId(em.id);
                        setActiveTab('em');
                      }}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[14px]">{em.title}</div>
                        <div className={`text-[12px] ${ui.muted}`}>{em.topic}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${ui.subtle} shrink-0`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Результаты: Билеты */}
            {globalSearchResults.tickets.length > 0 && (
              <div className="space-y-2">
                <div className={`px-1 text-[12px] font-bold uppercase tracking-wider ${ui.muted}`}>
                  Билеты ({globalSearchResults.tickets.length})
                </div>
                <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                  {globalSearchResults.tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setExpandedTicketId(ticket.id);
                        setActiveTab('tickets');
                      }}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[14px] line-clamp-2">
                          №{ticket.number}. {ticket.question}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${ui.subtle} shrink-0`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Результаты: Термины */}
            {globalSearchResults.terms.length > 0 && (
              <div className="space-y-2">
                <div className={`px-1 text-[12px] font-bold uppercase tracking-wider ${ui.muted}`}>
                  Словарь ({globalSearchResults.terms.length})
                </div>
                <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                  {globalSearchResults.terms.map((term) => (
                    <button
                      key={term.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSelectedTerm(term);
                      }}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[14px]" style={{ color: activeAccentHex }}>
                          {term.term}
                        </div>
                        <div className={`text-[12px] line-clamp-1 ${ui.muted}`}>
                          {term.definition}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${ui.subtle} shrink-0`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.trim() &&
              !globalSearchResults.slides.length &&
              !globalSearchResults.ems.length &&
              !globalSearchResults.tickets.length &&
              !globalSearchResults.terms.length && (
                <div className={`rounded-[24px] p-8 text-center text-[13px] ${ui.card} ${ui.muted}`}>
                  По запросу «{searchQuery}» ничего не найдено
                </div>
              )}
          </div>
        </div>
      )}

      {/* ==================== ШТОРКА «ИЗБРАННОЕ» ==================== */}
      {showFavoritesSheet && (
        <div
          onClick={() => setShowFavoritesSheet(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md max-h-[75vh] flex flex-col rounded-t-[30px] p-5 pb-8 space-y-4 animate-slideUp ${
              isDark
                ? 'bg-[#16161A]/95 backdrop-blur-2xl border-t border-white/15 text-white'
                : 'bg-white/95 backdrop-blur-2xl border-t border-black/10 text-zinc-900'
            }`}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-500/30 mx-auto shrink-0" />
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-[20px] font-extrabold">Избранные стекла</h3>
              <button
                onClick={() => setShowFavoritesSheet(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${ui.iconCircle}`}
                aria-label="Закрыть избранное"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {favoriteSlides.length > 0 ? (
              <>
                <div className="overflow-y-auto space-y-2 pr-0.5">
                  {favoriteSlides.map((slide) => (
                    <div
                      key={slide.id}
                      className={`rounded-[18px] p-3 flex items-center justify-between gap-3 ${ui.subCard}`}
                    >
                      <button
                        onClick={() => {
                          setShowFavoritesSheet(false);
                          setActiveMicroscopeSlide(slide);
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="font-bold text-[13px] truncate">{slide.title}</div>
                        <div className={`text-[11px] ${ui.muted}`}>{slide.stain}</div>
                      </button>
                      <button
                        onClick={() => toggleFavorite(slide.id)}
                        className="p-2 text-rose-400 shrink-0"
                        aria-label="Удалить из избранного"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowFavoritesSheet(false);
                    startQuiz(shuffleArray(favoriteSlides), 'Избранные препараты');
                  }}
                  style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                  className="w-full py-3.5 rounded-[16px] font-bold text-[14px] shrink-0 active:scale-[0.98] transition"
                >
                  Тренировать избранное ({favoriteSlides.length})
                </button>
              </>
            ) : (
              <p className={`text-[13px] text-center py-6 ${ui.muted}`}>
                Нажимайте на значок закладки в карточке препарата или во время теста, чтобы
                откладывать сложные стекла сюда.
              </p>
            )}
          </div>
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
                  style={{ backgroundColor: `${activeAccentHex}20`, color: activeAccentHex }}
                >
                  {selectedTerm.category}
                </span>
                <h3 className="text-[20px] font-extrabold mt-1.5 leading-tight">
                  {selectedTerm.term}
                </h3>
                {selectedTerm.latin && (
                  <div className={`text-[13px] italic mt-0.5 ${ui.muted}`}>
                    {selectedTerm.latin}
                  </div>
                )}
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
              style={{ backgroundColor: `${activeAccentHex}14` }}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: activeAccentHex }} />
              <div>
                <span className="font-bold" style={{ color: activeAccentHex }}>
                  Важно на экзамене:{' '}
                </span>
                <span>{selectedTerm.examNote}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ТОСТ-УВЕДОМЛЕНИЕ ==================== */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-zinc-900/95 text-white text-[12px] font-semibold border border-white/15 shadow-xl whitespace-nowrap animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* ==================== ВИРТУАЛЬНЫЙ МИКРОСКОП ==================== */}
      {activeMicroscopeSlide && (
        <React.Suspense fallback={null}>
            <MicroscopeViewerModal
              slide={activeMicroscopeSlide}
              onClose={() => setActiveMicroscopeSlide(null)}
              onStartTest={(s) => {
                setActiveMicroscopeSlide(null);
                startQuiz([s], s.title);
              }}
              accentHex={activeAccentHex}
              accentTextColor={accentTextColor}
              topInsetPx={topInsetPx}
            />
          </React.Suspense>
      )}
    </div>
  );
}

export default App;
