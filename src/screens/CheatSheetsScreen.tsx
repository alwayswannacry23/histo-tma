import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Sparkles, Layers, Microscope, X } from 'lucide-react';
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
      // Module filter
      if (selectedModuleId && slide.module_id !== selectedModuleId) {
        return false;
      }
      if (!q) return true;

      // Text search in title, stain, layers, cells, killer feature
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
    <div className="min-h-screen bg-white pb-24 safe-pt">
      {/* Header */}
      <header className="px-5 pt-4 pb-3 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-30">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Справочник • Экзаменационный атлас
        </span>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Шпаргалки по препаратам
        </h1>

        {/* Real-time Search Input */}
        <div className="mt-3 relative">
          <Search
            strokeWidth={1.5}
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, клеткам, признакам..."
            className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
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

        {/* Module Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto mt-3 pb-1 -mx-5 px-5 no-scrollbar">
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setSelectedModuleId(null);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              selectedModuleId === null
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {m.title.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </header>

      {/* Accordion Slide List */}
      <main className="px-5 pt-4 space-y-3">
        {filteredSlides.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Препаратов по вашему запросу не найдено
          </div>
        ) : (
          filteredSlides.map((slide) => {
            const isExpanded = expandedSlideId === slide.id;
            return (
              <div
                key={slide.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(slide.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    {/* Micro Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img
                        src={slide.image_clean_url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-slate-900 leading-tight">
                        {slide.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">
                          {slide.stain}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-500">
                          {slide.magnification}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 ml-2">
                    {isExpanded ? (
                      <ChevronUp strokeWidth={1.5} className="w-4 h-4" />
                    ) : (
                      <ChevronDown strokeWidth={1.5} className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-3 animate-fade-in">
                    {/* Killer Feature */}
                    <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <Sparkles strokeWidth={1.5} className="w-3 h-3" />
                        <span>Киллер-фича (Главный признак)</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {slide.exam_checklist.killer_feature}
                      </p>
                    </div>

                    {/* Layers */}
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                        <Layers strokeWidth={1.5} className="w-3 h-3" />
                        <span>Слои и оболочки:</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {slide.exam_checklist.layers}
                      </p>
                    </div>

                    {/* Key Cells */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 mb-1">
                        Ключевые клетки:
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {slide.exam_checklist.key_cells}
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleOpenTrainer(slide.id)}
                      className="w-full mt-2 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
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
