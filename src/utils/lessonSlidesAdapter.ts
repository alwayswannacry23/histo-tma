import { TheoryTopic } from '../data/curriculumTypes';
import { EXAM_SLIDES, HistSlide } from '../data/histoData';

export interface LessonSlide {
  id: string;
  slideIndex: number;
  totalSlides: number;
  type: 'intro' | 'summary' | 'concept' | 'table' | 'trap' | 'qa' | 'brief';
  title: string;
  subtitle?: string;
  badge?: string;
  text?: string;
  items?: string[];
  tableData?: { headers: string[]; rows: string[][] };
  qaItems?: { q: string; a: string }[];
  examQuestionIds?: number[];
  relatedSlide?: HistSlide | null;
  activeLayerNumber?: number;
}

export function buildLessonSlides(
  topic: TheoryTopic,
  fallbackBlocks: Array<{ id: string; title: string; summary: string; examTip?: string }> = []
): LessonSlide[] {
  const slides: Omit<LessonSlide, 'slideIndex' | 'totalSlides'>[] = [];

  // Find linked slide if available
  const linkedSlides: HistSlide[] = (topic.relatedSlideIds || [])
    .map((id) => EXAM_SLIDES.find((s) => s.id === id))
    .filter(Boolean) as HistSlide[];
  
  // Prefer slide that has an active image
  const primarySlide = linkedSlides.find((s) => Boolean(s.imageUrl && s.imageUrl.trim())) || linkedSlides[0] || null;

  // 1. Intro Slide
  slides.push({
    id: `${topic.id}_intro`,
    type: 'intro',
    title: topic.title,
    subtitle: topic.subtitle,
    badge: topic.lessonNumber ? `Занятие ${topic.lessonNumber}` : undefined,
    examQuestionIds: topic.examQuestionIds,
    relatedSlide: primarySlide,
  });

  // 2. Structured blocks
  if (topic.blocks && topic.blocks.length > 0) {
    topic.blocks.forEach((block, idx) => {
      switch (block.type) {
        case 'summary':
          slides.push({
            id: `${topic.id}_block_${idx}`,
            type: 'summary',
            title: block.title || 'Ключевая концепция',
            text: block.text,
            relatedSlide: primarySlide,
          });
          break;

        case 'text':
          slides.push({
            id: `${topic.id}_block_${idx}`,
            type: 'concept',
            title: block.title || 'Теоретический материал',
            text: block.text,
            relatedSlide: primarySlide,
          });
          break;

        case 'list':
          slides.push({
            id: `${topic.id}_block_${idx}`,
            type: 'concept',
            title: block.title || 'Основные положения',
            items: block.items,
            relatedSlide: primarySlide,
          });
          break;

        case 'table':
          slides.push({
            id: `${topic.id}_block_${idx}`,
            type: 'table',
            title: block.title || 'Сравнительный анализ',
            tableData: { headers: block.headers, rows: block.rows },
            relatedSlide: primarySlide,
          });
          break;

        case 'examTrap':
          slides.push({
            id: `${topic.id}_block_${idx}`,
            type: 'trap',
            title: block.title || 'На чём валят на экзамене',
            text: block.text,
            relatedSlide: primarySlide,
          });
          break;

        case 'qa':
          slides.push({
            id: `${topic.id}_block_${idx}`,
            type: 'qa',
            title: block.title || 'Вопросы преподавателя на 5',
            qaItems: block.items,
            relatedSlide: primarySlide,
          });
          break;
      }
    });
  } else if (fallbackBlocks.length > 0) {
    fallbackBlocks.forEach((fb, idx) => {
      slides.push({
        id: `${topic.id}_fallback_${idx}`,
        type: 'concept',
        title: fb.title,
        text: fb.summary + (fb.examTip ? `\n\nНа экзамене: ${fb.examTip}` : ''),
        relatedSlide: primarySlide,
      });
    });
  }

  // 3. Brief summary slide if brief points exist
  if (topic.briefPoints && topic.briefPoints.length > 0) {
    slides.push({
      id: `${topic.id}_brief`,
      type: 'brief',
      title: 'Выжимка за 60 секунд',
      items: topic.briefPoints,
      relatedSlide: primarySlide,
    });
  }

  // If no content slides were created at all, create an informative placeholder
  if (slides.length === 1) {
    slides.push({
      id: `${topic.id}_placeholder`,
      type: 'concept',
      title: 'Конспект темы готовится',
      text: topic.subtitle || 'Материалы по данной теме кафедры НГМУ загружаются.',
      relatedSlide: primarySlide,
    });
  }

  const total = slides.length;
  return slides.map((s, i) => ({
    ...s,
    slideIndex: i,
    totalSlides: total,
  }));
}
