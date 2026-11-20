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
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import { EXAM_SLIDES, THEORY_BLOCKS, HistSlide } from './data/histoData';
import { GLOSSARY_TERMS, GlossaryTerm, RichGlossaryText } from './data/glossaryData';
import { ELECTRONOGRAMS, EXAM_TICKETS } from './data/examContent';
import {
  StudyMode,
  DiagnosticId,
  TheoryTopic,
} from './data/curriculumTypes';
import {
  getModeLabel,
  modeToDiagnosticId,
  getSlideDiagnosticIds,
  getEmDiagnosticIds,
} from './data/curriculumConfig';
import { THEORY_SECTIONS } from './data/theory';
import { SITUATIONAL_TASKS } from './data/situationalTasks';
import { GoalHubView } from './components/GoalHubView';
import { ExamSimulatorModal } from './components/ExamSimulatorModal';
import { TheoryTopicView } from './components/TheoryTopicView';

const MicroscopeViewerModal = React.lazy(() => import('./components/MicroscopeViewerModal'));

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
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

const PRESET_ACCENTS: { id: Exclude<AccentId, 'custom'>; label: string; darkHex: string; lightHex: string }[] = [
  { id: 'mono', label: 'Монохром', darkHex: '#FFFFFF', lightHex: '#18181B' },
  { id: 'mint', label: 'Мята', darkHex: '#2DD4BF', lightHex: '#0D9488' },
  { id: 'blue', label: 'Синий', darkHex: '#38BDF8', lightHex: '#0284C7' },
  { id: 'pink', label: 'Розовый', darkHex: '#F472B6', lightHex: '#DB2777' },
  { id: 'violet', label: 'Фиолетовый', darkHex: '#A78BFA', lightHex: '#7C3AED' },
];

