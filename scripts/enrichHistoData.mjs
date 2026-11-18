// scripts/enrichHistoData.mjs
// Enriches src/data/histoData.ts with multi-slice atlas URLs, 6-point exam plans, and exports

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const histoDataPath = path.resolve(__dirname, '../src/data/histoData.ts');
const atlasDataPath = path.resolve(__dirname, '../src/data/atlas_image_urls.json');
const tgExportPath = path.resolve(__dirname, '../src/data/tg_raw_export.json');

const atlasData = JSON.parse(fs.readFileSync(atlasDataPath, 'utf-8'));
const tgExport = JSON.parse(fs.readFileSync(tgExportPath, 'utf-8'));

// Build TG matching map by normalized title
const tgMap = {};
for (const item of tgExport) {
  if (!item.fullText || !item.fullText.includes('1. Название препарата:')) continue;
  const match = item.fullText.match(/1\.\s*Название препарата:\s*([^\n\r]+)/);
  if (!match) continue;
  const title = match[1].trim();

  // Parse 6 sections from fullText
  const descMatch = item.fullText.match(/2\.\s*Описание:\s*([\s\S]*?)(?=3\.\s*Расположение:|$)/);
  const locMatch = item.fullText.match(/3\.\s*Расположение:\s*([\s\S]*?)(?=4\.\s*Функция:|$)/);
  const funcMatch = item.fullText.match(/4\.\s*Функция:\s*([\s\S]*?)(?=5\.\s*Окраска:|$)/);
  const stainMatch = item.fullText.match(/5\.\s*Окраска:\s*([\s\S]*?)(?=6\.\s*Развитие:|$)/);
  const originMatch = item.fullText.match(/6\.\s*Развитие:\s*([\s\S]*?)(?=\n\n\d|\n\d|$)/);

  tgMap[title.toLowerCase()] = {
    title,
    localImagePath: item.localImagePath,
    description: descMatch ? descMatch[1].trim() : '',
    location: locMatch ? locMatch[1].trim() : '',
    functionText: funcMatch ? funcMatch[1].trim() : '',
    stain: stainMatch ? stainMatch[1].trim() : '',
    origin: originMatch ? originMatch[1].trim() : '',
  };
}

console.log(`Loaded ${Object.keys(tgMap).length} TG preparations with full 6-point plans.`);

let code = fs.readFileSync(histoDataPath, 'utf-8');

// 1. Ensure exports of electronogramsData and examQuestionsData
if (!code.includes("export * from './electronogramsData'")) {
  code = `export * from './electronogramsData';\nexport * from './examQuestionsData';\n\n` + code;
}

// 2. Ensure ExamAnswerPlan and updated HistSlide interface
const oldInterface = `export interface HistSlide {
  id: string;
  examNumber: number;
  moduleId: string;
  title: string;
  stain: string;
  magnification: string;
  imageUrl: string;
  layersText: string;
  keyCells: string;
  killerFeature: string;
  embryoOrigin?: string;
  functionText?: string;
  distractors: string[];
  youtubeTimestampUrl?: string;
  layers?: SlideLayer[];
}`;

const newInterface = `export interface ExamAnswerPlan {
  stainAndType: string;
  origin: string;
  structure: string;
  location: string;
  functionText: string;
  killerFeature: string;
}

export interface HistSlide {
  id: string;
  examNumber: number;
  moduleId: string;
  title: string;
  stain: string;
  magnification: string;
  imageUrl: string;
  imageUrls?: string[];
  imageLabels?: string[];
  layersText: string;
  keyCells: string;
  killerFeature: string;
  embryoOrigin?: string;
  functionText?: string;
  distractors: string[];
  youtubeTimestampUrl?: string;
  layers?: SlideLayer[];
  examPlan?: ExamAnswerPlan;
}`;

if (code.includes('export interface HistSlide {') && !code.includes('export interface ExamAnswerPlan')) {
  code = code.replace(/export interface HistSlide \{[\s\S]*?\n\}/, newInterface);
}

