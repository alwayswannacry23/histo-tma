import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Zap,
  Play,
  Copy,
  Trash2,
  Check,
  Info,
  X,
  Microscope,
} from 'lucide-react';
import { HistSlide, SlideLayer } from '../data/histoData';

interface Props {
  slide: HistSlide;
  onClose: () => void;
  onStartTest: (slide: HistSlide) => void;
  accentHex?: string;
  accentTextColor?: string;
  topInsetPx?: number;
}

const PIN_COLORS = [
  { label: 'Индиго', hex: '#6366F1' },
  { label: 'Эозин', hex: '#EC4899' },
  { label: 'Изумруд', hex: '#10B981' },
  { label: 'Янтарь', hex: '#F59E0B' },
];

export const MicroscopeViewerModal: React.FC<Props> = ({
  slide,
  onClose,
  onStartTest,
  accentHex = '#6366F1',
  accentTextColor = '#818CF8',
  topInsetPx = 16,
}) => {
  const [showPins, setShowPins] = useState(true);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const [isAdmin, setIsAdmin] = useState(() => window.location.search.includes('admin=1'));
  const [tapCount, setTapCount] = useState(0);

  const [layers, setLayers] = useState<SlideLayer[]>(() => slide.layers || []);
  const [activeLayer, setActiveLayer] = useState<SlideLayer | null>(
    slide.layers && slide.layers.length > 0 ? slide.layers[0] : null
  );

  const [editingPin, setEditingPin] = useState<SlideLayer | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  useEffect(() => {
    setActiveSliceIndex(0);
    setImageFailed(false);
    setLayers(slide.layers || []);
    setActiveLayer(slide.layers && slide.layers.length > 0 ? slide.layers[0] : null);
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
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

    const newPin: SlideLayer = {
      number: layers.length + 1,
      short_name: `Слой ${layers.length + 1}`,
      name: '',
      description: '',
      color: PIN_COLORS[layers.length % PIN_COLORS.length].hex,
      pin_x: Math.max(2, Math.min(98, x)),
      pin_y: Math.max(2, Math.min(98, y)),
    };
    setEditingPin(newPin);
  };

  const saveEditedPin = () => {
    if (!editingPin) return;
    const exists = layers.some((l) => l.number === editingPin.number);
    const updated = exists
      ? layers.map((l) => (l.number === editingPin.number ? editingPin : l))
      : [...layers, { ...editingPin, name: editingPin.name || editingPin.short_name }];
    setLayers(updated);
    setActiveLayer(editingPin);
    setEditingPin(null);
  };

  const deletePin = (num: number) => {
    const filtered = layers
      .filter((l) => l.number !== num)
      .map((l, idx) => ({ ...l, number: idx + 1 }));
    setLayers(filtered);
    setActiveLayer(filtered[0] || null);
    setEditingPin(null);
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

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E] text-white flex flex-col select-none">
      {/* Верхняя панель окуляра с адаптивным отступом topInsetPx */}
      <div
        style={{ paddingTop: `${topInsetPx}px` }}
        className="px-4 pb-3 bg-gradient-to-b from-black/95 via-black/70 to-transparent flex items-center justify-between gap-3 z-20"
      >
        <div onClick={handleHeaderTap} className="min-w-0 flex-1 cursor-pointer">
          <div
            style={{ color: accentTextColor }}
            className="text-[11px] font-bold tracking-wide uppercase"
          >
            Препарат №{slide.examNumber} {isAdmin && '· РЕЖИМ РАЗМЕТКИ'}
          </div>
          <h2 className="text-[15px] font-extrabold text-white truncate leading-tight mt-0.5">
            {slide.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onStartTest(slide)}
            style={{ backgroundColor: accentHex }}
            className="px-3.5 h-9 rounded-full text-white font-bold text-[12px] flex items-center gap-1.5 shadow active:scale-95 transition"
          >
            <Zap className="w-3.5 h-3.5" />
            Тест
          </button>

          <button
            onClick={onClose}
            className="px-3 h-9 rounded-full bg-white/15 text-white/90 font-bold text-[12px] flex items-center gap-1 active:scale-95 transition"
            aria-label="Закрыть микроскоп"
          >
            <X className="w-3.5 h-3.5" />
            Закрыть
          </button>
        </div>
      </div>

      {/* Оптическое поле с синхронными пинами */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        <TransformWrapper
          ref={transformRef}
          centerOnInit
          initialScale={1}
          maxScale={6}
          minScale={0.8}
          onTransformed={(_, state) => setCurrentScale(state.scale)}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Кнопки зума */}
              {hasImage && (
                <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
                  <button
                    onClick={() => zoomIn(0.5)}
                    className="w-10 h-10 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => zoomOut(0.5)}
                    className="w-10 h-10 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="w-10 h-10 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Метки и Разбор */}
              <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
                {hasImage && layers.length > 0 && activeSliceIndex === 0 && (
                  <button
                    onClick={() => setShowPins((v) => !v)}
                    style={
                      showPins
                        ? { backgroundColor: accentHex, borderColor: `${accentHex}60` }
                        : undefined
                    }
                    className={`px-3 py-2 rounded-2xl backdrop-blur-md border text-[12px] font-bold flex items-center gap-1.5 transition ${
                      showPins
                        ? 'text-white'
                        : 'bg-black/65 border-white/10 text-white/80'
                    }`}
                  >
                    {showPins ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Метки ({layers.length})
                  </button>
                )}
                <button
                  onClick={() => setShowInfoSheet(true)}
                  className="px-3 py-2 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 text-[12px] font-bold flex items-center gap-1.5 text-white/90"
                >
                  <Info style={{ color: accentTextColor }} className="w-3.5 h-3.5" />
                  Разбор
                </button>
              </div>

              {/* Индикатор среза без разметки */}
              {hasImage && activeSliceIndex > 0 && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 bg-black/80 backdrop-blur-md border border-white/15 rounded-full text-[11px] font-semibold text-white/80 shadow-lg flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  Метки доступны на Срезе 1
                </div>
              )}

              {/* Переключатель срезов (Кафедра / Атлас / Доп. срезы) */}
              {hasImage && slide.imageUrls && slide.imageUrls.length > 1 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full border border-white/15 shadow-xl max-w-[90vw] overflow-x-auto no-scrollbar">
                  {slide.imageUrls.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSliceChange(idx)}
                      style={activeSliceIndex === idx ? { backgroundColor: accentHex } : undefined}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap ${
                        activeSliceIndex === idx
                          ? 'text-white shadow'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {slide.imageLabels?.[idx] || `Срез ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}

              <TransformComponent
                contentClass="relative flex items-center justify-center"
                wrapperClass="!w-full !h-full flex items-center justify-center"
              >
                {!hasImage ? (
                  <div className="w-[85vw] max-w-[390px] h-64 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center gap-3 p-6 text-center select-none">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center text-white/40">
                      <Microscope className="w-8 h-8 opacity-40 text-white" />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-zinc-200">Фото препарата пока не добавлено</div>
                      <div className="text-[12.5px] text-zinc-400 mt-1 max-w-[260px] leading-snug">
                        Текстовый разбор доступен по кнопке «Разбор»
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handleImageClick}
                    className={`relative inline-block ${isAdmin && activeSliceIndex === 0 ? 'cursor-crosshair' : ''}`}
                  >
                    <img
                      src={activeImageUrl}
                      alt={slide.title}
                      onError={() => setImageFailed(true)}
                      className="max-h-[70vh] w-auto max-w-[94vw] object-contain rounded-2xl select-none pointer-events-none"
                      draggable={false}
                    />

                    {showPins &&
                      activeSliceIndex === 0 &&
                      layers.map((layer) => {
                        const isSelected = activeLayer?.number === layer.number;
                        const invScale = Math.max(0.35, Math.min(1.15, 1 / currentScale));

                        return (
                          <button
                            key={layer.number}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLayer(layer);
                              if (isAdmin) setEditingPin(layer);
                            }}
                            style={{
                              left: `${layer.pin_x}%`,
                              top: `${layer.pin_y}%`,
                              transform: `translate(-50%, -50%) scale(${invScale})`,
                              backgroundColor: layer.color || accentHex,
                            }}
                            className={`absolute z-10 w-7 h-7 rounded-full text-white font-extrabold text-[12px] flex items-center justify-center shadow-lg transition-shadow ${
                              isSelected ? 'ring-4 ring-white' : 'ring-2 ring-black/50 opacity-90'
                            }`}
                          >
                            {layer.number}
                          </button>
                        );
                      })}
                  </div>
                )}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Нижняя панель слоёв и разбора */}
      <div className="bg-[#111520] border-t border-white/10 px-4 pt-3 pb-7 space-y-3 z-20">
        {hasImage && layers.length > 0 && activeSliceIndex === 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {layers.map((l) => {
              const active = activeLayer?.number === l.number;
              return (
                <button
                  key={l.number}
                  onClick={() => setActiveLayer(l)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold shrink-0 flex items-center gap-1.5 transition ${
                    active ? 'bg-white text-slate-950' : 'bg-white/10 text-white/80'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center font-extrabold"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.number}
                  </span>
                  {l.short_name}
                </button>
              );
            })}
          </div>
        )}

        {hasImage && activeLayer && activeSliceIndex === 0 ? (
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[13px] font-bold text-white">{activeLayer.name}</div>
            <div className="text-[12px] text-slate-300 mt-0.5 leading-snug">
              {activeLayer.description}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div
              style={{ color: accentTextColor }}
              className="text-[11px] font-bold uppercase"
            >
              Главный отличительный признак
            </div>
            <div className="text-[12px] text-slate-200 mt-0.5 leading-snug">
              {slide.killerFeature || slide.layersText || 'Нажмите «Разбор» для детального описания препарата.'}
            </div>
          </div>
        )}

        {isAdmin && activeSliceIndex === 0 && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={copyLayersJson}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-[12px] flex items-center justify-center gap-1.5"
            >
              {copiedJson ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedJson ? 'JSON скопирован!' : 'Скопировать JSON пинов'}
            </button>
            <button
              onClick={() => setLayers([])}
              className="py-2.5 px-3 rounded-xl bg-rose-600/20 text-rose-400 font-bold text-[12px]"
            >
              Очистить
            </button>
          </div>
        )}
      </div>

      {/* Модалка редактирования пина */}
      {editingPin && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-[#161B28] border border-white/15 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[15px]">
                Метка №{editingPin.number} ({editingPin.pin_x}%, {editingPin.pin_y}%)
              </span>
              <button onClick={() => setEditingPin(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Короткое имя (напр. Эпителий)"
              value={editingPin.short_name}
              onChange={(e) => setEditingPin({ ...editingPin, short_name: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white outline-none"
            />
            <input
              type="text"
              placeholder="Полное название структуры"
              value={editingPin.name}
              onChange={(e) => setEditingPin({ ...editingPin, name: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white outline-none"
            />
            <textarea
              placeholder="Описание структуры"
              value={editingPin.description}
              onChange={(e) => setEditingPin({ ...editingPin, description: e.target.value })}
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white outline-none"
            />
            <div className="flex items-center gap-2">
              {PIN_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setEditingPin({ ...editingPin, color: c.hex })}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full ${
                    editingPin.color === c.hex ? 'ring-2 ring-white' : 'opacity-60'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => deletePin(editingPin.number)}
                className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={saveEditedPin}
                style={{ backgroundColor: accentHex }}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-[13px]"
              >
                Сохранить метку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шторка полного разбора препарата по 6 пунктам экзаменационного плана */}
      {showInfoSheet && (
        <div
          onClick={() => setShowInfoSheet(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141926] border-t border-white/15 rounded-t-[28px] p-5 pb-8 space-y-3.5 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  style={{ color: accentTextColor }}
                  className="text-[11px] font-bold uppercase tracking-wide"
                >
                  Экзаменационный план · №{slide.examNumber}
                </span>
                <h3 className="text-[17px] font-extrabold text-white mt-0.5">{slide.title}</h3>
              </div>
              <button
                onClick={() => setShowInfoSheet(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-[13px]">
              {/* 1. Паспорт и окраска */}
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-1">
                <div style={{ color: accentTextColor }} className="text-[11px] font-bold uppercase">
                  1. Паспорт и окраска
                </div>
                <div className="text-slate-200">
                  <span className="font-semibold text-slate-400">Препарат: </span>
                  {slide.title}
                </div>
                <div className="text-slate-200">
                  <span className="font-semibold text-slate-400">Окраска: </span>
                  {slide.examPlan?.stainAndType || slide.stain}
                </div>
                {slide.magnification && (
                  <div className="text-slate-200">
                    <span className="font-semibold text-slate-400">Увеличение: </span>
                    {slide.magnification}
                  </div>
                )}
              </div>

              {/* 2. Источник развития */}
              {(slide.examPlan?.origin || slide.embryoOrigin) && (
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-1">
                  <div style={{ color: accentTextColor }} className="text-[11px] font-bold uppercase">
                    2. Источник развития (эмбриогенез)
                  </div>
                  <div className="text-slate-200 leading-snug">
                    {slide.examPlan?.origin || slide.embryoOrigin}
                  </div>
                </div>
              )}

              {/* 3. Строение и слои */}
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-1.5">
                <div style={{ color: accentTextColor }} className="text-[11px] font-bold uppercase">
                  3. Микроскопическое строение и слои
                </div>
                <div className="text-slate-200 leading-snug">
                  {slide.examPlan?.structure || slide.layersText}
                </div>
                {slide.keyCells && (
                  <div className="pt-1 border-t border-white/5">
                    <span className="font-semibold text-slate-400">Ключевые клетки: </span>
                    <span className="text-slate-200">{slide.keyCells}</span>
                  </div>
                )}
              </div>

              {/* 4. Локализация и топография */}
              {slide.examPlan?.location && (
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-1">
                  <div style={{ color: accentTextColor }} className="text-[11px] font-bold uppercase">
                    4. Топография и локализация
                  </div>
                  <div className="text-slate-200 leading-snug">{slide.examPlan.location}</div>
                </div>
              )}

              {/* 5. Функции */}
              {(slide.examPlan?.functionText || slide.functionText) && (
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-1">
                  <div style={{ color: accentTextColor }} className="text-[11px] font-bold uppercase">
                    5. Функции органа / ткани
                  </div>
                  <div className="text-slate-200 leading-snug">
                    {slide.examPlan?.functionText || slide.functionText}
                  </div>
                </div>
              )}

              {/* 6. Главный диагностический признак (Киллер-фича) */}
              <div
                style={{
                  backgroundColor: `${accentHex}1A`,
                  borderColor: `${accentHex}40`,
                }}
                className="rounded-2xl p-3 border space-y-1"
              >
                <div style={{ color: accentTextColor }} className="text-[11px] font-bold uppercase">
                  6. Главный диагностический признак на экзамене
                </div>
                <div className="text-white font-medium leading-snug">
                  {slide.examPlan?.killerFeature || slide.killerFeature}
                </div>
              </div>
            </div>

            {slide.youtubeTimestampUrl && (
              <a
                href={slide.youtubeTimestampUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-rose-600 text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow"
              >
                <Play className="w-4 h-4 fill-current" />
                Смотреть разбор на таймкоде YouTube
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MicroscopeViewerModal;
