import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Search,
  Palette,
  ArrowLeft,
  Eye,
  CheckCircle2,
  BookOpen,
  Microscope,
  Sparkles,
  X,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Moon,
  Sun,
  Check,
  CheckSquare,
  Square,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import {
  MODULES,
  THEORY_BLOCKS,
  EXAM_SLIDES,
  HISTO_GLOSSARY,
  HistSlide,
  HistoModule,
  HistoTerm,
  ELECTRONOGRAMS,
  EXAM_QUESTIONS,
} from './data/histoData';
import { MicroscopeViewerModal } from './components/MicroscopeViewerModal';

export type TabType = 'home' | 'electronograms' | 'tickets' | 'profile';
export type ThemeKey = 'indigo' | 'eosin' | 'hematoxylin' | 'emerald' | 'slate';
export type ColorMode = 'light' | 'dark';

export const THEMES: Record<
  ThemeKey,
  { name: string; primary: string; soft: string; badgeText: string; lightBg: string }
> = {
  indigo: {
    name: 'Индиго (База)',
    primary: '#4F46E5',
    soft: '#EEF2FF',
    badgeText: '#4338CA',
    lightBg: '#E0E7FF',
  },
  eosin: {
    name: 'Эозин (Розовый)',
    primary: '#EC4899',
    soft: '#FDF2F8',
    badgeText: '#BE185D',
    lightBg: '#FCE7F3',
  },
  hematoxylin: {
    name: 'Гематоксилин',
    primary: '#7C3AED',
    soft: '#F5F3FF',
    badgeText: '#6D28D9',
    lightBg: '#EDE9FE',
  },
  emerald: {
    name: 'Изумруд',
    primary: '#10B981',
    soft: '#ECFDF5',
    badgeText: '#047857',
    lightBg: '#D1FAE5',
  },
  slate: {
    name: 'Графит',
    primary: '#0F172A',
    soft: '#F1F5F9',
    badgeText: '#0F172A',
    lightBg: '#E2E8F0',
  },
};