function getContrastText(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#FFFFFF';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? '#09090B' : '#FFFFFF';
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getSlideImage(slide: any): string {
  return slide?.imageUrl || slide?.image_clean_url || slide?.imageUrls?.[0] || '';
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

  // Study Mode state (diag_1..4 / exam)
  const [studyMode, setStudyMode] = useState<StudyMode | null>(() => {
    const saved = localStorage.getItem('baza_study_mode');
    if (saved === 'diag_1' || saved === 'diag_2' || saved === 'diag_3' || saved === 'diag_4' || saved === 'exam') {
      return saved as StudyMode;
    }
    return null;
  });
  const [showGoalHub, setShowGoalHub] = useState<boolean>(false);
  const [showExamSimulator, setShowExamSimulator] = useState<boolean>(false);
  const [showSdoSheet, setShowSdoSheet] = useState<boolean>(false);
  const [showTasksSheet, setShowTasksSheet] = useState<boolean>(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAppearanceSheet, setShowAppearanceSheet] = useState(false);
  const [showFavoritesSheet, setShowFavoritesSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Curriculum topics expansion
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(() => THEORY_SECTIONS[0]?.id || null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(() => THEORY_SECTIONS[0]?.topics[0]?.id || null);
  const [topicSubTab, setTopicSubTab] = useState<Record<string, 'theory' | 'slides'>>({});

  const [expandedSlideId, setExpandedSlideId] = useState<string | null>(null);
  const [expandedEmId, setExpandedEmId] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [ticketBlockFilter, setTicketBlockFilter] = useState<string>('Все');

  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (localStorage.getItem('baza_theme_mode') as ThemeMode) || 'dark'
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    const tgScheme = getTg()?.colorScheme;
    if (tgScheme === 'dark') return true;
    if (tgScheme === 'light') return false;
    return typeof window !== 'undefined'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
      : true;
  });

  const [accentId, setAccentId] = useState<AccentId>(
    () => (localStorage.getItem('baza_accent_v2') as AccentId) || 'mint'
  );
  const [customHex, setCustomHex] = useState<string>(
    () => localStorage.getItem('baza_custom_hex') || '#2DD4BF'
  );

  const [masteredIds, setMasteredIds] = useState<string[]>(() => readStoredIds('baza_mastered'));
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readStoredIds('baza_favorites'));
  const [mistakeIds, setMistakeIds] = useState<string[]>(() => readStoredIds('baza_mistakes'));

  const [searchQuery, setSearchQuery] = useState('');
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeMicroscopeSlide, setActiveMicroscopeSlide] = useState<HistSlide | null>(null);
  const [quizState, setQuizState] = useState<{
    slides: HistSlide[];
    index: number;
    title: string;
    showAnswer: boolean;
    correctCount: number;
    isFinished: boolean;
  } | null>(null);

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
    const tg = getTg();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
    const t = setTimeout(() => setToastMessage(null), 2400);
    return () => clearTimeout(t);
  };

  // Safe area & system theme listeners
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onMqChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq?.addEventListener?.('change', onMqChange);

    const tg = getTg();
    const onTgTheme = () => {
      if (tg?.colorScheme) setSystemPrefersDark(tg.colorScheme === 'dark');
    };
    tg?.onEvent?.('themeChanged', onTgTheme);

    const readSafeInsets = () => {
      const top =
        Number(tg?.contentSafeAreaInset?.top ?? tg?.safeAreaInset?.top) ||
        (tg ? 44 : 14);
      setTopInsetPx(Math.max(12, top));
    };
    readSafeInsets();
    tg?.onEvent?.('viewportChanged', readSafeInsets);

    return () => {
      mq?.removeEventListener?.('change', onMqChange);
      tg?.offEvent?.('themeChanged', onTgTheme);
      tg?.offEvent?.('viewportChanged', readSafeInsets);
    };
  }, []);

  // Sync Telegram header color
  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    const headerBg = isDark ? '#09090B' : '#FFFFFF';
    try {
      tg.setHeaderColor?.(headerBg);
      tg.setBackgroundColor?.(headerBg);
    } catch {
      // safe fallback
    }
  }, [isDark]);

  // Persist settings
  useEffect(() => {
    safeSetItem('baza_theme_mode', themeMode);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  // Mode calculations and filters
  const isDiagnosticMode = studyMode !== 'exam' && studyMode !== null;
  const activeDiagnosticId = studyMode ? modeToDiagnosticId(studyMode) : null;

  const handleSelectStudyMode = (mode: StudyMode) => {
    setStudyMode(mode);
    safeSetItem('baza_study_mode', mode);
    setShowGoalHub(false);
    if (mode !== 'exam' && activeTab === 'tickets') {
      setActiveTab('home');
    }
    const tg = getTg();
    tg?.HapticFeedback?.impactOccurred?.('medium');
  };

  const diagProgress = useMemo(() => {
    const res: Record<DiagnosticId, { done: number; total: number }> = {
      1: { done: 0, total: 0 },
      2: { done: 0, total: 0 },
      3: { done: 0, total: 0 },
      4: { done: 0, total: 0 },
    };
    EXAM_SLIDES.forEach((s) => {
      const dIds = getSlideDiagnosticIds(s);
      dIds.forEach((dId) => {
        res[dId].total++;
        if (masteredIds.includes(s.id)) {
          res[dId].done++;
        }
      });
    });
    return res;
  }, [masteredIds]);

  const examProgress = useMemo(() => {
    const done = EXAM_SLIDES.filter((s) => masteredIds.includes(s.id)).length;
    return {
      done,
      total: EXAM_SLIDES.length,
      emCount: ELECTRONOGRAMS.length,
      questionsCount: EXAM_TICKETS.length,
      tasksCount: 55,
    };
  }, [masteredIds]);

  // Filtered collections by current study mode
  const visibleSlides = useMemo(() => {
    if (activeDiagnosticId) {
      return EXAM_SLIDES.filter((s) => getSlideDiagnosticIds(s).includes(activeDiagnosticId));
    }
    return EXAM_SLIDES;
  }, [activeDiagnosticId]);

  const visibleElectronograms = useMemo(() => {
    if (activeDiagnosticId) {
      return ELECTRONOGRAMS.filter((em) => getEmDiagnosticIds(em).includes(activeDiagnosticId));
    }
    return ELECTRONOGRAMS;
  }, [activeDiagnosticId]);

  const visibleTheorySections = useMemo(() => {
    if (activeDiagnosticId) {
      return THEORY_SECTIONS.map((sec) => ({
        ...sec,
        topics: sec.topics.filter((t) => t.diagnosticIds.includes(activeDiagnosticId)),
      })).filter((sec) => sec.topics.length > 0);
    }
    return THEORY_SECTIONS.map((sec) => ({
      ...sec,
      topics: sec.topics.filter((t) => t.isExam),
    })).filter((sec) => sec.topics.length > 0);
  }, [activeDiagnosticId]);

  const masteredCount = visibleSlides.filter((s) => masteredIds.includes(s.id)).length;
  const totalVisibleSlides = visibleSlides.length;
  const readinessPct = totalVisibleSlides > 0 ? Math.round((masteredCount / totalVisibleSlides) * 100) : 0;

  const favoriteSlides = visibleSlides.filter((s) => favoriteIds.includes(s.id));
  const mistakeSlides = visibleSlides.filter((s) => mistakeIds.includes(s.id));

  // Adaptive Dock Tabs
  const dockTabs = useMemo(() => {
    if (isDiagnosticMode) {
      return [
        { id: 'home' as TabId, label: 'Главная', icon: Home },
        { id: 'em' as TabId, label: 'ЭМ-схемы', icon: Layers },
        { id: 'glossary' as TabId, label: 'Словарь', icon: BookMarked },
        { id: 'profile' as TabId, label: 'Профиль', icon: User },
      ];
    }
    return [
      { id: 'home' as TabId, label: 'Главная', icon: Home },
      { id: 'em' as TabId, label: 'ЭМ-схемы', icon: Layers },
      { id: 'tickets' as TabId, label: 'Билеты', icon: FileText },
      { id: 'glossary' as TabId, label: 'Словарь', icon: BookMarked },
      { id: 'profile' as TabId, label: 'Профиль', icon: User },
    ];
  }, [isDiagnosticMode]);

  const activeDockIndex = dockTabs.findIndex((t) => t.id === activeTab);

  const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    const tg = getTg();
    tg?.HapticFeedback?.impactOccurred?.(style);
  };

  const toggleMastered = (id: string) => {
    haptic('medium');
    setMasteredIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('Удалено из усвоенных');
        return prev.filter((item) => item !== id);
      }
      showToast('Отмечено как усвоенное');
      return [...prev, id];
    });
  };

  const toggleFavorite = (id: string) => {
    haptic('light');
    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('Удалено из избранного');
        return prev.filter((item) => item !== id);
      }
      showToast('Добавлено в избранное');
      return [...prev, id];
    });
  };

  const startQuiz = (slides: HistSlide[], title: string) => {
    if (slides.length === 0) {
      showToast('Список препаратов пуст');
      return;
    }
    haptic('medium');
    setQuizState({
      slides,
      index: 0,
      title,
      showAnswer: false,
      correctCount: 0,
      isFinished: false,
    });
  };

  const handleQuizAnswer = (isCorrect: boolean) => {
    if (!quizState) return;
    haptic(isCorrect ? 'light' : 'heavy');
    const currentSlide = quizState.slides[quizState.index];

    if (isCorrect) {
      setMistakeIds((prev) => prev.filter((id) => id !== currentSlide.id));
      setMasteredIds((prev) => (prev.includes(currentSlide.id) ? prev : [...prev, currentSlide.id]));
    } else {
      setMistakeIds((prev) => (prev.includes(currentSlide.id) ? prev : [...prev, currentSlide.id]));
    }

    const nextIndex = quizState.index + 1;
    const newCorrect = isCorrect ? quizState.correctCount + 1 : quizState.correctCount;

    if (nextIndex >= quizState.slides.length) {
      setQuizState({
        ...quizState,
        correctCount: newCorrect,
        isFinished: true,
      });
      getTg()?.HapticFeedback?.notificationOccurred?.('success');
    } else {
      setQuizState({
        ...quizState,
        index: nextIndex,
        correctCount: newCorrect,
        showAnswer: false,
      });
    }
  };

  const startMistakesQuiz = () => {
    if (mistakeSlides.length === 0) {
      showToast('У вас нет неотработанных ошибок!');
      return;
    }
    startQuiz(shuffleArray(mistakeSlides), `Работа над ошибками (${mistakeSlides.length})`);
  };

  const openTicketOfTheDay = () => {
    haptic('light');
    setActiveTab('tickets');
    const randomTicket = EXAM_TICKETS[Math.floor(Math.random() * EXAM_TICKETS.length)];
    if (randomTicket) {
      setExpandedTicketId(randomTicket.id);
      showToast(`Билет дня: №${randomTicket.number}`);
    }
  };

  // Helper to resolve slides and fallbacks for curriculum topics
  const getTopicSlides = (topic: TheoryTopic) => {
    if (topic.relatedSlideIds && topic.relatedSlideIds.length > 0) {
      const list = EXAM_SLIDES.filter((s) => topic.relatedSlideIds.includes(s.id));
      if (list.length > 0) return list;
    }
    if (topic.sectionId === 'sec_1_histotechnique' || topic.sectionId === 'sec_2_cytology') {
      return [];
    }
    if (topic.sectionId === 'sec_3_embryology') {
      return EXAM_SLIDES.filter((s) => s.id === 'slide_01' || s.id === 'slide_69' || s.id === 'slide_70');
    }
    if (topic.sectionId === 'sec_4_general_histo') {
      return visibleSlides.filter(
        (s) => s.moduleId === 'mod_epithelium_conn' || s.moduleId === 'mod_cartilage_bone_muscle'
      );
    }
    return visibleSlides.filter(
      (s) => s.moduleId !== 'mod_epithelium_conn' && s.moduleId !== 'mod_cartilage_bone_muscle'
    );
  };

  const getTopicFallbackBlocks = (topic: TheoryTopic) => {
    const tTitle = topic.title.toLowerCase();
    const tSub = topic.subtitle.toLowerCase();
    return THEORY_BLOCKS.filter((b) => {
      const bTitle = b.title.toLowerCase();
      return (
        tTitle.includes(bTitle.slice(0, 6)) ||
        bTitle.includes(tTitle.slice(0, 6)) ||
        tSub.includes(bTitle.slice(0, 6))
      );
    });
  };

  // Global search filtering
  const globalSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { slides: [], ems: [], tickets: [], terms: [] };

    return {
      slides: visibleSlides.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          String(s.examNumber).includes(q) ||
          s.stain.toLowerCase().includes(q) ||
          s.killerFeature.toLowerCase().includes(q)
      ),
      ems: visibleElectronograms.filter(
        (em) =>
          em.title.toLowerCase().includes(q) ||
          String(em.number).includes(q) ||
          em.description.toLowerCase().includes(q) ||
          (em.keyFeature && em.keyFeature.toLowerCase().includes(q))
      ),
      tickets: EXAM_TICKETS.filter(
        (t) =>
          t.question.toLowerCase().includes(q) ||
          String(t.number).includes(q) ||
          t.answer.toLowerCase().includes(q)
      ),
      terms: GLOSSARY_TERMS.filter(
        (term) =>
          term.term.toLowerCase().includes(q) ||
          (term.latin && term.latin.toLowerCase().includes(q)) ||
          term.definition.toLowerCase().includes(q)
      ),
    };
  }, [searchQuery, visibleSlides, visibleElectronograms]);

  // Glossary tab search
  const filteredGlossary = useMemo(() => {
    const q = glossaryQuery.trim().toLowerCase();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        (t.latin && t.latin.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
  }, [glossaryQuery]);

  // Tickets tab filtering
  const filteredTickets = useMemo(() => {
    if (ticketBlockFilter === 'Все') return EXAM_TICKETS;
    return EXAM_TICKETS.filter((t) => t.block === ticketBlockFilter);
  }, [ticketBlockFilter]);

  // UI Theme classes
  const ui = {
    bg: isDark ? 'bg-[#09090B] text-white' : 'bg-[#F4F4F5] text-zinc-900',
    headerBg: isDark ? 'bg-[#09090B]/90' : 'bg-[#F4F4F5]/90',
    card: isDark
      ? 'bg-[#141417] border border-white/[0.06]'
      : 'bg-white border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]',
    cardInteractive: isDark
      ? 'bg-[#141417] border border-white/[0.06] active:bg-[#1A1A1F]'
      : 'bg-white border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] active:bg-zinc-50',
    subCard: isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-zinc-50 border border-black/[0.05]',
    muted: isDark ? 'text-zinc-400' : 'text-zinc-500',
    subtle: isDark ? 'text-zinc-500' : 'text-zinc-400',
    divider: isDark ? 'divide-white/[0.06]' : 'divide-black/[0.06]',
    iconCircle: isDark ? 'bg-white/[0.06] text-white' : 'bg-zinc-100 text-zinc-800',
    ctaBtn: isDark
      ? 'bg-white text-zinc-950 hover:bg-zinc-200'
      : 'bg-zinc-900 text-white hover:bg-zinc-800',
  };

  const themeModeLabel =
    themeMode === 'system' ? 'Системная' : themeMode === 'dark' ? 'Тёмная' : 'Светлая';

  // 1. If studyMode is not selected yet OR user opened Goal Hub -> show GoalHubView
  if (studyMode === null || showGoalHub) {
    return (
      <GoalHubView
        currentMode={studyMode}
        isDark={isDark}
        accentHex={activeAccentHex}
        textOnAccent={accentTextColor}
        topInsetPx={topInsetPx}
        diagProgress={diagProgress}
        examProgress={examProgress}
        onSelectMode={handleSelectStudyMode}
        onClose={studyMode ? () => setShowGoalHub(false) : undefined}
      />
    );
  }

  return (
    <div className={`min-h-screen ${ui.bg} transition-colors duration-300 font-sans select-none flex flex-col justify-between`}>
      {/* ==================== ОСНОВНОЙ КОНТЕНТ ==================== */}
      <div className="flex-1 pb-28">
        <div style={{ paddingTop: `${topInsetPx}px` }} className="max-w-md mx-auto px-4 space-y-5">
          {/* 1. ГЛАВНАЯ ВКЛАДКА */}
          {activeTab === 'home' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Шапка: Аватар + Капсула выбора режима + Кнопка поиска */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
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

                  <button
                    type="button"
                    onClick={() => {
                      haptic('light');
                      setShowGoalHub(true);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold transition active:scale-95 ${
                      isDark
                        ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/10'
                        : 'bg-black/[0.05] hover:bg-black/[0.08] text-zinc-900 border border-black/10'
                    }`}
                  >
                    <span>{getModeLabel(studyMode)}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>

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
                <p className={`text-[13px] font-medium ${ui.muted}`}>
                  {isDiagnosticMode ? `Готовность к ${getModeLabel(studyMode)}` : 'Готовность к экзамену'}
                </p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-[44px] font-extrabold tracking-tight leading-none">
                    {masteredCount}
                  </span>
                  <span className={`text-[24px] font-bold ${ui.subtle}`}>/{totalVisibleSlides}</span>
                </div>
                <p className={`text-[12px] mt-1.5 ${ui.subtle}`}>
                  Усвоено стекол: {readinessPct}%
                </p>
              </div>

              {/* Ряд из 4 полезных плиток в зависимости от режима */}
              <div className="grid grid-cols-4 gap-2.5">
                {(isDiagnosticMode
                  ? [
                      {
                        label: 'Теория',
                        icon: BookOpen,
                        badge: null as number | null,
                        onClick: () => {
                          document.getElementById('curriculum-tree')?.scrollIntoView({ behavior: 'smooth' });
                        },
                      },
                      {
                        label: 'ЭМ-схемы',
                        icon: Layers,
                        badge: visibleElectronograms.length || null,
                        onClick: () => setActiveTab('em'),
                      },
                      {
                        label: 'Избранное',
                        icon: Bookmark,
                        badge: favoriteSlides.length || null,
                        onClick: () => setShowFavoritesSheet(true),
                      },
                      {
                        label: 'Ошибки',
                        icon: AlertCircle,
                        badge: mistakeSlides.length || null,
                        onClick: startMistakesQuiz,
                      },
                    ]
                  : [
                      {
                        label: 'Тесты СДО',
                        icon: FileText,
                        badge: null as number | null,
                        onClick: () => setShowSdoSheet(true),
                      },
                      {
                        label: '55 задач',
                        icon: HelpCircle,
                        badge: null as number | null,
                        onClick: () => setShowTasksSheet(true),
                      },
                      {
                        label: 'Избранное',
                        icon: Bookmark,
                        badge: favoriteSlides.length || null,
                        onClick: () => setShowFavoritesSheet(true),
                      },
                      {
                        label: 'Ошибки',
                        icon: AlertCircle,
                        badge: mistakeSlides.length || null,
                        onClick: startMistakesQuiz,
                      },
                    ]
                ).map((item) => {
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

              {/* Главная CTA-карточка */}
              {isDiagnosticMode ? (
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
                      <span className="font-extrabold text-[16px]">Спидран: слепые стекла</span>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${activeAccentHex}20`, color: activeAccentHex }}
                    >
                      {visibleSlides.length} стекол
                    </span>
                  </div>
                  <p className={`text-[13px] leading-relaxed ${ui.muted}`}>
                    Тренировка опознания препаратов {getModeLabel(studyMode)}: слои, клетки, окраска и киллер-фичи.
                  </p>
                  <button
                    onClick={() => {
                      startQuiz(shuffleArray(visibleSlides), `Спидран · ${getModeLabel(studyMode)}`);
                    }}
                    className={`w-full py-3.5 rounded-[16px] font-bold text-[14px] transition active:scale-[0.98] ${ui.ctaBtn}`}
                  >
                    Начать проверку
                  </button>
                </div>
              ) : (
                <div
                  className={`rounded-[24px] p-4 space-y-3.5 relative overflow-hidden ${ui.card}`}
                  style={{
                    backgroundImage: isDark
                      ? `radial-gradient(circle at 85% 20%, ${activeAccentHex}24 0%, transparent 60%)`
                      : `radial-gradient(circle at 85% 20%, ${activeAccentHex}18 0%, transparent 60%)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" style={{ color: activeAccentHex }} />
                      <span className="font-extrabold text-[16px]">Симулятор экзамена НГМУ</span>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${activeAccentHex}20`, color: activeAccentHex }}
                    >
                      2-й этап
                    </span>
                  </div>
                  <p className={`text-[13px] leading-relaxed ${ui.muted}`}>
                    Случайный билет по регламенту кафедры: 3 вопроса + 1 задача + 2 слепых стекла + 1 ЭМ.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        haptic('medium');
                        setShowExamSimulator(true);
                      }}
                      style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                      className="w-full py-3.5 rounded-[16px] font-bold text-[14px] shadow-sm transition active:scale-[0.98]"
                    >
                      Тянуть экзаменационный билет
                    </button>
                    <button
                      onClick={() => {
                        const random15 = shuffleArray(EXAM_SLIDES).slice(0, 15);
                        startQuiz(random15, 'Спидран · 15 случайных стекол');
                      }}
                      className={`w-full py-2.5 rounded-[14px] font-bold text-[12.5px] transition active:scale-[0.98] ${ui.subCard}`}
                    >
                      Спидран: 15 случайных стекол
                    </button>
                  </div>
                </div>
              )}

              {/* ДЕРЕВО: ПРОГРАММА И РАЗБОРЫ */}
              <div id="curriculum-tree" className="space-y-3 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="font-extrabold text-[16px]">Программа и разборы</span>
                  <span className={`text-[12px] ${ui.muted}`}>
                    {visibleTheorySections.length} {visibleTheorySections.length === 1 ? 'раздел' : 'разделов'}
                  </span>
                </div>

                {visibleTheorySections.map((sec, secIdx) => {
                  const isSecOpen = expandedSectionId === sec.id;
                  const secTopics = sec.topics;

                  return (
                    <div
                      key={sec.id}
                      className={`rounded-[24px] overflow-hidden transition-all duration-300 ${ui.card}`}
                    >
                      {/* Шапка раздела */}
                      <button
                        onClick={() => {
                          haptic('light');
                          setExpandedSectionId(isSecOpen ? null : sec.id);
                        }}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left transition active:opacity-80"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-extrabold text-[13px]"
                            style={{
                              backgroundColor: isSecOpen ? activeAccentHex : `${activeAccentHex}1A`,
                              color: isSecOpen ? accentTextColor : activeAccentHex,
                            }}
                          >
                            {sec.order || secIdx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[15px] leading-snug">
                              {sec.title}
                            </div>
                            <div className={`text-[12px] ${ui.muted} mt-0.5`}>
                              {sec.semesterLabel} · {secTopics.length} {secTopics.length === 1 ? 'тема' : 'тем'}
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                            isSecOpen ? 'rotate-180' : ''
                          } ${ui.subtle}`}
                        />
                      </button>

                      {/* Темы внутри раздела */}
                      {isSecOpen && (
                        <div className={`px-4 pb-4 pt-1 space-y-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'} animate-fadeIn`}>
                          {secTopics.map((topic) => {
                            const isTopicOpen = expandedTopicId === topic.id;
                            const topicSlides = getTopicSlides(topic);
                            const currentSubTab = topicSubTab[topic.id] || 'theory';
                            const fallbackBlocks = getTopicFallbackBlocks(topic);

                            return (
                              <div
                                key={topic.id}
                                className={`rounded-[20px] overflow-hidden border transition-all ${
                                  isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-zinc-50 border-black/[0.04]'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    haptic('light');
                                    setExpandedTopicId(isTopicOpen ? null : topic.id);
                                  }}
                                  className="w-full p-3.5 flex items-start justify-between gap-2.5 text-left"
                                >
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      {topic.lessonNumber && (
                                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${ui.subCard}`}>
                                          Занятие {topic.lessonNumber}
                                        </span>
                                      )}
                                      <span className={`text-[11px] font-medium ${ui.subtle}`}>
                                        {topicSlides.length} стекол
                                      </span>
                                    </div>
                                    <div className="font-extrabold text-[14px] leading-snug">
                                      {topic.title}
                                    </div>
                                    <div className={`text-[11.5px] leading-snug line-clamp-2 ${ui.muted}`}>
                                      {topic.subtitle}
                                    </div>
                                  </div>
                                  <ChevronDown
                                    className={`w-4 h-4 shrink-0 mt-1 transition-transform duration-200 ${
                                      isTopicOpen ? 'rotate-180' : ''
                                    } ${ui.subtle}`}
                                  />
                                </button>

                                {isTopicOpen && (
                                  <div className={`p-3.5 pt-1 space-y-3 border-t ${isDark ? 'border-white/[0.05]' : 'border-black/[0.04]'}`}>
                                    {/* Переключатель Конспект / Препараты */}
                                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/5">
                                      <button
                                        type="button"
                                        onClick={() => setTopicSubTab((prev) => ({ ...prev, [topic.id]: 'theory' }))}
                                        style={
                                          currentSubTab === 'theory'
                                            ? { backgroundColor: activeAccentHex, color: accentTextColor }
                                            : undefined
                                        }
                                        className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold text-center transition ${
                                          currentSubTab === 'theory' ? 'shadow-sm' : ui.muted
                                        }`}
                                      >
                                        Конспект
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setTopicSubTab((prev) => ({ ...prev, [topic.id]: 'slides' }))}
                                        style={
                                          currentSubTab === 'slides'
                                            ? { backgroundColor: activeAccentHex, color: accentTextColor }
                                            : undefined
                                        }
                                        className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold text-center transition ${
                                          currentSubTab === 'slides' ? 'shadow-sm' : ui.muted
                                        }`}
                                      >
                                        Препараты ({topicSlides.length})
                                      </button>
                                    </div>

                                    {/* 1. Конспект */}
                                    {currentSubTab === 'theory' && (
                                      <TheoryTopicView
                                        topic={topic}
                                        fallbackBlocks={fallbackBlocks}
                                        isDark={isDark}
                                        accentHex={activeAccentHex}
                                        onSelectTerm={setSelectedTerm}
                                        onOpenQuestion={(qNum) => {
                                          setActiveTab('tickets');
                                          setExpandedTicketId(`q${qNum}`);
                                        }}
                                      />
                                    )}

                                    {/* 2. Препараты */}
                                    {currentSubTab === 'slides' && (
                                      <div className="space-y-2.5">
                                        {topicSlides.length > 0 ? (
                                          <>
                                            <div className="flex items-center justify-between px-1">
                                              <span className={`text-[11px] font-semibold ${ui.muted}`}>
                                                Стекла раздела ({topicSlides.length})
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => startQuiz(topicSlides, topic.title)}
                                                style={{ color: activeAccentHex }}
                                                className="text-[11px] font-bold flex items-center gap-1 active:scale-95"
                                              >
                                                <Zap className="w-3 h-3" /> Тест по теме
                                              </button>
                                            </div>

                                            {topicSlides.map((slide) => {
                                              const isSlideOpen = expandedSlideId === slide.id;
                                              const isMastered = masteredIds.includes(slide.id);
                                              const isFav = favoriteIds.includes(slide.id);
                                              const imgSrc = getSlideImage(slide);

                                              return (
                                                <div
                                                  key={slide.id}
                                                  className={`rounded-[18px] overflow-hidden border ${
                                                    isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5 shadow-sm'
                                                  }`}
                                                >
                                                  <div
                                                    onClick={() => setExpandedSlideId(isSlideOpen ? null : slide.id)}
                                                    className="p-3 flex items-center gap-3 cursor-pointer"
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
                                                        <span
                                                          className="text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                                                          style={{ backgroundColor: `${activeAccentHex}20`, color: activeAccentHex }}
                                                        >
                                                          №{slide.examNumber}
                                                        </span>
                                                        <span className={`text-[11px] truncate ${ui.muted}`}>
                                                          {slide.stain}
                                                        </span>
                                                      </div>
                                                      <div className="font-extrabold text-[13px] leading-snug truncate mt-0.5">
                                                        {slide.title}
                                                      </div>
                                                    </div>
                                                    <ChevronDown
                                                      className={`w-4 h-4 shrink-0 transition-transform ${
                                                        isSlideOpen ? 'rotate-180' : ''
                                                      } ${ui.subtle}`}
                                                    />
                                                  </div>

                                                  {isSlideOpen && (
                                                    <div className={`px-3 pb-3 pt-1 space-y-2.5 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                                                      <div className={`text-[12px] leading-relaxed ${ui.muted}`}>
                                                        <span className="font-bold">Киллер-фича: </span>
                                                        <RichGlossaryText
                                                          text={slide.killerFeature}
                                                          onSelectTerm={setSelectedTerm}
                                                          accentHex={activeAccentHex}
                                                        />
                                                      </div>

                                                      <div className="flex items-center gap-2 pt-1">
                                                        <button
                                                          type="button"
                                                          onClick={() => setActiveMicroscopeSlide(slide)}
                                                          style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                                                          className="flex-1 py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                                                        >
                                                          <Microscope className="w-3.5 h-3.5" /> В микроскоп
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => toggleFavorite(slide.id)}
                                                          className={`p-2 rounded-xl border ${ui.cardInteractive}`}
                                                          aria-label="Избранное"
                                                        >
                                                          <Bookmark
                                                            className="w-4 h-4"
                                                            style={isFav ? { fill: activeAccentHex, color: activeAccentHex } : undefined}
                                                          />
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => toggleMastered(slide.id)}
                                                          className={`p-2 rounded-xl border ${ui.cardInteractive}`}
                                                          aria-label="Усвоено"
                                                        >
                                                          <CheckCircle2
                                                            className="w-4 h-4"
                                                            style={isMastered ? { fill: activeAccentHex, color: accentTextColor } : undefined}
                                                          />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </>
                                        ) : (
                                          <div className={`p-4 rounded-xl text-center text-[12px] ${ui.muted} ${ui.subCard}`}>
                                            К этой теме нет отдельных экзаменационных стекол
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. ЭМ-СХЕМЫ */}
          {activeTab === 'em' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="pt-1">
                <h1 className="text-[30px] font-extrabold tracking-tight leading-none">
                  Электроннограммы
                </h1>
                <p className={`text-[13px] ${ui.muted} mt-1.5`}>
                  {isDiagnosticMode ? `Схемы к ${getModeLabel(studyMode)}` : 'Ультраструктура клеток, барьеров и органелл'}
                </p>
              </div>

              <div className="space-y-3">
                {visibleElectronograms.map((em) => {
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
                        <div className={`px-4 pb-4 pt-1 space-y-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'} animate-fadeIn`}>
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
                                style={{ color: activeAccentHex }}
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

          {/* 3. БИЛЕТЫ (ТОЛЬКО В РЕЖИМЕ ЭКЗАМЕНА) */}
          {activeTab === 'tickets' && !isDiagnosticMode && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h1 className="text-[30px] font-extrabold tracking-tight leading-none">
                    Билеты
                  </h1>
                  <p className={`text-[13px] ${ui.muted} mt-1.5`}>
                    94 экзаменационных вопроса с ответами
                  </p>
                </div>
                <button
                  onClick={openTicketOfTheDay}
                  style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                  className="px-3.5 py-2 rounded-full font-bold text-[12px] flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Случайный
                </button>
              </div>

              {/* Фильтры категорий */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {['Все', 'Цитология', 'Эмбриология', 'Общая гистология', 'Частная гистология'].map(
                  (cat) => {
                    const isSelected = ticketBlockFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setTicketBlockFilter(cat)}
                        style={
                          isSelected
                            ? { backgroundColor: activeAccentHex, color: accentTextColor }
                            : undefined
                        }
                        className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition active:scale-95 ${
                          isSelected ? 'shadow-sm' : ui.subCard
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  }
                )}
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
                              Билет №{ticket.number}
                            </span>
                            <span className={`text-[11px] ${ui.muted}`}>{ticket.block}</span>
                          </div>
                          <div className="font-extrabold text-[14px] mt-1 leading-snug">
                            {ticket.question}
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          } ${ui.subtle}`}
                        />
                      </button>

                      {isOpen && (
                        <div className={`px-4 pb-4 pt-2 space-y-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'} animate-fadeIn`}>
                          {ticket.keyTip && (
                            <div
                              style={{ backgroundColor: `${activeAccentHex}14` }}
                              className="p-3 rounded-[16px] text-[12px] leading-snug"
                            >
                              <span className="font-bold" style={{ color: activeAccentHex }}>
                                План ответа:{' '}
                              </span>
                              <span>{ticket.keyTip}</span>
                            </div>
                          )}

                          <div className={`text-[13px] leading-relaxed whitespace-pre-line ${ui.muted}`}>
                            <RichGlossaryText
                              text={ticket.answer}
                              onSelectTerm={setSelectedTerm}
                              accentHex={activeAccentHex}
                            />
                          </div>
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

          {/* 5. ПРОФИЛЬ */}
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

              {/* Основной блок меню */}
              <div className={`rounded-[24px] overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                {/* 1. Режим подготовки */}
                <button
                  onClick={() => {
                    haptic('light');
                    setShowGoalHub(true);
                  }}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left transition active:opacity-75"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}
                    >
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Режим подготовки</div>
                      <div className={`text-[12px] ${ui.muted}`}>{getModeLabel(studyMode)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: `${activeAccentHex}20`, color: activeAccentHex }}
                      className="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
                    >
                      {getModeLabel(studyMode)}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${ui.subtle}`} />
                  </div>
                </button>

                {/* 2. Оформление */}
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

                {/* Статистика */}
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${ui.iconCircle}`}
                    >
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[14px]">Усвоено препаратов</div>
                      <div className={`text-[12px] ${ui.muted}`}>В текущем режиме</div>
                    </div>
                  </div>
                  <span className="font-extrabold text-[15px]">
                    {masteredCount} / {totalVisibleSlides}
                  </span>
                </div>

                {/* Сброс прогресса */}
                <div className="p-4">
                  {confirmReset ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setMasteredIds([]);
                          setMistakeIds([]);
                          setConfirmReset(false);
                          showToast('Прогресс сброшен');
                        }}
                        className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-[12px]"
                      >
                        Да, сбросить всё
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        className={`px-4 py-2 rounded-xl text-[12px] font-bold ${ui.subCard}`}
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="w-full py-2.5 rounded-xl text-rose-500 font-bold text-[13px] flex items-center justify-center gap-1.5 active:opacity-75 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Сбросить весь прогресс
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== LIQUID GLASS ДОК НАВИГАЦИИ ==================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-5 pt-2 flex justify-center pointer-events-none">
        <nav
          className={`pointer-events-auto p-1.5 rounded-full transition-all duration-300 w-[92vw] max-w-[390px] relative ${
            isDark ? 'liquid-glass-dark' : 'liquid-glass-light'
          }`}
        >
          {/* Скользящая активная капсула */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 pointer-events-none z-0"
            style={{
              width: `calc((100% - 12px) / ${dockTabs.length})`,
              transform: `translateX(${Math.max(0, activeDockIndex) * 100}%)`,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          />

          <div className={`grid ${dockTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'} relative z-10`}>
            {dockTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic('light');
                    setActiveTab(tab.id);
                  }}
                  className={`py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 ${
                    isActive ? 'scale-105' : 'opacity-60 hover:opacity-90'
                  }`}
                  aria-label={tab.label}
                >
                  <Icon
                    className="w-5 h-5 transition-transform"
                    style={isActive ? { color: activeAccentHex } : undefined}
                  />
                  <span
                    className="text-[10px] font-bold tracking-tight truncate max-w-full"
                    style={isActive ? { color: activeAccentHex } : undefined}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ==================== ГЛОБАЛЬНЫЙ ПОИСК ==================== */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col animate-fadeIn">
          <div
            style={{ paddingTop: `${topInsetPx}px` }}
            className={`px-4 pb-4 border-b ${isDark ? 'bg-[#09090B] border-white/10' : 'bg-white border-black/10'}`}
          >
            <div className="max-w-md mx-auto flex items-center gap-3">
              <div className={`flex-1 rounded-full px-4 py-2.5 flex items-center gap-2.5 ${ui.subCard}`}>
                <Search className={`w-4 h-4 ${ui.muted}`} />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Препарат, ткань, орган, ЭМ..."
                  className="w-full bg-transparent text-[14px] outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X className={`w-4 h-4 ${ui.muted}`} />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="font-bold text-[14px]"
                style={{ color: activeAccentHex }}
              >
                Отмена
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full space-y-4">
            {!searchQuery.trim() ? (
              <div className={`text-center py-12 ${ui.muted} text-[13px]`}>
                Начните вводить название препарата, органа или термина
              </div>
            ) : (
              <>
                {globalSearchResults.slides.length > 0 && (
                  <div className="space-y-2">
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${ui.subtle}`}>
                      Препараты ({globalSearchResults.slides.length})
                    </div>
                    {globalSearchResults.slides.map((slide) => (
                      <div
                        key={slide.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setActiveMicroscopeSlide(slide);
                        }}
                        className={`rounded-[18px] p-3 flex items-center gap-3 cursor-pointer ${ui.cardInteractive}`}
                      >
                        <ImageWithFallback
                          src={getSlideImage(slide)}
                          alt={slide.title}
                          className="w-10 h-10 rounded-xl object-cover bg-black shrink-0 border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[13px] truncate">{slide.title}</div>
                          <div className={`text-[11px] ${ui.muted} truncate`}>
                            №{slide.examNumber} · {slide.stain}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {globalSearchResults.terms.length > 0 && (
                  <div className="space-y-2">
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${ui.subtle}`}>
                      Словарь ({globalSearchResults.terms.length})
                    </div>
                    {globalSearchResults.terms.map((term) => (
                      <div
                        key={term.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSelectedTerm(term);
                        }}
                        className={`rounded-[18px] p-3 cursor-pointer ${ui.cardInteractive}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[13px]" style={{ color: activeAccentHex }}>
                            {term.term}
                          </span>
                          <span className={`text-[10px] ${ui.subtle}`}>{term.category}</span>
                        </div>
                        <p className={`text-[12px] ${ui.muted} line-clamp-1 mt-0.5`}>
                          {term.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== ШТОРКА ОФОРМЛЕНИЯ ==================== */}
      {showAppearanceSheet && (
        <div
          onClick={() => setShowAppearanceSheet(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-[30px] p-5 pb-9 space-y-4 animate-slideUp ${
              isDark
                ? 'bg-[#16161A]/95 backdrop-blur-2xl border-t border-white/15 text-white'
                : 'bg-white/95 backdrop-blur-2xl border-t border-black/10 text-zinc-900'
            }`}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-500/30 mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-extrabold">Оформление</h3>
              <button
                onClick={() => setShowAppearanceSheet(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${ui.iconCircle}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Выбор темы: Тёмная / Светлая / Системная */}
            <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-black/10 dark:bg-white/5">
              {[
                { id: 'dark' as ThemeMode, label: 'Тёмная', icon: Moon },
                { id: 'light' as ThemeMode, label: 'Светлая', icon: Sun },
                { id: 'system' as ThemeMode, label: 'Системная', icon: Smartphone },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = themeMode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      haptic('light');
                      setThemeMode(item.id);
                    }}
                    className={`py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition ${
                      isSelected
                        ? isDark
                          ? 'bg-white text-zinc-950 shadow'
                          : 'bg-zinc-900 text-white shadow'
                        : ui.muted
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Выбор акцентного цвета в одну строку: 5 пресетов + пипетка */}
            <div className="space-y-2 pt-1">
              <div className={`text-[12px] font-bold ${ui.muted}`}>Цветовой акцент</div>
              <div className="flex items-center justify-between gap-2">
                {PRESET_ACCENTS.map((p) => {
                  const hex = isDark ? p.darkHex : p.lightHex;
                  const isSelected = accentId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        haptic('light');
                        setAccentId(p.id);
                      }}
                      style={{ backgroundColor: hex }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90 relative ${
                        isSelected ? 'ring-2 ring-offset-2 ring-offset-[#141417] ring-white scale-105' : 'opacity-85'
                      }`}
                      aria-label={p.label}
                    />
                  );
                })}

                {/* Пипетка для кастомного цвета */}
                <label
                  style={{
                    backgroundColor: accentId === 'custom' ? customHex : 'transparent',
                  }}
                  className={`w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition active:scale-90 relative ${
                    accentId === 'custom'
                      ? 'border-white ring-2 ring-offset-2 ring-offset-[#141417] ring-white scale-105'
                      : 'border-zinc-500 text-zinc-400'
                  }`}
                  title="Выбрать свой цвет"
                >
                  <Pipette className="w-4 h-4" />
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => {
                      setAccentId('custom');
                      setCustomHex(e.target.value);
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ШТОРКА ТЕСТОВ СДО ==================== */}
      {showSdoSheet && (
        <div
          onClick={() => setShowSdoSheet(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-[30px] p-5 pb-9 space-y-4 animate-slideUp max-h-[85vh] overflow-y-auto ${
              isDark
                ? 'bg-[#16161A]/95 backdrop-blur-2xl border-t border-white/15 text-white'
                : 'bg-white/95 backdrop-blur-2xl border-t border-black/10 text-zinc-900'
            }`}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-500/30 mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${activeAccentHex}20`, color: activeAccentHex }}
                >
                  1 294 задания
                </span>
                <h3 className="text-[20px] font-extrabold mt-1">Тесты СДО НГМУ</h3>
              </div>
              <button
                onClick={() => setShowSdoSheet(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ui.iconCircle}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-6 rounded-[24px] text-center space-y-3 ${ui.subCard}`}>
              <div
                style={{ backgroundColor: `${activeAccentHex}1C`, color: activeAccentHex }}
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center font-bold"
              >
                <FileText className="w-6 h-6" />
              </div>
              <div className="font-extrabold text-[16px]">Банк тестов СДО готов к загрузке</div>
              <p className={`text-[13px] leading-relaxed max-w-xs mx-auto ${ui.muted}`}>
                Слот зарезервирован под 1 294 официальных задания СДО кафедры гистологии НГМУ. Тесты будут подключены в следующем модульном обновлении.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Сетка данных синхронизирована
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ШТОРКА 55 СИТУАЦИОННЫХ ЗАДАЧ ==================== */}
      {showTasksSheet && (
        <div
          onClick={() => setShowTasksSheet(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-[30px] p-5 pb-9 space-y-4 animate-slideUp max-h-[85vh] overflow-y-auto ${
              isDark
                ? 'bg-[#16161A]/95 backdrop-blur-2xl border-t border-white/15 text-white'
                : 'bg-white/95 backdrop-blur-2xl border-t border-black/10 text-zinc-900'
            }`}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-500/30 mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${activeAccentHex}20`, color: activeAccentHex }}
                >
                  55 экзаменационных задач
                </span>
                <h3 className="text-[20px] font-extrabold mt-1">Ситуационные задачи</h3>
              </div>
              <button
                onClick={() => setShowTasksSheet(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ui.iconCircle}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-6 rounded-[24px] text-center space-y-3 ${ui.subCard}`}>
              <div
                style={{ backgroundColor: `${activeAccentHex}1C`, color: activeAccentHex }}
                className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center font-bold"
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="font-extrabold text-[16px]">Слот ситуационных задач готов</div>
              <p className={`text-[13px] leading-relaxed max-w-xs mx-auto ${ui.muted}`}>
                Слот зарезервирован под 55 экзаменационных ситуационных задач лечебного факультета НГМУ. Задачи уже подключены к симулятору экзамена.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Интеграция с симулятором активна
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ШТОРКА ИЗБРАННОГО ==================== */}
      {showFavoritesSheet && (
        <div
          onClick={() => setShowFavoritesSheet(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-t-[30px] p-5 pb-9 space-y-4 animate-slideUp max-h-[80vh] overflow-y-auto ${
              isDark
                ? 'bg-[#16161A]/95 backdrop-blur-2xl border-t border-white/15 text-white'
                : 'bg-white/95 backdrop-blur-2xl border-t border-black/10 text-zinc-900'
            }`}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-500/30 mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-extrabold">Избранные стекла</h3>
                <p className={`text-[12px] ${ui.muted}`}>
                  {favoriteSlides.length} сохранено в закладки
                </p>
              </div>
              <button
                onClick={() => setShowFavoritesSheet(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${ui.iconCircle}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {favoriteSlides.length === 0 ? (
              <div className={`p-8 text-center rounded-[20px] space-y-2 ${ui.subCard}`}>
                <Bookmark className={`w-8 h-8 mx-auto opacity-40`} />
                <div className="text-[14px] font-bold">Закладок пока нет</div>
                <p className={`text-[12px] ${ui.muted}`}>
                  Нажимайте на флажок внутри карточек, чтобы сохранять сложные препараты
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowFavoritesSheet(false);
                    startQuiz(shuffleArray(favoriteSlides), 'Избранные препараты');
                  }}
                  style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                  className="w-full py-3 rounded-2xl font-bold text-[13px] flex items-center justify-center gap-1.5 shadow"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Тренировать избранные ({favoriteSlides.length})
                </button>
                {favoriteSlides.map((slide) => (
                  <div
                    key={slide.id}
                    onClick={() => {
                      setShowFavoritesSheet(false);
                      setActiveMicroscopeSlide(slide);
                    }}
                    className={`rounded-[18px] p-3 flex items-center gap-3 cursor-pointer ${ui.cardInteractive}`}
                  >
                    <ImageWithFallback
                      src={getSlideImage(slide)}
                      alt={slide.title}
                      className="w-10 h-10 rounded-xl object-cover bg-black shrink-0 border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[13px] truncate">{slide.title}</div>
                      <div className={`text-[11px] ${ui.muted} truncate`}>
                        №{slide.examNumber} · {slide.stain}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== BOTTOM SHEET СЛОВАРИКА ==================== */}
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

      {/* ==================== СИМУЛЯТОР ЭКЗАМЕНА НГМУ ==================== */}
      {showExamSimulator && (
        <ExamSimulatorModal
          questions={EXAM_TICKETS}
          slides={EXAM_SLIDES}
          electronograms={ELECTRONOGRAMS}
          tasks={SITUATIONAL_TASKS}
          isDark={isDark}
          accentHex={activeAccentHex}
          textOnAccent={accentTextColor}
          topInsetPx={topInsetPx}
          onOpenSlide={(s) => setActiveMicroscopeSlide(s)}
          onClose={() => setShowExamSimulator(false)}
        />
      )}

      {/* ==================== МОДАЛКА КВИЗА (СПИДРАН) ==================== */}
      {quizState && (
        <div className="fixed inset-0 z-50 bg-[#07090E] text-white flex flex-col select-none animate-fadeIn">
          <div
            style={{ paddingTop: `${topInsetPx}px` }}
            className="px-4 pb-3 flex items-center justify-between gap-3 border-b border-white/10"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                {quizState.title}
              </div>
              <div className="text-[14px] font-extrabold truncate">
                {quizState.isFinished
                  ? 'Тестирование завершено'
                  : `Препарат ${quizState.index + 1} из ${quizState.slides.length}`}
              </div>
            </div>
            <button
              onClick={() => setQuizState(null)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full flex flex-col justify-between">
            {quizState.isFinished ? (
              <div className="my-auto text-center space-y-4 py-8">
                <div
                  style={{ backgroundColor: `${activeAccentHex}26`, color: activeAccentHex }}
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-[36px]"
                >
                  🎉
                </div>
                <div>
                  <h3 className="text-[24px] font-extrabold">Отличная работа!</h3>
                  <p className="text-[14px] text-zinc-400 mt-1">
                    Верно распознано: {quizState.correctCount} из {quizState.slides.length} препаратов
                  </p>
                </div>
                <button
                  onClick={() => setQuizState(null)}
                  style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                  className="w-full py-3.5 rounded-2xl font-bold text-[14px] shadow"
                >
                  Завершить
                </button>
              </div>
            ) : (
              <>
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
                          <Microscope className="w-3.5 h-3.5" />
                          В микроскоп
                        </button>
                      </div>

                      <div className="flex-1 space-y-3">
                        {!quizState.showAnswer ? (
                          <div className="text-center py-6 space-y-3">
                            <p className="text-[13px] text-zinc-400">
                              Внимательно рассмотрите срез, вспомните слои, тип ткани и окраску.
                            </p>
                            <button
                              onClick={() => {
                                haptic('light');
                                setQuizState({ ...quizState, showAnswer: true });
                              }}
                              style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                              className="w-full py-3.5 rounded-2xl font-bold text-[14px] shadow active:scale-[0.98] transition"
                            >
                              Показать разбор препарата
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-fadeIn">
                            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                                Название препарата №{slide.examNumber}
                              </div>
                              <div className="text-[16px] font-extrabold text-white">
                                {slide.title}
                              </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                              <div
                                style={{ color: activeAccentHex }}
                                className="text-[11px] font-bold uppercase tracking-wider"
                              >
                                Главный признак на экзамене
                              </div>
                              <div className="text-[13px] text-zinc-200 leading-snug">
                                {slide.killerFeature}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 pt-2">
                              <button
                                onClick={() => handleQuizAnswer(false)}
                                className="py-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[13px] active:scale-95 transition"
                              >
                                Не вспомнил
                              </button>
                              <button
                                onClick={() => handleQuizAnswer(true)}
                                className="py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[13px] active:scale-95 transition"
                              >
                                Знал / Угадал
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== ТОСТ-УВЕДОМЛЕНИЕ ==================== */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-zinc-900/95 text-white text-[12px] font-semibold border border-white/15 shadow-xl whitespace-nowrap animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* ==================== ЛЕНИВАЯ МОДАЛКА МИКРОСКОПА ==================== */}
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
