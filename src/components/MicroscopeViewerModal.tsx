import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  GraduationCap,
  Copy,
  Check,
  Trash2,
  Plus,
  Crosshair,
  Move,
  Settings2,
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

const COLOR_PRESETS = [
  { label: 'Индиго', value: '#6366F1' },
  { label: 'Эозин (Розовый)', value: '#EC4899' },
  { label: 'Изумруд', value: '#10B981' },
  { label: 'Янтарь', value: '#F59E0B' },
  { label: 'Фиолетовый', value: '#8B5CF6' },
  { label: 'Коралл', value: '#EF4444' },
];

export const MicroscopeViewerModal: React.FC<MicroscopeViewerModalProps> = ({
  slide,
  isOpen,
  onClose,
  onStartQuiz,
}) => {
  const { hapticFeedback } = useTelegram();

  // Annotations state (can be edited by admin)
  const [annotations, setAnnotations] = useState<LayerAnnotation[]>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<LayerAnnotation | null>(null);

  // Admin Mode state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [isPinFormOpen, setIsPinFormOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<LayerAnnotation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Dragging state for existing pin
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);

  // Refs for tap detection & image element
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  const toastTimeoutRef = useRef<number | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Initialize annotations and admin mode
  useEffect(() => {
    if (slide) {
      setAnnotations(slide.layer_annotations ? [...slide.layer_annotations] : []);
    }
  }, [slide]);

  useEffect(() => {
    // Check ?admin=1 query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1') {
      setIsAdminMode(true);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  if (!isOpen || !slide) return null;

  // Secret 5-tap detection on slide title
  const handleTitleTap = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 500) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      hapticFeedback.impactOccurred('medium');
      setIsAdminMode((prev) => {
        const next = !prev;
        showToast(next ? '🛠️ Режим разметки включен' : 'Режим разметки выключен');
        return next;
      });
    }
  };

  const handleClose = () => {
    hapticFeedback.impactOccurred('light');
    setSelectedLayer(null);
    setIsPinFormOpen(false);
    setEditingPin(null);
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

    if (isAdminMode) {
      // In admin mode, clicking opens edit form
      setEditingPin({ ...layer });
      setIsPinFormOpen(true);
    } else {
      // In viewer mode, clicking toggles details card
      setSelectedLayer((prev) => (prev?.id === layer.id ? null : layer));
    }
  };

  // Click on image container to add a new pin in admin mode
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdminMode || !isPlacingPin) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX;
    const clickY = e.clientY;

    const rawX = ((clickX - rect.left) / rect.width) * 100;
    const rawY = ((clickY - rect.top) / rect.height) * 100;

    if (rawX < 0 || rawX > 100 || rawY < 0 || rawY > 100) return;

    const pinX = Math.round(rawX * 10) / 10;
    const pinY = Math.round(rawY * 10) / 10;

    hapticFeedback.impactOccurred('light');

    const nextNumber =
      annotations.length > 0
        ? Math.max(...annotations.map((a) => a.number)) + 1
        : 1;

    setEditingPin({
      id: `pin_${Date.now()}`,
      number: nextNumber,
      name: '',
      short_name: '',
      color: COLOR_PRESETS[(nextNumber - 1) % COLOR_PRESETS.length].value,
      description: '',
      pin_x: pinX,
      pin_y: pinY,
    });
    setIsPinFormOpen(true);
    setIsPlacingPin(false);
  };

  // Dragging pin around for fine tuning
  const handlePinPointerDown = (e: React.PointerEvent, layer: LayerAnnotation) => {
    if (!isAdminMode) return;
    e.stopPropagation();
    setDraggingPinId(layer.id);

    const container = imageContainerRef.current;
    if (!container) return;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const rawX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const rawY = ((moveEvent.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, Math.round(rawX * 10) / 10));
      const clampedY = Math.max(0, Math.min(100, Math.round(rawY * 10) / 10));

      setAnnotations((prev) =>
        prev.map((item) =>
          item.id === layer.id
            ? { ...item, pin_x: clampedX, pin_y: clampedY }
            : item
        )
      );
    };

    const onPointerUp = () => {
      setDraggingPinId(null);
      hapticFeedback.impactOccurred('light');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Save edited or newly created pin
  const handleSavePin = () => {
    if (!editingPin) return;

    const name = editingPin.name.trim() || `Слой ${editingPin.number}`;
    const shortName = editingPin.short_name.trim() || `Слой ${editingPin.number}`;

    const updatedPin: LayerAnnotation = {
      ...editingPin,
      name,
      short_name: shortName,
    };

    setAnnotations((prev) => {
      const exists = prev.some((p) => p.id === updatedPin.id);
      if (exists) {
        return prev.map((p) => (p.id === updatedPin.id ? updatedPin : p));
      }
      return [...prev, updatedPin].sort((a, b) => a.number - b.number);
    });

    hapticFeedback.notificationOccurred('success');
    showToast(`Метка «${shortName}» сохранена`);
    setIsPinFormOpen(false);
    setEditingPin(null);
  };

  // Delete pin
  const handleDeletePin = (id: string) => {
    hapticFeedback.impactOccurred('medium');
    setAnnotations((prev) => prev.filter((p) => p.id !== id));
    setIsPinFormOpen(false);
    setEditingPin(null);
    showToast('Метка удалена');
  };

  // Reset to slide defaults
  const handleResetAnnotations = () => {
    hapticFeedback.impactOccurred('medium');
    if (confirm('Сбросить метки к исходному состоянию?')) {
      setAnnotations(slide.layer_annotations ? [...slide.layer_annotations] : []);
      showToast('Метки сброшены');
    }
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    const formattedData = annotations.map((a) => ({
      id: a.id,
      number: a.number,
      name: a.name,
      short_name: a.short_name,
      color: a.color,
      description: a.description,
      pin_x: a.pin_x,
      pin_y: a.pin_y,
    }));

    const jsonString = JSON.stringify(formattedData, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      hapticFeedback.notificationOccurred('success');
      showToast('✅ JSON скопирован в буфер!');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      showToast('Ошибка копирования в буфер');
    }
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-black/85 backdrop-blur-xl text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 shadow-2xl animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Top Header Floating Bar */}
      <header className="px-4 py-3 z-30 flex items-center justify-between bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all shrink-0"
            title="Закрыть окуляр"
          >
            <X strokeWidth={2} className="w-5 h-5 text-white" />
          </button>

          {/* 5-Tap Title for Secret Admin Toggle */}
          <div
            onClick={handleTitleTap}
            className="min-w-0 cursor-pointer active:opacity-75 transition-opacity"
            title="Тапните 5 раз для включения режима разметки"
          >
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white tracking-tight truncate">
                {slide.title}
              </h2>
              {isAdminMode && (
                <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Settings2 className="w-3 h-3" />
                  EDIT
                </span>
              )}
            </div>
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
          disabled={isPlacingPin || draggingPinId !== null}
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

              {/* Status Hint */}
              <div className="absolute bottom-24 left-4 z-20 pointer-events-none">
                {isAdminMode ? (
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/30 backdrop-blur-md px-3 py-1 rounded-full">
                    {isPlacingPin
                      ? '🎯 Кликните по срезу для установки метки'
                      : 'Тапните по метке для редактирования или перетащите'}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-white/40 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    Двойной тап или щипок для зума
                  </span>
                )}
              </div>

              {/* Pan & Zoom Canvas */}
              <div
                className={`w-full h-full flex items-center justify-center ${
                  isPlacingPin ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
                }`}
              >
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center"
                >
                  <div
                    ref={imageContainerRef}
                    onClick={handleImageClick}
                    className="relative inline-block max-w-full max-h-full"
                  >
                    {/* Authentic Crystal-Clear Micrograph */}
                    <img
                      src={slide.image_clean_url}
                      alt={slide.title}
                      className="max-h-[82vh] max-w-[96vw] object-contain pointer-events-none select-none rounded-lg"
                    />

                    {/* Interactive Layer Pin Overlays */}
                    {showAnnotations &&
                      annotations.map((layer) => {
                        const isSelected = selectedLayer?.id === layer.id;
                        const isDragging = draggingPinId === layer.id;

                        return (
                          <div
                            key={layer.id}
                            style={{
                              left: `${layer.pin_x}%`,
                              top: `${layer.pin_y}%`,
                            }}
                            onPointerDown={(e) => handlePinPointerDown(e, layer)}
                            onClick={(e) => handlePinClick(e, layer)}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer z-30 group select-none ${
                              isDragging ? 'z-40 scale-125' : ''
                            }`}
                          >
                            {/* Animated Pulse Ring */}
                            <span
                              className="absolute -inset-1.5 rounded-full animate-ping opacity-40 pointer-events-none"
                              style={{ backgroundColor: layer.color }}
                            />

                            {/* Circular Pin Badge */}
                            <div
                              className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-transform duration-150 ${
                                isSelected || isDragging
                                  ? 'scale-125 ring-3 ring-white'
                                  : 'hover:scale-115 ring-2 ring-white/80'
                              }`}
                              style={{ backgroundColor: layer.color }}
                            >
                              <span className="text-white drop-shadow-sm">{layer.number}</span>
                            </div>

                            {/* Label Pill on Pin */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/85 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap border border-white/20 shadow-md opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1">
                              {isAdminMode && <Move className="w-2.5 h-2.5 text-amber-300" />}
                              <span>{layer.short_name}</span>
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

        {/* Regular Mode: Selected Layer Detail Popover Card */}
        {!isAdminMode && selectedLayer && (
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

        {/* Admin Mode: Pin Edit & Creation Modal */}
        {isPinFormOpen && editingPin && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/15 w-full max-w-sm rounded-[24px] p-5 shadow-2xl space-y-3.5 text-white animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: editingPin.color }}
                  >
                    {editingPin.number}
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {annotations.some((p) => p.id === editingPin.id)
                      ? `Метка #${editingPin.number}`
                      : 'Новая метка'}
                  </h3>
                </div>

                <div className="text-[11px] text-white/50 font-mono bg-white/5 px-2 py-0.5 rounded-md">
                  X: {editingPin.pin_x}% Y: {editingPin.pin_y}%
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-white/60 block mb-1">
                    Короткая подпись (для пина)
                  </label>
                  <input
                    type="text"
                    value={editingPin.short_name}
                    onChange={(e) =>
                      setEditingPin({ ...editingPin, short_name: e.target.value })
                    }
                    placeholder="Например: Эпителий"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-white/60 block mb-1">
                    Полное анатомическое название
                  </label>
                  <input
                    type="text"
                    value={editingPin.name}
                    onChange={(e) =>
                      setEditingPin({ ...editingPin, name: e.target.value })
                    }
                    placeholder="Например: Многорядный мерцательный эпителий"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-white/60 block mb-1">
                    Гистологическое описание
                  </label>
                  <textarea
                    rows={2}
                    value={editingPin.description}
                    onChange={(e) =>
                      setEditingPin({ ...editingPin, description: e.target.value })
                    }
                    placeholder="Клеточный состав, особенности окраски..."
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 resize-none"
                  />
                </div>

                {/* Color Palette */}
                <div>
                  <label className="text-[11px] font-semibold text-white/60 block mb-1.5">
                    Цвет маркера
                  </label>
                  <div className="flex items-center gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() =>
                          setEditingPin({ ...editingPin, color: preset.value })
                        }
                        className={`w-7 h-7 rounded-full transition-transform ${
                          editingPin.color === preset.value
                            ? 'scale-120 ring-2 ring-white'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.value }}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-between gap-2">
                {annotations.some((p) => p.id === editingPin.id) ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePin(editingPin.id)}
                    className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors flex items-center justify-center shrink-0"
                    title="Удалить метку"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : null}

                <div className="flex items-center gap-2 ml-auto w-full justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPinFormOpen(false);
                      setEditingPin(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/80 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Admin Editor HUD vs Normal Mode Legend */}
      {isAdminMode ? (
        /* Floating Admin Toolbar */
        <div className="z-30 bg-slate-900/95 backdrop-blur-xl border-t border-amber-500/30 px-4 py-3 safe-pb shadow-2xl">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2">
            {/* Toggle Place Pin Mode */}
            <button
              onClick={() => {
                hapticFeedback.impactOccurred('light');
                setIsPlacingPin((prev) => !prev);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                isPlacingPin
                  ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isPlacingPin ? (
                <>
                  <Crosshair className="w-4 h-4 animate-spin" />
                  <span>Кликните на срез</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>+ Новый пин</span>
                </>
              )}
            </button>

            {/* Reset Pins */}
            <button
              onClick={handleResetAnnotations}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              title="Сбросить к исходным"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Copy JSON Button */}
            <button
              onClick={handleCopyJson}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-lg ${
                copied
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Скопировано!' : 'Скопировать JSON'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Regular Mode: Bottom Floating Layer Legend Chips */
        showAnnotations &&
        annotations.length > 0 && (
          <div className="z-30 bg-black/80 backdrop-blur-xl border-t border-white/10 px-4 py-2.5 safe-pb">
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <div className="text-[11px] font-bold text-white/40 shrink-0 mr-1 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>Слои:</span>
                </div>
                {annotations.map((layer) => {
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
        )
      )}
    </div>
  );
};
