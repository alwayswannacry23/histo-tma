import React, { useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { Eye, EyeOff, Microscope } from 'lucide-react';
import { HistSlide, SlideLayer } from '../data/histoData';

export interface SlideZoneCanvasProps {
  slide: HistSlide | null;
  activeLayerNumber?: number | null;
  onSelectLayer?: (layer: SlideLayer) => void;
  sliderOpacity: number;
  onSliderOpacityChange: (val: number) => void;
  fallbackTitle?: string;
  fallbackText?: string;
  isDark?: boolean;
  accentHex?: string;
  heightClass?: string;
}

export const SlideZoneCanvas: React.FC<SlideZoneCanvasProps> = ({
  slide,
  activeLayerNumber,
  onSelectLayer,
  sliderOpacity,
  onSliderOpacityChange,
  fallbackTitle,
  fallbackText,
  isDark = true,
  accentHex = '#2DD4BF',
  heightClass = 'h-[230px] sm:h-[260px]',
}) => {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  const hasImage = Boolean(slide?.imageUrl && slide.imageUrl.trim());
  const layers: SlideLayer[] = slide?.layers || [];
  const activeLayer = layers.find((l) => l.number === activeLayerNumber) || null;

  // Autozoom into focused area when activeLayer changes
  useEffect(() => {
    if (!transformRef.current || !activeLayer || !hasImage) return;

    if (activeLayer.focusBox) {
      const { x, y, scale } = activeLayer.focusBox;
      transformRef.current.setTransform(x, y, scale, 300, 'easeOutQuad');
    } else if (activeLayer.polygon && activeLayer.polygon.length > 0) {
      // Calculate center of polygon
      const xs = activeLayer.polygon.map((p) => p[0]);
      const ys = activeLayer.polygon.map((p) => p[1]);
      const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
      const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;

      // Approximate zoom target
      const scale = 2.2;
      const targetX = (500 - avgX) * scale;
      const targetY = (500 - avgY) * scale;
      transformRef.current.setTransform(targetX, targetY, scale, 300, 'easeOutQuad');
    } else if (typeof activeLayer.pin_x === 'number' && typeof activeLayer.pin_y === 'number') {
      const scale = 2.2;
      const targetX = (50 - activeLayer.pin_x) * 10 * scale;
      const targetY = (50 - activeLayer.pin_y) * 10 * scale;
      transformRef.current.setTransform(targetX, targetY, scale, 300, 'easeOutQuad');
    }
  }, [activeLayerNumber, hasImage]);

  const opacityRatio = sliderOpacity / 100;

  if (!hasImage) {
    return (
      <div
        className={`w-full ${heightClass} rounded-[20px] p-4 flex flex-col justify-between border relative overflow-hidden select-none ${
          isDark
            ? 'bg-[#131316] text-white border-white/[0.08]'
            : 'bg-white text-zinc-900 border-black/[0.07]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Microscope className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
            <span className="text-[12px] font-semibold tracking-tight text-zinc-400">
              {slide?.title ? `Препарат №${slide.examNumber || ''}` : 'Кафедральный атлас НГМУ'}
            </span>
          </div>
          {slide?.stain && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                isDark ? 'bg-white/[0.06] text-zinc-400' : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {slide.stain}
            </span>
          )}
        </div>

        <div className="space-y-1.5 my-auto">
          <div className="text-[15px] font-semibold leading-snug tracking-tight">
            {fallbackTitle || slide?.title || 'Гистологический препарат'}
          </div>
          <div
            className={`text-[12.5px] leading-relaxed line-clamp-3 ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}
          >
            {fallbackText ||
              slide?.examPlan?.structure ||
              slide?.layersText ||
              'Оптическая схема микропрепарата со структурными метками слоёв.'}
          </div>
        </div>

        <div
          className={`text-[11px] font-mono tracking-tight ${
            isDark ? 'text-zinc-500' : 'text-zinc-400'
          }`}
        >
          Кафедра гистологии, эмбриологии и цитологии НГМУ
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${heightClass} rounded-[20px] border relative overflow-hidden select-none ${
        isDark ? 'bg-black border-white/[0.08]' : 'bg-zinc-950 border-black/[0.07]'
      }`}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.8}
        maxScale={4.5}
        centerOnInit
        wheel={{ step: 0.1 }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full flex items-center justify-center relative"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={slide!.imageUrl}
              alt={slide!.title}
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />

            {/* SVG Interactive Overlay */}
            {opacityRatio > 0.02 && (
              <svg
                viewBox="0 0 1000 1000"
                className="absolute inset-0 w-full h-full pointer-events-auto"
                style={{ opacity: opacityRatio }}
              >
                {layers.map((layer) => {
                  const isActive = activeLayer?.number === layer.number;
                  const layerColor = layer.color || accentHex;

                  if (layer.polygon && layer.polygon.length > 2) {
                    const pointsStr = layer.polygon.map((pt) => `${pt[0]},${pt[1]}`).join(' ');
                    return (
                      <polygon
                        key={layer.number}
                        points={pointsStr}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLayer?.(layer);
                        }}
                        fill={layerColor}
                        fillOpacity={isActive ? 0.38 : 0.16}
                        stroke={layerColor}
                        strokeWidth={isActive ? 4 : 2}
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
                          onSelectLayer?.(layer);
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isActive ? 22 : 16}
                          fill={layerColor}
                          fillOpacity={0.9}
                          stroke="#FFFFFF"
                          strokeWidth={2.5}
                        />
                        <text
                          x={cx}
                          y={cy + 5}
                          fill="#FFFFFF"
                          fontSize="13"
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
              </svg>
            )}
          </div>
        </TransformComponent>
      </TransformWrapper>

      {/* Slide title pill overlay */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white/90 border border-white/10">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentHex }} />
        <span className="truncate max-w-[170px]">{slide!.title}</span>
      </div>

      {/* Floating slider: Разметка ↔ Слепое стекло */}
      <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white select-none">
        <button
          type="button"
          onClick={() => onSliderOpacityChange(sliderOpacity > 0 ? 0 : 100)}
          className="text-zinc-400 hover:text-white transition"
          aria-label="Слепое стекло"
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
          onChange={(e) => onSliderOpacityChange(Number(e.target.value))}
          className="w-16 h-1 accent-white bg-white/20 rounded-lg cursor-pointer"
        />

        <span className="text-[10px] font-mono tabular-nums text-zinc-300 min-w-[24px] text-right">
          {sliderOpacity}%
        </span>
      </div>
    </div>
  );
};
