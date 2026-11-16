import { Module, Slide } from '../types';

const base = import.meta.env.BASE_URL || './';
const cleanBase = base.endsWith('/') ? base : `${base}/`;
const getSlideUrl = (filename: string) => `${cleanBase}slides/${filename}`;

export const MOCK_MODULES: Module[] = [
  {
    id: 'mod_epithelium',
    title: 'Эпителиальные ткани и железы',
    order_index: 1,
    is_free: true,
    description: 'Покровный и железистый эпителий, базальная мембрана, реснитчатый эпителий'
  },
  {
    id: 'mod_resp',
    title: 'Дыхательная система',
    order_index: 2,
    is_free: true,
    description: 'Трахея, бронхи разного калибра, респираторный отдел легкого'
  },
  {
    id: 'mod_digestive',
    title: 'Пищеварительная система',
    order_index: 3,
    is_free: false,
    description: 'Пищевод, желудок, тонкая и толстая кишка, печень и поджелудочная'
  },
  {
    id: 'mod_urinary',
    title: 'Мочевыделительная система',
    order_index: 4,
    is_free: false,
    description: 'Почка (корковое и мозговое вещество), нефрон, мочеточник, мочевой пузырь'
  }
];

export const MOCK_SLIDES: Slide[] = [
  {
    id: 'slide_trachea_01',
    module_id: 'mod_resp',
    title: 'Трахея (поперечный срез)',
    stain: 'Гематоксилин-эозин',
    magnification: 'x100 / x400',
    image_clean_url: getSlideUrl('trachea_clean.png'),
    image_annotated_url: getSlideUrl('trachea_annotated.jpg'),
    exam_checklist: {
      layers: '1. Слизистая (многорядный мерцательный эпителий + собственная пластинка) 2. Подслизистая основа (белково-слизистые железы) 3. Волокнисто-хрящевая оболочка (незамкнутые гиалиновые кольца) 4. Адвентициальная оболочка',
      key_cells: 'Реснитчатые, бокаловидные (секреция слизи), вставочные базальные (камбиальные), эндокринные клетки',
      killer_feature: 'Наличие массивного гиалинового хряща в виде незамкнутых колец (С-образная дуга) и многорядного призматического реснитчатого эпителия строго отличает от пищевода и бронхов'
    },
    quiz_distractors: [
      'Пищевод (поперечный срез)',
      'Крупный бронх',
      'Мочеточник'
    ],
    order_index: 1
  },
  {
    id: 'slide_esophagus_01',
    module_id: 'mod_digestive',
    title: 'Пищевод (поперечный срез)',
    stain: 'Гематоксилин-эозин',
    magnification: 'x100 / x400',
    image_clean_url: getSlideUrl('esophagus_clean.jpg'),
    image_annotated_url: getSlideUrl('esophagus_annotated.jpg'),
    exam_checklist: {
      layers: '1. Слизистая (многослойный плоский неороговевающий эпителий, собственная пластинка, мышечная пластинка из гладких миоцитов) 2. Подслизистая основа (собственные железы пищевода) 3. Мышечная оболочка (в верхней трети поперечнополосатая, в нижней — гладкая) 4. Адвентициальная оболочка',
      key_cells: 'Клетки базального и шиповатого слоев плоского эпителия, секреторные клетки концевых отделов собственных желез',
      killer_feature: 'Мощный многослойный плоский неороговевающий эпителий + глубокие собственные железы в подслизистой основе + звездчатый складчатый просвет'
    },
    quiz_distractors: [
      'Трахея (поперечный срез)',
      'Мочеточник',
      'Двенадцатиперстная кишка'
    ],
    order_index: 2
  },
  {
    id: 'slide_ureter_01',
    module_id: 'mod_urinary',
    title: 'Мочеточник (поперечный срез)',
    stain: 'Гематоксилин-эозин',
    magnification: 'x100 / x200',
    image_clean_url: getSlideUrl('ureter_clean.jpg'),
    image_annotated_url: getSlideUrl('ureter_annotated.jpg'),
    exam_checklist: {
      layers: '1. Слизистая оболочка (переходный эпителий / уротелий, выраженная складчатость, собственная пластинка) 2. Подслизистая основа (слабо выражена) 3. Мышечная оболочка (внутренний продольный, наружный циркулярный) 4. Адвентициальная оболочка',
      key_cells: 'Зонтичные (поверхностные крупные полиплоидные клетки с кутикулой), грушевидные промежуточные, мелкие базальные',
      killer_feature: 'Звездчатый узкий просвет с переходным эпителием (уротелием), полное отсутствие желез в стенке и четкая гладкая мускулатура'
    },
    quiz_distractors: [
      'Пищевод (поперечный срез)',
      'Трахея (поперечный срез)',
      'Семенной канатик'
    ],
    order_index: 3
  }
];