// 3. Find matching TG preparation for a given slide
function findTgMatch(title) {
  const norm = title.toLowerCase();
  for (const [k, v] of Object.entries(tgMap)) {
    if (norm.includes(k) || k.includes(norm)) return v;
    // Word stems
    const words = k.split(/\s+/).filter((w) => w.length > 4);
    const matches = words.filter((w) => norm.includes(w));
    if (matches.length >= 2) return v;
  }
  return null;
}

// 4. Update the slides array programmatically
// We find where `export const EXAM_SLIDES: HistSlide[] = [` is and parse it
const startMarker = 'export const EXAM_SLIDES: HistSlide[] = [';
const startIndex = code.indexOf(startMarker);
if (startIndex === -1) {
  console.error('Could not find EXAM_SLIDES in file');
  process.exit(1);
}

const slidesSubstr = code.slice(startIndex + startMarker.length);
// Find the closing array bracket
const closingIndex = slidesSubstr.lastIndexOf('];');
if (closingIndex === -1) {
  console.error('Could not find closing ]; of EXAM_SLIDES');
  process.exit(1);
}

const slidesJsonStr = slidesSubstr.slice(0, closingIndex).trim();

// Safely evaluate or parse the array
let slides;
try {
  // Use Function to parse JavaScript object literal
  slides = new Function(`return [ ${slidesJsonStr} ];`)();
} catch (e) {
  console.error('Error evaluating EXAM_SLIDES JSON:', e.message);
  process.exit(1);
}

console.log(`Parsed ${slides.length} slides from histoData.ts`);

// Enrich each slide
for (const slide of slides) {
  const tgMatch = findTgMatch(slide.title);
  const atlasEntry = atlasData[slide.id];

  // Image URLs list
  const urls = [];
  const labels = [];

  // Primary image
  const primaryUrl = (tgMatch && tgMatch.localImagePath) ? tgMatch.localImagePath : slide.imageUrl;
  urls.push(primaryUrl);
  labels.push(tgMatch ? 'Срез 1 (Кафедра)' : 'Срез 1 (Оригинал)');

  // Atlas images
  if (atlasEntry && atlasEntry.atlasImages && atlasEntry.atlasImages.length > 0) {
    atlasEntry.atlasImages.forEach((img, idx) => {
      if (img.url && !urls.includes(img.url)) {
        urls.push(img.url);
        labels.push(`Срез ${urls.length} (Атлас)`);
      }
    });
  }

  slide.imageUrls = urls;
  slide.imageLabels = labels;

  // 6-point Exam Answer Plan
  if (tgMatch) {
    slide.examPlan = {
      stainAndType: tgMatch.stain ? `${slide.title} (${tgMatch.stain})` : `${slide.title} (${slide.stain})`,
      origin: tgMatch.origin || slide.embryoOrigin || 'Мезенхима',
      structure: tgMatch.description || slide.layersText,
      location: tgMatch.location || slide.keyCells,
      functionText: tgMatch.functionText || slide.functionText || 'Специфическая физиологическая функция органа',
      killerFeature: slide.killerFeature,
    };
    if (tgMatch.origin) slide.embryoOrigin = tgMatch.origin;
    if (tgMatch.functionText) slide.functionText = tgMatch.functionText;
  } else {
    slide.examPlan = {
      stainAndType: `${slide.title} (${slide.stain})`,
      origin: slide.embryoOrigin || 'Мезенхима / Эмбриональный источник',
      structure: slide.layersText,
      location: slide.keyCells,
      functionText: slide.functionText || 'Специфическая физиологическая функция органа',
      killerFeature: slide.killerFeature,
    };
  }
}

// Re-serialize slides
const formattedSlides = JSON.stringify(slides, null, 2);
const newCode = code.slice(0, startIndex + startMarker.length) + '\n' + formattedSlides.slice(1, -1) + '\n];\n';

fs.writeFileSync(histoDataPath, newCode, 'utf-8');
console.log(`Successfully updated ${histoDataPath} with multi-slice and exam plans!`);
