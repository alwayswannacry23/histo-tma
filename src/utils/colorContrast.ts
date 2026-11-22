function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

function relativeLuminance(r: number, g: number, b: number): number {
  const linear = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.7152 * 0 + 0.0722 * linear[2];
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Возвращает оттенок акцента с гарантированным контрастом >= 4.6:1.
 * Если выбран Монохром (серый/чёрный/белый), сохраняет чистый монохром без подмены на синий.
 */
export function getReadableAccent(hex: string, isDark: boolean): string {
  const rgb = parseHex(hex);
  if (!rgb) return isDark ? '#F4F4F5' : '#18181B';

  let [r, g, b] = rgb;
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  const isGrayscale = maxChannel - minChannel < 14;

  if (isGrayscale) {
    return isDark ? '#F4F4F5' : '#18181B';
  }

  const bgLum = isDark ? 0.008 : 0.94;
  let lum = relativeLuminance(r, g, b);
  if (contrastRatio(lum, bgLum) >= 4.6) {
    return toHex(r, g, b);
  }

  for (let step = 0; step < 18; step++) {
    if (isDark) {
      r = r + (255 - r) * 0.14;
      g = g + (255 - g) * 0.14;
      b = b + (255 - b) * 0.14;
    } else {
      r = r * 0.86;
      g = g * 0.86;
      b = b * 0.86;
    }
    lum = relativeLuminance(r, g, b);
    if (contrastRatio(lum, bgLum) >= 4.6) {
      break;
    }
  }

  return toHex(r, g, b);
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return `rgba(24, 24, 27, ${alpha})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}
