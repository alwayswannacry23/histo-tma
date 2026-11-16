import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Microscope,
  X,
  GraduationCap,
  PlayCircle,
  Compass,
  Stethoscope,
} from 'lucide-react';
import { Slide, Module } from '../types';
import { useTelegram } from '../telegram/TelegramContext';
import { MicroscopeViewerModal } from '../components/MicroscopeViewerModal';
import { createHistologyFallbackSvg } from '../data/mockSlides';

interface CheatSheetsScreenProps {
  slides: Slide[];
  modules: Module[];
  onSelectSlideForTraining: (slideId: string) => void;
}

export const CheatSheetsScreen: React.FC<CheatSheetsScreenProps> = ({
  slides,
  modules,
  onSelectSlideForTraining,
}) => {
  const { hapticFeedback, openLink } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedSlideId, setExpandedSlideId] = useState<string | null>(slides[0]?.id || null);
  const [ocularSlide, setOcularSlide] = useState<Slide | null>(null);

  const filteredSlides = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return slides.filter((slide) => {
      const modId = slide.module_id || slide.moduleId;
      if (selectedModuleId && modId !== selectedModuleId) {
        return false;
      }
      if (!q) return true;

      const layers = slide.exam_checklist?.layers || slide.layers || '';
      const cells = slide.exam_checklist?.key_cells || slide.keyCells || '';
      const killer = slide.exam_checklist?.killer_feature || slide.killerFeature || '';
      const diff = slide.differential_diagnosis || slide.differentialDiagnosis || '';
      const clin = slide.clinical_note || slide.clinicalNote || '';

      return (
        slide.title.toLowerCase().includes(q) ||
        slide.stain.toLowerCase().includes(q) ||
        layers.toLowerCase().includes(q) ||
        cells.toLowerCase().includes(q) ||
        killer.toLowerCase().includes(q) ||
        diff.toLowerCase().includes(q) ||
        clin.toLowerCase().includes(q)
      );
    });
  }, [slides, searchQuery, selectedModuleId]);

  const toggleExpand = (id: string) => {
    hapticFeedback.selectionChanged();
    setExpandedSlideId((prev) => (prev === id ? null : id));
  };

  const handleOpenOcular = (slide: Slide) => {
    hapticFeedback.impactOccurred('medium');
    setOcularSlide(slide);
  };

  const handleOpenTrainer = (slideId: string) => {
    hapticFeedback.impactOccurred('medium');
    onSelectSlideForTraining(slideId);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] pb-28 safe-pt transition-colors duration-200">
      {/* Header */}
      <header className="px-5 pt-1 pb-3 sticky top-0 bg-[var(--bg-page)]/95 backdrop-blur-md z-30 space-y-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--text-primary)] leading-tight">
            Атлас и шпаргалки
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
            Дифференциальная диагностика препаратов к экзамену ({slides.length} препаратов)
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            strokeWidth={1.75}
            className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, клеткам, диагнозу..."
            className="w-full pl-10 pr-10 py-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[0_2px_10px_rgba(15,23,42,0.04)] rounded-full text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X strokeWidth={1.75} className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5 no-scrollbar pb-1">
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setSelectedModuleId(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all select-none ${
              selectedModuleId === null
                ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] shadow-xs hover:bg-[var(--bg-card-secondary)]'
            }`}
          >
            Все ({slides.length})
          </button>
          {modules.map((m) => {
            const count = slides.filter(
              (s) => (s.module_id || s.moduleId) === m.id
            ).length;
            if (count === 0) return null;
            const isSelected = selectedModuleId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  hapticFeedback.selectionChanged();
                  setSelectedModuleId(m.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all select-none ${
                  isSelected
                    ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] shadow-xs hover:bg-[var(--bg-card-secondary)]'
                }`}
              >
                {m.title.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </header>

      {/* Accordion Slide List */}
      <main className="px-5 pt-1 space-y-3 max-w-lg mx-auto">
        {filteredSlides.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)] text-xs">
            Препаратов по вашему запросу не найдено
          </div>
        ) : (
          filteredSlides.map((slide) => {
            const isExpanded = expandedSlideId === slide.id;
            const imgSrc = slide.image_clean_url || slide.imageUrl || '';
            const killer = slide.exam_checklist?.killer_feature || slide.killerFeature || '';
            const layers = slide.exam_checklist?.layers || slide.layers || '';
            const cells = slide.exam_checklist?.key_cells || slide.keyCells || '';
            const diff =
              slide.differential_diagnosis ||
              slide.differentialDiagnosis ||
              slide.exam_checklist?.differential_diagnosis ||
              '';
            const clin =
              slide.clinical_note ||
              slide.clinicalNote ||
              slide.exam_checklist?.clinical_note ||
              '';
            const videoQuery =
              slide.video_hint_query ||
              slide.videoHintQuery ||
              `${slide.title} гистология препарат разбор`;

            return (
              <div
                key={slide.id}
                className="bg-[var(--bg-card)] rounded-[22px] shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-[var(--border-subtle)] overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(slide.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none active:bg-black/5 dark:active:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-900 shrink-0">
                      <img
                        src={imgSrc}
                        alt={slide.title}
                        onError={(e) => {
                          e.currentTarget.src = createHistologyFallbackSvg(slide.title, slide.stain);
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {slide.exam_number && (
                          <span className="text-[10px] font-black text-[var(--accent-primary)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded-md">
                            №{slide.exam_number}
                          </span>
                        )}
                        <h3 className="font-bold text-sm text-[var(--text-primary)] leading-snug truncate">
                          {slide.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--text-muted)]">
                          {slide.stain}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]/60">•</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {slide.magnification}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[var(--text-muted)] pl-2 shrink-0">
                    {isExpanded ? (
                      <ChevronUp strokeWidth={2} className="w-5 h-5 text-[var(--accent-primary)]" />
                    ) : (
                      <ChevronDown strokeWidth={2} className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-[var(--border-subtle)]">
                    {/* Image Preview & Dual Action Buttons */}
                    <div className="relative rounded-2xl overflow-hidden bg-[#090D16] h-48 flex items-center justify-center group">
                      <img
                        src={imgSrc}
                        alt={slide.title}
                        onError={(e) => {
                          e.currentTarget.src = createHistologyFallbackSvg(slide.title, slide.stain);
                        }}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => handleOpenOcular(slide)}
                      />

                      {/* Floating Buttons on Image */}
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                        {/* Open Pure Microscope */}
                        <button
                          onClick={() => handleOpenOcular(slide)}
                          className="px-3.5 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-full text-xs font-bold shadow-lg shadow-[var(--accent-shadow)] flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <Microscope className="w-3.5 h-3.5" />
                          <span>В микроскоп</span>
                        </button>

                        {/* Open Quiz / Test */}
                        <button
                          onClick={() => handleOpenTrainer(slide.id)}
                          className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                          <span>Тест</span>
                        </button>
                      </div>

                      {/* Top-left Hint */}
                      <div className="absolute top-2.5 left-2.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white/70 font-medium">
                        Нажмите для просмотра в окуляре
                      </div>
                    </div>

                    {/* Главный отличительный признак */}
                    {killer && (
                      <div className="bg-[var(--accent-soft)] p-3.5 rounded-2xl space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--accent-primary)] text-xs font-bold">
                          <Sparkles strokeWidth={1.75} className="w-4 h-4 text-[var(--accent-primary)]" />
                          <span>Главный отличительный признак</span>
                        </div>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                          {killer}
                        </p>
                      </div>
                    )}

                    {/* Дифференциальный диагноз (за 3 секунды) */}
                    {diff && (
                      <div className="bg-amber-500/10 p-3.5 rounded-2xl space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold">
                          <Compass strokeWidth={1.75} className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Дифференциальный диагноз на зачете</span>
                        </div>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                          {diff}
                        </p>
                      </div>
                    )}

                    {/* Клиническая значимость */}
                    {clin && (
                      <div className="bg-emerald-500/10 p-3.5 rounded-2xl space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                          <Stethoscope strokeWidth={1.75} className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Клиническая значимость</span>
                        </div>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                          {clin}
                        </p>
                      </div>
                    )}

                    {/* Layers Checklist */}
                    {layers && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block px-1">
                          Оболочки и слои
                        </span>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--bg-card-secondary)] p-3.5 rounded-2xl font-normal border border-[var(--border-subtle)]">
                          {layers}
                        </p>
                      </div>
                    )}

                    {/* Key Cells */}
                    {cells && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block px-1">
                          Ключевые клетки
                        </span>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--bg-card-secondary)] p-3.5 rounded-2xl font-normal border border-[var(--border-subtle)]">
                          {cells}
                        </p>
                      </div>
                    )}

                    {/* Video breakdown button */}
                    <button
                      onClick={() => {
                        hapticFeedback.impactOccurred('medium');
                        const url =
                          slide.youtubeTimestampUrl ||
                          `https://www.youtube.com/results?search_query=${encodeURIComponent(
                            videoQuery
                          )}`;
                        openLink(url);
                      }}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 border border-red-500/20"
                    >
                      <PlayCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>
                        {slide.youtubeTimestampUrl
                          ? 'Смотреть разбор на YouTube (с таймкодом)'
                          : 'Смотреть разбор на YouTube'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Pure Virtual Microscope Ocular Modal */}
      <MicroscopeViewerModal
        slide={ocularSlide}
        isOpen={ocularSlide !== null}
        onClose={() => setOcularSlide(null)}
        onStartQuiz={onSelectSlideForTraining}
      />
    </div>
  );
};
