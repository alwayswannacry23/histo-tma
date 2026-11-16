import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Slide, LayerAnnotation } from '../types';
import { useTelegram } from '../telegram/TelegramContext';

interface MicroscopeViewerModalProps {
  slide: Slide | null;
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz?: (slideId: string) => void;
}

export const MicroscopeViewerModal: React.FC<MicroscopeViewerModalProps> = ({
  slide,
  isOpen,
  onClose,
  onStartQuiz,
}) => {
  const { hapticFeedback } = useTelegram();
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<LayerAnnotation | null>(null);

  if (!isOpen || !slide) return null;

  const handleClose = () => {
    hapticFeedback.impactOccurred('light');
    setSelectedLayer(null);
    onClose();
  };

  const handleToggleAnnotations = () => {
    hapticFeedback.impactOccurred('light');
    setShowAnnotations((prev) => !prev);
    if (showAnnotations) {
      setSelectedLayer(null);
    }
  };

  const handlePinClick = (e: React.MouseEvent, layer: LayerAnnotation) => {
    e.stopPropagation();
    hapticFeedback.selectionChanged();
    setSelectedLayer((prev) => (prev?.id === layer.id ? null : layer));
  };

  const handleStartQuizClick = () => {
    if (onStartQuiz) {
      hapticFeedback.impactOccurred('medium');
      onStartQuiz(slide.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E] text-white flex flex-col select-none overflow-hidden safe-pt">
      {/* Top Header Floating Glass Bar */}
      <header className="px-4 py-3 z-30 flex items-center justify-between bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all shrink-0"
            title="Закрыть окуляр"
          >
            <X strokeWidth={2} className="w-5 h-5 text-white" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">
              {slide.title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-white/60">
              <span>{slide.stain}</span>
              <span>•</span>
              <span className="text-indigo-400 font-semibold">{slide.magnification}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggleAnnotations}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
              showAnnotations
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {showAnnotations ? (
              <>
                <EyeOff strokeWidth={1.8} className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Скрыть метки</span>
              </>
            ) : (
              <>
                <Eye strokeWidth={1.8} className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Слои</span>
              </>
            )}
          </button>

          {onStartQuiz && (
            <button
              onClick={handleStartQuizClick}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95 border border-emerald-500/30"
              title="Пройти тест по этому препарату"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Тест</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Microscope Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#07090E] flex items-center justify-center">
        {/* Soft Vignette Overlay around lens to give realistic optical microscope depth */}
        <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]" />

        <TransformWrapper
          initialScale={1}
          minScale={0.7}
          maxScale={8}
          centerOnInit
          wheel={{ step: 0.15 }}
          doubleClick={{ mode: 'zoomIn', step: 0.7 }}
        >
          {({ zoomIn, zoomOut, resetTransform, setTransform }) => (
            <>
              {/* Floating Magnification Selector & Zoom Controls (Right HUD) */}
              <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-2">
                {/* Manual Zoom Buttons */}
                <div className="flex flex-col items-center gap-1 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-xl">
                  <button
                    onClick={() => zoomIn(0.4)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                    title="Приблизить"
                  >
                    <ZoomIn strokeWidth={1.8} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => zoomOut(0.4)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                    title="Отдалить"
                  >
                    <ZoomOut strokeWidth={1.8} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                    title="Сброс масштаба"
                  >
                    <RotateCcw strokeWidth={1.8} className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Objective Turret Presets (4x, 10x, 40x, 100x) */}
                <div className="hidden sm:flex flex-col items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-2xl border border-white/10 text-[10px] font-bold">
                  {[
                    { label: '4x', scale: 1 },
                    { label: '10x', scale: 2 },
                    { label: '40x', scale: 4 },
                    { label: '100x', scale: 7 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setTransform(0, 0, preset.scale)}
                      className="w-7 h-6 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ocular Reticle / Help hint in bottom-left */}
              <div className="absolute bottom-24 left-4 z-20 pointer-events-none">
                <span className="text-[10px] font-medium text-white/40 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  Двойной тап или щипок для зума
                </span>
              </div>

              {/* Pan & Zoom Canvas */}
              <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center"
                >
                  <div className="relative inline-block max-w-full max-h-full">
                    {/* Authentic Crystal-Clear Micrograph */}
                    <img
                      src={slide.image_clean_url}
                      alt={slide.title}
                      className="max-h-[82vh] max-w-[96vw] object-contain pointer-events-none select-none rounded-lg"
                    />

                    {/* Interactive Layer Pin Overlays */}
                    {showAnnotations &&
                      slide.layer_annotations &&
                      slide.layer_annotations.map((layer) => {
                        const isSelected = selectedLayer?.id === layer.id;
                        return (
                          <div
                            key={layer.id}
                            style={{
                              left: `${layer.pin_x}%`,
                              top: `${layer.pin_y}%`,
                            }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-30 group"
                            onClick={(e) => handlePinClick(e, layer)}
                          >
                            {/* Animated Pulse Ring */}
                            <span
                              className="absolute -inset-1.5 rounded-full animate-ping opacity-40"
                              style={{ backgroundColor: layer.color }}
                            />

                            {/* Circular Pin Badge */}
                            <div
                              className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-transform duration-200 active:scale-90 ${
                                isSelected
                                  ? 'scale-125 ring-3 ring-white'
                                  : 'hover:scale-115 ring-2 ring-white/80'
                              }`}
                              style={{ backgroundColor: layer.color }}
                            >
                              <span className="text-white drop-shadow-sm">{layer.number}</span>
                            </div>

                            {/* Label Pill on Pin */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border border-white/20 shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                              {layer.short_name}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </TransformComponent>
              </div>
            </>
          )}
        </TransformWrapper>

        {/* Selected Layer Detail Popover Card */}
        {selectedLayer && (
          <div className="absolute bottom-24 left-4 right-4 z-40 max-w-md mx-auto">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-2xl space-y-2 text-white animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: selectedLayer.color }}
                  >
                    {selectedLayer.number}
                  </span>
                  <h4 className="text-xs font-bold text-white tracking-tight">
                    {selectedLayer.name}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedLayer(null)}
                  className="p-1 rounded-full text-white/50 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-white/80 leading-relaxed font-normal">
                {selectedLayer.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Layer Legend Chips */}
      {showAnnotations && slide.layer_annotations && (
        <div className="z-30 bg-black/80 backdrop-blur-xl border-t border-white/10 px-4 py-2.5 safe-pb">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <div className="text-[11px] font-bold text-white/40 shrink-0 mr-1 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>Слои:</span>
              </div>
              {slide.layer_annotations.map((layer) => {
                const isSelected = selectedLayer?.id === layer.id;
                return (
                  <button
                    key={layer.id}
                    onClick={() => {
                      hapticFeedback.selectionChanged();
                      setSelectedLayer((prev) => (prev?.id === layer.id ? null : layer));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-md ring-2 ring-indigo-400'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span>
                      {layer.number}. {layer.short_name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
