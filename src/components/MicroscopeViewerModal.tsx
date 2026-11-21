import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { HistSlide, SlideLayer } from '../data/histoData';
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
  topInsetPx = 16,
}) => {
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [sliderOpacity, setSliderOpacity] = useState(100);

  const [isAdmin, setIsAdmin] = useState<boolean>(() => window.location.search.includes('admin=1'));
  const [adminMode, setAdminMode] = useState<'pin' | 'polygon'>('pin');
  const [polygonDraft, setPolygonDraft] = useState<[number, number][]>([]);
  const [tapCount, setTapCount] = useState(0);

  const [layers, setLayers] = useState<SlideLayer[]>(() => slide.layers || []);
  const [activeLayer, setActiveLayer] = useState<SlideLayer | null>(
    slide.layers && slide.layers.length > 0 ? slide.layers[0] : null
  );

  const [copiedJson, setCopiedJson] = useState(false);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  useEffect(() => {
    setActiveSliceIndex(0);
    setImageFailed(false);
    setLayers(slide.layers || []);
    setActiveLayer(slide.layers && slide.layers.length > 0 ? slide.layers[0] : null);
    setPolygonDraft([]);
  }, [slide.id]);

  const activeImageUrl =
    slide.imageUrls && slide.imageUrls.length > activeSliceIndex
      ? slide.imageUrls[activeSliceIndex]
      : slide.imageUrl;

  useEffect(() => {
    setImageFailed(false);
  }, [activeImageUrl]);

  const handleSliceChange = (idx: number) => {
    setActiveSliceIndex(idx);
    setImageFailed(false);
    transformRef.current?.resetTransform();
  };

  const hasImage = Boolean(activeImageUrl && activeImageUrl.trim()) && !imageFailed;

  const handleHeaderTap = () => {
    const next = tapCount + 1;
    if (next >= 5) {
      setIsAdmin((prev) => !prev);
      setTapCount(0);
      (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
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
    setActiveLayer(newPin);
  };

  const finishPolygonDraft = () => {
    if (polygonDraft.length < 3) return;
    const newLayer: SlideLayer = {
      number: layers.length + 1,
      short_name: `Зона ${layers.length + 1}`,
      name: `Зона ${layers.length + 1}`,
      description: '',
      color: PIN_COLORS[layers.length % PIN_COLORS.length].hex,
      pin_x: Math.round(polygonDraft[0][0] / 10),
      pin_y: Math.round(polygonDraft[0][1] / 10),
      polygon: polygonDraft,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayer(newLayer);
    setPolygonDraft([]);
  };

  const deletePin = (num: number) => {
    const filtered = layers
      .filter((l) => l.number !== num)
      .map((l, idx) => ({ ...l, number: idx + 1 }));
    setLayers(filtered);
    setActiveLayer(filtered[0] || null);
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

  return (
    <div className="fixed inset-0 z-50 bg-[#09090B] text-white flex flex-col select-none">
      {/* 1. TOP BAR */}
      <div
        style={{ paddingTop: `${topInsetPx}px` }}
        className="px-4 pb-2.5 bg-[#09090B]/90 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between gap-3 z-20 shrink-0"
      >
        <div onClick={handleHeaderTap} className="min-w-0 flex-1 cursor-pointer">
          <div className="text-[11px] font-mono tracking-tight text-zinc-400">
            Препарат №{slide.examNumber} {isAdmin && '· Режим разметки'}
          </div>
          <h2 className="text-[14.5px] font-semibold text-white truncate leading-tight mt-0.5">
            {slide.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onStartTest(slide)}
            style={{ backgroundColor: accentHex, color: '#09090B' }}
            className="px-3 h-8 rounded-full font-semibold text-[12px] flex items-center gap-1.5 shadow active:scale-95 transition"
          >
            <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Тест</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center active:scale-95 transition"
            aria-label="Закрыть микроскоп"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 2. ADMIN TOOLBAR */}
      {isAdmin && hasImage && activeSliceIndex === 0 && (
        <div className="px-4 py-2 bg-[#131316] border-b border-white/[0.08] flex items-center justify-between gap-2 text-[11.5px] z-20">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setAdminMode('pin');
                setPolygonDraft([]);
              }}
              className={`px-2 py-1 rounded-md font-medium transition ${
                adminMode === 'pin' ? 'bg-white text-zinc-900' : 'bg-white/[0.06] text-zinc-400'
              }`}
            >
              Точка
            </button>
            <button
              type="button"
              onClick={() => setAdminMode('polygon')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                adminMode === 'polygon' ? 'bg-white text-zinc-900' : 'bg-white/[0.06] text-zinc-400'
              }`}
            >
              Полигон зоны {polygonDraft.length > 0 && `(${polygonDraft.length})`}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {adminMode === 'polygon' && polygonDraft.length >= 3 && (
              <button
                type="button"
                onClick={finishPolygonDraft}
                className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-medium"
              >
                Замкнуть зону
              </button>
            )}
            <button
              type="button"
              onClick={copyLayersJson}
              className="px-2 py-1 rounded-md bg-white/[0.06] text-zinc-300 flex items-center gap-1"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Скопировано' : 'JSON'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. OPTICAL FIELD */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-black">
        <TransformWrapper
          ref={transformRef}
          centerOnInit
          initialScale={1}
          maxScale={6}
          minScale={0.8}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom controls */}
              {hasImage && (
                <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => zoomIn(0.5)}
                    aria-label="Приблизить"
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition"
                  >
                    <ZoomIn className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomOut(0.5)}
                    aria-label="Отдалить"
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition"
                  >
                    <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    aria-label="Сброс зума"
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              )}

              {/* Slider & Info buttons */}
              <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
                {hasImage && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white select-none">
                    <button
                      type="button"
                      onClick={() => setSliderOpacity(sliderOpacity > 0 ? 0 : 100)}
                      className="text-zinc-400 hover:text-white transition"
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
                    <span className="text-[10px] font-mono tabular-nums text-zinc-300 min-w-[22px] text-right">
                      {sliderOpacity}%
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowInfoSheet(true)}
                  className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11.5px] font-medium flex items-center gap-1 text-white/90 active:scale-95 transition"
                >
                  <Info className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                  <span>Разбор</span>
                </button>
              </div>

              {/* Slice selector */}
              {hasImage && slide.imageUrls && slide.imageUrls.length > 1 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-full border border-white/10 max-w-[85vw] overflow-x-auto">
                  {slide.imageUrls.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSliceChange(idx)}
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition whitespace-nowrap ${
                        activeSliceIndex === idx
                          ? 'bg-white text-zinc-900'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {slide.imageLabels?.[idx] || `Срез ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Transform Canvas Content */}
              <TransformComponent
                contentClass="relative flex items-center justify-center"
                wrapperClass="!w-full !h-full flex items-center justify-center"
              >
                {!hasImage ? (
                  <div className="w-[85vw] max-w-[360px] p-6 rounded-[24px] bg-[#131316] border border-white/[0.08] flex flex-col items-center justify-center gap-3 text-center select-none">
                    <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center text-zinc-500">
                      <Microscope className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[14px] font-semibold text-white">
                        Фото препарата в обработке
                      </div>
                      <p className="text-[12px] text-zinc-400 max-w-[240px] leading-relaxed">
                        Текстовый план ответа и разбор кафедры доступны по кнопке «Разбор»
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handleImageClick}
                    className={`relative inline-block ${
                      isAdmin && activeSliceIndex === 0 ? 'cursor-crosshair' : ''
                    }`}
                  >
                    <img
                      src={activeImageUrl}
                      alt={slide.title}
                      onError={() => setImageFailed(true)}
                      className="max-h-[70vh] w-auto max-w-[94vw] object-contain rounded-[16px] select-none pointer-events-none"
                      draggable={false}
                    />

                    {/* SVG Layer Polygons & Pins */}
                    {opacityRatio > 0.02 && activeSliceIndex === 0 && (
                      <svg
                        viewBox="0 0 1000 1000"
                        className="absolute inset-0 w-full h-full pointer-events-auto"
                        style={{ opacity: opacityRatio }}
                      >
                        {layers.map((layer) => {
                          const isSelected = activeLayer?.number === layer.number;
                          const layerColor = layer.color || accentHex;

                          if (layer.polygon && layer.polygon.length > 2) {
                            const pointsStr = layer.polygon.map((p) => `${p[0]},${p[1]}`).join(' ');
                            return (
                              <polygon
                                key={layer.number}
                                points={pointsStr}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLayer(layer);
                                }}
                                fill={layerColor}
                                fillOpacity={isSelected ? 0.35 : 0.16}
                                stroke={layerColor}
                                strokeWidth={isSelected ? 3.5 : 2}
                                className="cursor-pointer transition-all duration-150"
                              />
                            );
                          }

                          if (typeof layer.pin_x === 'number' && typeof layer.pin_y === 'number') {
                            const cx = layer.pin_x * 10;
                            const cy = layer.pin_y * 10;
                            return (
                              <g
                                key={layer.number}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLayer(layer);
                                }}
                                className="cursor-pointer"
                              >
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={isSelected ? 20 : 15}
                                  fill={layerColor}
                                  fillOpacity={0.9}
                                  stroke="#FFFFFF"
                                  strokeWidth={2}
                                />
                                <text
                                  x={cx}
                                  y={cy + 4.5}
                                  fill="#FFFFFF"
                                  fontSize="12"
                                  fontWeight="600"
                                  textAnchor="middle"
                                  className="pointer-events-none select-none"
                                >
                                  {layer.number}
                                </text>
                              </g>
                            );
                          }

                          return null;
                        })}

                        {/* Polygon draft preview in admin mode */}
                        {polygonDraft.length > 0 && (
                          <g>
                            <polyline
                              points={polygonDraft.map((p) => `${p[0]},${p[1]}`).join(' ')}
                              fill="none"
                              stroke="#EC4899"
                              strokeWidth={2}
                              strokeDasharray="4 4"
                            />
                            {polygonDraft.map((p, idx) => (
                              <circle key={idx} cx={p[0]} cy={p[1]} r={6} fill="#EC4899" />
                            ))}
                          </g>
                        )}
                      </svg>
                    )}
                  </div>
                )}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* 4. BOTTOM LAYER BAR */}
      <div className="bg-[#131316] border-t border-white/[0.08] px-4 pt-3 pb-7 space-y-2.5 z-20 shrink-0">
        {hasImage && layers.length > 0 && activeSliceIndex === 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {layers.map((l) => {
              const isSelected = activeLayer?.number === l.number;
              return (
                <button
                  key={l.number}
                  type="button"
                  onClick={() => setActiveLayer(l)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'bg-white/[0.04] border border-white/[0.06] text-zinc-300'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: l.color || accentHex }}
                  />
                  <span>{l.number}. {l.short_name || l.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Layer Info */}
        {activeLayer ? (
          <div className="rounded-[16px] p-3 bg-white/[0.03] border border-white/[0.06] flex items-start justify-between gap-3 text-[12px]">
            <div className="space-y-0.5 min-w-0">
              <div className="font-semibold text-white truncate">
                {activeLayer.number}. {activeLayer.name}
              </div>
              {activeLayer.description && (
                <div className="text-zinc-400 leading-snug line-clamp-2">
                  {activeLayer.description}
                </div>
              )}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => deletePin(activeLayer.number)}
                className="text-zinc-500 hover:text-rose-400 p-1"
                aria-label="Удалить слой"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        ) : (
          <div className="text-[12px] text-zinc-500 text-center py-1">
            {hasImage ? 'Нажмите на зону или выберите слой в списке' : 'Текстовый план ответа доступен по кнопке «Разбор»'}
          </div>
        )}
      </div>

      {/* 5. INFO SHEET: STRUCTURE BREAKDOWN */}
      <BottomSheet
        isOpen={showInfoSheet}
        onClose={() => setShowInfoSheet(false)}
        title={`Разбор: ${slide.title}`}
        isDark={true}
      >
        <div className="space-y-3 py-1 text-[13px]">
          {slide.stain && (
            <div className="rounded-[14px] p-3 bg-white/[0.03] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                Окраска и тип:
              </span>
              <div className="text-zinc-200">{slide.stain}</div>
            </div>
          )}

          {(slide.examPlan?.structure || slide.layersText) && (
            <div className="rounded-[14px] p-3 bg-white/[0.03] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                Микроскопическое строение:
              </span>
              <div className="text-zinc-200 whitespace-pre-line leading-relaxed">
                {slide.examPlan?.structure || slide.layersText}
              </div>
            </div>
          )}

          {(slide.killerFeature || slide.examPlan?.killerFeature) && (
            <div className="rounded-[14px] p-3 bg-amber-500/10 border border-amber-500/25 space-y-1">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
                Ключевой диагностический признак:
              </span>
              <div className="text-zinc-200 leading-relaxed">
                {slide.killerFeature || slide.examPlan?.killerFeature}
              </div>
            </div>
          )}

          {(slide.functionText || slide.examPlan?.functionText) && (
            <div className="rounded-[14px] p-3 bg-white/[0.03] border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                Функция ткани/органа:
              </span>
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
