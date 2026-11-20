import { DiagnosticId, DiagnosticMeta, StudyMode } from './curriculumTypes';

export const DIAGNOSTICS_CONFIG: DiagnosticMeta[] = [
  {
    id: 1,
    mode: 'diag_1',
    title: 'Диагностика №1',
    shortTitle: 'Диагностика 1',
    semester: '2 семестр',
    lessonLabel: 'Занятие 12',
    subtitle: 'Ткани, кровь, хрящ, кость',
    expectedSlidesCount: 23,
    expectedEmCount: 19,
  },
  {
    id: 2,
    mode: 'diag_2',
    title: 'Диагностика №2',
    shortTitle: 'Диагностика 2',
    semester: '2 семестр · Зачёт',
    lessonLabel: 'Занятие 17',
    subtitle: 'Мышцы, нервная ткань, ЦНС',
    expectedSlidesCount: 13,
    expectedEmCount: 8,
  },
  {
    id: 3,
    mode: 'diag_3',
    title: 'Диагностика №3',
    shortTitle: 'Диагностика 3',
    semester: '3 семестр',
    lessonLabel: 'Занятие 26',
    subtitle: 'Чувства, ССС, иммунка, эндокринка',
    expectedSlidesCount: 25,
    expectedEmCount: 11,
  },
  {
    id: 4,
    mode: 'diag_4',
    title: 'Диагностика №4',
    shortTitle: 'Диагностика 4',
    semester: '3 семестр · Зачёт',
    lessonLabel: 'Занятие 34',
    subtitle: 'ЖКТ, почка, половая, плацента',
    expectedSlidesCount: 26,
    expectedEmCount: 23,
  },
];

export function modeToDiagnosticId(mode: StudyMode): DiagnosticId | null {
  if (mode === 'diag_1') return 1;
  if (mode === 'diag_2') return 2;
  if (mode === 'diag_3') return 3;
  if (mode === 'diag_4') return 4;
  return null;
}

export function getModeLabel(mode: StudyMode): string {
  const diagId = modeToDiagnosticId(mode);
  if (diagId) {
    return DIAGNOSTICS_CONFIG.find((d) => d.id === diagId)?.shortTitle || `Диагностика ${diagId}`;
  }
  return 'Экзамен';
}

/**
 * Определяет принадлежность микропрепарата к диагностикам №1–4.
 * Если у препарата уже задан явный массив `diagnosticIds`, используется он.
 * Иначе срабатывает точный маппинг по moduleId и examNumber из программы НГМУ.
 */
export function getSlideDiagnosticIds(slide: any): DiagnosticId[] {
  if (Array.isArray(slide?.diagnosticIds) && slide.diagnosticIds.length > 0) {
    return slide.diagnosticIds;
  }
  const mod = String(slide?.moduleId || '');
  const num = Number(slide?.examNumber || 0);

  if (mod === 'mod_epithelium_conn' || mod === 'mod_general_1') return [1];
  if (mod === 'mod_cartilage_bone_muscle' || mod === 'mod_general_2') {
    if (num >= 15) return [2];
    return [1];
  }
  if (mod === 'mod_nervous' || mod === 'mod_nervous_sensory') {
    if (num > 0 && num <= 23) return [2];
    return [3];
  }
  if (mod === 'mod_cardio_immune' || mod === 'mod_skin_resp' || mod === 'mod_endocrine') {
    return [3];
  }
  if (mod === 'mod_digestive' || mod === 'mod_urogenital') {
    return [4];
  }
  return [1];
}

/**
 * Определяет принадлежность электроннограммы к диагностикам №1–4.
 */
export function getEmDiagnosticIds(em: any): DiagnosticId[] {
  if (Array.isArray(em?.diagnosticIds) && em.diagnosticIds.length > 0) {
    return em.diagnosticIds;
  }
  const text = `${em?.title || ''} ${em?.category || ''} ${em?.section || ''}`.toLowerCase();

  if (
    text.includes('мышеч') ||
    text.includes('миоцит') ||
    text.includes('кардио') ||
    text.includes('вставочн') ||
    text.includes('нейрон') ||
    text.includes('миелин') ||
    text.includes('гематоэнцефал') ||
    text.includes('синапс')
  ) {
    return [2];
  }
  if (
    text.includes('палочк') ||
    text.includes('колбочк') ||
    text.includes('вкусов') ||
    text.includes('альвеол') ||
    text.includes('аэрогемат') ||
    text.includes('эндокрин') ||
    text.includes('нейросекрет') ||
    text.includes('гипофиз') ||
    text.includes('тимус') ||
    text.includes('кожа')
  ) {
    return [3];
  }
  if (
    text.includes('гепатоцит') ||
    text.includes('одонтобласт') ||
    text.includes('энамелобласт') ||
    text.includes('почк') ||
    text.includes('подоцит') ||
    text.includes('фильтрац') ||
    text.includes('семен') ||
    text.includes('сертоли') ||
    text.includes('яичник') ||
    text.includes('ооцит') ||
    text.includes('спермат') ||
    text.includes('плацент') ||
    text.includes('кишк') ||
    text.includes('желуд') ||
    text.includes('панкреа')
  ) {
    return [4];
  }
  return [1];
}
