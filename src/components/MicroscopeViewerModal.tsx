import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Zap,
  Copy,
  Trash2,
  Check,
  Info,
  X,
  Microscope,
  ChevronLeft,
  ChevronRight,
  Crosshair,
} from 'lucide-react';
import { HistSlide, SlideLayer } from '../data/histoData';
import { getReadableAccent, hexWithAlpha } from '../utils/colorContrast';
import { BottomSheet } from './BottomSheet';

interface Props {
  slide: HistSlide;
  onClose: () => void;
  onStartTest: (slide: HistSlide) => void;
  accentHex?: string;
  accentTextColor?: string;
  topInsetPx?: number;
  isDark?: boolean;
}

const PIN_COLORS = [
  { label: 'Индиго', hex: '#6366F1' },
  { label: 'Эозин', hex: '#EC4899' },
  { label: 'Изумруд', hex: '#10B981' },
  { label: 'Янтарь', hex: '#F59E0B' },
  { label: 'Бирюза', hex: '#2DD4BF' },
];

function isPointInPolygon(px: number, py: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function checkLayerHit(normX: number, normY: number, layer: SlideLayer): boolean {
  if (Array.isArray(layer.polygon) && layer.polygon.length >= 3) {
    if (isPointInPolygon(normX * 10, normY * 10, layer.polygon)) {
      return true;
    }
  }
  if (typeof layer.pin_x === 'number' && typeof layer.pin_y === 'number') {
    const dist = Math.hypot(normX - layer.pin_x, normY - layer.pin_y);
    if (dist <= 9.5) return true;
  }
  return false;
}

function triggerHaptic(type: 'light' | 'medium' | 'success' | 'error'): void {
  try {
    const hf = (window as unknown as {
      Telegram?: {
        WebApp?: {
          HapticFeedback?: {
            impactOccurred?: (s: string) => void;
            notificationOccurred?: (t: string) => void;
          };
        };
      };
    }).Telegram?.WebApp?.HapticFeedback;
    if (type === 'success' || type === 'error') {
      hf?.notificationOccurred?.(type);
    } else {
      hf?.impactOccurred?.(type);
    }
  } catch {
    // ignore
  }
}

export const MicroscopeViewerModal: React.FC<Props> = ({
  slide,
  onClose,
  onStartTest,
  accentHex = '#2DD4BF',
  accentTextColor = '#09090B',
  topInsetPx = 16,
}) => {
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [sliderOpacity, setSliderOpacity] = useState(100);
  const [viewMode, setViewMode] = useState<'explore' | 'steps' | 'spotter'>('explore');

  // Spotter ("Найти на стекле") state
  const [spotterOrder, setSpotterOrder] = useState<number[]>([]);
  const [spotterPos, setSpotterPos] = useState(0);
  const [spotterScore, setSpotterScore] = useState(0);
  const [spotterFeedback, setSpotterFeedback] = useState<{
    status: 'hit' | 'miss';
    tapX: number;
    tapY: number;
  } | null>(null);
  const [spotterDone, setSpotterDone] = useState(false);

  const [isAdmin, setIsAdmin] = useState<boolean>(() => window.location.search.includes('admin=1'));
  const [adminMode, setAdminMode] = useState<'pin' | 'polygon'>('pin');
  const [polygonDraft, setPolygonDraft] = useState<[number, number][]>([]);
  const [tapCount, setTapCount] = useState(0);

  const [layers, setLayers] = useState<SlideLayer[]>(() => slide.layers || []);
  const [activeLayerIdx, setActiveLayerIdx] = useState<number>(0);
  const [copiedJson, setCopiedJson] = useState(false);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const darkAccentInk = useMemo(() => getReadableAccent(accentHex, true), [accentHex]);

  const startSpotter = (sourceLayers: SlideLayer[]) => {
    const indices = sourceLayers.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setSpotterOrder(indices);
    setSpotterPos(0);
    setSpotterScore(0);
    setSpotterFeedback(null);
    setSpotterDone(false);
    transformRef.current?.resetTransform(0);
  };

  useEffect(() => {
    setActiveSliceIndex(0);
    setImageFailed(false);
    setViewMode('explore');
    setLayers(slide.layers || []);
    setActiveLayerIdx(0);
    setPolygonDraft([]);
    setSpotterFeedback(null);
    setSpotterDone(false);
    transformRef.current?.resetTransform(0);
  }, [slide.id]);

  const activeLayer = layers.length > 0 ? layers[Math.min(activeLayerIdx, layers.length - 1)] : null;
  const spotterTargetIdx =
    spotterOrder.length > 0 ? spotterOrder[Math.min(spotterPos, spotterOrder.length - 1)] : 0;
  const spotterTargetLayer = layers[spotterTargetIdx] || null;

  const activeImageUrl =
    slide.imageUrls && slide.imageUrls.length > activeSliceIndex
      ? slide.imageUrls[activeSliceIndex]
      : slide.imageUrl;

  useEffect(() => {
    setImageFailed(false);
  }, [activeImageUrl]);

  const hasImage = Boolean(activeImageUrl && activeImageUrl.trim()) && !imageFailed;

  const handleModeSwitch = (nextMode: 'explore' | 'steps' | 'spotter') => {
    setViewMode(nextMode);
    if (nextMode === 'spotter') {
      startSpotter(layers);
    } else {
      setSpotterFeedback(null);
      setSpotterDone(false);
    }
  };

  const handleSliceChange = (idx: number) => {
    setActiveSliceIndex(idx);
    setImageFailed(false);
    if (idx > 0 && viewMode === 'spotter') {
      setViewMode('explore');
    }
    transformRef.current?.resetTransform(0);
  };

  const handleHeaderTap = () => {
    const next = tapCount + 1;
    if (next >= 5) {
      setIsAdmin((prev) => !prev);
      setTapCount(0);
      triggerHaptic('medium');
    } else {
      setTapCount(next);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const normY = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

    // Режим «Найти на стекле» (Spotter)
    if (viewMode === 'spotter' && activeSliceIndex === 0 && spotterTargetLayer && !spotterDone) {
      if (spotterFeedback) return;
      const isHit = checkLayerHit(normX, normY, spotterTargetLayer);
      setSpotterFeedback({ status: isHit ? 'hit' : 'miss', tapX: normX, tapY: normY });
      if (isHit) {
        setSpotterScore((s) => s + 1);
        triggerHaptic('success');
      } else {
        triggerHaptic('error');
      }
      return;
    }

    // Режим разметки (?admin=1)
    if (!isAdmin || activeSliceIndex > 0) return;

    if (adminMode === 'polygon') {
      const pt: [number, number] = [Math.round(normX * 10), Math.round(normY * 10)];
      setPolygonDraft((prev) => [...prev, pt]);
      return;
    }

    const newPin: SlideLayer = {
      number: layers.length + 1,
      short_name: `Слой ${layers.length + 1}`,
      name: `Слой ${layers.length + 1}`,
      description: '',
      color: PIN_COLORS[layers.length % PIN_COLORS.length].hex,
      pin_x: Math.max(2, Math.min(98, normX)),
      pin_y: Math.max(2, Math.min(98, normY)),
    };
    setLayers((prev) => [...prev, newPin]);
    setActiveLayerIdx(layers.length);
  };

  const handleSpotterNext = () => {
    setSpotterFeedback(null);
    if (spotterPos + 1 < spotterOrder.length) {
      setSpotterPos((p) => p + 1);
    } else {
      setSpotterDone(true);
    }
  };

  const finishPolygonDraft = () => {
    if (polygonDraft.length < 3) return;
    const avgX = Math.round(polygonDraft.reduce((acc, p) => acc + p[0], 0) / polygonDraft.length / 10);
    const avgY = Math.round(polygonDraft.reduce((acc, p) => acc + p[1], 0) / polygonDraft.length / 10);
    const newLayer: SlideLayer = {
      number: layers.length + 1,
      short_name: `Зона ${layers.length + 1}`,
      name: `Зона ${layers.length + 1}`,
      description: '',
      color: PIN_COLORS[layers.length % PIN_COLORS.length].hex,
      pin_x: avgX,
      pin_y: avgY,
      polygon: polygonDraft,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerIdx(layers.length);
    setPolygonDraft([]);
  };

  const deletePin = (num: number) => {
    const filtered = layers
      .filter((l) => l.number !== num)
      .map((l, idx) => ({ ...l, number: idx + 1 }));
    setLayers(filtered);
    setActiveLayerIdx(0);
  };

  const copyLayersJson = async () => {
    try {
      const payload = JSON.stringify(layers, null, 2);
      await navigator.clipboard.writeText(payload);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
  };

  const isSpotterActive = viewMode === 'spotter' && activeSliceIndex === 0;
  const opacityRatio = isSpotterActive ? (spotterFeedback || spotterDone ? 1 : 0) : sliderOpacity / 100;
  const canStep = hasImage && layers.length > 0 && activeSliceIndex === 0;
  const hasMultipleSlices = Boolean(hasImage && slide.imageUrls && slide.imageUrls.length > 1);

  const visibleLayers = useMemo(() => {
    if (!isSpotterActive) return layers;
    if (spotterDone) return layers;
    if (spotterFeedback && spotterTargetLayer) return [spotterTargetLayer];
    return [];
  }, [isSpotterActive, layers, spotterDone, spotterFeedback, spotterTargetLayer]);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B] text-[#F4F4F5] flex flex-col select-none">
      {/* 1. Шапка окуляра */}
      <div
        style={{ paddingTop: `${Math.max(topInsetPx, 12)}px` }}
        className="px-4 pb-3 bg-[#09090B]/95 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between gap-3 z-20 shrink-0"
      >
        <div onClick={handleHeaderTap} className="min-w-0 flex-1 cursor-pointer">
          <div className="text-[12px] font-mono tabular-nums text-zinc-400">
            Препарат №{slide.examNumber} {isAdmin ? '· Разметка' : ''}
          </div>
          <h2 className="text-[15px] font-semibold text-white truncate leading-tight mt-0.5">
            {slide.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onStartTest(slide)}
            style={{ backgroundColor: accentHex, color: accentTextColor }}
            className="px-3 h-8 rounded-lg font-medium text-[12px] flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Тест</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.08] text-zinc-300 flex items-center justify-center transition-transform active:scale-95"
            aria-label="Закрыть микроскоп"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 2. Вынесенная полоса переключения срезов */}
      {hasMultipleSlices && (
        <div className="px-4 py-2 bg-[#0F0F12] border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 z-20">
          {slide.imageUrls!.map((_, idx) => {
            const active = activeSliceIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSliceChange(idx)}
                className={`px-3 h-7 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active ? 'bg-white text-zinc-900' : 'bg-white/[0.06] text-zinc-400'
                }`}
              >
                {slide.imageLabels?.[idx] || `Срез ${idx + 1}`}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Панель разметки (?admin=1) */}
      {isAdmin && hasImage && activeSliceIndex === 0 && (
        <div className="px-4 py-2 bg-[#131316] border-b border-white/[0.08] flex items-center justify-between gap-2 text-[12px] z-20 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAdminMode('pin');
                setPolygonDraft([]);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                adminMode === 'pin' ? 'bg-white text-zinc-900' : 'bg-white/[0.06] text-zinc-400'
              }`}
            >
              Точка
            </button>
            <button
              type="button"
              onClick={() => setAdminMode('polygon')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                adminMode === 'polygon' ? 'bg-white text-zinc-900' : 'bg-white/[0.06] text-zinc-400'
              }`}
            >
              Полигон {polygonDraft.length > 0 ? `(${polygonDraft.length})` : ''}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {adminMode === 'polygon' && polygonDraft.length >= 3 && (
              <button
                type="button"
                onClick={finishPolygonDraft}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium"
              >
                Замкнуть
              </button>
            )}
            <button
              type="button"
              onClick={copyLayersJson}
              className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-zinc-300 flex items-center gap-1"
            >
              {copiedJson ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
              ) : (
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              <span>{copiedJson ? 'Готово' : 'JSON'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Основное поле */}
      {!hasImage ? (
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="max-w-md mx-auto space-y-4">
            <div className="rounded-2xl p-4 bg-[#131316] border border-white/[0.08] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                <Microscope className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold">Микрофотография готовится</div>
                <div className="text-[12px] text-zinc-400">
                  Ниже доступен полный экзаменационный разбор препарата
                </div>
              </div>
            </div>

            {slide.stain && (
              <div className="rounded-2xl p-4 bg-[#131316] border border-white/[0.08] space-y-1">
                <div className="text-[12px] font-medium text-zinc-400">Окраска</div>
                <div className="text-[14px] text-zinc-200">{slide.stain}</div>
              </div>
            )}

            {(slide.killerFeature || slide.examPlan?.killerFeature) && (
              <div className="relative overflow-hidden rounded-2xl p-4 pl-5 bg-[#1D1810] border border-amber-500/20 space-y-1">
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-amber-500" />
                <div className="text-[12px] font-semibold text-amber-300">Главный признак</div>
                <div className="text-[14px] text-zinc-200 leading-relaxed">
                  {slide.killerFeature || slide.examPlan?.killerFeature}
                </div>
              </div>
            )}

            {(slide.examPlan?.structure || slide.layersText) && (
              <div className="rounded-2xl p-4 bg-[#131316] border border-white/[0.08] space-y-1.5">
                <div className="text-[12px] font-medium text-zinc-400">Строение и слои</div>
                <div className="text-[14px] text-zinc-300 leading-relaxed whitespace-pre-line">
                  {slide.examPlan?.structure || slide.layersText}
                </div>
              </div>
            )}

            {(slide.functionText || slide.examPlan?.functionText) && (
              <div className="rounded-2xl p-4 bg-[#131316] border border-white/[0.08] space-y-1.5">
                <div className="text-[12px] font-medium text-zinc-400">Функция</div>
                <div className="text-[14px] text-zinc-300 leading-relaxed">
                  {slide.functionText || slide.examPlan?.functionText}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="relative flex-1 min-h-0 overflow-hidden bg-black">
            <TransformWrapper
              ref={transformRef}
              initialScale={1}
              minScale={0.9}
              maxScale={6}
              wheel={{ step: 0.15 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Кнопки зума */}
                  <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => zoomIn(0.5)}
                      aria-label="Приблизить"
                      className="w-8 h-8 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 active:scale-95 transition-transform"
                    >
                      <ZoomIn className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => zoomOut(0.5)}
                      aria-label="Отдалить"
                      className="w-8 h-8 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 active:scale-95 transition-transform"
                    >
                      <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => resetTransform()}
                      aria-label="Сброс зума"
                      className="w-8 h-8 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 active:scale-95 transition-transform"
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Ползунок разметки и кнопка Разбор */}
                  <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
                    {layers.length > 0 && activeSliceIndex === 0 && !isSpotterActive && (
                      <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white">
                        <button
                          type="button"
                          onClick={() => setSliderOpacity(sliderOpacity > 0 ? 0 : 100)}
                          className="text-zinc-300"
                          aria-label="Переключить разметку"
                        >
                          {sliderOpacity > 0 ? (
                            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                          )}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderOpacity}
                          onChange={(e) => setSliderOpacity(Number(e.target.value))}
                          className="w-14 h-1 accent-white bg-white/20 rounded-lg cursor-pointer"
                        />
                        <span className="text-[11px] font-mono tabular-nums text-zinc-300 min-w-[28px] text-right">
                          {sliderOpacity}%
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowInfoSheet(true)}
                      className="px-2.5 h-8 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[12px] font-medium flex items-center gap-1.5 text-white/90 active:scale-95 transition-transform"
                    >
                      <Info className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                      <span>Разбор</span>
                    </button>
                  </div>

                  <TransformComponent contentClass="!w-full !h-full flex items-center justify-center p-2" wrapperClass="!w-full !h-full">
                    <div
                      onClick={handleImageClick}
                      className={`relative inline-block leading-none ${
                        (isAdmin && activeSliceIndex === 0) || isSpotterActive ? 'cursor-crosshair' : ''
                      }`}
                    >
                      <img
                        src={activeImageUrl}
                        alt={slide.title}
                        onError={() => setImageFailed(true)}
                        onLoad={() => transformRef.current?.resetTransform(0)}
                        className="block max-h-[54vh] max-w-[94vw] w-auto h-auto rounded-xl select-none pointer-events-none"
                        draggable={false}
                      />

                      {/* SVG-полигоны */}
                      {opacityRatio > 0.02 && activeSliceIndex === 0 && (
                        <svg
                          viewBox="0 0 1000 1000"
                          preserveAspectRatio="none"
                          className="absolute inset-0 w-full h-full rounded-xl pointer-events-auto"
                          style={{ opacity: opacityRatio }}
                        >
                          {visibleLayers.map((layer) => {
                            if (!layer.polygon || layer.polygon.length < 3) return null;
                            const origIdx = layers.findIndex((l) => l.number === layer.number);
                            const isSelected = isSpotterActive || activeLayer?.number === layer.number;
                            const layerColor = isSpotterActive
                              ? spotterFeedback?.status === 'miss'
                                ? '#F59E0B'
                                : '#10B981'
                              : layer.color || darkAccentInk;
                            const pointsStr = layer.polygon.map((p) => `${p[0]},${p[1]}`).join(' ');
                            return (
                              <polygon
                                key={layer.number}
                                points={pointsStr}
                                onClick={(e) => {
                                  if (isSpotterActive) return;
                                  e.stopPropagation();
                                  if (origIdx >= 0) setActiveLayerIdx(origIdx);
                                }}
                                fill={layerColor}
                                fillOpacity={isSelected ? 0.34 : 0.14}
                                stroke={layerColor}
                                strokeWidth={isSelected ? 3 : 1.75}
                                vectorEffect="non-scaling-stroke"
                                className="cursor-pointer transition-opacity duration-150"
                              />
                            );
                          })}

                          {polygonDraft.length > 0 && (
                            <polyline
                              points={polygonDraft.map((p) => `${p[0]},${p[1]}`).join(' ')}
                              fill="none"
                              stroke="#EC4899"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                        </svg>
                      )}

                      {/* HTML-пины и маркер касания Spotter */}
                      {activeSliceIndex === 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {opacityRatio > 0.02 &&
                            visibleLayers.map((layer) => {
                              if (typeof layer.pin_x !== 'number' || typeof layer.pin_y !== 'number') {
                                return null;
                              }
                              const origIdx = layers.findIndex((l) => l.number === layer.number);
                              const isSelected = isSpotterActive || activeLayer?.number === layer.number;
                              const layerColor = isSpotterActive
                                ? spotterFeedback?.status === 'miss'
                                  ? '#F59E0B'
                                  : '#10B981'
                                : layer.color || darkAccentInk;
                              return (
                                <button
                                  key={layer.number}
                                  type="button"
                                  onClick={(e) => {
                                    if (isSpotterActive) return;
                                    e.stopPropagation();
                                    if (origIdx >= 0) setActiveLayerIdx(origIdx);
                                  }}
                                  style={{
                                    left: `${layer.pin_x}%`,
                                    top: `${layer.pin_y}%`,
                                    backgroundColor: hexWithAlpha(layerColor, isSelected ? 0.94 : 0.72),
                                    borderColor: '#FFFFFF',
                                    opacity: opacityRatio,
                                  }}
                                  className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 text-white font-semibold tabular-nums flex items-center justify-center shadow-md transition-transform ${
                                    isSelected ? 'w-7 h-7 text-[12px] scale-105 z-10' : 'w-6 h-6 text-[11px]'
                                  }`}
                                  aria-label={`${layer.number}. ${layer.name}`}
                                >
                                  {layer.number}
                                </button>
                              );
                            })}

                          {isSpotterActive && spotterFeedback && (
                            <span
                              style={{
                                left: `${spotterFeedback.tapX}%`,
                                top: `${spotterFeedback.tapY}%`,
                              }}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg ${
                                spotterFeedback.status === 'hit' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                          )}

                          {polygonDraft.map((pt, i) => (
                            <span
                              key={i}
                              style={{ left: `${pt[0] / 10}%`, top: `${pt[1] / 10}%` }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-pink-500 border border-white"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>

          {/* 5. Нижняя панель слоёв (Обзор | По шагам | Найти) */}
          <div className="bg-[#131316] border-t border-white/[0.08] px-4 pt-3 pb-7 space-y-2.5 z-20 shrink-0">
            {canStep && (
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex p-0.5 rounded-xl bg-white/[0.06]">
                  {(
                    [
                      { id: 'explore', label: 'Обзор' },
                      { id: 'steps', label: 'По шагам' },
                      { id: 'spotter', label: 'Найти' },
                    ] as const
                  ).map((mTab) => (
                    <button
                      key={mTab.id}
                      type="button"
                      onClick={() => handleModeSwitch(mTab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors ${
                        viewMode === mTab.id ? 'bg-[#27272D] text-white' : 'text-zinc-400'
                      }`}
                    >
                      {mTab.label}
                    </button>
                  ))}
                </div>

                {viewMode === 'steps' && (
                  <span className="text-[12px] font-mono tabular-nums text-zinc-400">
                    {activeLayerIdx + 1} / {layers.length}
                  </span>
                )}

                {viewMode === 'spotter' && !spotterDone && (
                  <span className="text-[12px] font-mono tabular-nums text-zinc-400">
                    {spotterPos + 1} / {spotterOrder.length}
                  </span>
                )}
              </div>
            )}

            {/* Режим «Найти на стекле» */}
            {isSpotterActive ? (
              spotterDone ? (
                <div className="rounded-2xl p-3.5 bg-white/[0.04] border border-white/[0.08] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-white">Проверка завершена</div>
                    <div className="text-[12px] text-zinc-400 tabular-nums mt-0.5">
                      Найдено: {spotterScore} из {spotterOrder.length}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startSpotter(layers)}
                    style={{ backgroundColor: accentHex, color: accentTextColor }}
                    className="h-9 px-3.5 rounded-lg text-[12px] font-medium shrink-0"
                  >
                    Ещё раз
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl p-3 bg-white/[0.04] border border-white/[0.08] space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Crosshair className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} style={{ color: darkAccentInk }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-zinc-400">Нажмите на структуру на срезе</div>
                      <div className="text-[14px] font-semibold text-white leading-snug mt-0.5">
                        {spotterTargetLayer?.name}
                      </div>
                    </div>
                  </div>

                  {spotterFeedback && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                      <span
                        className={`text-[12px] font-medium ${
                          spotterFeedback.status === 'hit' ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {spotterFeedback.status === 'hit'
                          ? 'Точно в цель'
                          : 'Мимо — правильная зона подсвечена'}
                      </span>
                      <button
                        type="button"
                        onClick={handleSpotterNext}
                        style={{ backgroundColor: accentHex, color: accentTextColor }}
                        className="h-8 px-3 rounded-lg text-[12px] font-medium shrink-0"
                      >
                        {spotterPos + 1 < spotterOrder.length ? 'Дальше' : 'Итог'}
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              <>
                {canStep && viewMode === 'explore' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {layers.map((l, idx) => {
                      const isSelected = activeLayer?.number === l.number;
                      return (
                        <button
                          key={l.number}
                          type="button"
                          onClick={() => setActiveLayerIdx(idx)}
                          className={`px-2.5 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                            isSelected
                              ? 'bg-white text-zinc-900'
                              : 'bg-white/[0.05] border border-white/[0.08] text-zinc-300'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: l.color || darkAccentInk }}
                          />
                          <span>
                            {l.number}. {l.short_name || l.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeLayer ? (
                  <div className="rounded-2xl p-3 bg-white/[0.04] border border-white/[0.08] space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-[13px] font-semibold text-white">
                          {activeLayer.number}. {activeLayer.name}
                        </div>
                        {activeLayer.description && (
                          <div className="text-[12px] text-zinc-400 leading-relaxed">
                            {activeLayer.description}
                          </div>
                        )}
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => deletePin(activeLayer.number)}
                          className="text-zinc-500 active:text-rose-400 p-1"
                          aria-label="Удалить слой"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>

                    {canStep && viewMode === 'steps' && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          disabled={activeLayerIdx === 0}
                          onClick={() => setActiveLayerIdx((i) => Math.max(0, i - 1))}
                          className="h-9 px-3 rounded-lg bg-white/[0.06] text-zinc-200 disabled:opacity-35 text-[12px] font-medium flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                          <span>Назад</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveLayerIdx((i) => (i + 1 < layers.length ? i + 1 : 0))
                          }
                          style={{ backgroundColor: accentHex, color: accentTextColor }}
                          className="h-9 px-4 rounded-lg text-[12px] font-medium flex items-center gap-1"
                        >
                          <span>{activeLayerIdx + 1 < layers.length ? 'Следующий слой' : 'Сначала'}</span>
                          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[12px] text-zinc-400 text-center py-1">
                    {activeSliceIndex > 0
                      ? 'Метки привязаны к основному срезу'
                      : 'Откройте «Разбор», чтобы посмотреть план ответа'}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* 6. Шторка полного разбора */}
      <BottomSheet
        isOpen={showInfoSheet}
        onClose={() => setShowInfoSheet(false)}
        title={slide.title}
        isDark={true}
      >
        <div className="space-y-3 py-1 text-[14px]">
          {slide.stain && (
            <div className="rounded-2xl p-3.5 bg-white/[0.04] border border-white/[0.08] space-y-1">
              <div className="text-[12px] font-medium text-zinc-400">Окраска</div>
              <div className="text-zinc-200">{slide.stain}</div>
            </div>
          )}

          {(slide.examPlan?.structure || slide.layersText) && (
            <div className="rounded-2xl p-3.5 bg-white/[0.04] border border-white/[0.08] space-y-1">
              <div className="text-[12px] font-medium text-zinc-400">Микроскопическое строение</div>
              <div className="text-zinc-200 whitespace-pre-line leading-relaxed">
                {slide.examPlan?.structure || slide.layersText}
              </div>
            </div>
          )}

          {(slide.killerFeature || slide.examPlan?.killerFeature) && (
            <div className="relative overflow-hidden rounded-2xl p-3.5 pl-5 bg-[#1D1810] border border-amber-500/20 space-y-1">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-amber-500" />
              <div className="text-[12px] font-semibold text-amber-300">Главный признак</div>
              <div className="text-zinc-200 leading-relaxed">
                {slide.killerFeature || slide.examPlan?.killerFeature}
              </div>
            </div>
          )}

          {(slide.functionText || slide.examPlan?.functionText) && (
            <div className="rounded-2xl p-3.5 bg-white/[0.04] border border-white/[0.08] space-y-1">
              <div className="text-[12px] font-medium text-zinc-400">Функция</div>
              <div className="text-zinc-200 leading-relaxed">
                {slide.functionText || slide.examPlan?.functionText}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};

export default MicroscopeViewerModal;
