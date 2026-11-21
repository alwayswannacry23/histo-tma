import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { LazyMotion, domMax, m } from 'framer-motion';
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
  Bookmark,
  AlertCircle,
  Shuffle,
  FileText,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import { EXAM_SLIDES, HistSlide } from './data/histoData';
import { GLOSSARY_TERMS, GlossaryTerm, RichGlossaryText } from './data/glossaryData';
import { ELECTRONOGRAMS, EXAM_TICKETS } from './data/examContent';
import {
  StudyMode,
  DiagnosticId,
  TheoryTopic,
  TheorySection,
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
import { BottomSheet } from './components/BottomSheet';
import { SectionPageView } from './components/SectionPageView';
import { InteractiveLessonView } from './components/InteractiveLessonView';
import { IOS_SPRING } from './utils/motion';

const MicroscopeViewerModal = React.lazy(() => import('./components/MicroscopeViewerModal'));

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage access failed:', e);
  }
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
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

function readStoredIds(key: string): string[] {
  try {
    const parsed = JSON.parse(safeGetItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  // Screen stack for Home tab
  const [selectedSection, setSelectedSection] = useState<TheorySection | null>(null);
  const [activeLessonTopic, setActiveLessonTopic] = useState<TheoryTopic | null>(null);

  // Study Mode state (diag_1..4 / exam)
  const [studyMode, setStudyMode] = useState<StudyMode | null>(() => {
    const saved = safeGetItem('baza_study_mode');
    if (saved === 'diag_1' || saved === 'diag_2' || saved === 'diag_3' || saved === 'diag_4' || saved === 'exam') {
      return saved as StudyMode;
    }
    return null;
  });

  const [showGoalHub, setShowGoalHub] = useState<boolean>(false);
  const [showExamSimulator, setShowExamSimulator] = useState<boolean>(false);
  const [showAppearanceSheet, setShowAppearanceSheet] = useState<boolean>(false);
  const [showSdoSheet, setShowSdoSheet] = useState<boolean>(false);
  const [showTasksSheet, setShowTasksSheet] = useState<boolean>(false);
  const [showFavoritesSheet, setShowFavoritesSheet] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [expandedEmId, setExpandedEmId] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [ticketBlockFilter, setTicketBlockFilter] = useState<string>('Все');

  const [themeMode, setThemeMode] = useState<ThemeMode>(
    () => (safeGetItem('baza_theme_mode') as ThemeMode) || 'dark'
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    const tgScheme = getTg()?.colorScheme;
    if (tgScheme === 'dark') return true;
    if (tgScheme === 'light') return false;
    return typeof window !== 'undefined'
      ? window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? true
      : true;
  });

  const [accentId, setAccentId] = useState<AccentId>(
    () => (safeGetItem('baza_accent_v2') as AccentId) || 'mint'
  );
  const [customHex, setCustomHex] = useState<string>(
    () => safeGetItem('baza_custom_hex') || '#2DD4BF'
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
    tg?.HapticFeedback?.notificationOccurred?.('success');
    const t = setTimeout(() => setToastMessage(null), 2400);
    return () => clearTimeout(t);
  };

  const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    const tg = getTg();
    tg?.HapticFeedback?.impactOccurred?.(style);
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
    const headerBg = isDark ? '#09090B' : '#F4F4F6';
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
    setSelectedSection(null);
    setActiveLessonTopic(null);
    if (mode !== 'exam' && activeTab === 'tickets') {
      setActiveTab('home');
    }
    haptic('medium');
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

  const startQuiz = (slidesList: HistSlide[], title: string) => {
    if (slidesList.length === 0) {
      showToast('Список препаратов пуст');
      return;
    }
    haptic('medium');
    setQuizState({
      slides: slidesList,
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
      showToast('У вас нет неотработанных ошибок');
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

  // Section slides & EMs resolvers
  const getSectionSlides = (sec: TheorySection) => {
    const topicSlideIds = new Set<string>();
    sec.topics.forEach((t) => {
      (t.relatedSlideIds || []).forEach((id) => topicSlideIds.add(id));
    });
    if (topicSlideIds.size > 0) {
      const matched = visibleSlides.filter((s) => topicSlideIds.has(s.id));
      if (matched.length > 0) return matched;
    }
    if (sec.id === 'sec_1_histotechnique' || sec.id === 'sec_2_cytology') {
      return [];
    }
    if (sec.id === 'sec_3_embryology') {
      return visibleSlides.filter((s) => s.id === 'slide_01' || s.id === 'slide_69' || s.id === 'slide_70');
    }
    if (sec.id === 'sec_4_general_histo') {
      return visibleSlides.filter(
        (s) => s.moduleId === 'mod_epithelium_conn' || s.moduleId === 'mod_cartilage_bone_muscle'
      );
    }
    return visibleSlides.filter(
      (s) => s.moduleId !== 'mod_epithelium_conn' && s.moduleId !== 'mod_cartilage_bone_muscle'
    );
  };

  const getSectionEms = (sec: TheorySection) => {
    const emIds = new Set<string>();
    sec.topics.forEach((t) => {
      (t.relatedEmIds || []).forEach((id) => emIds.add(id));
    });
    if (emIds.size > 0) {
      return visibleElectronograms.filter((em) => emIds.has(em.id));
    }
    if (sec.id === 'sec_2_cytology') {
      return visibleElectronograms.filter((em) => em.number >= 1 && em.number <= 15);
    }
    if (sec.id === 'sec_3_embryology') {
      return visibleElectronograms.filter((em) => em.number >= 46 && em.number <= 52);
    }
    if (sec.id === 'sec_4_general_histo') {
      return visibleElectronograms.filter((em) => em.number >= 16 && em.number <= 25);
    }
    if (sec.id === 'sec_5_special_histo') {
      return visibleElectronograms.filter((em) => em.number > 25 && em.number < 46);
    }
    return [];
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

  // Unified Telegram BackButton stack (Phase 5.2)
  useEffect(() => {
    const tg = getTg();
    if (!tg?.BackButton) return;

    const hasBackAction =
      Boolean(selectedTerm) ||
      showSdoSheet ||
      showTasksSheet ||
      showFavoritesSheet ||
      showAppearanceSheet ||
      showExamSimulator ||
      isSearchOpen ||
      Boolean(activeMicroscopeSlide) ||
      Boolean(quizState) ||
      Boolean(activeLessonTopic) ||
      Boolean(selectedSection) ||
      activeTab !== 'home' ||
      showGoalHub;

    if (hasBackAction) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }

    const handleBack = () => {
      if (selectedTerm) {
        setSelectedTerm(null);
        return;
      }
      if (showSdoSheet) {
        setShowSdoSheet(false);
        return;
      }
      if (showTasksSheet) {
        setShowTasksSheet(false);
        return;
      }
      if (showFavoritesSheet) {
        setShowFavoritesSheet(false);
        return;
      }
      if (showAppearanceSheet) {
        setShowAppearanceSheet(false);
        return;
      }
      if (showExamSimulator) {
        setShowExamSimulator(false);
        return;
      }
      if (isSearchOpen) {
        setIsSearchOpen(false);
        return;
      }
      if (activeMicroscopeSlide) {
        setActiveMicroscopeSlide(null);
        return;
      }
      if (quizState) {
        setQuizState(null);
        return;
      }
      if (activeLessonTopic) {
        setActiveLessonTopic(null);
        return;
      }
      if (selectedSection) {
        setSelectedSection(null);
        return;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return;
      }
      if (showGoalHub && studyMode) {
        setShowGoalHub(false);
        return;
      }
    };

    tg.BackButton.onClick(handleBack);
    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [
    selectedTerm,
    showSdoSheet,
    showTasksSheet,
    showFavoritesSheet,
    showAppearanceSheet,
    showExamSimulator,
    isSearchOpen,
    activeMicroscopeSlide,
    quizState,
    activeLessonTopic,
    selectedSection,
    activeTab,
    showGoalHub,
    studyMode,
  ]);

  // UI Theme classes conforming to /unslop (Phase 1)
  const ui = {
    bg: isDark ? 'bg-[#09090B] text-white' : 'bg-[#F4F4F6] text-zinc-900',
    card: isDark
      ? 'bg-[#131316] border border-white/[0.08]'
      : 'bg-white border border-black/[0.07]',
    cardInteractive: isDark
      ? 'bg-[#131316] border border-white/[0.08] active:bg-[#1C1C21]'
      : 'bg-white border border-black/[0.07] active:bg-zinc-50',
    subCard: isDark
      ? 'bg-white/[0.03] border border-white/[0.06]'
      : 'bg-zinc-50 border border-black/[0.05]',
    muted: isDark ? 'text-zinc-400' : 'text-zinc-600',
    subtle: isDark ? 'text-zinc-500' : 'text-zinc-400',
    divider: isDark ? 'divide-white/[0.06]' : 'divide-black/[0.06]',
    iconCircle: isDark ? 'bg-white/[0.06] text-white' : 'bg-zinc-100 text-zinc-800',
  };

  const themeModeLabel =
    themeMode === 'system' ? 'Системная' : themeMode === 'dark' ? 'Тёмная' : 'Светлая';

  // 1. Initial Goal Hub View (if studyMode is not selected yet OR user opened Goal Hub)
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

  const hideDock = Boolean(activeLessonTopic || activeMicroscopeSlide || quizState);

  return (
    <LazyMotion features={domMax} strict>
      <div className={`min-h-screen ${ui.bg} transition-colors duration-200 font-sans select-none flex flex-col justify-between overflow-x-hidden`}>
        {/* ==================== SCREEN 3: INTERACTIVE LESSON SLIDE-VIEW ==================== */}
        {activeLessonTopic && (
          <InteractiveLessonView
            topic={activeLessonTopic}
            isDark={isDark}
            accentHex={activeAccentHex}
            onClose={() => setActiveLessonTopic(null)}
            onSelectTerm={setSelectedTerm}
            onOpenQuestion={(qNum) => {
              setActiveLessonTopic(null);
              setSelectedSection(null);
              setActiveTab('tickets');
              const t = EXAM_TICKETS.find((tick) => tick.number === qNum);
              if (t) setExpandedTicketId(t.id);
            }}
            onOpenSlide={(slide) => setActiveMicroscopeSlide(slide)}
          />
        )}

        {/* ==================== SCREEN 2: SECTION PAGE VIEW ==================== */}
        {!activeLessonTopic && selectedSection && (
          <SectionPageView
            section={selectedSection}
            topics={selectedSection.topics}
            slides={getSectionSlides(selectedSection)}
            electronograms={getSectionEms(selectedSection)}
            favoriteIds={favoriteIds}
            masteredIds={masteredIds}
            isDark={isDark}
            accentHex={activeAccentHex}
            accentTextColor={accentTextColor}
            onBack={() => setSelectedSection(null)}
            onSelectTopic={(t) => setActiveLessonTopic(t)}
            onSelectSlide={(s) => setActiveMicroscopeSlide(s)}
            onSelectEm={(em) => {
              setExpandedEmId(em.id);
              setActiveTab('em');
              setSelectedSection(null);
            }}
            onStartSectionQuiz={(secSlides) =>
              startQuiz(shuffleArray(secSlides), `Тест · ${selectedSection.title}`)
            }
          />
        )}

        {/* ==================== SCREEN 1: HOME OVERVIEW & TABS ==================== */}
        {!activeLessonTopic && !selectedSection && (
          <div className="flex-1 pb-28">
            <div style={{ paddingTop: `${topInsetPx}px` }} className="max-w-md mx-auto px-4 space-y-5">
              {/* TAB 1: HOME */}
              {activeTab === 'home' && (
                <div className="space-y-4">
                  {/* Шапка: Аватар + Капсула режима + Поиск */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                        className="w-9 h-9 rounded-full font-semibold text-[13px] flex items-center justify-center shadow-sm transition active:scale-95"
                      >
                        {userInitial}
                      </button>

                      {/* Капсула выбора режима */}
                      <button
                        type="button"
                        onClick={() => {
                          haptic('light');
                          setShowGoalHub(true);
                        }}
                        className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 text-[12px] font-semibold transition active:scale-95 ${ui.cardInteractive}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeAccentHex }} />
                        <span>{getModeLabel(studyMode)}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setIsSearchOpen(true);
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 ${ui.cardInteractive}`}
                      aria-label="Поиск"
                    >
                      <Search className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Блок готовности с tabular-nums */}
                  <div className={`rounded-[20px] p-4 space-y-3 ${ui.card}`}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className={ui.muted}>
                        {isDiagnosticMode ? `Готовность к ${getModeLabel(studyMode)}` : 'Готовность к экзамену'}
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-[13px]">
                        {masteredCount} / {totalVisibleSlides}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-white/[0.08] dark:bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${readinessPct}%`,
                          backgroundColor: activeAccentHex,
                        }}
                      />
                    </div>
                  </div>

                  {/* 4 плитки быстрого доступа */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
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
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            haptic('light');
                            item.onClick();
                          }}
                          className={`relative rounded-[16px] py-3 px-1 flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${ui.cardInteractive}`}
                        >
                          {item.badge !== null && (
                            <span
                              style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                              className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-semibold flex items-center justify-center tabular-nums"
                            >
                              {item.badge}
                            </span>
                          )}
                          <Icon className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                          <span className="text-[11px] font-medium tracking-tight truncate max-w-full">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Спокойная CTA-карточка тренировки */}
                  {isDiagnosticMode ? (
                    <div className={`rounded-[20px] p-4 space-y-3 ${ui.card}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" style={{ color: activeAccentHex }} strokeWidth={1.5} />
                          <h2 className="font-semibold text-[15px] tracking-tight">Слепые стёкла</h2>
                        </div>
                        <span className={`text-[11px] font-mono tabular-nums ${ui.subtle}`}>
                          {visibleSlides.length} препаратов
                        </span>
                      </div>
                      <p className={`text-[12.5px] leading-relaxed ${ui.muted}`}>
                        Тренировка быстрого опознания препаратов {getModeLabel(studyMode)}: ткань, слои, окраска и диагностические признаки.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          startQuiz(shuffleArray(visibleSlides), `Слепые стёкла · ${getModeLabel(studyMode)}`);
                        }}
                        style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                        className="w-full py-2.5 rounded-[14px] font-semibold text-[13px] transition active:scale-[0.98] shadow-sm"
                      >
                        Начать тренировку
                      </button>
                    </div>
                  ) : (
                    <div className={`rounded-[20px] p-4 space-y-3 ${ui.card}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" style={{ color: activeAccentHex }} strokeWidth={1.5} />
                          <h2 className="font-semibold text-[15px] tracking-tight">Симулятор экзамена</h2>
                        </div>
                        <span className={`text-[11px] font-mono tabular-nums ${ui.subtle}`}>
                          Регламент НГМУ
                        </span>
                      </div>
                      <p className={`text-[12.5px] leading-relaxed ${ui.muted}`}>
                        Случайный экзаменационный билет: 3 вопроса теории, 1 ситуационная задача, 2 слепых стекла и 1 электроннограмма.
                      </p>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            haptic('medium');
                            setShowExamSimulator(true);
                          }}
                          style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                          className="w-full py-2.5 rounded-[14px] font-semibold text-[13px] shadow-sm transition active:scale-[0.98]"
                        >
                          Тянуть билет
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const random15 = shuffleArray(EXAM_SLIDES).slice(0, 15);
                            startQuiz(random15, 'Слепые стёкла · 15 случайных');
                          }}
                          className={`w-full py-2 rounded-[14px] font-medium text-[12px] transition active:scale-[0.98] ${ui.subCard}`}
                        >
                          15 случайных препаратов
                        </button>
                      </div>
                    </div>
                  )}

                  {/* РАЗДЕЛЫ КУРСА: Чистый список */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-semibold text-[15px] tracking-tight">Разделы</span>
                      <span className={`text-[11px] font-mono tabular-nums ${ui.subtle}`}>
                        {visibleTheorySections.length} {visibleTheorySections.length === 1 ? 'раздел' : visibleTheorySections.length < 5 ? 'раздела' : 'разделов'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {visibleTheorySections.map((sec, secIdx) => {
                        const secSlides = getSectionSlides(sec);
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              haptic('light');
                              setSelectedSection(sec);
                            }}
                            className={`w-full p-3.5 rounded-[18px] text-left border flex items-center justify-between gap-3 transition active:scale-[0.98] ${ui.cardInteractive}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-[12px] font-semibold"
                                style={{
                                  backgroundColor: `${activeAccentHex}1A`,
                                  color: activeAccentHex,
                                }}
                              >
                                {sec.order || secIdx + 1}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-[14px] leading-snug tracking-tight truncate">
                                  {sec.title}
                                </h3>
                                <p className={`text-[11.5px] ${ui.muted} mt-0.5`}>
                                  {sec.topics.length} {sec.topics.length === 1 ? 'тема' : 'тем'} · {secSlides.length} препаратов
                                </p>
                              </div>
                            </div>

                            <ChevronRight className={`w-4 h-4 shrink-0 ${ui.subtle}`} strokeWidth={1.5} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ЭМ-СХЕМЫ */}
              {activeTab === 'em' && (
                <div className="space-y-4">
                  <div className="pt-1">
                    <h1 className="text-[22px] font-semibold tracking-tight leading-tight">
                      Электроннограммы
                    </h1>
                    <p className={`text-[12.5px] ${ui.muted} mt-1`}>
                      {isDiagnosticMode ? `Схемы к ${getModeLabel(studyMode)}` : 'Ультраструктура клеток, барьеров и органелл'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {visibleElectronograms.map((em) => {
                      const isOpen = expandedEmId === em.id;
                      return (
                        <div key={em.id} className={`rounded-[18px] overflow-hidden border ${ui.card}`}>
                          <button
                            type="button"
                            onClick={() => {
                              haptic('light');
                              setExpandedEmId(isOpen ? null : em.id);
                            }}
                            className="w-full p-3.5 flex items-center justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-[10.5px] font-mono px-2 py-0.5 rounded"
                                  style={{ backgroundColor: `${activeAccentHex}1A`, color: activeAccentHex }}
                                >
                                  ЭМ №{em.number}
                                </span>
                                <span className={`text-[11px] truncate ${ui.subtle}`}>{em.topic}</span>
                              </div>
                              <h2 className="font-semibold text-[14px] leading-snug">{em.title}</h2>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              } ${ui.subtle}`}
                              strokeWidth={1.5}
                            />
                          </button>

                          {isOpen && (
                            <div className={`px-4 pb-4 pt-1 space-y-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                              {em.imageUrl && (
                                <img
                                  src={em.imageUrl}
                                  alt={em.title}
                                  className="w-full h-40 rounded-[14px] object-cover border border-white/10"
                                  loading="lazy"
                                />
                              )}

                              {em.keyFeature && (
                                <div className={`p-3 rounded-[14px] border space-y-1 ${ui.subCard}`}>
                                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: activeAccentHex }}>
                                    Ключевой ультраструктурный признак:
                                  </div>
                                  <p className={`text-[12.5px] leading-relaxed ${ui.muted}`}>
                                    {em.keyFeature}
                                  </p>
                                </div>
                              )}

                              <div className={`text-[12.5px] leading-relaxed ${ui.muted}`}>
                                {em.description}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: БИЛЕТЫ (РЕЖИМ ЭКЗАМЕНА) */}
              {activeTab === 'tickets' && !isDiagnosticMode && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h1 className="text-[22px] font-semibold tracking-tight leading-tight">Билеты</h1>
                      <p className={`text-[12.5px] ${ui.muted} mt-1`}>
                        94 экзаменационных вопроса с ответами
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openTicketOfTheDay}
                      style={{ backgroundColor: `${activeAccentHex}1A`, color: activeAccentHex }}
                      className="px-3 py-1.5 rounded-full font-semibold text-[12px] flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Shuffle className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Случайный</span>
                    </button>
                  </div>

                  {/* Фильтры */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {['Все', 'Цитология', 'Эмбриология', 'Общая гистология', 'Частная гистология'].map(
                      (cat) => {
                        const isSelected = ticketBlockFilter === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setTicketBlockFilter(cat)}
                            className={`px-3 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap transition active:scale-95 ${
                              isSelected
                                ? 'bg-white text-zinc-900 shadow-sm'
                                : ui.subCard
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="space-y-2">
                    {filteredTickets.map((ticket) => {
                      const isOpen = expandedTicketId === ticket.id;
                      return (
                        <div key={ticket.id} className={`rounded-[18px] overflow-hidden border ${ui.card}`}>
                          <button
                            type="button"
                            onClick={() => {
                              haptic('light');
                              setExpandedTicketId(isOpen ? null : ticket.id);
                            }}
                            className="w-full p-3.5 flex items-center justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-[10.5px] font-mono px-2 py-0.5 rounded"
                                  style={{ backgroundColor: `${activeAccentHex}1A`, color: activeAccentHex }}
                                >
                                  Билет №{ticket.number}
                                </span>
                                <span className={`text-[11px] truncate ${ui.subtle}`}>{ticket.block}</span>
                              </div>
                              <h2 className="font-semibold text-[13.5px] leading-snug">{ticket.question}</h2>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              } ${ui.subtle}`}
                              strokeWidth={1.5}
                            />
                          </button>

                          {isOpen && (
                            <div className={`px-4 pb-4 pt-1 space-y-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                              {ticket.keyTip && (
                                <div className={`p-3 rounded-[14px] text-[12px] leading-snug ${ui.subCard}`}>
                                  <span className="font-semibold" style={{ color: activeAccentHex }}>
                                    План ответа:{' '}
                                  </span>
                                  <span>{ticket.keyTip}</span>
                                </div>
                              )}

                              <div className={`text-[12.5px] leading-relaxed whitespace-pre-line ${ui.muted}`}>
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

              {/* TAB 4: СЛОВАРЬ ТЕРМИНОВ */}
              {activeTab === 'glossary' && (
                <div className="space-y-4">
                  <div className="pt-1">
                    <h1 className="text-[22px] font-semibold tracking-tight leading-tight">Словарь</h1>
                    <p className={`text-[12.5px] ${ui.muted} mt-1`}>
                      Кафедральные определения и пояснения к экзамену
                    </p>
                  </div>

                  <div className={`rounded-[16px] px-3.5 py-2.5 flex items-center gap-2.5 border ${ui.card}`}>
                    <Search className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
                    <input
                      type="text"
                      value={glossaryQuery}
                      onChange={(e) => setGlossaryQuery(e.target.value)}
                      placeholder="Поиск по терминам..."
                      className="w-full bg-transparent text-[13px] outline-none"
                    />
                    {glossaryQuery && (
                      <button onClick={() => setGlossaryQuery('')}>
                        <X className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {filteredGlossary.map((term) => (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => setSelectedTerm(term)}
                        className={`w-full p-3.5 rounded-[18px] text-left border flex items-center justify-between gap-3 transition active:scale-[0.98] ${ui.cardInteractive}`}
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[13.5px]">{term.term}</span>
                            {term.latin && (
                              <span className={`text-[11px] font-mono italic truncate ${ui.subtle}`}>
                                {term.latin}
                              </span>
                            )}
                          </div>
                          <p className={`text-[12px] line-clamp-1 ${ui.muted}`}>{term.definition}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${ui.subtle}`} strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: ПРОФИЛЬ */}
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  <div className="pt-1">
                    <h1 className="text-[22px] font-semibold tracking-tight leading-tight">Профиль</h1>
                  </div>

                  <div className="flex flex-col items-center text-center py-2">
                    <div
                      style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                      className="w-16 h-16 rounded-full font-semibold text-[24px] flex items-center justify-center shadow-sm"
                    >
                      {userInitial}
                    </div>
                    <h2 className="text-[17px] font-semibold mt-2.5">{userName}</h2>
                    <p className={`text-[12px] ${ui.muted}`}>{userHandle}</p>
                  </div>

                  {/* Меню профиля */}
                  <div className={`rounded-[20px] overflow-hidden divide-y border ${ui.card} ${ui.divider}`}>
                    {/* Режим подготовки */}
                    <button
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setShowGoalHub(true);
                      }}
                      className="w-full p-3.5 flex items-center justify-between gap-3 text-left transition active:opacity-80"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ui.iconCircle}`}>
                          <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="font-semibold text-[13.5px]">Режим подготовки</div>
                          <div className={`text-[11.5px] ${ui.muted}`}>{getModeLabel(studyMode)}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
                    </button>

                    {/* Оформление */}
                    <button
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setShowAppearanceSheet(true);
                      }}
                      className="w-full p-3.5 flex items-center justify-between gap-3 text-left transition active:opacity-80"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ui.iconCircle}`}>
                          <Palette className="w-4 h-4" strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="font-semibold text-[13.5px]">Оформление</div>
                          <div className={`text-[11.5px] ${ui.muted}`}>{themeModeLabel}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: activeAccentHex }}
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                        />
                        <ChevronRight className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
                      </div>
                    </button>

                    {/* Статистика */}
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ui.iconCircle}`}>
                          <Award className="w-4 h-4" strokeWidth={1.5} />
                        </div>
                        <div>
                          <div className="font-semibold text-[13.5px]">Усвоено препаратов</div>
                          <div className={`text-[11.5px] ${ui.muted}`}>В активном режиме</div>
                        </div>
                      </div>
                      <span className="font-mono font-semibold tabular-nums text-[13.5px]">
                        {masteredCount} / {totalVisibleSlides}
                      </span>
                    </div>

                    {/* Сброс прогресса */}
                    <div className="p-3.5">
                      {confirmReset ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMasteredIds([]);
                              setMistakeIds([]);
                              setConfirmReset(false);
                              showToast('Прогресс сброшен');
                            }}
                            className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-medium text-[12px]"
                          >
                            Сбросить прогресс
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmReset(false)}
                            className={`px-3 py-2 rounded-xl text-[12px] font-medium ${ui.subCard}`}
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmReset(true)}
                          className="w-full py-2 rounded-xl text-rose-500 font-medium text-[12.5px] flex items-center justify-center gap-1.5 transition active:opacity-75"
                        >
                          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Сбросить данные прогресса</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== BOTTOM DOCK NAVIGATION ==================== */}
        {!hideDock && !selectedSection && (
          <div className="fixed bottom-0 left-0 right-0 z-30 pb-4 pt-1 flex justify-center pointer-events-none">
            <nav
              className={`pointer-events-auto p-1 rounded-full w-[92vw] max-w-[390px] relative border backdrop-blur-xl ${
                isDark
                  ? 'bg-[#131316]/85 border-white/[0.08] shadow-2xl'
                  : 'bg-white/85 border-black/[0.07] shadow-lg'
              }`}
            >
              {/* Sliding Active Pill */}
              <m.div
                layoutId="dock-pill-indicator"
                transition={IOS_SPRING}
                className="absolute top-1 bottom-1 rounded-full pointer-events-none z-0"
                style={{
                  width: `calc((100% - 8px) / ${dockTabs.length})`,
                  left: `calc(4px + ${Math.max(0, activeDockIndex)} * ((100% - 8px) / ${dockTabs.length}))`,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                }}
              />

              <div className={`grid ${dockTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'} relative z-10`}>
                {dockTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setActiveTab(tab.id);
                      }}
                      className={`py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${
                        isActive
                          ? isDark
                            ? 'text-white'
                            : 'text-zinc-900'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      aria-label={tab.label}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} style={isActive ? { color: activeAccentHex } : undefined} />
                      <span className="text-[10px] font-medium tracking-tight truncate max-w-full">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        )}

        {/* ==================== GLOBAL SEARCH MODAL ==================== */}
        <BottomSheet
          isOpen={isSearchOpen}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchQuery('');
          }}
          title="Поиск по базе"
          isDark={isDark}
        >
          <div className="space-y-3">
            <div className={`rounded-[14px] px-3.5 py-2.5 flex items-center gap-2 border ${ui.card}`}>
              <Search className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Препарат, ткань, орган, ЭМ..."
                className="w-full bg-transparent text-[13px] outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {!searchQuery.trim() ? (
                <p className={`text-center py-6 text-[12px] ${ui.muted}`}>
                  Введите название препарата, органа или термин
                </p>
              ) : (
                <>
                  {globalSearchResults.slides.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setActiveMicroscopeSlide(s);
                      }}
                      className={`w-full p-3 rounded-[14px] text-left border flex items-center gap-2.5 ${ui.cardInteractive}`}
                    >
                      <Microscope className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[13px] truncate">{s.title}</div>
                        <div className={`text-[11px] font-mono ${ui.muted}`}>№{s.examNumber} · {s.stain}</div>
                      </div>
                    </button>
                  ))}

                  {globalSearchResults.terms.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSelectedTerm(t);
                      }}
                      className={`w-full p-3 rounded-[14px] text-left border flex items-center gap-2.5 ${ui.cardInteractive}`}
                    >
                      <BookOpen className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[13px]" style={{ color: activeAccentHex }}>{t.term}</div>
                        <div className={`text-[11.5px] truncate ${ui.muted}`}>{t.definition}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </BottomSheet>

        {/* ==================== SDO TESTS SHEET ==================== */}
        <BottomSheet
          isOpen={showSdoSheet}
          onClose={() => setShowSdoSheet(false)}
          title="Тесты СДО кафедры"
          isDark={isDark}
        >
          <div className="space-y-3 py-2 text-center">
            <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${activeAccentHex}1A`, color: activeAccentHex }}>
              <FileText className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h4 className="text-[14.5px] font-semibold">База тестов СДО</h4>
            <p className={`text-[12.5px] max-w-xs mx-auto leading-relaxed ${ui.muted}`}>
              Слот зарезервирован под 1 294 официальных задания СДО кафедры гистологии НГМУ. Тестовый тренажёр будет активирован в следующем релизе.
            </p>
          </div>
        </BottomSheet>

        {/* ==================== 55 SITUATIONAL TASKS SHEET ==================== */}
        <BottomSheet
          isOpen={showTasksSheet}
          onClose={() => setShowTasksSheet(false)}
          title="Ситуационные задачи"
          isDark={isDark}
        >
          <div className="space-y-3 py-2 text-center">
            <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${activeAccentHex}1A`, color: activeAccentHex }}>
              <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h4 className="text-[14.5px] font-semibold">55 экзаменационных задач</h4>
            <p className={`text-[12.5px] max-w-xs mx-auto leading-relaxed ${ui.muted}`}>
              Полный банк 55 экзаменационных задач кафедры гистологии НГМУ. Задачи интегрированы в Симулятор экзамена и привязаны к соответствующим темам конспектов.
            </p>
          </div>
        </BottomSheet>

        {/* ==================== FAVORITES SHEET ==================== */}
        <BottomSheet
          isOpen={showFavoritesSheet}
          onClose={() => setShowFavoritesSheet(false)}
          title="Избранные препараты"
          isDark={isDark}
        >
          <div className="space-y-2 py-1">
            {favoriteSlides.length === 0 ? (
              <p className={`text-center py-6 text-[12px] ${ui.muted}`}>
                В избранном пока нет препаратов. Нажимайте на флажок внутри карточки, чтобы сохранить.
              </p>
            ) : (
              favoriteSlides.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setShowFavoritesSheet(false);
                    setActiveMicroscopeSlide(s);
                  }}
                  className={`w-full p-2.5 rounded-[14px] text-left border flex items-center gap-2.5 ${ui.cardInteractive}`}
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-black flex items-center justify-center">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <Microscope className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[13px] truncate">{s.title}</div>
                    <div className={`text-[11px] font-mono ${ui.muted}`}>№{s.examNumber} · {s.stain}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </BottomSheet>

        {/* ==================== APPEARANCE SHEET ==================== */}
        <BottomSheet
          isOpen={showAppearanceSheet}
          onClose={() => setShowAppearanceSheet(false)}
          title="Оформление"
          isDark={isDark}
        >
          <div className="space-y-4 py-1">
            {/* Выбор темы */}
            <div className="space-y-1.5">
              <span className={`text-[11px] font-medium uppercase tracking-wide ${ui.subtle}`}>
                Тема оформления:
              </span>
              <div className="grid grid-cols-3 gap-2">
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
                      type="button"
                      onClick={() => setThemeMode(item.id)}
                      className={`p-2.5 rounded-[14px] text-center border flex flex-col items-center justify-center gap-1 transition ${
                        isSelected
                          ? 'border-white text-white bg-white/10'
                          : ui.subCard
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                      <span className="text-[11px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Выбор акцентного цвета */}
            <div className="space-y-1.5">
              <span className={`text-[11px] font-medium uppercase tracking-wide ${ui.subtle}`}>
                Цветовой акцент:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_ACCENTS.map((item) => {
                  const isSelected = accentId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAccentId(item.id)}
                      className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium flex items-center gap-2 border transition ${
                        isSelected ? 'border-white text-white' : ui.subCard
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: isDark ? item.darkHex : item.lightHex }}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <label
                  className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium flex items-center gap-2 border cursor-pointer transition ${
                    accentId === 'custom' ? 'border-white text-white' : ui.subCard
                  }`}
                >
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      setAccentId('custom');
                    }}
                    className="w-3.5 h-3.5 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                  />
                  <span>Свой</span>
                </label>
              </div>
            </div>
          </div>
        </BottomSheet>

        {/* ==================== GLOSSARY TERM DEFINITION SHEET ==================== */}
        <BottomSheet
          isOpen={Boolean(selectedTerm)}
          onClose={() => setSelectedTerm(null)}
          title={selectedTerm?.term || 'Термин'}
          isDark={isDark}
        >
          {selectedTerm && (
            <div className="space-y-3 py-1 text-[13px]">
              {selectedTerm.latin && (
                <div className={`text-[12px] font-mono italic ${ui.subtle}`}>
                  {selectedTerm.latin}
                </div>
              )}

              <div className="space-y-1">
                <span className={`text-[11px] font-medium uppercase tracking-wide ${ui.subtle}`}>
                  Определение:
                </span>
                <p className={`leading-relaxed ${ui.muted}`}>{selectedTerm.definition}</p>
              </div>

              {selectedTerm.examNote && (
                <div className={`p-3 rounded-[14px] border space-y-1 ${ui.subCard}`}>
                  <span className="text-[11px] font-semibold" style={{ color: activeAccentHex }}>
                    Важно на экзамене:
                  </span>
                  <p className={`text-[12px] leading-relaxed ${ui.muted}`}>
                    {selectedTerm.examNote}
                  </p>
                </div>
              )}
            </div>
          )}
        </BottomSheet>

        {/* ==================== EXAM SIMULATOR MODAL ==================== */}
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

        {/* ==================== QUIZ (SPEEDRUN) OVERLAY ==================== */}
        {quizState && (
          <div className="fixed inset-0 z-50 bg-[#09090B] text-white flex flex-col select-none">
            <div
              style={{ paddingTop: `${topInsetPx}px` }}
              className="px-4 pb-2.5 flex items-center justify-between gap-3 border-b border-white/[0.08]"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-mono text-zinc-400">{quizState.title}</div>
                <div className="text-[14px] font-semibold truncate">
                  {quizState.isFinished
                    ? 'Тестирование завершено'
                    : `Препарат ${quizState.index + 1} из ${quizState.slides.length}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuizState(null)}
                className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0 active:scale-95 transition"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full flex flex-col justify-between">
              {quizState.isFinished ? (
                <div className="my-auto text-center space-y-4 py-8">
                  <div
                    style={{ backgroundColor: `${activeAccentHex}1A`, color: activeAccentHex }}
                    className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold">Тестирование завершено</h3>
                    <p className="text-[13px] text-zinc-400 mt-1 tabular-nums font-mono">
                      Верно распознано: {quizState.correctCount} из {quizState.slides.length} препаратов
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuizState(null)}
                    style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                    className="w-full py-2.5 rounded-[14px] font-semibold text-[13px] shadow-sm"
                  >
                    Завершить
                  </button>
                </div>
              ) : (
                <>
                  {(() => {
                    const currentSlide = quizState.slides[quizState.index];
                    const isFav = favoriteIds.includes(currentSlide.id);
                    return (
                      <div className="space-y-4">
                        <div className="relative w-full h-[32vh] rounded-[20px] overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                          {currentSlide.imageUrl ? (
                            <img
                              src={currentSlide.imageUrl}
                              alt={currentSlide.title}
                              className="w-full h-full object-cover select-none"
                            />
                          ) : (
                            <Microscope className="w-8 h-8 text-zinc-500" strokeWidth={1.5} />
                          )}
                          {currentSlide.stain && (
                            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                              {currentSlide.stain}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleFavorite(currentSlide.id)}
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/10 active:scale-95 transition"
                            aria-label="В избранное"
                          >
                            <Bookmark
                              className="w-4 h-4"
                              style={isFav ? { fill: activeAccentHex, color: activeAccentHex } : undefined}
                              strokeWidth={1.5}
                            />
                          </button>
                        </div>

                        {!quizState.showAnswer ? (
                          <div className="text-center py-4 space-y-3">
                            <p className="text-[12.5px] text-zinc-400">
                              Вспомните ткань, слои и ключевые диагностические признаки.
                            </p>
                            <button
                              type="button"
                              onClick={() => setQuizState({ ...quizState, showAnswer: true })}
                              style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                              className="w-full py-2.5 rounded-[14px] font-semibold text-[13px] shadow-sm transition active:scale-[0.98]"
                            >
                              Показать ответ
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-3.5 rounded-[16px] bg-white/[0.04] border border-white/10 space-y-1">
                              <span className="text-[10.5px] font-mono text-zinc-400">
                                Препарат №{currentSlide.examNumber}
                              </span>
                              <div className="text-[15px] font-semibold text-white">
                                {currentSlide.title}
                              </div>
                            </div>

                            {(currentSlide.killerFeature || currentSlide.examPlan?.killerFeature) && (
                              <div className="p-3 rounded-[14px] bg-amber-500/10 border border-amber-500/25 space-y-0.5">
                                <span className="text-[11px] font-semibold text-amber-400">
                                  Ключевой признак:
                                </span>
                                <p className="text-[12px] text-zinc-200">
                                  {currentSlide.killerFeature || currentSlide.examPlan?.killerFeature}
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => handleQuizAnswer(false)}
                                className="py-2.5 rounded-[14px] bg-rose-500/15 border border-rose-500/30 text-rose-400 font-semibold text-[13px] transition active:scale-95"
                              >
                                Ошибка
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuizAnswer(true)}
                                className="py-2.5 rounded-[14px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[13px] transition active:scale-95"
                              >
                                Верно
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {/* ==================== MICROSCOPE VIEWER MODAL ==================== */}
        {activeMicroscopeSlide && (
          <Suspense fallback={null}>
            <MicroscopeViewerModal
              slide={activeMicroscopeSlide}
              onClose={() => setActiveMicroscopeSlide(null)}
              onStartTest={(s) => {
                setActiveMicroscopeSlide(null);
                startQuiz([s], `Тест: ${s.title}`);
              }}
              accentHex={activeAccentHex}
              accentTextColor={accentTextColor}
              topInsetPx={topInsetPx}
              isDark={isDark}
            />
          </Suspense>
        )}

        {/* Toast message */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-[#131316] text-white text-[12px] font-medium border border-white/10 shadow-lg pointer-events-none">
            {toastMessage}
          </div>
        )}
      </div>
    </LazyMotion>
  );
}

export default App;
