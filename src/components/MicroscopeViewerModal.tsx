import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  X,
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
} from 'lucide-react';
import { HistSlide, SlideLayer } from '../data/histoData';

interface Props {
  slide: HistSlide;
  onClose: () => void;
  onStartTest: (slide: HistSlide) => void;
}

const PIN_COLORS = [
  { label: 'Индиго', hex: '#6366F1' },
  { label: 'Эозин', hex: '#EC4899' },
  { label: 'Изумруд', hex: '#10B981' },
  { label: 'Янтарь', hex: '#F59E0B' },
];

export const MicroscopeViewerModal: React.FC<Props> = ({ slide, onClose, onStartTest }) => {
  const [showPins, setShowPins] = useState(true);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);

  const [isAdmin, setIsAdmin] = useState(() => window.location.search.includes('admin=1'));
  const [tapCount, setTapCount] = useState(0);

  const [layers, setLayers] = useState<SlideLayer[]>(() => slide.layers || []);
  const [activeLayer, setActiveLayer] = useState<SlideLayer | null>(
    slide.layers && slide.layers.length > 0 ? slide.layers[0] : null
  );

  const [editingPin, setEditingPin] = useState<SlideLayer | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

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
    if (!isAdmin) return;
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

  const copyLayersJson = () => {
    const payload = JSON.stringify(layers, null, 2);
    navigator.clipboard.writeText(payload);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const safeTop: React.CSSProperties = {
    paddingTop:
      'calc(var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, 52px)) + 8px)',
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E] text-white flex flex-col select-none">
      {/* Верхняя панель окуляра */}
      <div
        style={safeTop}
        className="px-4 pb-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between gap-2 z-20"
      >
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition shrink-0"
          aria-label="Закрыть микроскоп"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div onClick={handleHeaderTap} className="min-w-0 flex-1 text-center cursor-pointer px-2">
          <div className="text-[11px] font-bold text-indigo-400 tracking-wide">
            Препарат №{slide.examNumber} {isAdmin && '· РЕЖИМ РАЗМЕТКИ'}
          </div>
          <h2 className="text-[14px] font-bold text-white truncate">{slide.title}</h2>
        </div>

        <button
          onClick={() => onStartTest(slide)}
          className="px-3.5 h-10 rounded-full bg-indigo-600 text-white font-bold text-[12px] flex items-center gap-1.5 shadow active:scale-95 transition shrink-0"
        >
          <Zap className="w-3.5 h-3.5" />
          Тест
        </button>
      </div>

      {/* Оптическое поле с синхронными пинами */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        <TransformWrapper
          centerOnInit
          initialScale={1}
          maxScale={6}
          minScale={0.8}
          onTransformed={(_, state) => setCurrentScale(state.scale)}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
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

              <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
                {layers.length > 0 && (
                  <button
                    onClick={() => setShowPins((v) => !v)}
                    className={`px-3 py-2 rounded-2xl backdrop-blur-md border text-[12px] font-bold flex items-center gap-1.5 transition ${
                      showPins
                        ? 'bg-indigo-600/90 border-indigo-400/40 text-white'
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
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  Разбор
                </button>
              </div>

              <TransformComponent
                contentClass="relative flex items-center justify-center"
                wrapperClass="!w-full !h-full flex items-center justify-center"
              >
                <div
                  onClick={handleImageClick}
                  className={`relative inline-block ${isAdmin ? 'cursor-crosshair' : ''}`}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="max-h-[70vh] w-auto max-w-[94vw] object-contain rounded-2xl select-none pointer-events-none"
                    draggable={false}
                  />

                  {showPins &&
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
                            backgroundColor: layer.color || '#6366F1',
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
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Нижняя панель слоёв и разбора */}
      <div className="bg-[#111520] border-t border-white/10 px-4 pt-3 pb-7 space-y-3 z-20">
        {layers.length > 0 && (
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

        {activeLayer ? (
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[13px] font-bold text-white">{activeLayer.name}</div>
            <div className="text-[12px] text-slate-300 mt-0.5 leading-snug">
              {activeLayer.description}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-indigo-400 uppercase">
              Главный отличительный признак
            </div>
            <div className="text-[12px] text-slate-200 mt-0.5 leading-snug">
              {slide.killerFeature}
            </div>
          </div>
        )}

        {isAdmin && (
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
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-[13px]"
              >
                Сохранить метку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шторка полного разбора препарата */}
      {showInfoSheet && (
        <div
          onClick={() => setShowInfoSheet(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#141926] border-t border-white/15 rounded-t-[28px] p-5 pb-8 space-y-3.5 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-indigo-400">
                  Препарат №{slide.examNumber} · {slide.stain}
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

            <div className="bg-white/5 rounded-2xl p-3.5 space-y-2 text-[13px]">
              <div>
                <span className="text-slate-400 font-semibold">Слои и структуры: </span>
                <span className="text-slate-100">{slide.layersText}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Ключевые клетки: </span>
                <span className="text-slate-100">{slide.keyCells}</span>
              </div>
              <div>
                <span className="text-indigo-400 font-semibold">Как узнать за 3 секунды: </span>
                <span className="text-white font-medium">{slide.killerFeature}</span>
              </div>
            </div>

            {slide.youtubeTimestampUrl && (
              <a
                href={slide.youtubeTimestampUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-rose-600 text-white font-bold text-[13px] flex items-center justify-center gap-2"
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
