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
    <div className="min-h-screen bg-[#F2F4F7] pb-28 safe-pt">
      {/* Header */}
      <header className="px-5 pt-4 pb-3 sticky top-0 bg-[#F2F4F7]/95 backdrop-blur-md z-30 space-y-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 leading-tight">
            Атлас и шпаргалки
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Дифференциальная диагностика препаратов к экзамену
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            strokeWidth={1.75}
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, клеткам, слоям..."
            className="w-full pl-10 pr-10 py-3 bg-white border-0 shadow-[0_2px_10px_rgba(15,23,42,0.03)] rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all select-none border-0 ${
              selectedModuleId === null
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 shadow-xs hover:bg-slate-50'
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all select-none border-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 shadow-xs hover:bg-slate-50'
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
          <div className="py-16 text-center text-slate-400 text-xs">
            Препаратов по вашему запросу не найдено
          </div>
        ) : (
          filteredSlides.map((slide) => {
            const isExpanded = expandedSlideId === slide.id;
            return (
              <div
                key={slide.id}
                className="bg-white rounded-[22px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-0 overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(slide.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-900 shrink-0">
                      <img
                        src={slide.image_clean_url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug truncate">
                        {slide.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">
                          {slide.stain}
                        </span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          {slide.magnification}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 pl-2 shrink-0">
                    {isExpanded ? (
                      <ChevronUp strokeWidth={2} className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <ChevronDown strokeWidth={2} className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-slate-100">
                    {/* Image Preview & Quick Launch Button */}
                    <div className="relative rounded-2xl overflow-hidden bg-[#090D16] h-44 flex items-center justify-center">
                      <img
                        src={slide.image_clean_url}
                        alt={slide.title}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => handleOpenTrainer(slide.id)}
                        className="absolute bottom-2.5 right-2.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Microscope className="w-3.5 h-3.5" />
                        <span>Открыть в окуляре</span>
                      </button>
                    </div>

                    {/* Главный отличительный признак */}
                    <div className="bg-indigo-50/80 p-3.5 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-900 text-xs font-bold">
                        <Sparkles strokeWidth={1.75} className="w-4 h-4 text-indigo-600" />
                        <span>Главный отличительный признак</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {slide.exam_checklist.killer_feature}
                      </p>
                    </div>

                    {/* Layers Checklist */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                        Оболочки и слои
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-2xl font-normal">
                        {slide.exam_checklist.layers}
                      </p>
                    </div>

                    {/* Key Cells */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                        Ключевые клетки
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-2xl font-normal">
                        {slide.exam_checklist.key_cells}
                      </p>
                    </div>
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
