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
  const [viewMode, setViewMode] = useState<'explore' | 'steps'>('explore');

  const [isAdmin, setIsAdmin] = useState<boolean>(() => window.location.search.includes('admin=1'));
  const [adminMode, setAdminMode] = useState<'pin' | 'polygon'>('pin');
  const [polygonDraft, setPolygonDraft] = useState<[number, number][]>([]);
  const [tapCount, setTapCount] = useState(0);

  const [layers, setLayers] = useState<SlideLayer[]>(() => slide.layers || []);
  const [activeLayerIdx, setActiveLayerIdx] = useState<number>(0);
  const [copiedJson, setCopiedJson] = useState(false);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  const darkAccentInk = useMemo(() => getReadableAccent(accentHex, true), [accentHex]);

  useEffect(() => {
    setActiveSliceIndex(0);
    setImageFailed(false);
    setViewMode('explore');
    setLayers(slide.layers || []);
    setActiveLayerIdx(0);
    setPolygonDraft([]);
    transformRef.current?.resetTransform(0);
  }, [slide.id]);

  const activeLayer = layers.length > 0 ? layers[Math.min(activeLayerIdx, layers.length - 1)] : null;

  const activeImageUrl =
    slide.imageUrls && slide.imageUrls.length > activeSliceIndex
      ? slide.imageUrls[activeSliceIndex]
      : slide.imageUrl;

  useEffect(() => {
    setImageFailed(false);
  }, [activeImageUrl]);

  const hasImage = Boolean(activeImageUrl && activeImageUrl.trim()) && !imageFailed;

  const handleSliceChange = (idx: number) => {
    setActiveSliceIndex(idx);
    setImageFailed(false);
    transformRef.current?.resetTransform(0);
  };

  const handleHeaderTap = () => {
    const next = tapCount + 1;
    if (next >= 5) {
      setIsAdmin((prev) => !prev);
      setTapCount(0);
      (window as unknown as {
        Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } };
      }).Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
    } else {
      setTapCount(next);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin || activeSliceIndex > 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const normY = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

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

  const opacityRatio = sliderOpacity / 100;
  const canStep = hasImage && layers.length > 0 && activeSliceIndex === 0;
  const hasMultipleSlices = Boolean(hasImage && slide.imageUrls && slide.imageUrls.length > 1);

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

      {/* 2. Вынесенная полоса переключения срезов (вне фото — не перекрывает препарат) */}
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
                  active
                    ? 'bg-white text-zinc-900'
                    : 'bg-white/[0.06] text-zinc-400'
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

                  {/* Ползунок «Разметка ↔ Слепое стекло» и кнопка Разбор */}
                  <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
                    {layers.length > 0 && activeSliceIndex === 0 && (
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
                        isAdmin && activeSliceIndex === 0 ? 'cursor-crosshair' : ''
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

                      {/* Полигоны с точным 1:1 маппингом preserveAspectRatio="none" */}
                      {opacityRatio > 0.02 && activeSliceIndex === 0 && (
                        <svg
                          viewBox="0 0 1000 1000"
                          preserveAspectRatio="none"
                          className="absolute inset-0 w-full h-full rounded-xl pointer-events-auto"
                          style={{ opacity: opacityRatio }}
                        >
                          {layers.map((layer, idx) => {
                            if (!layer.polygon || layer.polygon.length < 3) return null;
                            const isSelected = activeLayer?.number === layer.number;
                            const layerColor = layer.color || darkAccentInk;
                            const pointsStr = layer.polygon.map((p) => `${p[0]},${p[1]}`).join(' ');
                            return (
                              <polygon
                                key={layer.number}
                                points={pointsStr}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLayerIdx(idx);
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

                      {/* HTML-пины: всегда идеально круглые, не искажаются на широких фото */}
                      {opacityRatio > 0.02 && activeSliceIndex === 0 && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ opacity: opacityRatio }}
                        >
                          {layers.map((layer, idx) => {
                            if (typeof layer.pin_x !== 'number' || typeof layer.pin_y !== 'number') {
                              return null;
                            }
                            const isSelected = activeLayer?.number === layer.number;
                            const layerColor = layer.color || darkAccentInk;
                            return (
                              <button
                                key={layer.number}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLayerIdx(idx);
                                }}
                                style={{
                                  left: `${layer.pin_x}%`,
                                  top: `${layer.pin_y}%`,
                                  backgroundColor: hexWithAlpha(layerColor, isSelected ? 0.94 : 0.72),
                                  borderColor: '#FFFFFF',
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

          {/* 5. Нижняя панель слоёв (Обзор | По шагам) */}
          <div className="bg-[#131316] border-t border-white/[0.08] px-4 pt-3 pb-7 space-y-2.5 z-20 shrink-0">
            {canStep && (
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex p-0.5 rounded-xl bg-white/[0.06]">
                  {(
                    [
                      { id: 'explore', label: 'Обзор' },
                      { id: 'steps', label: 'По шагам' },
                    ] as const
                  ).map((mTab) => (
                    <button
                      key={mTab.id}
                      type="button"
                      onClick={() => setViewMode(mTab.id)}
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
              </div>
            )}

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
