import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Sparkles, Microscope, X } from 'lucide-react';
import { Slide, Module } from '../types';
import { useTelegram } from '../telegram/TelegramContext';

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
  const { hapticFeedback } = useTelegram();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedSlideId, setExpandedSlideId] = useState<string | null>(slides[0]?.id || null);

  const filteredSlides = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return slides.filter((slide) => {
      if (selectedModuleId && slide.module_id !== selectedModuleId) {
        return false;
      }
      if (!q) return true;
      return (
        slide.title.toLowerCase().includes(q) ||
        slide.stain.toLowerCase().includes(q) ||
        slide.exam_checklist.layers.toLowerCase().includes(q) ||
        slide.exam_checklist.key_cells.toLowerCase().includes(q) ||
        slide.exam_checklist.killer_feature.toLowerCase().includes(q)
      );
    });
  }, [slides, searchQuery, selectedModuleId]);

  const toggleExpand = (id: string) => {
    hapticFeedback.selectionChanged();
    setExpandedSlideId((prev) => (prev === id ? null : id));
  };

  const handleOpenTrainer = (slideId: string) => {
    hapticFeedback.impactOccurred('medium');
    onSelectSlideForTraining(slideId);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 safe-pt">
      {/* Header */}
      <header className="px-5 pt-4 pb-3 sticky top-0 bg-[#F8F9FA]/95 backdrop-blur-md z-30 space-y-3 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Шпаргалки
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Дифференциальная диагностика препаратов к экзамену
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            strokeWidth={1.5}
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, клеткам, слоям..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X strokeWidth={1.5} className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-5 px-5 no-scrollbar pb-0.5">
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setSelectedModuleId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedModuleId === null
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Все ({slides.length})
          </button>
          {modules.map((m) => {
            const count = slides.filter((s) => s.module_id === m.id).length;
            if (count === 0) return null;
            const isSelected = selectedModuleId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  hapticFeedback.selectionChanged();
                  setSelectedModuleId(m.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {m.title.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </header>

      {/* Accordion Slide List */}
      <main className="px-5 pt-3 space-y-2.5 max-w-lg mx-auto">
        {filteredSlides.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Препаратов по вашему запросу не найдено
          </div>
        ) : (
          filteredSlides.map((slide) => {
            const isExpanded = expandedSlideId === slide.id;
            return (
              <div
                key={slide.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(slide.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer select-none active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img
                        src={slide.image_clean_url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-slate-900 leading-snug">
                        {slide.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500">
                          {slide.stain}
                        </span>
                        <span className="text-[11px] text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">
                          {slide.magnification}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 ml-2">
                    {isExpanded ? (
                      <ChevronUp strokeWidth={1.5} className="w-4 h-4 text-slate-700" />
                    ) : (
                      <ChevronDown strokeWidth={1.5} className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 bg-slate-50/40">
                    {/* Главный отличительный признак */}
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-800 text-[11px] font-bold">
                        <Sparkles strokeWidth={1.5} className="w-3.5 h-3.5 text-blue-600" />
                        <span>Главный отличительный признак</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {slide.exam_checklist.killer_feature}
                      </p>
                    </div>

                    {/* Слои и оболочки */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700">
                        Оболочки и слои:
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/70">
                        {slide.exam_checklist.layers}
                      </p>
                    </div>

                    {/* Ключевые клетки */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-700">
                        Ключевые клетки:
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/70">
                        {slide.exam_checklist.key_cells}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleOpenTrainer(slide.id)}
                      className="w-full mt-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-99"
                    >
                      <Microscope strokeWidth={1.5} className="w-3.5 h-3.5" />
                      <span>Диагностировать в микроскопе</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};