// Helper to highlight interactive medical terms from HISTO_GLOSSARY inside text
function TermHighlightedText({
  text,
  onSelectTerm,
  themeColor,
}: {
  text: string;
  onSelectTerm: (term: HistoTerm) => void;
  themeColor: string;
}) {
  const sortedPairs = useMemo(() => {
    const list: { alias: string; term: HistoTerm }[] = [];
    HISTO_GLOSSARY.forEach((t) => {
      t.aliases.forEach((a) => {
        list.push({ alias: a.toLowerCase(), term: t });
      });
      list.push({ alias: t.term.toLowerCase(), term: t });
    });
    return list.sort((a, b) => b.alias.length - a.alias.length);
  }, []);

  const elements = useMemo(() => {
    if (!text) return text;
    const escaped = sortedPairs.map((p) =>
      p.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const lower = part.toLowerCase();
      const match = sortedPairs.find((p) => p.alias === lower);
      if (match) {
        return (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTerm(match.term);
            }}
            style={{ textDecorationColor: themeColor }}
            className="inline font-bold underline decoration-dotted decoration-2 underline-offset-3 text-slate-900 dark:text-white bg-black/[0.04] dark:bg-white/[0.08] px-1 py-0.5 rounded hover:bg-black/[0.08] transition active:scale-95"
            title="Нажми, чтобы открыть справку термина"
          >
            {part}
          </button>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  }, [text, sortedPairs, themeColor, onSelectTerm]);

  return <>{elements}</>;
}

export function App() {
  // --- ТЕМА И ЦВЕТОВАЯ СХЕМА ---
  const [themeKey, setThemeKey] = useState<ThemeKey>(() => {
    return (localStorage.getItem('baza_theme') as ThemeKey) || 'eosin';
  });
  const theme = THEMES[themeKey] || THEMES.eosin;

  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    return (localStorage.getItem('baza_color_mode') as ColorMode) || 'light';
  });

  useEffect(() => {
    if (colorMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('baza_color_mode', colorMode);
  }, [colorMode]);

  useEffect(() => {
    const t = THEMES[themeKey] || THEMES.eosin;
    document.documentElement.style.setProperty('--accent-primary', t.primary);
    document.documentElement.style.setProperty('--accent-soft', t.soft);
    document.documentElement.style.setProperty('--accent-text', t.badgeText);
    localStorage.setItem('baza_theme', themeKey);
  }, [themeKey]);

  // --- НАВИГАЦИЯ МЕЖДУ 4 ВКЛАДКАМИ ---
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // --- ПРОГРЕСС ИЗУЧЕНИЯ ---
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('baza_mastered') || '[]');
    } catch {
      return [];
    }
  });

  const [emMasteredIds, setEmMasteredIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('baza_em_mastered') || '[]');
    } catch {
      return [];
    }
  });

  const [learnedTicketIds, setLearnedTicketIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('baza_tickets_learned') || '[]');
    } catch {
      return [];
    }
  });

  // Level 1: Accordion sections state on Home ('general' | 'private' | null)
  const [expandedSection, setExpandedSection] = useState<'general' | 'private' | null>('general');

  // Level 2 & 3: Active Topic (Module) & Tab ('theory' | 'slides' | 'test')
  const [activeModule, setActiveModule] = useState<HistoModule | null>(null);
  const [moduleTab, setModuleTab] = useState<'theory' | 'slides' | 'test'>('theory');

  // Interactive Glossary Term modal
  const [selectedTerm, setSelectedTerm] = useState<HistoTerm | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [emSearchQuery, setEmSearchQuery] = useState('');
  const [emFilterSection, setEmFilterSection] = useState<string>('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketFilterSection, setTicketFilterSection] = useState<string>('all');

  // Expandable cards
  const [expandedEmId, setExpandedEmId] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Virtual Microscope Ocular
  const [viewerSlide, setViewerSlide] = useState<HistSlide | null>(null);

  // Speedrun Quiz Deck
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

  // Sync Telegram native BackButton with screens hierarchy
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    const handleBack = () => {
      if (selectedTerm) {
        setSelectedTerm(null);
      } else if (viewerSlide) {
        setViewerSlide(null);
      } else if (quizDeck) {
        setQuizDeck(null);
      } else if (activeModule) {
        setActiveModule(null);
      }
    };

    if (selectedTerm || viewerSlide || quizDeck || activeModule) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [selectedTerm, viewerSlide, quizDeck, activeModule]);

  const changeTheme = (key: ThemeKey) => {
    setThemeKey(key);
    (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  };

  const toggleColorMode = () => {
    setColorMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
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

  const toggleEmMastered = (emId: string) => {
    setEmMasteredIds((prev) => {
      const next = prev.includes(emId)
        ? prev.filter((id) => id !== emId)
        : [...prev, emId];
      localStorage.setItem('baza_em_mastered', JSON.stringify(next));
      return next;
    });
    (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  };

  const toggleTicketLearned = (ticketId: string) => {
    setLearnedTicketIds((prev) => {
      const next = prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId];
      localStorage.setItem('baza_tickets_learned', JSON.stringify(next));
      return next;
    });
    (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  };

  const resetAllProgress = () => {
    if (window.confirm('Сбросить весь прогресс изучения препаратов, ЭМ-схем и билетов?')) {
      setMasteredIds([]);
      setEmMasteredIds([]);
      setLearnedTicketIds([]);
      localStorage.removeItem('baza_mastered');
      localStorage.removeItem('baza_em_mastered');
      localStorage.removeItem('baza_tickets_learned');
      (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('warning');
    }
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

  // Safe area padding matching Telegram iOS top buttons (minimum 112px on iPhone)
  const safeTopStyle: React.CSSProperties = {
    paddingTop: 'calc(var(--tg-content-safe-area-inset-top, 52px) + var(--tg-safe-area-inset-top, 48px) + 12px)',
  };

  // Filtered slides for search bar on Home
  const filteredSlides = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return EXAM_SLIDES.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        String(s.examNumber) === q.trim() ||
        s.killerFeature.toLowerCase().includes(q) ||
        s.stain.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filtered Electronograms
  const filteredElectronograms = useMemo(() => {
    return ELECTRONOGRAMS.filter((em) => {
      if (emFilterSection !== 'all' && em.section !== emFilterSection) {
        return false;
      }
      if (!emSearchQuery.trim()) return true;
      const q = emSearchQuery.toLowerCase();
      return (
        em.title.toLowerCase().includes(q) ||
        String(em.number) === q.trim() ||
        em.keyFeature.toLowerCase().includes(q) ||
        em.markers.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [emSearchQuery, emFilterSection]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return EXAM_QUESTIONS.filter((t) => {
      if (ticketFilterSection !== 'all' && t.section !== ticketFilterSection) {
        return false;
      }
      if (!ticketSearchQuery.trim()) return true;
      const q = ticketSearchQuery.toLowerCase();
      return (
        t.question.toLowerCase().includes(q) ||
        String(t.number) === q.trim() ||
        t.summaryAnswer.toLowerCase().includes(q) ||
        t.keyTerms.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [ticketSearchQuery, ticketFilterSection]);

  const readinessPercent = Math.round(
    (masteredIds.length / Math.max(1, EXAM_SLIDES.length)) * 100
  );

  const overallScore = Math.round(
    ((masteredIds.length / 70) * 0.4 +
      (emMasteredIds.length / 52) * 0.3 +
      (learnedTicketIds.length / 94) * 0.3) *
      100
  );

  // Quiz state
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

  // ================= 1. ЭКРАН ТЕСТА / СПИДРАНА =================
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
      <div className="min-h-screen bg-[#F2F4F7] dark:bg-[#0B0F17] text-slate-900 dark:text-white flex flex-col">
        {/* Шапка с безопасным отступом iOS */}
        <div
          style={safeTopStyle}
          className="px-4 pb-3 bg-white/95 dark:bg-[#161D2A]/95 backdrop-blur-md flex items-center justify-between gap-3 sticky top-0 z-20 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
        >
          <button
            onClick={() => setQuizDeck(null)}
            className="px-3.5 h-10 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-bold text-[13px] flex items-center gap-1.5 active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Выйти
          </button>

          <div className="text-[13px] font-extrabold text-slate-700 dark:text-slate-300">
            Вопрос {quizIndex + 1} из {quizDeck.length}
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
          {/* Превью микропрепарата */}
          <div
            onClick={() => setViewerSlide(currentQuizSlide)}
            className="relative h-[34vh] w-full rounded-[24px] bg-[#090D16] overflow-hidden shadow-md cursor-pointer group"
          >
            <img
              src={
                currentQuizSlide.imageUrls && currentQuizSlide.imageUrls.length > 0
                  ? currentQuizSlide.imageUrls[0]
                  : currentQuizSlide.imageUrl
              }
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
              let btnStyle =
                'bg-white dark:bg-[#161D2A] text-slate-900 dark:text-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]';
              if (isAnswered) {
                if (opt === currentQuizSlide.title) {
                  btnStyle = 'bg-emerald-500 text-white shadow-md';
                } else if (opt === selectedOption) {
                  btnStyle = 'bg-rose-500 text-white shadow-md';
                } else {
                  btnStyle = 'bg-white/60 dark:bg-white/5 text-slate-400';
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
                  className={`w-full p-4 rounded-[20px] text-left transition active:scale-[0.99] flex items-center gap-3 ${btnStyle}`}
                >
                  <span className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center font-extrabold text-[12px] shrink-0">
                    {letter}
                  </span>
                  <span className="font-extrabold text-[14px] leading-snug flex-1">
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Карточка разбора после ответа */}
          {isAnswered && (
            <div className="bg-white dark:bg-[#161D2A] rounded-[24px] p-4 shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className="font-extrabold text-[14px]">
                  {isCorrect ? 'Верно!' : 'Ошибка'} — Препарат №{currentQuizSlide.examNumber}
                </span>
              </div>

              <div className="text-[13px] text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-800 dark:text-white">Признак: </span>
                {currentQuizSlide.killerFeature}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleNext(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-[13px] active:scale-95 transition"
                >
                  Повторить позже
                </button>
                <button
                  onClick={() => handleNext(true)}
                  style={{ backgroundColor: theme.primary }}
                  className="flex-1 py-3 rounded-2xl text-white font-extrabold text-[13px] shadow active:scale-95 transition"
                >
                  Запомнил
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= 2. ЭКРАН ТЕМЫ / МОДУЛЯ (УРОВЕНЬ 3) =================
  if (activeModule) {
    const moduleSlides = EXAM_SLIDES.filter((s) => s.moduleId === activeModule.id);
    const moduleTheory = THEORY_BLOCKS.filter((b) => b.moduleId === activeModule.id);

    return (
      <div className="min-h-screen bg-[#F2F4F7] dark:bg-[#0B0F17] text-slate-900 dark:text-white flex flex-col">
        {/* Шапка модуля с безопасным отступом */}
        <div
          style={safeTopStyle}
          className="px-4 pb-3 bg-white/95 dark:bg-[#161D2A]/95 backdrop-blur-md sticky top-0 z-20 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-2.5"
        >
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveModule(null)}
              className="px-3.5 h-10 rounded-full bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-bold text-[13px] flex items-center gap-1.5 active:scale-95 transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
            <div className="min-w-0 flex-1 text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                {activeModule.section === 'general' ? 'Общая гистология' : 'Частная гистология'}
              </span>
              <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-white truncate">
                {activeModule.title}
              </h2>
            </div>
          </div>

          {/* 3 Вкладки темы: [ Конспект ] [ Препараты ] [ Тест ] */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
            <button
              onClick={() => setModuleTab('theory')}
              className={`py-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-1 transition ${
                moduleTab === 'theory'
                  ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Конспект
            </button>
            <button
              onClick={() => setModuleTab('slides')}
              className={`py-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-1 transition ${
                moduleTab === 'slides'
                  ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              Препараты ({moduleSlides.length})
            </button>
            <button
              onClick={() => setModuleTab('test')}
              className={`py-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-1 transition ${
                moduleTab === 'test'
                  ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Тест
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-3.5 w-full">
          {/* ВКЛАДКА 1: [ Конспект с интерактивными терминами ] */}
          {moduleTab === 'theory' && (
            <div className="space-y-3">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-[12px] text-amber-900 dark:text-amber-200">
                <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Интерактивный конспект: </span>
                  Нажимай на подчёркнутые термины в тексте, чтобы открыть карточку с определением, латынью и советом к экзамену.
                </div>
              </div>

              {moduleTheory.map((block) => (
                <div
                  key={block.id}
                  className="bg-white dark:bg-[#161D2A] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3"
                >
                  <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-snug">
                    {block.title}
                  </h3>

                  <div className="text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    <TermHighlightedText
                      text={block.summary}
                      onSelectTerm={setSelectedTerm}
                      themeColor={theme.primary}
                    />
                  </div>

                  {block.examTip && (
                    <div
                      style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                      className="rounded-2xl p-3.5 text-[12px] font-semibold leading-snug border border-black/5"
                    >
                      <div className="font-extrabold uppercase text-[11px] mb-0.5">
                        На что смотрит препод на экзамене:
                      </div>
                      <TermHighlightedText
                        text={block.examTip}
                        onSelectTerm={setSelectedTerm}
                        themeColor={theme.primary}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ВКЛАДКА 2: [ Препараты по 6 пунктам экзаменационного плана ] */}
          {moduleTab === 'slides' && (
            <div className="space-y-3.5">
              {moduleSlides.map((slide) => {
                const isDone = masteredIds.includes(slide.id);
                return (
                  <div
                    key={slide.id}
                    className="bg-white dark:bg-[#161D2A] rounded-[24px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3"
                  >
                    {/* Заголовок карточки с микрофотографией */}
                    <div className="flex items-start gap-3.5">
                      <div
                        onClick={() => setViewerSlide(slide)}
                        className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer shadow-inner"
                      >
                        <img
                          src={
                            slide.imageUrls && slide.imageUrls.length > 0
                              ? slide.imageUrls[0]
                              : slide.imageUrl
                          }
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white/90" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-slate-400">
                            Препарат №{slide.examNumber}
                          </span>
                          <button
                            onClick={() => toggleMastered(slide.id, !isDone)}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {isDone ? 'Выучен' : 'Учить'}
                          </button>
                        </div>
                        <h4 className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-snug mt-0.5">
                          {slide.title}
                        </h4>
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {slide.stain}
                        </div>
                      </div>
                    </div>

                    {/* Главный диагностический признак */}
                    <div
                      style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                      className="p-3 rounded-2xl text-[12px] font-medium leading-snug"
                    >
                      <div className="font-extrabold uppercase text-[10px] mb-0.5">
                        Диагностический признак:
                      </div>
                      {slide.killerFeature}
                    </div>

                    {/* Кнопка открытия микроскопа */}
                    <button
                      onClick={() => setViewerSlide(slide)}
                      style={{ backgroundColor: theme.primary }}
                      className="w-full py-3 rounded-2xl text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow active:scale-95 transition"
                    >
                      <Microscope className="w-4 h-4" />
                      Открыть в виртуальном микроскопе
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ВКЛАДКА 3: [ Тест по теме ] */}
          {moduleTab === 'test' && (
            <div className="bg-white dark:bg-[#161D2A] rounded-[24px] p-6 text-center space-y-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
              <div
                style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
              >
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">
                  Проверка знаний темы
                </h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {moduleSlides.length} препаратов в режиме спидрана с автоматической фиксацией выученного.
                </p>
              </div>
              <button
                onClick={() => startSpeedrun(moduleSlides, moduleSlides.length)}
                style={{ backgroundColor: theme.primary }}
                className="w-full py-3.5 rounded-2xl text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow active:scale-95 transition"
              >
                <Zap className="w-4 h-4" />
                Начать спидран по теме
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= 3. ГЛАВНОЕ ОКНО С 4 ВКЛАДКАМИ =================
  return (
    <div className="min-h-screen bg-[#F2F4F7] dark:bg-[#0B0F17] text-slate-900 dark:text-white flex flex-col">
      {/* ================= ВКЛАДКА 1: ГЛАВНАЯ (ПРЕПАРАТЫ И ТЕМЫ) ================= */}
      {activeTab === 'home' && (
        <>
          {/* Шапка с безопасным отступом iOS */}
          <div
            style={safeTopStyle}
            className="px-4 pb-3 bg-white/95 dark:bg-[#161D2A]/95 backdrop-blur-md sticky top-0 z-20 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-[16px] shadow-xs"
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight">
                    База · Гистология
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Кафедральный экзаменационный атлас
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleColorMode}
                  className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 transition"
                  title="Сменить тему"
                >
                  {colorMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 transition"
                  title="Палитра"
                >
                  <Palette className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-4 w-full">
            {/* Поиск по всем 70 препаратам */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по номеру (1–70), окраске или органу..."
                className="w-full bg-white dark:bg-[#161D2A] rounded-2xl pl-10 pr-9 py-3.5 text-[13px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 shadow-[0_2px_12px_rgba(15,23,42,0.04)] outline-none"
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

            {/* Выдача поиска */}
            {searchQuery.trim() !== '' && (
              <div className="space-y-2">
                {filteredSlides.map((slide) => (
                  <div
                    key={slide.id}
                    onClick={() => setViewerSlide(slide)}
                    className="bg-white dark:bg-[#161D2A] rounded-2xl p-3 flex items-center gap-3 shadow-xs cursor-pointer active:scale-[0.99] transition border border-slate-100 dark:border-white/5"
                  >
                    <img
                      src={
                        slide.imageUrls && slide.imageUrls.length > 0
                          ? slide.imageUrls[0]
                          : slide.imageUrl
                      }
                      alt={slide.title}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-900 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-slate-400">
                        Препарат №{slide.examNumber} · {slide.stain}
                      </div>
                      <div className="text-[14px] font-extrabold text-slate-900 dark:text-white truncate">
                        {slide.title}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* Hero Bento-виджет прогресса и Спидрана */}
            <div className="bg-white dark:bg-[#161D2A] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[12px] font-bold text-slate-400">
                    Готовность к препаратам
                  </span>
                  <div className="text-[28px] font-extrabold text-slate-900 dark:text-white leading-tight">
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

              {/* Прогресс-бар */}
              <div className="w-full bg-slate-100 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${readinessPercent}%`, backgroundColor: theme.primary }}
                  className="h-full rounded-full transition-all duration-500"
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

            {/* ИЕРАРХИЧЕСКОЕ РАСКРЫТИЕ РАЗДЕЛОВ (УРОВЕНЬ 1 И 2) */}
            <div className="space-y-3.5">
              {/* РАЗДЕЛ 1: ОБЩАЯ ГИСТОЛОГИЯ */}
              <div className="bg-white dark:bg-[#161D2A] rounded-[26px] overflow-hidden shadow-[0_2px_12px_rgba(15,23,42,0.04)] border border-slate-100 dark:border-white/5 transition-all">
                <button
                  onClick={() =>
                    setExpandedSection((prev) => (prev === 'general' ? null : 'general'))
                  }
                  className="w-full p-4 flex items-center justify-between text-left transition hover:bg-slate-50/50 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      style={{ backgroundColor: '#8B5CF618', color: '#8B5CF6' }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-[18px] shrink-0"
                    >
                      🧬
                    </div>
                    <div>
                      <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-snug">
                        Общая гистология
                      </h2>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ткани: эпителий, кровь, РВСТ, хрящи, кость, мышцы · Препараты №1–16
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      expandedSection === 'general' ? 'rotate-180 text-slate-900 dark:text-white' : ''
                    }`}
                  />
                </button>

                {/* Список тем Общей гистологии (Уровень 2) */}
                {expandedSection === 'general' && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-white/5 pt-3">
                    {MODULES.filter((m) => m.section === 'general').map((mod) => {
                      const modSlides = EXAM_SLIDES.filter((s) => s.moduleId === mod.id);
                      const doneCount = modSlides.filter((s) => masteredIds.includes(s.id)).length;
                      return (
                        <div
                          key={mod.id}
                          onClick={() => {
                            setActiveModule(mod);
                            setModuleTab('theory');
                          }}
                          className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100/80 dark:hover:bg-white/10 flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99] border border-slate-100 dark:border-white/5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-tight">
                              {mod.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {mod.subtitle}
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 mt-1">
                              Изучено: {doneCount} из {modSlides.length}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* РАЗДЕЛ 2: ЧАСТНАЯ ГИСТОЛОГИЯ */}
              <div className="bg-white dark:bg-[#161D2A] rounded-[26px] overflow-hidden shadow-[0_2px_12px_rgba(15,23,42,0.04)] border border-slate-100 dark:border-white/5 transition-all">
                <button
                  onClick={() =>
                    setExpandedSection((prev) => (prev === 'private' ? null : 'private'))
                  }
                  className="w-full p-4 flex items-center justify-between text-left transition hover:bg-slate-50/50 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      style={{ backgroundColor: '#EC489918', color: '#EC4899' }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-[18px] shrink-0"
                    >
                      🔬
                    </div>
                    <div>
                      <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-snug">
                        Частная гистология
                      </h2>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Системы: ЦНС, сосуды, дыхание, ЖКТ, эндокринная, почки · Препараты №17–70
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      expandedSection === 'private' ? 'rotate-180 text-slate-900 dark:text-white' : ''
                    }`}
                  />
                </button>

                {/* Список тем Частной гистологии (Уровень 2) */}
                {expandedSection === 'private' && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-white/5 pt-3">
                    {MODULES.filter((m) => m.section === 'private').map((mod) => {
                      const modSlides = EXAM_SLIDES.filter((s) => s.moduleId === mod.id);
                      const doneCount = modSlides.filter((s) => masteredIds.includes(s.id)).length;
                      return (
                        <div
                          key={mod.id}
                          onClick={() => {
                            setActiveModule(mod);
                            setModuleTab('theory');
                          }}
                          className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 hover:bg-slate-100/80 dark:hover:bg-white/10 flex items-center justify-between gap-3 cursor-pointer transition active:scale-[0.99] border border-slate-100 dark:border-white/5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-tight">
                              {mod.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {mod.subtitle}
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 mt-1">
                              Изучено: {doneCount} из {modSlides.length}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= ВКЛАДКА 2: ЭЛЕКТРОННОГРАММЫ (52 СХЕМЫ) ================= */}
      {activeTab === 'electronograms' && (
        <>
          <div
            style={safeTopStyle}
            className="px-4 pb-3 bg-white/95 dark:bg-[#161D2A]/95 backdrop-blur-md sticky top-0 z-20 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight">
                  Электроннограммы
                </h1>
                <p className="text-[11px] font-semibold text-slate-400">
                  52 схемы ультраструктуры · Выучено: {emMasteredIds.length} из 52
                </p>
              </div>
              <div
                style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                className="px-3 py-1 rounded-full text-[12px] font-extrabold"
              >
                {Math.round((emMasteredIds.length / 52) * 100)}%
              </div>
            </div>

            {/* Поиск по ЭМ-схемам */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={emSearchQuery}
                onChange={(e) => setEmSearchQuery(e.target.value)}
                placeholder="Поиск по названию, органелле или признаку..."
                className="w-full bg-slate-100 dark:bg-white/10 rounded-xl pl-9 pr-8 py-2 text-[12px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
              {emSearchQuery && (
                <button
                  onClick={() => setEmSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Фильтры разделов */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'all', label: 'Все (52)' },
                { id: 'cytology', label: 'Цитология (15)' },
                { id: 'general', label: 'Общая (15)' },
                { id: 'nervous', label: 'Нервная (12)' },
                { id: 'private', label: 'Частная (10)' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setEmFilterSection(chip.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition ${
                    emFilterSection === chip.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-md mx-auto px-4 pt-3 pb-28 space-y-3 w-full">
            {filteredElectronograms.map((em) => {
              const isMastered = emMasteredIds.includes(em.id);
              const isExpanded = expandedEmId === em.id;

              return (
                <div
                  key={em.id}
                  className="bg-white dark:bg-[#161D2A] rounded-[24px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3 border border-slate-100 dark:border-white/5"
                >
                  {/* Заголовок карточки */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          ЭМ №{em.number}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {em.sectionName}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-snug mt-1">
                        {em.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => toggleEmMastered(em.id)}
                      className={`p-2 rounded-xl transition ${
                        isMastered
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-white/10'
                      }`}
                      title={isMastered ? 'Выучено' : 'Отметить выученным'}
                    >
                      {isMastered ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Маркеры */}
                  <div className="flex flex-wrap gap-1.5">
                    {em.markers.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5"
                      >
                        • {m}
                      </span>
                    ))}
                  </div>

                  {/* Главный признак */}
                  <div
                    style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                    className="p-3 rounded-2xl text-[12px] font-medium leading-snug"
                  >
                    <div className="font-extrabold uppercase text-[10px] mb-0.5">
                      ⚡ Главный диагностический признак:
                    </div>
                    {em.keyFeature}
                  </div>

                  {/* Подробное раскрытие описания и функции */}
                  {isExpanded && (
                    <div className="space-y-2.5 pt-1 text-[12px] border-t border-slate-100 dark:border-white/5">
                      <div>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          Ультраструктура:{' '}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          <TermHighlightedText
                            text={em.description}
                            onSelectTerm={setSelectedTerm}
                            themeColor={theme.primary}
                          />
                        </span>
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          Функция:{' '}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          <TermHighlightedText
                            text={em.functionText}
                            onSelectTerm={setSelectedTerm}
                            themeColor={theme.primary}
                          />
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedEmId(isExpanded ? null : em.id)}
                    className="w-full py-2 text-center text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                  >
                    {isExpanded ? 'Свернуть описание ↑' : 'Подробный разбор и функции ↓'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ================= ВКЛАДКА 3: БИЛЕТЫ (94 ВОПРОСА) ================= */}
      {activeTab === 'tickets' && (
        <>
          <div
            style={safeTopStyle}
            className="px-4 pb-3 bg-white/95 dark:bg-[#161D2A]/95 backdrop-blur-md sticky top-0 z-20 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight">
                  Экзаменационные билеты
                </h1>
                <p className="text-[11px] font-semibold text-slate-400">
                  94 вопроса кафедры · Выучено: {learnedTicketIds.length} из 94
                </p>
              </div>
              <div
                style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                className="px-3 py-1 rounded-full text-[12px] font-extrabold"
              >
                {Math.round((learnedTicketIds.length / 94) * 100)}%
              </div>
            </div>

            {/* Поиск по вопросам */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ticketSearchQuery}
                onChange={(e) => setTicketSearchQuery(e.target.value)}
                placeholder="Поиск по вопросу, разделу или термину..."
                className="w-full bg-slate-100 dark:bg-white/10 rounded-xl pl-9 pr-8 py-2 text-[12px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
              {ticketSearchQuery && (
                <button
                  onClick={() => setTicketSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Фильтры разделов */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'all', label: 'Все (94)' },
                { id: 'cytology', label: 'Цитология (20)' },
                { id: 'embryology', label: 'Эмбриология (16)' },
                { id: 'general', label: 'Общая (24)' },
                { id: 'private', label: 'Частная (34)' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setTicketFilterSection(chip.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition ${
                    ticketFilterSection === chip.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-md mx-auto px-4 pt-3 pb-28 space-y-3 w-full">
            {filteredTickets.map((q) => {
              const isLearned = learnedTicketIds.includes(q.id);
              const isExpanded = expandedTicketId === q.id;

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-[#161D2A] rounded-[24px] p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3 border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Вопрос №{q.number}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {q.sectionName}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-snug mt-1">
                        {q.question}
                      </h3>
                    </div>

                    <button
                      onClick={() => toggleTicketLearned(q.id)}
                      className={`p-2 rounded-xl transition ${
                        isLearned
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-white/10'
                      }`}
                      title={isLearned ? 'Выучен' : 'Отметить выученным'}
                    >
                      {isLearned ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Раскрытый план и ответ */}
                  {isExpanded ? (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5 text-[13px]">
                      {/* План ответа */}
                      <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl space-y-1.5">
                        <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                          План ответа на экзамене:
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[12px] font-medium">
                          {q.plan.map((step, idx) => (
                            <li key={idx} className="leading-snug">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Ключевые термины */}
                      <div>
                        <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1.5">
                          Ключевые термины:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {q.keyTerms.map((term, idx) => {
                            const found = HISTO_GLOSSARY.find(
                              (g) =>
                                g.term.toLowerCase() === term.toLowerCase() ||
                                g.aliases.some((a) => a.toLowerCase() === term.toLowerCase())
                            );
                            return (
                              <button
                                key={idx}
                                onClick={() => found && setSelectedTerm(found)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                                  found
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 underline decoration-dotted'
                                    : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {term}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Краткий эталонный ответ */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-500/20 space-y-1 text-[12px]">
                        <div className="font-extrabold text-amber-900 dark:text-amber-300 uppercase text-[10px]">
                          Краткий эталонный ответ (конспект кафедры):
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <TermHighlightedText
                            text={q.summaryAnswer}
                            onSelectTerm={setSelectedTerm}
                            themeColor={theme.primary}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <button
                    onClick={() => setExpandedTicketId(isExpanded ? null : q.id)}
                    className="w-full py-2 text-center text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                  >
                    {isExpanded ? 'Свернуть билет ↑' : 'Показать план ответа и шпаргалку ↓'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ================= ВКЛАДКА 4: ПРОФИЛЬ И НАСТРОЙКИ ================= */}
      {activeTab === 'profile' && (
        <>
          <div
            style={safeTopStyle}
            className="px-4 pb-3 bg-white/95 dark:bg-[#161D2A]/95 backdrop-blur-md sticky top-0 z-20 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
          >
            <h1 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight">
              Профиль и готовность
            </h1>
            <p className="text-[11px] font-semibold text-slate-400">
              Статистика подготовки и внешний вид
            </p>
          </div>

          <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-4 w-full">
            {/* Bento-виджет общей готовности */}
            <div className="bg-white dark:bg-[#161D2A] rounded-[26px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4 border border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[12px] font-bold text-slate-400">
                    Общая готовность к экзамену
                  </span>
                  <div className="text-[32px] font-extrabold text-slate-900 dark:text-white leading-tight">
                    {overallScore}%
                  </div>
                </div>
                <div
                  style={{ backgroundColor: theme.soft, color: theme.badgeText }}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                >
                  <GraduationCap className="w-7 h-7" />
                </div>
              </div>

              {/* 3 Счётчика */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl text-center">
                  <div className="text-[18px] font-extrabold text-slate-900 dark:text-white">
                    {masteredIds.length}/70
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 mt-0.5">Препараты</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl text-center">
                  <div className="text-[18px] font-extrabold text-slate-900 dark:text-white">
                    {emMasteredIds.length}/52
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 mt-0.5">ЭМ-схемы</div>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl text-center">
                  <div className="text-[18px] font-extrabold text-slate-900 dark:text-white">
                    {learnedTicketIds.length}/94
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 mt-0.5">Билеты</div>
                </div>
              </div>
            </div>

            {/* Настройки темы и режима */}
            <div className="bg-white dark:bg-[#161D2A] rounded-[26px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4 border border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                    Режим отображения
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    {colorMode === 'dark' ? 'Тёмная тема (OLED)' : 'Светлая тема (Медицинская)'}
                  </p>
                </div>
                <button
                  onClick={toggleColorMode}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white font-bold text-[12px] flex items-center gap-2 active:scale-95 transition"
                >
                  {colorMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {colorMode === 'dark' ? 'Светлая' : 'Тёмная'}
                </button>
              </div>

              {/* Выбор акцентного цвета */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2.5">
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">
                  Цветовая схема «Базы»
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
                    const item = THEMES[k];
                    const active = themeKey === k;
                    return (
                      <button
                        key={k}
                        onClick={() => changeTheme(k)}
                        className={`p-3 rounded-2xl flex items-center justify-between border transition ${
                          active
                            ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-white/10'
                            : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-5 h-5 rounded-full shadow-xs"
                            style={{ backgroundColor: item.primary }}
                          />
                          <span className="font-bold text-[13px] text-slate-900 dark:text-white">
                            {item.name}
                          </span>
                        </div>
                        {active && (
                          <Check className="w-4 h-4 text-slate-900 dark:text-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Сброс прогресса */}
            <div className="bg-white dark:bg-[#161D2A] rounded-[26px] p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-3 border border-slate-100 dark:border-white/5">
              <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                Управление данными
              </h3>
              <p className="text-[12px] text-slate-400">
                Весь прогресс хранится локально на твоем устройстве.
              </p>
              <button
                onClick={resetAllProgress}
                className="w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-[13px] flex items-center justify-center gap-2 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Сбросить весь прогресс
              </button>
            </div>

            {/* Информация о приложении */}
            <div className="text-center text-[11px] text-slate-400 py-2 space-y-1">
              <div>«База» — Кафедральная гистология v2.0</div>
              <div>70 микропрепаратов · 52 ЭМ-схемы · 94 билета</div>
            </div>
          </div>
        </>
      )}

      {/* ================= НИЖНИЙ ТАБ-БАР (4 ВКЛАДКИ) ================= */}
      <div
        style={{ paddingBottom: 'calc(var(--tg-safe-area-inset-bottom, 0px) + 8px)' }}
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#121826]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-2 flex items-center justify-around"
      >
        <button
          onClick={() => {
            setActiveTab('home');
            setActiveModule(null);
            (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-1 transition ${
            activeTab === 'home'
              ? 'text-slate-900 dark:text-white font-extrabold'
              : 'text-slate-400 font-medium'
          }`}
        >
          <div
            style={activeTab === 'home' ? { color: theme.primary } : undefined}
            className="transition-colors"
          >
            <Microscope className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Главная</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('electronograms');
            setActiveModule(null);
            (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-1 transition ${
            activeTab === 'electronograms'
              ? 'text-slate-900 dark:text-white font-extrabold'
              : 'text-slate-400 font-medium'
          }`}
        >
          <div
            style={activeTab === 'electronograms' ? { color: theme.primary } : undefined}
            className="transition-colors"
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">ЭМ-схемы</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('tickets');
            setActiveModule(null);
            (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-1 transition ${
            activeTab === 'tickets'
              ? 'text-slate-900 dark:text-white font-extrabold'
              : 'text-slate-400 font-medium'
          }`}
        >
          <div
            style={activeTab === 'tickets' ? { color: theme.primary } : undefined}
            className="transition-colors"
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Билеты</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('profile');
            setActiveModule(null);
            (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-1 transition ${
            activeTab === 'profile'
              ? 'text-slate-900 dark:text-white font-extrabold'
              : 'text-slate-400 font-medium'
          }`}
        >
          <div
            style={activeTab === 'profile' ? { color: theme.primary } : undefined}
            className="transition-colors"
          >
            <Palette className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Профиль</span>
        </button>
      </div>

      {/* ================= МОДАЛКА ИНТЕРАКТИВНОГО ТЕРМИНА (ГЛОССАРИЙ) ================= */}
      {selectedTerm && (
        <div
          onClick={() => setSelectedTerm(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#161D2A] rounded-t-[28px] p-5 pb-8 space-y-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {selectedTerm.category} · {selectedTerm.latin}
                </span>
                <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {selectedTerm.term}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTerm(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
              <div className="text-[11px] font-extrabold text-slate-400 uppercase">
                Определение (Афанасьев / Быков):
              </div>
              <p className="text-[13px] text-slate-800 dark:text-slate-200 leading-relaxed">
                {selectedTerm.definition}
              </p>
            </div>

            {selectedTerm.aliases && selectedTerm.aliases.length > 0 && (
              <div className="text-[12px] text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Синонимы и формы:{' '}
                </span>
                {selectedTerm.aliases.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ВИРТУАЛЬНЫЙ МИКРОСКОП ================= */}
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
