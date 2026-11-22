import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { LazyMotion, domMax, m, AnimatePresence } from 'framer-motion';
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
import { SituationalTasksModal } from './components/SituationalTasksModal';
import { IOS_SPRING } from './utils/motion';
import { getReadableAccent, hexWithAlpha } from './utils/colorContrast';

const MicroscopeViewerModal = React.lazy(() => import('./components/MicroscopeViewerModal'));
const TheoryReaderView = React.lazy(() =>
  import('./components/TheoryReaderView').then((mod) => ({ default: mod.TheoryReaderView }))
);

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTg = () => (window as any).Telegram?.WebApp;

type ThemeMode = 'dark' | 'light' | 'system';
type AccentId = 'mono' | 'mint' | 'blue' | 'pink' | 'violet' | 'custom';
type TabId = 'home' | 'em' | 'tickets' | 'glossary' | 'profile';

const PRESET_ACCENTS: { id: Exclude<AccentId, 'custom'>; label: string; darkHex: string; lightHex: string }[] = [
  { id: 'mono', label: 'Монохром', darkHex: '#F4F4F5', lightHex: '#18181B' },
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

function readStoredIds(key: string): string[] {
  try {
    const parsed = JSON.parse(safeGetItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return `${n} ${forms[2]}`;
  if (n1 > 1 && n1 < 5) return `${n} ${forms[1]}`;
  if (n1 === 1) return `${n} ${forms[0]}`;
  return `${n} ${forms[2]}`;
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  // Стек экранов Главной
  const [selectedSection, setSelectedSection] = useState<TheorySection | null>(null);
  const [activeLessonTopic, setActiveLessonTopic] = useState<TheoryTopic | null>(null);

  // Режим подготовки (diag_1..4 / exam)
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
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>(() =>
    readStoredIds('baza_completed_topics')
  );

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
  const readableAccent = useMemo(
    () => getReadableAccent(activeAccentHex, isDark),
    [activeAccentHex, isDark]
  );
  const accentSoftBg = useMemo(
    () => hexWithAlpha(readableAccent, isDark ? 0.14 : 0.1),
    [readableAccent, isDark]
  );

  const tgUser = getTg()?.initDataUnsafe?.user;
  const userName = tgUser?.first_name || 'Студент';
  const userHandle = tgUser?.username ? `@${tgUser.username}` : 'Учебный профиль';
  const userInitial = (userName?.[0] || 'Б').toUpperCase();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const tg = getTg();
    tg?.HapticFeedback?.notificationOccurred?.('success');
    window.setTimeout(() => setToastMessage(null), 2400);
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
        (tg?.initData ? 44 : 14);
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

  // Синхронизация темы с document.body и шапкой Telegram
  useEffect(() => {
    safeSetItem('baza_theme_mode', themeMode);
    const pageBgHex = isDark ? '#09090B' : '#F4F4F6';
    const pageTextHex = isDark ? '#F4F4F5' : '#18181B';

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.body.style.backgroundColor = pageBgHex;
    document.body.style.color = pageTextHex;

    const tg = getTg();
    if (tg) {
      try {
        tg.setHeaderColor?.(pageBgHex);
        tg.setBackgroundColor?.(pageBgHex);
      } catch {
        // ignore
      }
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

  // ВСЕ хуки строго ВЫШЕ любых условных return (соблюдение Rules of Hooks)
  const activeSectionObj = useMemo(() => {
    if (!activeLessonTopic) return selectedSection;
    return (
      visibleTheorySections.find((s) => s.id === activeLessonTopic.sectionId) ||
      THEORY_SECTIONS.find((s) => s.id === activeLessonTopic.sectionId) ||
      selectedSection
    );
  }, [activeLessonTopic, selectedSection, visibleTheorySections]);

  const nextLessonTopic = useMemo(() => {
    if (!activeLessonTopic || !activeSectionObj) return null;
    const topics = activeSectionObj.topics;
    const currentIdx = topics.findIndex((t) => t.id === activeLessonTopic.id);
    if (currentIdx >= 0 && currentIdx < topics.length - 1) {
      return topics[currentIdx + 1];
    }
    return null;
  }, [activeLessonTopic, activeSectionObj]);

  const activeLessonSlides = useMemo(() => {
    if (!activeLessonTopic?.relatedSlideIds) return [];
    return activeLessonTopic.relatedSlideIds
      .map((id) => EXAM_SLIDES.find((s) => s.id === id))
      .filter((s): s is HistSlide => Boolean(s));
  }, [activeLessonTopic]);

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

  const filteredTickets = useMemo(() => {
    if (ticketBlockFilter === 'Все') return EXAM_TICKETS;
    return EXAM_TICKETS.filter((t) => t.block === ticketBlockFilter);
  }, [ticketBlockFilter]);

  // Единый стек системной кнопки Назад Telegram
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
      (showGoalHub && Boolean(studyMode));

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

  const masteredCount = visibleSlides.filter((s) => masteredIds.includes(s.id)).length;
  const totalVisibleSlides = visibleSlides.length;
  const readinessPct = totalVisibleSlides > 0 ? Math.round((masteredCount / totalVisibleSlides) * 100) : 0;

  const favoriteSlides = visibleSlides.filter((s) => favoriteIds.includes(s.id));
  const mistakeSlides = visibleSlides.filter((s) => mistakeIds.includes(s.id));

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

  const toggleTopicCompleted = (topicId: string) => {
    haptic('medium');
    setCompletedTopicIds((prev) => {
      const next = prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId];
      safeSetItem('baza_completed_topics', JSON.stringify(next));
      showToast(next.includes(topicId) ? 'Тема отмечена изученной' : 'Отметка снята');
      return next;
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
      showToast('Неотработанных ошибок нет');
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
      showToast(`Билет дня · №${randomTicket.number}`);
    }
  };

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

  const ui = {
    bg: isDark ? 'bg-[#09090B] text-[#F4F4F5]' : 'bg-[#F4F4F6] text-[#18181B]',
    card: isDark
      ? 'bg-[#131316] border border-white/[0.08]'
      : 'bg-white border border-black/[0.07]',
    cardInteractive: isDark
      ? 'bg-[#131316] border border-white/[0.08] active:bg-[#1C1C21]'
      : 'bg-white border border-black/[0.07] active:bg-zinc-50',
    subCard: isDark
      ? 'bg-white/[0.04] border border-white/[0.08] text-zinc-200'
      : 'bg-[#ECEEF2] border border-black/[0.06] text-zinc-800',
    muted: isDark ? 'text-zinc-400' : 'text-zinc-600',
    subtle: isDark ? 'text-zinc-500' : 'text-zinc-500',
    divider: isDark ? 'divide-white/[0.08]' : 'divide-black/[0.07]',
    border: isDark ? 'border-white/[0.08]' : 'border-black/[0.07]',
    iconCircle: isDark ? 'bg-white/[0.06] text-zinc-200' : 'bg-zinc-100 text-zinc-700',
    track: isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]',
  };

  const themeModeLabel =
    themeMode === 'system' ? 'Системная' : themeMode === 'dark' ? 'Тёмная' : 'Светлая';

  // Теперь ранний возврат безопасен: все хуки вызваны выше
  if (studyMode === null || showGoalHub) {
    return (
      <GoalHubView
        currentMode={studyMode}
        onSelectMode={handleSelectStudyMode}
        onClose={studyMode ? () => setShowGoalHub(false) : undefined}
        diagProgress={diagProgress}
        examProgress={examProgress}
        isDark={isDark}
        accentHex={activeAccentHex}
        textOnAccent={accentTextColor}
        topInsetPx={topInsetPx}
      />
    );
  }

  const hideDock = Boolean(activeLessonTopic || activeMicroscopeSlide || quizState || selectedSection || showTasksSheet);
  const selectedTermNote =
    selectedTerm?.examNote || (selectedTerm as { examTrap?: string } | null)?.examTrap;

  return (
    <LazyMotion features={domMax} strict>
      <div
        className={`min-h-screen ${ui.bg} transition-colors duration-200 font-sans select-none flex flex-col justify-between overflow-x-hidden`}
      >
        {/* ==================== ЭКРАН 3: ЧИТАЛКА КОНСПЕКТА ==================== */}
        <AnimatePresence>
          {activeLessonTopic && (
            <Suspense fallback={null}>
              <TheoryReaderView
                topic={activeLessonTopic}
                sectionTitle={activeSectionObj?.title}
                relatedSlides={activeLessonSlides}
                nextTopic={nextLessonTopic}
                isCompleted={completedTopicIds.includes(activeLessonTopic.id)}
                onToggleCompleted={toggleTopicCompleted}
                onSelectTerm={setSelectedTerm}
                onOpenQuestion={(qNum) => {
                  setActiveLessonTopic(null);
                  setSelectedSection(null);
                  setActiveTab('tickets');
                  const t = EXAM_TICKETS.find((tick) => tick.number === qNum);
                  if (t) setExpandedTicketId(t.id);
                }}
                onOpenSlide={(slide) => setActiveMicroscopeSlide(slide)}
                onOpenNextTopic={(next) => setActiveLessonTopic(next)}
                onClose={() => setActiveLessonTopic(null)}
                isDark={isDark}
                accentHex={activeAccentHex}
                textOnAccent={accentTextColor}
                topInsetPx={topInsetPx}
              />
            </Suspense>
          )}
        </AnimatePresence>

        {/* ==================== ЭКРАН 2: СТРАНИЦА РАЗДЕЛА ==================== */}
        {!activeLessonTopic && selectedSection && (
          <SectionPageView
            section={selectedSection}
            topics={selectedSection.topics}
            slides={getSectionSlides(selectedSection)}
            electronograms={getSectionEms(selectedSection)}
            favoriteIds={favoriteIds}
            masteredIds={masteredIds}
            completedTopicIds={completedTopicIds}
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

        {/* ==================== ЭКРАН 1: ГЛАВНАЯ И ВКЛАДКИ ДОКА ==================== */}
        {!activeLessonTopic && !selectedSection && (
          <div className="flex-1 pb-28">
            <div style={{ paddingTop: `${topInsetPx}px` }} className="max-w-md mx-auto px-4 space-y-5">
              {/* TAB 1: ГЛАВНАЯ */}
              {activeTab === 'home' && (
                <div className="space-y-4">
                  {/* Шапка */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                        className="w-9 h-9 rounded-full font-semibold text-[13px] flex items-center justify-center transition-transform active:scale-95"
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
                        className={`px-3 h-9 rounded-full border flex items-center gap-2 text-[13px] font-medium transition-transform active:scale-95 ${ui.cardInteractive}`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: readableAccent }}
                        />
                        <span>{getModeLabel(studyMode)}</span>
                        <ChevronDown className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setIsSearchOpen(true);
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 ${ui.cardInteractive}`}
                      aria-label="Поиск"
                    >
                      <Search className={`w-4 h-4 ${ui.muted}`} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Готовность */}
                  <div className={`rounded-2xl p-4 space-y-3 ${ui.card}`}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className={ui.muted}>
                        {isDiagnosticMode ? `Готовность · ${getModeLabel(studyMode)}` : 'Готовность к экзамену'}
                      </span>
                      <span className="font-mono font-medium tabular-nums text-[13px]">
                        {masteredCount} / {totalVisibleSlides}
                      </span>
                    </div>

                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${ui.track}`}>
                      <div
                        className="h-full rounded-full transition-transform duration-300 origin-left"
                        style={{
                          width: '100%',
                          transform: `scaleX(${readinessPct / 100})`,
                          backgroundColor: readableAccent,
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
                          className={`relative rounded-2xl py-3 px-1 flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 ${ui.cardInteractive}`}
                        >
                          {item.badge !== null && (
                            <span
                              style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                              className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold flex items-center justify-center tabular-nums"
                            >
                              {item.badge}
                            </span>
                          )}
                          <Icon className={`w-4 h-4 ${ui.muted}`} strokeWidth={1.5} />
                          <span className="text-[11px] font-medium truncate max-w-full">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Главная карточка тренировки */}
                  {isDiagnosticMode ? (
                    <div className={`rounded-2xl p-4 space-y-3 ${ui.card}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" strokeWidth={1.5} style={{ color: readableAccent }} />
                          <h2 className="font-semibold text-[15px] tracking-tight">Слепые стёкла</h2>
                        </div>
                        <span className={`text-[12px] font-mono tabular-nums ${ui.subtle}`}>
                          {pluralRu(visibleSlides.length, ['препарат', 'препарата', 'препаратов'])}
                        </span>
                      </div>
                      <p className={`text-[13px] leading-relaxed ${ui.muted}`}>
                        Опознание срезов для {getModeLabel(studyMode)}: ткань, слои, окраска и главные признаки.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          startQuiz(shuffleArray(visibleSlides), `Слепые стёкла · ${getModeLabel(studyMode)}`)
                        }
                        style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                        className="w-full h-11 rounded-xl font-medium text-[14px] transition-transform active:scale-[0.98]"
                      >
                        Начать тренировку
                      </button>
                    </div>
                  ) : (
                    <div className={`rounded-2xl p-4 space-y-3 ${ui.card}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" strokeWidth={1.5} style={{ color: readableAccent }} />
                          <h2 className="font-semibold text-[15px] tracking-tight">Симулятор экзамена</h2>
                        </div>
                        <span className={`text-[12px] ${ui.subtle}`}>Регламент НГМУ</span>
                      </div>
                      <p className={`text-[13px] leading-relaxed ${ui.muted}`}>
                        Случайный билет: 3 вопроса теории, 1 задача, 2 слепых стекла и 1 электроннограмма.
                      </p>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            haptic('medium');
                            setShowExamSimulator(true);
                          }}
                          style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                          className="w-full h-11 rounded-xl font-medium text-[14px] transition-transform active:scale-[0.98]"
                        >
                          Тянуть билет
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const random15 = shuffleArray(EXAM_SLIDES).slice(0, 15);
                            startQuiz(random15, 'Слепые стёкла · 15 случайных');
                          }}
                          className={`w-full h-10 rounded-xl font-medium text-[13px] transition-transform active:scale-[0.98] ${ui.subCard}`}
                        >
                          15 случайных препаратов
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Разделы курса */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between px-1">
                      <span className="font-semibold text-[15px] tracking-tight">Разделы</span>
                      <span className={`text-[12px] font-mono tabular-nums ${ui.subtle}`}>
                        {pluralRu(visibleTheorySections.length, ['раздел', 'раздела', 'разделов'])}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {visibleTheorySections.map((sec, secIdx) => {
                        const secSlides = getSectionSlides(sec);
                        const doneTopics = sec.topics.filter((t) =>
                          completedTopicIds.includes(t.id)
                        ).length;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              haptic('light');
                              setSelectedSection(sec);
                            }}
                            className={`w-full p-4 rounded-2xl text-left flex items-center justify-between gap-3 transition-transform active:scale-[0.98] ${ui.cardInteractive}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-mono text-[12px] font-semibold tabular-nums"
                                style={{
                                  backgroundColor: accentSoftBg,
                                  color: readableAccent,
                                }}
                              >
                                {sec.order || secIdx + 1}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-[14px] leading-snug tracking-tight truncate">
                                  {sec.title}
                                </h3>
                                <p className={`text-[12px] tabular-nums ${ui.muted} mt-0.5`}>
                                  {pluralRu(sec.topics.length, ['тема', 'темы', 'тем'])}
                                  {secSlides.length > 0
                                    ? ` · ${pluralRu(secSlides.length, ['препарат', 'препарата', 'препаратов'])}`
                                    : ''}
                                  {doneTopics > 0 ? ` · ${doneTopics} изучено` : ''}
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
                    <p className={`text-[13px] ${ui.muted} mt-1`}>
                      {isDiagnosticMode
                        ? `Схемы для ${getModeLabel(studyMode)}`
                        : 'Ультраструктура клеток, барьеров и органелл'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {visibleElectronograms.map((em) => {
                      const isOpen = expandedEmId === em.id;
                      return (
                        <div key={em.id} className={`rounded-2xl overflow-hidden ${ui.card}`}>
                          <button
                            type="button"
                            onClick={() => {
                              haptic('light');
                              setExpandedEmId(isOpen ? null : em.id);
                            }}
                            className="w-full p-4 flex items-center justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md font-medium"
                                  style={{ backgroundColor: accentSoftBg, color: readableAccent }}
                                >
                                  ЭМ №{em.number}
                                </span>
                                <span className={`text-[12px] truncate ${ui.subtle}`}>{em.topic}</span>
                              </div>
                              <h2 className="font-semibold text-[14px] leading-snug">{em.title}</h2>
                            </div>
                            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${ui.subtle}`} strokeWidth={1.5} />
                          </button>

                          {isOpen && (
                            <div className={`px-4 pb-4 pt-3 space-y-3 border-t ${ui.border}`}>
                              {em.imageUrl && (
                                <img
                                  src={em.imageUrl}
                                  alt={em.title}
                                  className="w-full h-40 rounded-xl object-cover border border-white/10"
                                  loading="lazy"
                                />
                              )}

                              {em.keyFeature && (
                                <div
                                  className={`relative overflow-hidden p-3 pl-4 rounded-xl space-y-1 ${ui.subCard}`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className="absolute inset-y-0 left-0 w-[3px]"
                                    style={{ backgroundColor: readableAccent }}
                                  />
                                  <div className="text-[12px] font-semibold" style={{ color: readableAccent }}>
                                    Ключевой ультраструктурный признак
                                  </div>
                                  <p className={`text-[13px] leading-relaxed ${ui.muted}`}>
                                    {em.keyFeature}
                                  </p>
                                </div>
                              )}

                              <div className={`text-[13px] leading-relaxed ${ui.muted}`}>
                                <RichGlossaryText text={em.description} accentHex={readableAccent} onSelectTerm={setSelectedTerm} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: БИЛЕТЫ */}
              {activeTab === 'tickets' && !isDiagnosticMode && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h1 className="text-[22px] font-semibold tracking-tight leading-tight">Билеты</h1>
                      <p className={`text-[13px] ${ui.muted} mt-1 tabular-nums`}>
                        {EXAM_TICKETS.length} экзаменационных вопросов
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openTicketOfTheDay}
                      style={{ backgroundColor: accentSoftBg, color: readableAccent }}
                      className="px-3 h-9 rounded-xl font-medium text-[12px] flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      <Shuffle className="w-3.5 h-3.5" strokeWidth={1.5}/>
                      <span>Случайный</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {['Все', 'Цитология', 'Эмбриология', 'Общая гистология', 'Частная гистология'].map(
                      (cat) => {
                        const isSelected = ticketBlockFilter === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setTicketBlockFilter(cat)}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: activeAccentHex,
                                    color: accentTextColor,
                                    borderColor: activeAccentHex,
                                  }
                                : undefined
                            }
                            className={`px-3 py-1.5 rounded-xl text-[12px] font-medium whitespace-nowrap border transition-colors ${
                              isSelected ? '' : ui.subCard
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
                        <div key={ticket.id} className={`rounded-2xl overflow-hidden ${ui.card}`}>
                          <button
                            type="button"
                            onClick={() => {
                              haptic('light');
                              setExpandedTicketId(isOpen ? null : ticket.id);
                            }}
                            className="w-full p-4 flex items-center justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md font-medium"
                                  style={{ backgroundColor: accentSoftBg, color: readableAccent }}
                                >
                                  Билет №{ticket.number}
                                </span>
                                <span className={`text-[12px] truncate ${ui.subtle}`}>{ticket.block}</span>
                              </div>
                              <h2 className="font-semibold text-[14px] leading-snug">{ticket.question}</h2>
                            </div>
                            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${ui.subtle}`} strokeWidth={1.5} />
                          </button>

                          {isOpen && (
                            <div className={`px-4 pb-4 pt-3 space-y-3 border-t ${ui.border}`}>
                              {ticket.keyTip && (
                                <div className={`p-3 rounded-xl text-[13px] leading-snug ${ui.subCard}`}>
                                  <span className="font-semibold" style={{ color: readableAccent }}>
                                    План ответа:{' '}
                                  </span>
                                  <span>{ticket.keyTip}</span>
                                </div>
                              )}

                              <div className={`text-[13px] leading-relaxed whitespace-pre-line ${ui.muted}`}>
                                <RichGlossaryText text={ticket.answer} accentHex={readableAccent} onSelectTerm={setSelectedTerm} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: СЛОВАРЬ */}
              {activeTab === 'glossary' && (
                <div className="space-y-4">
                  <div className="pt-1">
                    <h1 className="text-[22px] font-semibold tracking-tight leading-tight">Словарь</h1>
                    <p className={`text-[13px] ${ui.muted} mt-1`}>
                      Кафедральные определения и пояснения к экзамену
                    </p>
                  </div>

                  <div className={`rounded-2xl px-3.5 h-11 flex items-center gap-2.5 ${ui.card}`}>
                    <Search className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
                    <input
                      type="text"
                      value={glossaryQuery}
                      onChange={(e) => setGlossaryQuery(e.target.value)}
                      placeholder="Поиск"
                      className="w-full bg-transparent text-[14px] outline-none"
                    />
                    {glossaryQuery && (
                      <button type="button" onClick={() => setGlossaryQuery('')} aria-label="Очистить">
                        <X className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {filteredGlossary.map((term) => (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => setSelectedTerm(term)}
                        className={`w-full p-4 rounded-2xl text-left flex items-center justify-between gap-3 transition-transform active:scale-[0.98] ${ui.cardInteractive}`}
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[14px]">{term.term}</span>
                            {term.latin && (
                              <span className={`text-[12px] font-mono truncate ${ui.subtle}`}>
                                {term.latin}
                              </span>
                            )}
                          </div>
                          <p className={`text-[13px] line-clamp-1 ${ui.muted}`}>{term.definition}</p>
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
                      className="w-16 h-16 rounded-full font-semibold text-[22px] flex items-center justify-center"
                    >
                      {userInitial}
                    </div>
                    <h2 className="text-[17px] font-semibold mt-3">{userName}</h2>
                    <p className={`text-[13px] ${ui.muted}`}>{userHandle}</p>
                  </div>

                  <div className={`rounded-2xl overflow-hidden divide-y ${ui.card} ${ui.divider}`}>
                    <button
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setShowGoalHub(true);
                      }}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left transition-opacity active:opacity-75"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${ui.iconCircle}`}>
                          <GraduationCap className="w-4 h-4" strokeWidth={1.5}/>
                        </div>
                        <div>
                          <div className="font-medium text-[14px]">Режим подготовки</div>
                          <div className={`text-[12px] ${ui.muted}`}>{getModeLabel(studyMode)}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setShowAppearanceSheet(true);
                      }}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left transition-opacity active:opacity-75"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${ui.iconCircle}`}>
                          <Palette className="w-4 h-4" strokeWidth={1.5}/>
                        </div>
                        <div>
                          <div className="font-medium text-[14px]">Оформление</div>
                          <div className={`text-[12px] ${ui.muted}`}>{themeModeLabel}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: activeAccentHex }}
                          className={`w-3.5 h-3.5 rounded-full border ${ui.border}`}
                        />
                        <ChevronRight className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
                      </div>
                    </button>

                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${ui.iconCircle}`}>
                          <Award className="w-4 h-4" strokeWidth={1.5}/>
                        </div>
                        <div>
                          <div className="font-medium text-[14px]">Усвоено препаратов</div>
                          <div className={`text-[12px] ${ui.muted}`}>В активном режиме</div>
                        </div>
                      </div>
                      <span className="font-mono font-medium tabular-nums text-[14px]">
                        {masteredCount} / {totalVisibleSlides}
                      </span>
                    </div>

                    <div className="p-4">
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
                            className="flex-1 h-10 rounded-xl bg-rose-600 text-white font-medium text-[13px]"
                          >
                            Сбросить прогресс
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmReset(false)}
                            className={`px-4 h-10 rounded-xl text-[13px] font-medium ${ui.subCard}`}
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmReset(true)}
                          className="w-full h-10 rounded-xl text-rose-500 font-medium text-[13px] flex items-center justify-center gap-2 transition-opacity active:opacity-75"
                        >
                          <RotateCcw className="w-4 h-4" strokeWidth={1.5}/>
                          <span>Сбросить прогресс</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== НИЖНИЙ ДОК НАВИГАЦИИ ==================== */}
        {!hideDock && (
          <div className="fixed bottom-0 left-0 right-0 z-30 pb-4 pt-1 flex justify-center pointer-events-none">
            <nav
              className={`pointer-events-auto p-1 rounded-2xl w-[92vw] max-w-[390px] border backdrop-blur-xl ${
                isDark
                  ? 'bg-[#131316]/90 border-white/[0.08] shadow-2xl'
                  : 'bg-white/92 border-black/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
              }`}
            >
              <div className={`grid ${dockTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
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
                      className={`relative py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                        isActive
                          ? isDark
                            ? 'text-white'
                            : 'text-[#18181B]'
                          : ui.subtle
                      }`}
                      aria-label={tab.label}
                    >
                      {isActive && (
                        <m.span
                          layoutId="dock-pill-indicator"
                          transition={IOS_SPRING}
                          className={`absolute inset-0 rounded-xl ${
                            isDark ? 'bg-white/[0.10]' : 'bg-black/[0.06]'
                          }`}
                        />
                      )}
                      <Icon className="w-4 h-4 relative z-10" strokeWidth={1.5} style={isActive ? { color: readableAccent } : undefined} />
                      <span className="text-[11px] font-medium relative z-10 truncate max-w-full">
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        )}

        {/* ==================== ШТОРКА ПОИСКА ==================== */}
        <BottomSheet isOpen={isSearchOpen} onClose={() => {
            setIsSearchOpen(false);
            setSearchQuery('');
          }}
          title="Поиск по базе"
          isDark={isDark}
        >
          <div className="space-y-3">
            <div className={`rounded-xl px-3 h-11 flex items-center gap-2 ${ui.subCard}`}>
              <Search className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Препарат, орган, ЭМ или термин"
                className="w-full bg-transparent text-[14px] outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} aria-label="Очистить">
                  <X className={`w-4 h-4 ${ui.subtle}`} strokeWidth={1.5} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {!searchQuery.trim() ? (
                <p className={`text-center py-6 text-[13px] ${ui.muted}`}>
                  Введите название препарата, номер или термин
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
                      className={`w-full p-3 rounded-xl text-left flex items-center gap-3 ${ui.cardInteractive}`}
                    >
                      <Microscope className={`w-4 h-4 shrink-0 ${ui.subtle}`} strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[14px] truncate">{s.title}</div>
                        <div className={`text-[12px] font-mono tabular-nums ${ui.muted}`}>
                          №{s.examNumber} · {s.stain}
                        </div>
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
                      className={`w-full p-3 rounded-xl text-left flex items-center gap-3 ${ui.cardInteractive}`}
                    >
                      <BookOpen className={`w-4 h-4 shrink-0 ${ui.subtle}`} strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[14px]" style={{ color: readableAccent }}>
                          {t.term}
                        </div>
                        <div className={`text-[12px] truncate ${ui.muted}`}>{t.definition}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </BottomSheet>

        {/* ==================== ШТОРКА ТЕСТЫ СДО ==================== */}
        <BottomSheet isOpen={showSdoSheet} onClose={() => setShowSdoSheet(false)}
          title="Тесты СДО"
          isDark={isDark}
        >
          <div className="space-y-3 py-4 text-center">
            <div
              className="w-11 h-11 rounded-2xl mx-auto flex items-center justify-center"
              style={{ backgroundColor: accentSoftBg, color: readableAccent }}
            >
              <FileText className="w-5 h-5" strokeWidth={1.5}/>
            </div>
            <h4 className="text-[15px] font-semibold">База тестов СДО НГМУ</h4>
            <p className={`text-[13px] max-w-xs mx-auto leading-relaxed ${ui.muted}`}>
              Слот подготовлен под 1 294 задания СДО кафедры гистологии. Тренажёр появится в следующем обновлении.
            </p>
          </div>
        </BottomSheet>

        {/* ==================== ЭКРАН 55 ЗАДАЧ ==================== */}
        <AnimatePresence>
          {showTasksSheet && (
            <SituationalTasksModal
              tasks={SITUATIONAL_TASKS}
              isDark={isDark}
              accentHex={activeAccentHex}
              textOnAccent={accentTextColor}
              topInsetPx={topInsetPx}
              onSelectTerm={setSelectedTerm}
              onClose={() => setShowTasksSheet(false)}
            />
          )}
        </AnimatePresence>

        {/* ==================== ШТОРКА ИЗБРАННОЕ ==================== */}
        <BottomSheet isOpen={showFavoritesSheet} onClose={() => setShowFavoritesSheet(false)}
          title="Избранные препараты"
          isDark={isDark}
        >
          <div className="space-y-2 py-1">
            {favoriteSlides.length === 0 ? (
              <p className={`text-center py-6 text-[13px] ${ui.muted}`}>
                В избранном пока пусто. Сохраняйте сложные стёкла флажком во время тренировки.
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
                  className={`w-full p-3 rounded-xl text-left flex items-center gap-3 ${ui.cardInteractive}`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black flex items-center justify-center">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <Microscope className="w-4 h-4 text-zinc-500" strokeWidth={1.5}/>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[14px] truncate">{s.title}</div>
                    <div className={`text-[12px] font-mono tabular-nums ${ui.muted}`}>
                      №{s.examNumber} · {s.stain}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </BottomSheet>

        {/* ==================== ШТОРКА ОФОРМЛЕНИЯ (ПОЧИНЕН КОНТРАСТ В СВЕТЛОЙ ТЕМЕ) ==================== */}
        <BottomSheet isOpen={showAppearanceSheet} onClose={() => setShowAppearanceSheet(false)}
          title="Оформление"
          isDark={isDark}
        >
          <div className="space-y-5 py-1">
            <div className="space-y-2">
              <div className={`text-[12px] font-medium ${ui.muted}`}>Тема оформления</div>
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
                      data-testid={`theme-btn-${item.id}`}
                      data-selected={isSelected ? 'true' : 'false'}
                      onClick={() => {
                        haptic('light');
                        setThemeMode(item.id);
                      }}
                      style={
                        isSelected
                          ? {
                              backgroundColor: hexWithAlpha(readableAccent, isDark ? (accentId === 'mono' ? 0.14 : 0.16) : (accentId === 'mono' ? 0.08 : 0.12)),
                              borderColor: readableAccent,
                              color: isDark ? '#F4F4F5' : '#18181B',
                            }
                          : undefined
                      }
                      className={`p-3 rounded-xl text-center border flex flex-col items-center justify-center gap-1.5 transition-colors ${
                        isSelected ? 'font-semibold' : ui.subCard
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} style={isSelected ? { color: readableAccent } : undefined} />
                      <span className="text-[12px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className={`text-[12px] font-medium ${ui.muted}`}>Цветовой акцент</div>
              <div className="flex flex-wrap gap-2">
                {PRESET_ACCENTS.map((item) => {
                  const isSelected = accentId === item.id;
                  const swatchHex = isDark ? item.darkHex : item.lightHex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`accent-btn-${item.id}`}
                      data-selected={isSelected ? 'true' : 'false'}
                      onClick={() => {
                        haptic('light');
                        setAccentId(item.id);
                      }}
                      style={
                        isSelected
                          ? {
                              backgroundColor: hexWithAlpha(readableAccent, isDark ? (accentId === 'mono' ? 0.14 : 0.16) : (accentId === 'mono' ? 0.08 : 0.12)),
                              borderColor: readableAccent,
                              color: isDark ? '#F4F4F5' : '#18181B',
                            }
                          : undefined
                      }
                      className={`px-3 h-9 rounded-xl text-[12px] font-medium flex items-center gap-2 border transition-colors ${
                        isSelected ? 'font-semibold' : ui.subCard
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: swatchHex }}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <label
                  data-testid="accent-btn-custom"
                  data-selected={accentId === 'custom' ? 'true' : 'false'}
                  style={
                    accentId === 'custom'
                      ? {
                          backgroundColor: hexWithAlpha(readableAccent, isDark ? 0.16 : 0.1),
                          borderColor: readableAccent,
                          color: isDark ? '#F4F4F5' : '#18181B',
                        }
                      : undefined
                  }
                  className={`relative overflow-hidden px-3 h-9 rounded-xl text-[12px] font-medium flex items-center gap-2 border cursor-pointer transition-colors ${
                    accentId === 'custom' ? 'font-semibold' : ui.subCard
                  }`}
                >
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => {
                      setCustomHex(e.target.value);
                      setAccentId('custom');
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 border ${ui.border}`}
                    style={{ backgroundColor: customHex }}
                  />
                  <span>Свой</span>
                </label>
              </div>
            </div>
          </div>
        </BottomSheet>

        {/* ==================== ШТОРКА ТЕРМИНА ==================== */}
        <BottomSheet isOpen={Boolean(selectedTerm)} onClose={() => setSelectedTerm(null)}
          title={selectedTerm?.term || 'Термин'}
          isDark={isDark}
        >
          {selectedTerm && (
            <div className="space-y-3 py-1 text-[14px]">
              {selectedTerm.latin && (
                <div className={`text-[12px] font-mono ${ui.subtle}`}>{selectedTerm.latin}</div>
              )}

              <div className="space-y-1">
                <div className={`text-[12px] font-medium ${ui.subtle}`}>Определение</div>
                <p className={`leading-relaxed ${ui.muted}`}>{selectedTerm.definition}</p>
              </div>

              {selectedTermNote && (
                <div
                  className={`relative overflow-hidden p-3 pl-4 rounded-xl space-y-1 ${ui.subCard}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ backgroundColor: readableAccent }}
                  />
                  <div className="text-[12px] font-semibold" style={{ color: readableAccent }}>
                    Важно на экзамене
                  </div>
                  <p className={`text-[13px] leading-relaxed ${ui.muted}`}>{selectedTermNote}</p>
                </div>
              )}
            </div>
          )}
        </BottomSheet>

        {/* ==================== СИМУЛЯТОР ЭКЗАМЕНА ==================== */}
        {showExamSimulator && (
          <ExamSimulatorModal
            slides={EXAM_SLIDES}
            questions={EXAM_TICKETS}
            tasks={SITUATIONAL_TASKS}
            electronograms={ELECTRONOGRAMS}
            onOpenSlide={(s) => setActiveMicroscopeSlide(s)}
            onClose={() => setShowExamSimulator(false)}
            isDark={isDark}
            accentHex={activeAccentHex}
            textOnAccent={accentTextColor}
            topInsetPx={topInsetPx}
          />
        )}

        {/* ==================== ТРЕНАЖЁР СЛЕПЫХ СТЁКОЛ ==================== */}
        {quizState && (
          <div className="fixed inset-0 z-50 bg-[#09090B] text-white flex flex-col select-none">
            <div
              style={{ paddingTop: `${Math.max(topInsetPx, 12)}px` }}
              className="px-4 pb-3 flex items-center justify-between gap-3 border-b border-white/[0.08]"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-mono text-zinc-400 truncate">{quizState.title}</div>
                <div className="text-[15px] font-semibold truncate">
                  {quizState.isFinished
                    ? 'Тренировка завершена'
                    : `Препарат ${quizState.index + 1} из ${quizState.slides.length}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuizState(null)}
                aria-label="Закрыть тренировку"
                className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" strokeWidth={1.5}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full flex flex-col justify-between">
              {quizState.isFinished ? (
                <div className="my-auto text-center space-y-4 py-8">
                  <div
                    style={{ backgroundColor: hexWithAlpha(getReadableAccent(activeAccentHex, true), 0.16), color: getReadableAccent(activeAccentHex, true) }}
                    className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-8 h-8" strokeWidth={1.5}/>
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold">Готово</h3>
                    <p className="text-[13px] text-zinc-400 mt-1 tabular-nums font-mono">
                      Верно: {quizState.correctCount} из {quizState.slides.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuizState(null)}
                    style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                    className="w-full h-11 rounded-xl font-medium text-[14px]"
                  >
                    Вернуться
                  </button>
                </div>
              ) : (
                (() => {
                  const currentSlide = quizState.slides[quizState.index];
                  const isFav = favoriteIds.includes(currentSlide.id);
                  const darkAccent = getReadableAccent(activeAccentHex, true);
                  return (
                    <div className="space-y-4">
                      <div className="relative w-full h-[34vh] rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                        {currentSlide.imageUrl ? (
                          <img
                            src={currentSlide.imageUrl}
                            alt={currentSlide.title}
                            className="w-full h-full object-cover select-none"
                          />
                        ) : (
                          <Microscope className="w-8 h-8 text-zinc-500" strokeWidth={1.5}/>
                        )}
                        {currentSlide.stain && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                            {currentSlide.stain}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleFavorite(currentSlide.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/65 backdrop-blur-md text-white flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
                          aria-label="В избранное"
                        >
                          <Bookmark className="w-4 h-4" strokeWidth={1.5} style={isFav ? { color: darkAccent, fill: darkAccent } : undefined} />
                        </button>
                      </div>

                      {!quizState.showAnswer ? (
                        <div className="text-center py-4 space-y-3">
                          <p className="text-[13px] text-zinc-400">
                            Назовите препарат, слои и главный признак
                          </p>
                          <button
                            type="button"
                            onClick={() => setQuizState({ ...quizState, showAnswer: true })}
                            style={{ backgroundColor: activeAccentHex, color: accentTextColor }}
                            className="w-full h-11 rounded-xl font-medium text-[14px] transition-transform active:scale-[0.98]"
                          >
                            Показать ответ
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                            <span className="text-[12px] font-mono text-zinc-400 tabular-nums">
                              Препарат №{currentSlide.examNumber}
                            </span>
                            <div className="text-[16px] font-semibold text-white">
                              {currentSlide.title}
                            </div>
                          </div>

                          {(currentSlide.killerFeature || currentSlide.examPlan?.killerFeature) && (
                            <div
                              className="relative overflow-hidden p-3.5 pl-4 rounded-2xl bg-[#1D1810] border border-amber-500/20 space-y-1"
                            >
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-0 left-0 w-[3px]"
                                style={{ backgroundColor: '#F59E0B' }}
                              />
                              <span className="text-[12px] font-semibold text-amber-300">
                                Главный признак
                              </span>
                              <p className="text-[13px] text-zinc-200 leading-relaxed">
                                {currentSlide.killerFeature || currentSlide.examPlan?.killerFeature}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => handleQuizAnswer(false)}
                              className="h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-medium text-[14px] transition-transform active:scale-95"
                            >
                              Ошибка
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuizAnswer(true)}
                              className="h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium text-[14px] transition-transform active:scale-95"
                            >
                              Верно
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* ==================== МИКРОСКОП ==================== */}
        {activeMicroscopeSlide && (
          <Suspense fallback={null}>
            <MicroscopeViewerModal
              slide={activeMicroscopeSlide}
              onClose={() => setActiveMicroscopeSlide(null)}
              onStartTest={(s) => {
                setActiveMicroscopeSlide(null);
                startQuiz([s], `Тест · ${s.title}`);
              }}
              accentHex={activeAccentHex}
              accentTextColor={accentTextColor}
              topInsetPx={topInsetPx}
              isDark={isDark}
            />
          </Suspense>
        )}

        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#131316] text-white text-[13px] font-medium border border-white/10 shadow-lg pointer-events-none">
            {toastMessage}
          </div>
        )}
      </div>
    </LazyMotion>
  );
}

export default App;