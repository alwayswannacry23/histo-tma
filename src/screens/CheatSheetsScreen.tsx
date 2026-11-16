import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-screen bg-[#F4F5F7] pb-28 safe-pt">
      {/* Header */}
      <header className="px-5 pt-3 pb-3 sticky top-0 bg-[#F4F5F7]/90 backdrop-blur-md z-30 space-y-3">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 leading-tight">
            Шпаргалки
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Диагностические маркеры и слои для экзамена
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            strokeWidth={1.5}
            className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, клеткам, слоям..."
            className="w-full pl-10 pr-10 py-3 bg-white shadow-ios rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X strokeWidth={1.5} className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips - Horizontal Scroll without scrollbar */}
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-5 px-5 no-scrollbar pb-1">
          <button
            onClick={() => {
              hapticFeedback.selectionChanged();
              setSelectedModuleId(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedModuleId === null
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-500 shadow-ios hover:text-slate-800'
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-500 shadow-ios hover:text-slate-800'
                }`}
              >
                {m.title.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>
      </header>

      {/* Accordion Slide Cards List */}
      <main className="px-5 pt-2 space-y-3 max-w-lg mx-auto">
        {filteredSlides.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Препаратов по вашему запросу не найдено
          </div>
        ) : (
          filteredSlides.map((slide) => {
            const isExpanded = expandedSlideId === slide.id;
            return (
              <motion.div
                key={slide.id}
                layout
                className="bg-white rounded-2xl shadow-ios overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(slide.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Micro Thumbnail inside Dark Circle */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0F172A] shrink-0 p-1 flex items-center justify-center">
                      <img
                        src={slide.image_clean_url}
                        alt={slide.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {slide.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400">
                          {slide.stain}
                        </span>
                        <span className="text-[11px] text-slate-300">•</span>
                        <span className="text-[11px] text-slate-400">
                          {slide.magnification}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-300 ml-2">
                    {isExpanded ? (
                      <ChevronUp strokeWidth={1.5} className="w-5 h-5 text-slate-700" />
                    ) : (
                      <ChevronDown strokeWidth={1.5} className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Accordion Drawer Content - Clean Typography with Colored Bullets */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5 pt-1 space-y-3.5"
                    >
                      {/* Главный отличительный признак */}
                      <div className="bg-blue-50/70 p-3.5 rounded-2xl space-y-1">
                        <div className="flex items-center gap-1.5 text-blue-800 text-[11px] font-bold">
                          <Sparkles strokeWidth={1.5} className="w-3.5 h-3.5 text-blue-600" />
                          <span>Главный отличительный признак</span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">
                          {slide.exam_checklist.killer_feature}
                        </p>
                      </div>

                      {/* Оболочки и слои (Bullet points) */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>Оболочки и слои:</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-3.5">
                          {slide.exam_checklist.layers}
                        </p>
                      </div>

                      {/* Ключевые клетки (Bullet points) */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Ключевые клетки:</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-3.5">
                          {slide.exam_checklist.key_cells}
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleOpenTrainer(slide.id)}
                        className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
                      >
                        <Microscope strokeWidth={1.5} className="w-4 h-4" />
                        <span>Диагностировать в микроскопе</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
};
