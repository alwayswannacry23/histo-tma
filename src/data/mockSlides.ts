import { Module, Slide } from '../types';

export const getSlideUrl = (filename: string) => {
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}slides/${filename}`;
};

// Reliable fallback placeholder generator for histological micrographs
export const createHistologyFallbackSvg = (title: string, stain: string) => {
  const isSilver = stain.toLowerCase().includes('серебр') || stain.toLowerCase().includes('ороми');
  const isOrcein = stain.toLowerCase().includes('орсеин');
  const isNissl = stain.toLowerCase().includes('ниссл');

  let bg = '#FCE7F3';
  let circleColor = '#BE185D';
  let cellColor = '#4338CA';

  if (isSilver) {
    bg = '#E2E8F0';
    circleColor = '#334155';
    cellColor = '#0F172A';
  } else if (isOrcein) {
    bg = '#FDE8E8';
    circleColor = '#9B1C1C';
    cellColor = '#771D1D';
  } else if (isNissl) {
    bg = '#EDE9FE';
    circleColor = '#6D28D9';
    cellColor = '#4338CA';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="${bg}"/>
    <circle cx="400" cy="300" r="280" fill="${circleColor}" opacity="0.15"/>
    <g fill="${cellColor}" opacity="0.4">
      <circle cx="280" cy="240" r="16"/><circle cx="520" cy="240" r="16"/>
      <circle cx="400" cy="360" r="22"/><circle cx="340" cy="300" r="14"/>
      <circle cx="460" cy="300" r="14"/><circle cx="300" cy="380" r="12"/>
      <circle cx="500" cy="380" r="12"/>
    </g>
    <text x="400" y="300" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-size="22" font-weight="bold">${title}</text>
    <text x="400" y="335" text-anchor="middle" fill="#64748B" font-family="sans-serif" font-size="15">${stain}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const MOCK_MODULES: Module[] = [
  {
    "id": "mod_general_1",
    "title": "Общая гистология: Эпителии, железы и кровь",
    "order_index": 1,
    "is_free": true,
    "description": "Однослойные и многослойные эпителии, экзокринные железы, мазок крови и РВСТ."
  },
  {
    "id": "mod_general_2",
    "title": "Общая гистология: Хрящ, кость и мышечные ткани",
    "order_index": 2,
    "is_free": true,
    "description": "Плотная соединительная ткань, жир, гиалиновый и эластический хрящ, остеоны и все виды мышц."
  },
  {
    "id": "mod_nervous",
    "title": "Нервная ткань и нервная система",
    "order_index": 3,
    "is_free": false,
    "description": "Мотонейроны спинного мозга, миелиновые волокна, спинальный ганглий и кора мозжечка."
  },
  {
    "id": "mod_cardio_immune",
    "title": "Сердечно-сосудистая и иммунная системы",
    "order_index": 4,
    "is_free": false,
    "description": "Артерии и вены мышечного типа, лимфатический узел и селезенка."
  },
  {
    "id": "mod_skin_resp",
    "title": "Кожа и дыхательная система",
    "order_index": 5,
    "is_free": false,
    "description": "Трахея, легкое, респираторный отдел и воздухоносные пути."
  },
  {
    "id": "mod_endocrine",
    "title": "Эндокринная система",
    "order_index": 6,
    "is_free": false,
    "description": "Щитовидная железа, фолликулы, кора и мозговое вещество надпочечника."
  },
  {
    "id": "mod_digestive",
    "title": "Пищеварительная система",
    "order_index": 7,
    "is_free": false,
    "description": "Классическая печеночная долька, триады, синусоиды и балки гепатоцитов."
  },
  {
    "id": "mod_urogenital",
    "title": "Мочеполовая система и плацента",
    "order_index": 8,
    "is_free": false,
    "description": "Почка, почечные тельца с клубочками и извитые канальцы нефрона."
  }
];

export const EXAM_SLIDES: Slide[] = [
  {
    "id": "slide_01",
    "exam_number": 1,
    "examNumber": 1,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Однослойный плоский эпителий (мезотелий)",
    "stain": "Импрегнация серебром + гематоксилин",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Simple_squamous_epithelium_40x.jpg/800px-Simple_squamous_epithelium_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Simple_squamous_epithelium_40x.jpg/800px-Simple_squamous_epithelium_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=0",
    "layers": "Пласт плоских полигональных клеток на базальной мембране.",
    "keyCells": "Мезотелиоциты с извилистыми краями и светлыми ядрами.",
    "killerFeature": "Четкие черные извилистые границы («пазлы») при серебрении.",
    "differential_diagnosis": "От эндотелия отличается полигональной формой клеток и происхождением из спланхнотома.",
    "differentialDiagnosis": "От эндотелия отличается полигональной формой клеток и происхождением из спланхнотома.",
    "clinical_note": "Образует серозные оболочки (брюшину, плевру, перикард), предотвращает трение органов.",
    "clinicalNote": "Образует серозные оболочки (брюшину, плевру, перикард), предотвращает трение органов.",
    "quiz_distractors": [
      "Эндотелий",
      "Многослойный эпителий",
      "Кубический эпителий"
    ],
    "distractors": [
      "Эндотелий",
      "Многослойный эпителий",
      "Кубический эпителий"
    ],
    "exam_checklist": {
      "layers": "Пласт плоских полигональных клеток на базальной мембране.",
      "key_cells": "Мезотелиоциты с извилистыми краями и светлыми ядрами.",
      "killer_feature": "Четкие черные извилистые границы («пазлы») при серебрении.",
      "clinical_note": "Образует серозные оболочки (брюшину, плевру, перикард), предотвращает трение органов.",
      "differential_diagnosis": "От эндотелия отличается полигональной формой клеток и происхождением из спланхнотома.",
      "video_hint_query": "Однослойный плоский эпителий (мезотелий) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p1_1",
        "number": 1,
        "name": "Границы мезотелиоцитов (серебрение)",
        "short_name": "Границы",
        "color": "#6366F1",
        "description": "Извилистые черные границы клеток, импрегнированные серебром.",
        "pin_x": 48,
        "pin_y": 35
      },
      {
        "id": "p1_2",
        "number": 2,
        "name": "Ядро мезотелиоцита",
        "short_name": "Ядро",
        "color": "#EC4899",
        "description": "Крупное светлое овальное ядро с ядрышками.",
        "pin_x": 55,
        "pin_y": 52
      },
      {
        "id": "p1_3",
        "number": 3,
        "name": "Базальная мембрана",
        "short_name": "Мембрана",
        "color": "#10B981",
        "description": "Тонкая бесклеточная пластинка, на которой лежит пласт мезотелия.",
        "pin_x": 35,
        "pin_y": 70
      }
    ]
  },
  {
    "id": "slide_02",
    "exam_number": 3,
    "examNumber": 3,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Однослойный столбчатый каемчатый эпителий",
    "stain": "Гематоксилин и эозин",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Duodenum_histology_40x.jpg/800px-Duodenum_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Duodenum_histology_40x.jpg/800px-Duodenum_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=364",
    "layers": "Однорядный пласт высоких призматических клеток с полоской щеточной каемки.",
    "keyCells": "Каемчатые энтероциты, бокаловидные клетки.",
    "killerFeature": "Четкая розовая щеточная каемка на апикальном крае высоких клеток.",
    "differential_diagnosis": "От многорядного реснитчатого отличается отсутствием ресничек и одноуровневым расположением ядер.",
    "differentialDiagnosis": "От многорядного реснитчатого отличается отсутствием ресничек и одноуровневым расположением ядер.",
    "clinical_note": "Микроворсинки щеточной каемки увеличивают площадь всасывания в тонкой кишке в 30 раз.",
    "clinicalNote": "Микроворсинки щеточной каемки увеличивают площадь всасывания в тонкой кишке в 30 раз.",
    "quiz_distractors": [
      "Многорядный эпителий",
      "Многослойный эпителий",
      "Переходный эпителий"
    ],
    "distractors": [
      "Многорядный эпителий",
      "Многослойный эпителий",
      "Переходный эпителий"
    ],
    "exam_checklist": {
      "layers": "Однорядный пласт высоких призматических клеток с полоской щеточной каемки.",
      "key_cells": "Каемчатые энтероциты, бокаловидные клетки.",
      "killer_feature": "Четкая розовая щеточная каемка на апикальном крае высоких клеток.",
      "clinical_note": "Микроворсинки щеточной каемки увеличивают площадь всасывания в тонкой кишке в 30 раз.",
      "differential_diagnosis": "От многорядного реснитчатого отличается отсутствием ресничек и одноуровневым расположением ядер.",
      "video_hint_query": "Однослойный столбчатый каемчатый эпителий гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p2_1",
        "number": 1,
        "name": "Щеточная каемка (микроворсинки)",
        "short_name": "Каемка",
        "color": "#EC4899",
        "description": "Плотный слой микроворсинок с гликокаликсом на апикальном крае.",
        "pin_x": 50,
        "pin_y": 25
      },
      {
        "id": "p2_2",
        "number": 2,
        "name": "Призматический энтероцит",
        "short_name": "Энтероцит",
        "color": "#6366F1",
        "description": "Высокая клетка цилиндрической формы с базальным ядром.",
        "pin_x": 45,
        "pin_y": 50
      },
      {
        "id": "p2_3",
        "number": 3,
        "name": "Бокаловидная клетка",
        "short_name": "Бокал. кл.",
        "color": "#10B981",
        "description": "Светлая одноклеточная эндоэпителиальная железа со слизью.",
        "pin_x": 62,
        "pin_y": 42
      }
    ]
  },
  {
    "id": "slide_03",
    "exam_number": 4,
    "examNumber": 4,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Однослойный многорядный реснитчатый эпителий (трахея)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Trachea_histology_40x.jpg/800px-Trachea_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Trachea_histology_40x.jpg/800px-Trachea_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=634",
    "layers": "Все клетки на базальной мембране, но ядра на разной высоте (многорядность).",
    "keyCells": "Реснитчатые, бокаловидные, вставочные базальные клетки.",
    "killerFeature": "Многоядерные ряды и реснички на поверхности без бокаловидных разрывов.",
    "differential_diagnosis": "От истинно многослойного отличается тем, что ВСЕ клетки контактируют с базальной мембраной.",
    "differentialDiagnosis": "От истинно многослойного отличается тем, что ВСЕ клетки контактируют с базальной мембраной.",
    "clinical_note": "Мукоцилиарный клиренс очищает бронхиальное дерево; курение парализует реснички.",
    "clinicalNote": "Мукоцилиарный клиренс очищает бронхиальное дерево; курение парализует реснички.",
    "quiz_distractors": [
      "Однослойный эпителий",
      "Многослойный плоский",
      "Каемчатый эпителий"
    ],
    "distractors": [
      "Однослойный эпителий",
      "Многослойный плоский",
      "Каемчатый эпителий"
    ],
    "exam_checklist": {
      "layers": "Все клетки на базальной мембране, но ядра на разной высоте (многорядность).",
      "key_cells": "Реснитчатые, бокаловидные, вставочные базальные клетки.",
      "killer_feature": "Многоядерные ряды и реснички на поверхности без бокаловидных разрывов.",
      "clinical_note": "Мукоцилиарный клиренс очищает бронхиальное дерево; курение парализует реснички.",
      "differential_diagnosis": "От истинно многослойного отличается тем, что ВСЕ клетки контактируют с базальной мембраной.",
      "video_hint_query": "Однослойный многорядный реснитчатый эпителий (трахея) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p3_1",
        "number": 1,
        "name": "Мерцательные реснички",
        "short_name": "Реснички",
        "color": "#6366F1",
        "description": "Подвижные выросты цитоплазмы с аксонемой 9х2 + 2 микротрубочек.",
        "pin_x": 50,
        "pin_y": 20
      },
      {
        "id": "p3_2",
        "number": 2,
        "name": "Ряды ядер вставочных клеток",
        "short_name": "Ядра",
        "color": "#EC4899",
        "description": "Разноуровневое положение ядер создает эффект многослойности.",
        "pin_x": 48,
        "pin_y": 55
      },
      {
        "id": "p3_3",
        "number": 3,
        "name": "Базальная мембрана",
        "short_name": "Мембрана",
        "color": "#10B981",
        "description": "Толстая четко очерченная базальная мембрана дыхательных путей.",
        "pin_x": 50,
        "pin_y": 78
      }
    ]
  },
  {
    "id": "slide_04",
    "exam_number": 5,
    "examNumber": 5,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Многослойный плоский неороговевающий эпителий (пищевод / роговица)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Esophagus_histology_40x.jpg/800px-Esophagus_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Esophagus_histology_40x.jpg/800px-Esophagus_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=892",
    "layers": "Базальный, шиповатый и плоский поверхностный слои (живые ядра доверху).",
    "keyCells": "Кератиноциты разных слоев.",
    "killerFeature": "Много рядов клеток, поверхностные клетки уплощены, но сохраняют ядра.",
    "differential_diagnosis": "От ороговевающего отличается наличием ядер в клетках самого верхнего слоя и отсутствием зернистого слоя.",
    "differentialDiagnosis": "От ороговевающего отличается наличием ядер в клетках самого верхнего слоя и отсутствием зернистого слоя.",
    "clinical_note": "Выстилает пищевод, роговицу, влагалище; метаплазия в желудочный эпителий — пищевод Барретта.",
    "clinicalNote": "Выстилает пищевод, роговицу, влагалище; метаплазия в желудочный эпителий — пищевод Барретта.",
    "quiz_distractors": [
      "Ороговевающий эпителий",
      "Переходный эпителий",
      "Многорядный эпителий"
    ],
    "distractors": [
      "Ороговевающий эпителий",
      "Переходный эпителий",
      "Многорядный эпителий"
    ],
    "exam_checklist": {
      "layers": "Базальный, шиповатый и плоский поверхностный слои (живые ядра доверху).",
      "key_cells": "Кератиноциты разных слоев.",
      "killer_feature": "Много рядов клеток, поверхностные клетки уплощены, но сохраняют ядра.",
      "clinical_note": "Выстилает пищевод, роговицу, влагалище; метаплазия в желудочный эпителий — пищевод Барретта.",
      "differential_diagnosis": "От ороговевающего отличается наличием ядер в клетках самого верхнего слоя и отсутствием зернистого слоя.",
      "video_hint_query": "Многослойный плоский неороговевающий эпителий (пищевод / роговица) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p4_1",
        "number": 1,
        "name": "Поверхностный слой плоских клеток с ядрами",
        "short_name": "Поверхн. слой",
        "color": "#EC4899",
        "description": "Уплощенные живые клетки с четко видимыми ядрами.",
        "pin_x": 50,
        "pin_y": 22
      },
      {
        "id": "p4_2",
        "number": 2,
        "name": "Шиповатый промежуточный слой",
        "short_name": "Шиповатый",
        "color": "#6366F1",
        "description": "Полигональные клетки с десмосомальными контактами.",
        "pin_x": 50,
        "pin_y": 48
      },
      {
        "id": "p4_3",
        "number": 3,
        "name": "Базальный камбиальный слой",
        "short_name": "Базальный",
        "color": "#10B981",
        "description": "Призматические делящиеся клетки на базальной мембране.",
        "pin_x": 50,
        "pin_y": 75
      }
    ]
  },
  {
    "id": "slide_05",
    "exam_number": 6,
    "examNumber": 6,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Многослойный переходный эпителий (уротелий — мочевой пузырь)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Urinary_bladder_histology_40x.jpg/800px-Urinary_bladder_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Urinary_bladder_histology_40x.jpg/800px-Urinary_bladder_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=1166",
    "layers": "Базальный, промежуточный и поверхностный слои с куполообразными клетками.",
    "keyCells": "Зонтичные (поверхностные) крупные клетки, часто двуядерные.",
    "killerFeature": "Крупные куполообразные поверхностные клетки («зонтичные»), меняющие форму при растяжении.",
    "differential_diagnosis": "От плоского неороговевающего отличается куполообразными крупными клетками («зонтиками»), часто двуядерными.",
    "differentialDiagnosis": "От плоского неороговевающего отличается куполообразными крупными клетками («зонтиками»), часто двуядерными.",
    "clinical_note": "Уроплакиновые бляшки защищают стенку мочевого пузыря от гипертонической токсичной мочи.",
    "clinicalNote": "Уроплакиновые бляшки защищают стенку мочевого пузыря от гипертонической токсичной мочи.",
    "quiz_distractors": [
      "Многослойный неороговевающий",
      "Многорядный эпителий",
      "Однослойный кубический"
    ],
    "distractors": [
      "Многослойный неороговевающий",
      "Многорядный эпителий",
      "Однослойный кубический"
    ],
    "exam_checklist": {
      "layers": "Базальный, промежуточный и поверхностный слои с куполообразными клетками.",
      "key_cells": "Зонтичные (поверхностные) крупные клетки, часто двуядерные.",
      "killer_feature": "Крупные куполообразные поверхностные клетки («зонтичные»), меняющие форму при растяжении.",
      "clinical_note": "Уроплакиновые бляшки защищают стенку мочевого пузыря от гипертонической токсичной мочи.",
      "differential_diagnosis": "От плоского неороговевающего отличается куполообразными крупными клетками («зонтиками»), часто двуядерными.",
      "video_hint_query": "Многослойный переходный эпителий (уротелий — мочевой пузырь) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p5_1",
        "number": 1,
        "name": "Крупные зонтичные клетки",
        "short_name": "Зонтичные кл.",
        "color": "#EC4899",
        "description": "Куполообразные клетки, покрывающие несколько промежуточных.",
        "pin_x": 48,
        "pin_y": 28
      },
      {
        "id": "p5_2",
        "number": 2,
        "name": "Промежуточный грушевидный слой",
        "short_name": "Промежуточный",
        "color": "#6366F1",
        "description": "Клетки с вытянутыми ножками, скользящие друг по другу при растяжении.",
        "pin_x": 50,
        "pin_y": 52
      },
      {
        "id": "p5_3",
        "number": 3,
        "name": "Базальный слой",
        "short_name": "Базальный",
        "color": "#10B981",
        "description": "Мелкие округлые камбиальные клетки.",
        "pin_x": 52,
        "pin_y": 75
      }
    ]
  },
  {
    "id": "slide_06",
    "exam_number": 7,
    "examNumber": 7,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Многослойный плоский ороговевающий эпителий (кожа пальца)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Thick_skin_histology_40x.jpg/800px-Thick_skin_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Thick_skin_histology_40x.jpg/800px-Thick_skin_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=1521",
    "layers": "Базальный, шиповатый, зернистый, блестящий и мощный роговой слои.",
    "keyCells": "Кератиноциты, корнеоциты без ядер в роговом слое.",
    "killerFeature": "Наличие бесструктурного розового рогового слоя из омертвевших чешуек сверху.",
    "differential_diagnosis": "От неороговевающего отличается толстым слоем безъядерных чешуек и зернистым слоем с кератогиалином.",
    "differentialDiagnosis": "От неороговевающего отличается толстым слоем безъядерных чешуек и зернистым слоем с кератогиалином.",
    "clinical_note": "Обеспечивает механическую защиту и водонепроницаемость; при псориазе нарушается созревание (паракератоз).",
    "clinicalNote": "Обеспечивает механическую защиту и водонепроницаемость; при псориазе нарушается созревание (паракератоз).",
    "quiz_distractors": [
      "Неороговевающий эпителий",
      "Переходный эпителий",
      "Многорядный реснитчатый"
    ],
    "distractors": [
      "Неороговевающий эпителий",
      "Переходный эпителий",
      "Многорядный реснитчатый"
    ],
    "exam_checklist": {
      "layers": "Базальный, шиповатый, зернистый, блестящий и мощный роговой слои.",
      "key_cells": "Кератиноциты, корнеоциты без ядер в роговом слое.",
      "killer_feature": "Наличие бесструктурного розового рогового слоя из омертвевших чешуек сверху.",
      "clinical_note": "Обеспечивает механическую защиту и водонепроницаемость; при псориазе нарушается созревание (паракератоз).",
      "differential_diagnosis": "От неороговевающего отличается толстым слоем безъядерных чешуек и зернистым слоем с кератогиалином.",
      "video_hint_query": "Многослойный плоский ороговевающий эпителий (кожа пальца) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p6_1",
        "number": 1,
        "name": "Роговой слой (корнеоциты)",
        "short_name": "Роговой",
        "color": "#EC4899",
        "description": "Многослойные пласты безъядерных кератиновых чешуек.",
        "pin_x": 50,
        "pin_y": 18
      },
      {
        "id": "p6_2",
        "number": 2,
        "name": "Зернистый слой",
        "short_name": "Зернистый",
        "color": "#7C3AED",
        "description": "Темные гранулы кератогиалина в цитоплазме.",
        "pin_x": 50,
        "pin_y": 38
      },
      {
        "id": "p6_3",
        "number": 3,
        "name": "Шиповатый слой",
        "short_name": "Шиповатый",
        "color": "#6366F1",
        "description": "Много рядов полигональных кератиноцитов с десмосомами.",
        "pin_x": 50,
        "pin_y": 58
      }
    ]
  },
  {
    "id": "slide_07",
    "exam_number": 8,
    "examNumber": 8,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Простые трубчатые разветвленные железы (фундальный отдел желудка)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x100",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Fundic_stomach_congo_red_40x.jpg/800px-Fundic_stomach_congo_red_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Fundic_stomach_congo_red_40x.jpg/800px-Fundic_stomach_congo_red_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=1800",
    "layers": "Прямые трубчатые железы, открывающиеся в короткие ямки.",
    "keyCells": "Главные, париетальные (обкладочные) и мукоидные клетки.",
    "killerFeature": "Плотные ряды вертикальных трубочек желез с крупными оксифильными обкладочными клетками.",
    "differential_diagnosis": "От пилорических желез отличаются неглубокими желудочными ямками и обилием ярко-оксифильных париетальных клеток.",
    "differentialDiagnosis": "От пилорических желез отличаются неглубокими желудочными ямками и обилием ярко-оксифильных париетальных клеток.",
    "clinical_note": "Париетальные клетки секретируют соляную кислоту и фактор Касла (всасывание B12).",
    "clinicalNote": "Париетальные клетки секретируют соляную кислоту и фактор Касла (всасывание B12).",
    "quiz_distractors": [
      "Пилорические железы",
      "Кишечные крипты",
      "Потовые железы"
    ],
    "distractors": [
      "Пилорические железы",
      "Кишечные крипты",
      "Потовые железы"
    ],
    "exam_checklist": {
      "layers": "Прямые трубчатые железы, открывающиеся в короткие ямки.",
      "key_cells": "Главные, париетальные (обкладочные) и мукоидные клетки.",
      "killer_feature": "Плотные ряды вертикальных трубочек желез с крупными оксифильными обкладочными клетками.",
      "clinical_note": "Париетальные клетки секретируют соляную кислоту и фактор Касла (всасывание B12).",
      "differential_diagnosis": "От пилорических желез отличаются неглубокими желудочными ямками и обилием ярко-оксифильных париетальных клеток.",
      "video_hint_query": "Простые трубчатые разветвленные железы (фундальный отдел желудка) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p7_1",
        "number": 1,
        "name": "Желудочные ямки",
        "short_name": "Ямки",
        "color": "#6366F1",
        "description": "Мелкие углубления покровного эпителия (не более 1/4 толщины слизистой).",
        "pin_x": 50,
        "pin_y": 18
      },
      {
        "id": "p7_2",
        "number": 2,
        "name": "Париетальные клетки (оксифильные)",
        "short_name": "Париетальные",
        "color": "#EC4899",
        "description": "Крупные круглые ярко-розовые клетки, продуцирующие HCl.",
        "pin_x": 45,
        "pin_y": 45
      },
      {
        "id": "p7_3",
        "number": 3,
        "name": "Главные клетки (базофильные)",
        "short_name": "Главные",
        "color": "#7C3AED",
        "description": "Базофильные клетки на дне желез, синтезирующие пепсиноген.",
        "pin_x": 55,
        "pin_y": 75
      }
    ]
  },
  {
    "id": "slide_08",
    "exam_number": 10,
    "examNumber": 10,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Простая разветвленная альвеолярная железа (сальная железа кожи)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Thin_skin_hair_follicle_40x.jpg/800px-Thin_skin_hair_follicle_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Thin_skin_hair_follicle_40x.jpg/800px-Thin_skin_hair_follicle_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=2159",
    "layers": "Мешковидные концевые отделы (альвеолы), открывающиеся в волосяной фолликул.",
    "keyCells": "Себоциты (с накоплением капель жира — голокриновый тип секреции).",
    "killerFeature": "Светлые ячеистые клетки с пенистой цитоплазмой, распадающиеся при выделении секрета.",
    "differential_diagnosis": "От потовых желез отличается альвеолярной формой, голокриновым распадом клеток и связью с волосяным фолликулом.",
    "differentialDiagnosis": "От потовых желез отличается альвеолярной формой, голокриновым распадом клеток и связью с волосяным фолликулом.",
    "clinical_note": "Гиперпродукция кожного сала и бактериальная колонизация Cutibacterium acnes приводят к акне.",
    "clinicalNote": "Гиперпродукция кожного сала и бактериальная колонизация Cutibacterium acnes приводят к акне.",
    "quiz_distractors": [
      "Потовые железы",
      "Слюнные железы",
      "Щитовидная железа"
    ],
    "distractors": [
      "Потовые железы",
      "Слюнные железы",
      "Щитовидная железа"
    ],
    "exam_checklist": {
      "layers": "Мешковидные концевые отделы (альвеолы), открывающиеся в волосяной фолликул.",
      "key_cells": "Себоциты (с накоплением капель жира — голокриновый тип секреции).",
      "killer_feature": "Светлые ячеистые клетки с пенистой цитоплазмой, распадающиеся при выделении секрета.",
      "clinical_note": "Гиперпродукция кожного сала и бактериальная колонизация Cutibacterium acnes приводят к акне.",
      "differential_diagnosis": "От потовых желез отличается альвеолярной формой, голокриновым распадом клеток и связью с волосяным фолликулом.",
      "video_hint_query": "Простая разветвленная альвеолярная железа (сальная железа кожи) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p8_1",
        "number": 1,
        "name": "Концевой альвеолярный отдел",
        "short_name": "Альвеола",
        "color": "#6366F1",
        "description": "Группа клеток, окруженная соединительнотканной капсулой.",
        "pin_x": 48,
        "pin_y": 40
      },
      {
        "id": "p8_2",
        "number": 2,
        "name": "Себоциты с каплями липидов",
        "short_name": "Себоциты",
        "color": "#EC4899",
        "description": "Светлые ячеистые клетки на разных стадиях накопления жира.",
        "pin_x": 55,
        "pin_y": 55
      },
      {
        "id": "p8_3",
        "number": 3,
        "name": "Волосяной фолликул",
        "short_name": "Фолликул",
        "color": "#10B981",
        "description": "Устье железы открывается в шейку волосяного фолликула.",
        "pin_x": 35,
        "pin_y": 30
      }
    ]
  },
  {
    "id": "slide_09",
    "exam_number": 11,
    "examNumber": 11,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Кровь человека (мазок)",
    "stain": "По Романовскому-Гимза",
    "magnification": "x900",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Blood_smear_40x.jpg/800px-Blood_smear_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Blood_smear_40x.jpg/800px-Blood_smear_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=2706",
    "layers": "Форменные элементы в жидкой плазме.",
    "keyCells": "Эритроциты, нейтрофилы, лимфоциты, моноциты, эозинофилы, тромбоциты.",
    "killerFeature": "Масса розовых безъядерных дисков-эритроцитов и редкие ядра лейкоцитов.",
    "differential_diagnosis": "От костного мозга отличается отсутствием незрелых бластных форм и стромы.",
    "differentialDiagnosis": "От костного мозга отличается отсутствием незрелых бластных форм и стромы.",
    "clinical_note": "Подсчет лейкоцитарной формулы позволяет диагностировать бактериальные инфекции, лейкозы и аллергии.",
    "clinicalNote": "Подсчет лейкоцитарной формулы позволяет диагностировать бактериальные инфекции, лейкозы и аллергии.",
    "quiz_distractors": [
      "Красный костный мозг",
      "Лимфа",
      "Селезенка"
    ],
    "distractors": [
      "Красный костный мозг",
      "Лимфа",
      "Селезенка"
    ],
    "exam_checklist": {
      "layers": "Форменные элементы в жидкой плазме.",
      "key_cells": "Эритроциты, нейтрофилы, лимфоциты, моноциты, эозинофилы, тромбоциты.",
      "killer_feature": "Масса розовых безъядерных дисков-эритроцитов и редкие ядра лейкоцитов.",
      "clinical_note": "Подсчет лейкоцитарной формулы позволяет диагностировать бактериальные инфекции, лейкозы и аллергии.",
      "differential_diagnosis": "От костного мозга отличается отсутствием незрелых бластных форм и стромы.",
      "video_hint_query": "Кровь человека (мазок) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p9_1",
        "number": 1,
        "name": "Эритроциты (нормоциты)",
        "short_name": "Эритроциты",
        "color": "#EC4899",
        "description": "Безъядерные двояковогнутые диски диаметром 7.5 мкм.",
        "pin_x": 40,
        "pin_y": 40
      },
      {
        "id": "p9_2",
        "number": 2,
        "name": "Сегментоядерный нейтрофил",
        "short_name": "Нейтрофил",
        "color": "#7C3AED",
        "description": "Лейкоцит с ядром из 3-5 сегментов и мелкой зернистостью.",
        "pin_x": 58,
        "pin_y": 48
      },
      {
        "id": "p9_3",
        "number": 3,
        "name": "Кровяные пластинки (тромбоциты)",
        "short_name": "Тромбоциты",
        "color": "#6366F1",
        "description": "Мелкие безъядерные фиолетовые осколки мегакариоцитов.",
        "pin_x": 68,
        "pin_y": 60
      }
    ]
  },
  {
    "id": "slide_10",
    "exam_number": 12,
    "examNumber": 12,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Рыхлая волокнистая соединительная ткань (РВСТ, пленочный препарат)",
    "stain": "Железный гематоксилин",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Areolar_connective_tissue_40x.jpg/800px-Areolar_connective_tissue_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Areolar_connective_tissue_40x.jpg/800px-Areolar_connective_tissue_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=3532",
    "layers": "Переплетающиеся пучки коллагеновых и тонкие сети эластических волокон.",
    "keyCells": "Фибробласты, макрофаги, тучные клетки, плазмоциты.",
    "killerFeature": "Два типа волокон (толстые коллагеновые и тонкие эластические) в аморфном матриксе.",
    "differential_diagnosis": "От плотной волокнистой отличается преобладанием аморфного вещества и разнообразием клеточных форм.",
    "differentialDiagnosis": "От плотной волокнистой отличается преобладанием аморфного вещества и разнообразием клеточных форм.",
    "clinical_note": "Сопровождает все сосуды и нервы, является главной ареной воспалительных и аллергических реакций.",
    "clinicalNote": "Сопровождает все сосуды и нервы, является главной ареной воспалительных и аллергических реакций.",
    "quiz_distractors": [
      "Плотная волокнистая ткань",
      "Мезенхима",
      "Ретикулярная ткань"
    ],
    "distractors": [
      "Плотная волокнистая ткань",
      "Мезенхима",
      "Ретикулярная ткань"
    ],
    "exam_checklist": {
      "layers": "Переплетающиеся пучки коллагеновых и тонкие сети эластических волокон.",
      "key_cells": "Фибробласты, макрофаги, тучные клетки, плазмоциты.",
      "killer_feature": "Два типа волокон (толстые коллагеновые и тонкие эластические) в аморфном матриксе.",
      "clinical_note": "Сопровождает все сосуды и нервы, является главной ареной воспалительных и аллергических реакций.",
      "differential_diagnosis": "От плотной волокнистой отличается преобладанием аморфного вещества и разнообразием клеточных форм.",
      "video_hint_query": "Рыхлая волокнистая соединительная ткань (РВСТ, пленочный препарат) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p10_1",
        "number": 1,
        "name": "Пучки коллагеновых волокон",
        "short_name": "Коллаген",
        "color": "#EC4899",
        "description": "Широкие розовые волнистые ленты неветвящихся волокон.",
        "pin_x": 45,
        "pin_y": 35
      },
      {
        "id": "p10_2",
        "number": 2,
        "name": "Эластические волокна",
        "short_name": "Эластин",
        "color": "#0F172A",
        "description": "Тонкие темные ветвящиеся нити, анастомозирующие в сеть.",
        "pin_x": 60,
        "pin_y": 50
      },
      {
        "id": "p10_3",
        "number": 3,
        "name": "Фибробласт",
        "short_name": "Фибробласт",
        "color": "#6366F1",
        "description": "Крупная отростчатая клетка со светлым овальным ядром.",
        "pin_x": 35,
        "pin_y": 65
      }
    ]
  },
  {
    "id": "slide_11",
    "exam_number": 15,
    "examNumber": 15,
    "module_id": "mod_general_1",
    "moduleId": "mod_general_1",
    "title": "Плотная оформленная соединительная ткань (сухожилие, продольный срез)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Dense_regular_connective_tissue_40x.jpg/800px-Dense_regular_connective_tissue_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Dense_regular_connective_tissue_40x.jpg/800px-Dense_regular_connective_tissue_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=4106",
    "layers": "Параллельные толстые пучки коллагеновых волокон 1-го и 2-го порядка.",
    "keyCells": "Тендиноциты (фиброциты) с вытянутыми темными ядрами в виде цепочек.",
    "killerFeature": "Строго параллельные волнистые розовые пучки волокон и ровные ряды ядер между ними.",
    "differential_diagnosis": "От скелетной мышцы отличается отсутствием поперечной исчерченности и расположением ядер строго между волокнами.",
    "differentialDiagnosis": "От скелетной мышцы отличается отсутствием поперечной исчерченности и расположением ядер строго между волокнами.",
    "clinical_note": "Выдерживает колоссальные нагрузки на растяжение; медленно регенерирует из-за бедного кровоснабжения.",
    "clinicalNote": "Выдерживает колоссальные нагрузки на растяжение; медленно регенерирует из-за бедного кровоснабжения.",
    "quiz_distractors": [
      "Скелетная мышца",
      "Плотная неоформленная ткань",
      "Гладкая мышца"
    ],
    "distractors": [
      "Скелетная мышца",
      "Плотная неоформленная ткань",
      "Гладкая мышца"
    ],
    "exam_checklist": {
      "layers": "Параллельные толстые пучки коллагеновых волокон 1-го и 2-го порядка.",
      "key_cells": "Тендиноциты (фиброциты) с вытянутыми темными ядрами в виде цепочек.",
      "killer_feature": "Строго параллельные волнистые розовые пучки волокон и ровные ряды ядер между ними.",
      "clinical_note": "Выдерживает колоссальные нагрузки на растяжение; медленно регенерирует из-за бедного кровоснабжения.",
      "differential_diagnosis": "От скелетной мышцы отличается отсутствием поперечной исчерченности и расположением ядер строго между волокнами.",
      "video_hint_query": "Плотная оформленная соединительная ткань (сухожилие, продольный срез) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p11_1",
        "number": 1,
        "name": "Параллельные коллагеновые пучки",
        "short_name": "Коллаген",
        "color": "#EC4899",
        "description": "Плотные пучки волокон I порядка, ориентированные строго вдоль оси.",
        "pin_x": 50,
        "pin_y": 35
      },
      {
        "id": "p11_2",
        "number": 2,
        "name": "Ряды ядер сухожильных клеток (тендиноцитов)",
        "short_name": "Тендиноциты",
        "color": "#7C3AED",
        "description": "Вытянутые уплощенные темные ядра фиброцитов в виде цепочек.",
        "pin_x": 48,
        "pin_y": 55
      },
      {
        "id": "p11_3",
        "number": 3,
        "name": "Эндотеноний",
        "short_name": "Эндотеноний",
        "color": "#10B981",
        "description": "Прослойки РВСТ с капиллярами между пучками II порядка.",
        "pin_x": 55,
        "pin_y": 80
      }
    ]
  },
  {
    "id": "slide_12",
    "exam_number": 18,
    "examNumber": 18,
    "module_id": "mod_general_2",
    "moduleId": "mod_general_2",
    "title": "Белая жировая ткань",
    "stain": "Гематоксилин и эозин / Судан III",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Adipose_tissue_40x.jpg/800px-Adipose_tissue_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Adipose_tissue_40x.jpg/800px-Adipose_tissue_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=4652",
    "layers": "Крупные жировые клетки, сгруппированные в дольки соединительной тканью.",
    "keyCells": "Адипоциты (огромная капля жира внутри, ядро оттеснено к плазмолемме — «перстень»).",
    "killerFeature": "Соты из крупных прозрачных пузырей с жиром и тонкими ободками цитоплазмы.",
    "differential_diagnosis": "От бурого жира отличается одной гигантской каплей липидов (унилокулярные адипоциты) и сплющенным ядром.",
    "differentialDiagnosis": "От бурого жира отличается одной гигантской каплей липидов (унилокулярные адипоциты) и сплющенным ядром.",
    "clinical_note": "Энергетическое депо, теплоизоляция и эндокринный орган (секреция лептина, резистина, эстрогенов).",
    "clinicalNote": "Энергетическое депо, теплоизоляция и эндокринный орган (секреция лептина, резистина, эстрогенов).",
    "quiz_distractors": [
      "Бурая жировая ткань",
      "Селезенка",
      "Тимус"
    ],
    "distractors": [
      "Бурая жировая ткань",
      "Селезенка",
      "Тимус"
    ],
    "exam_checklist": {
      "layers": "Крупные жировые клетки, сгруппированные в дольки соединительной тканью.",
      "key_cells": "Адипоциты (огромная капля жира внутри, ядро оттеснено к плазмолемме — «перстень»).",
      "killer_feature": "Соты из крупных прозрачных пузырей с жиром и тонкими ободками цитоплазмы.",
      "clinical_note": "Энергетическое депо, теплоизоляция и эндокринный орган (секреция лептина, резистина, эстрогенов).",
      "differential_diagnosis": "От бурого жира отличается одной гигантской каплей липидов (унилокулярные адипоциты) и сплющенным ядром.",
      "video_hint_query": "Белая жировая ткань гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p12_1",
        "number": 1,
        "name": "Липидная вакуоль адипоцита",
        "short_name": "Вакуоль",
        "color": "#F59E0B",
        "description": "Прозрачная полость от вымытого спиртами триглицерида.",
        "pin_x": 48,
        "pin_y": 42
      },
      {
        "id": "p12_2",
        "number": 2,
        "name": "Сплющенное ядро на периферии",
        "short_name": "Ядро",
        "color": "#7C3AED",
        "description": "Ядро в форме серпа, прижатое липидной каплей к оболочке клетки.",
        "pin_x": 62,
        "pin_y": 48
      },
      {
        "id": "p12_3",
        "number": 3,
        "name": "Междольковая перегородка РВСТ",
        "short_name": "Септа",
        "color": "#EC4899",
        "description": "Тонкая соединительнотканная прослойка с капиллярами.",
        "pin_x": 35,
        "pin_y": 65
      }
    ]
  },
  {
    "id": "slide_13",
    "exam_number": 21,
    "examNumber": 21,
    "module_id": "mod_general_2",
    "moduleId": "mod_general_2",
    "title": "Гиалиновый хрящ (ребро)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Hyaline_cartilage_40x.jpg/800px-Hyaline_cartilage_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Hyaline_cartilage_40x.jpg/800px-Hyaline_cartilage_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=5152",
    "layers": "Надхрящница и глубокая зона с изогенными группами хондроцитов.",
    "keyCells": "Хондроциты в лакунах по 2–5 штук (изогенные группы).",
    "killerFeature": "Однородное стекловидное (базофильное) межклеточное вещество без видимых волокон.",
    "differential_diagnosis": "От эластического хряща отличается отсутствием сети эластических волокон (матрикс однороден).",
    "differentialDiagnosis": "От эластического хряща отличается отсутствием сети эластических волокон (матрикс однороден).",
    "clinical_note": "Покрывает суставные поверхности; при артрозе истирается гиалиновый матрикс.",
    "clinicalNote": "Покрывает суставные поверхности; при артрозе истирается гиалиновый матрикс.",
    "quiz_distractors": [
      "Эластический хрящ",
      "Костная ткань",
      "Волокнистый хрящ"
    ],
    "distractors": [
      "Эластический хрящ",
      "Костная ткань",
      "Волокнистый хрящ"
    ],
    "exam_checklist": {
      "layers": "Надхрящница и глубокая зона с изогенными группами хондроцитов.",
      "key_cells": "Хондроциты в лакунах по 2–5 штук (изогенные группы).",
      "killer_feature": "Однородное стекловидное (базофильное) межклеточное вещество без видимых волокон.",
      "clinical_note": "Покрывает суставные поверхности; при артрозе истирается гиалиновый матрикс.",
      "differential_diagnosis": "От эластического хряща отличается отсутствием сети эластических волокон (матрикс однороден).",
      "video_hint_query": "Гиалиновый хрящ (ребро) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p13_1",
        "number": 1,
        "name": "Изогенная группа хондроцитов",
        "short_name": "Изогенная гр.",
        "color": "#7C3AED",
        "description": "Группа из 2-4 клеток-потомков одного хондробласта в общей лакуне.",
        "pin_x": 52,
        "pin_y": 48
      },
      {
        "id": "p13_2",
        "number": 2,
        "name": "Базофильный матрикс",
        "short_name": "Матрикс",
        "color": "#6366F1",
        "description": "Аморфное стекловидное вещество, богатое хондроитинсульфатами.",
        "pin_x": 38,
        "pin_y": 60
      },
      {
        "id": "p13_3",
        "number": 3,
        "name": "Надхрящница (перихондрий)",
        "short_name": "Надхрящница",
        "color": "#EC4899",
        "description": "Волокнистый слой с сосудами и камбиальными хондробластами.",
        "pin_x": 50,
        "pin_y": 18
      }
    ]
  },
  {
    "id": "slide_14",
    "exam_number": 22,
    "examNumber": 22,
    "module_id": "mod_general_2",
    "moduleId": "mod_general_2",
    "title": "Эластический хрящ (ушная раковина)",
    "stain": "Орсеин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Elastic_cartilage_40x.jpg/800px-Elastic_cartilage_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Elastic_cartilage_40x.jpg/800px-Elastic_cartilage_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=5758",
    "layers": "Матрикс, пронизанный густой сетью эластических волокон.",
    "keyCells": "Хондроциты в капсулах.",
    "killerFeature": "Темно-коричневая или вишневая густая сеть эластических волокон при окраске орсеином.",
    "differential_diagnosis": "От гиалинового хряща отличается темной эластической сетью и неспособностью к омелотворению (окостенению).",
    "differentialDiagnosis": "От гиалинового хряща отличается темной эластической сетью и неспособностью к омелотворению (окостенению).",
    "clinical_note": "Обеспечивает гибкость ушной раковины и надгортанника.",
    "clinicalNote": "Обеспечивает гибкость ушной раковины и надгортанника.",
    "quiz_distractors": [
      "Гиалиновый хрящ",
      "Волокнистый хрящ",
      "Костная ткань"
    ],
    "distractors": [
      "Гиалиновый хрящ",
      "Волокнистый хрящ",
      "Костная ткань"
    ],
    "exam_checklist": {
      "layers": "Матрикс, пронизанный густой сетью эластических волокон.",
      "key_cells": "Хондроциты в капсулах.",
      "killer_feature": "Темно-коричневая или вишневая густая сеть эластических волокон при окраске орсеином.",
      "clinical_note": "Обеспечивает гибкость ушной раковины и надгортанника.",
      "differential_diagnosis": "От гиалинового хряща отличается темной эластической сетью и неспособностью к омелотворению (окостенению).",
      "video_hint_query": "Эластический хрящ (ушная раковина) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p14_1",
        "number": 1,
        "name": "Сеть эластических волокон",
        "short_name": "Эластин",
        "color": "#991B1B",
        "description": "Густая сеть волокон, избирательно прокрашенная орсеином.",
        "pin_x": 52,
        "pin_y": 40
      },
      {
        "id": "p14_2",
        "number": 2,
        "name": "Хондроциты в лакунах",
        "short_name": "Хондроциты",
        "color": "#7C3AED",
        "description": "Клетки хряща, лежащие поодиночке или мелкими парами.",
        "pin_x": 42,
        "pin_y": 55
      },
      {
        "id": "p14_3",
        "number": 3,
        "name": "Перихондрий",
        "short_name": "Перихондрий",
        "color": "#EC4899",
        "description": "Соединительнотканная оболочка хряща.",
        "pin_x": 50,
        "pin_y": 20
      }
    ]
  },
  {
    "id": "slide_15",
    "exam_number": 24,
    "examNumber": 24,
    "module_id": "mod_general_2",
    "moduleId": "mod_general_2",
    "title": "Пластинчатая костная ткань (диафиз, поперечный срез по Шморлю)",
    "stain": "По Шморлю",
    "magnification": "x100",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Compact_bone_40x.jpg/800px-Compact_bone_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Compact_bone_40x.jpg/800px-Compact_bone_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=6193",
    "layers": "Остеоны с концентрическими пластинками вокруг центральных каналов.",
    "keyCells": "Остеоциты с паукообразными отростками в лакунах.",
    "killerFeature": "Системы колец остеонов вокруг темных каналов Гаверса.",
    "differential_diagnosis": "От грубоволокнистой кости отличается упорядоченными остеонными системами концентрических пластинок.",
    "differentialDiagnosis": "От грубоволокнистой кости отличается упорядоченными остеонными системами концентрических пластинок.",
    "clinical_note": "Остеоны обеспечивают прочность костей скелета при изгибах и сжатии; при остеопорозе истончаются.",
    "clinicalNote": "Остеоны обеспечивают прочность костей скелета при изгибах и сжатии; при остеопорозе истончаются.",
    "quiz_distractors": [
      "Продольный срез кости",
      "Непрямой остеогенез",
      "Гиалиновый хрящ"
    ],
    "distractors": [
      "Продольный срез кости",
      "Непрямой остеогенез",
      "Гиалиновый хрящ"
    ],
    "exam_checklist": {
      "layers": "Остеоны с концентрическими пластинками вокруг центральных каналов.",
      "key_cells": "Остеоциты с паукообразными отростками в лакунах.",
      "killer_feature": "Системы колец остеонов вокруг темных каналов Гаверса.",
      "clinical_note": "Остеоны обеспечивают прочность костей скелета при изгибах и сжатии; при остеопорозе истончаются.",
      "differential_diagnosis": "От грубоволокнистой кости отличается упорядоченными остеонными системами концентрических пластинок.",
      "video_hint_query": "Пластинчатая костная ткань (диафиз, поперечный срез по Шморлю) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p15_1",
        "number": 1,
        "name": "Канал остеона (канал Гаверса)",
        "short_name": "Гаверсов канал",
        "color": "#0F172A",
        "description": "Центральный канал с кровеносными сосудами и нервными волокнами.",
        "pin_x": 50,
        "pin_y": 50
      },
      {
        "id": "p15_2",
        "number": 2,
        "name": "Концентрические костные пластинки",
        "short_name": "Пластинки",
        "color": "#F59E0B",
        "description": "Цилиндрические слои минерализованного костного матрикса.",
        "pin_x": 40,
        "pin_y": 38
      },
      {
        "id": "p15_3",
        "number": 3,
        "name": "Лакуны с остеоцитами",
        "short_name": "Остеоциты",
        "color": "#7C3AED",
        "description": "Паукообразные темные щели с костными клетками и канальцами.",
        "pin_x": 62,
        "pin_y": 45
      }
    ]
  },
  {
    "id": "slide_16",
    "exam_number": 29,
    "examNumber": 29,
    "module_id": "mod_general_2",
    "moduleId": "mod_general_2",
    "title": "Поперечно-полосатая скелетная мышечная ткань (язык)",
    "stain": "Железный гематоксилин",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Skeletal_muscle_40x.jpg/800px-Skeletal_muscle_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Skeletal_muscle_40x.jpg/800px-Skeletal_muscle_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=7335",
    "layers": "Длинные цилиндрические симпласты с поперечной исчерченностью.",
    "keyCells": "Мышечные симпласты, множество плоских ядер на периферии.",
    "killerFeature": "Четкие полоски дисков (A и I) и периферическое положение ядер, волокна не ветвятся.",
    "differential_diagnosis": "От сердечной мышцы отличается периферическим положением сотен ядер, отсутствием вставочных дисков и анастомозов.",
    "differentialDiagnosis": "От сердечной мышцы отличается периферическим положением сотен ядер, отсутствием вставочных дисков и анастомозов.",
    "clinical_note": "Иннервируется соматической нервной системой; утомляема; субстрат миастении и рабдомиолиза.",
    "clinicalNote": "Иннервируется соматической нервной системой; утомляема; субстрат миастении и рабдомиолиза.",
    "quiz_distractors": [
      "Сердечная мышечная ткань",
      "Гладкая мышца",
      "Сухожилие"
    ],
    "distractors": [
      "Сердечная мышечная ткань",
      "Гладкая мышца",
      "Сухожилие"
    ],
    "exam_checklist": {
      "layers": "Длинные цилиндрические симпласты с поперечной исчерченностью.",
      "key_cells": "Мышечные симпласты, множество плоских ядер на периферии.",
      "killer_feature": "Четкие полоски дисков (A и I) и периферическое положение ядер, волокна не ветвятся.",
      "clinical_note": "Иннервируется соматической нервной системой; утомляема; субстрат миастении и рабдомиолиза.",
      "differential_diagnosis": "От сердечной мышцы отличается периферическим положением сотен ядер, отсутствием вставочных дисков и анастомозов.",
      "video_hint_query": "Поперечно-полосатая скелетная мышечная ткань (язык) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p16_1",
        "number": 1,
        "name": "Поперечная исчерченность (диски A и I)",
        "short_name": "Исчерченность",
        "color": "#6366F1",
        "description": "Чередование темных анизотропных и светлых изотропных дисков саркомеров.",
        "pin_x": 50,
        "pin_y": 40
      },
      {
        "id": "p16_2",
        "number": 2,
        "name": "Периферические ядра симпласта",
        "short_name": "Ядра под сарколеммой",
        "color": "#7C3AED",
        "description": "Сплющенные ядра, оттесненные миофибриллами под оболочку волокна.",
        "pin_x": 35,
        "pin_y": 52
      },
      {
        "id": "p16_3",
        "number": 3,
        "name": "Эндомизий",
        "short_name": "Эндомизий",
        "color": "#EC4899",
        "description": "Тончайшая прослойка РВСТ с капиллярами вокруг каждого волокна.",
        "pin_x": 65,
        "pin_y": 60
      }
    ]
  },
  {
    "id": "slide_17",
    "exam_number": 31,
    "examNumber": 31,
    "module_id": "mod_general_2",
    "moduleId": "mod_general_2",
    "title": "Поперечно-полосатая сердечная мышечная ткань (миокард)",
    "stain": "Железный гематоксилин / Г-Э",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Cardiac_muscle_40x.jpg/800px-Cardiac_muscle_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Cardiac_muscle_40x.jpg/800px-Cardiac_muscle_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=7673",
    "layers": "Взаимосвязанная сеть кардиомиоцитов с анастомозами.",
    "keyCells": "Кардиомиоциты с центральным расположением ядра и вставочными дисками.",
    "killerFeature": "Ветвление волокон (анастомозы), центральные ядра и темные черточки — вставочные диски.",
    "differential_diagnosis": "От скелетной мышцы отличается клеточным строением, центральным расположением 1-2 ядер и вставочными дисками.",
    "differentialDiagnosis": "От скелетной мышцы отличается клеточным строением, центральным расположением 1-2 ядер и вставочными дисками.",
    "clinical_note": "Вставочные диски содержат нексусы для электрического синцития; гибель кардиомиоцитов ведет к инфаркту миокарда.",
    "clinicalNote": "Вставочные диски содержат нексусы для электрического синцития; гибель кардиомиоцитов ведет к инфаркту миокарда.",
    "quiz_distractors": [
      "Скелетная мускулатура",
      "Гладкая мышца",
      "Нерв"
    ],
    "distractors": [
      "Скелетная мускулатура",
      "Гладкая мышца",
      "Нерв"
    ],
    "exam_checklist": {
      "layers": "Взаимосвязанная сеть кардиомиоцитов с анастомозами.",
      "key_cells": "Кардиомиоциты с центральным расположением ядра и вставочными дисками.",
      "killer_feature": "Ветвление волокон (анастомозы), центральные ядра и темные черточки — вставочные диски.",
      "clinical_note": "Вставочные диски содержат нексусы для электрического синцития; гибель кардиомиоцитов ведет к инфаркту миокарда.",
      "differential_diagnosis": "От скелетной мышцы отличается клеточным строением, центральным расположением 1-2 ядер и вставочными дисками.",
      "video_hint_query": "Поперечно-полосатая сердечная мышечная ткань (миокард) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p17_1",
        "number": 1,
        "name": "Вставочный диск",
        "short_name": "Вставочный диск",
        "color": "#991B1B",
        "description": "Граница между соседними кардиомиоцитами с десмосомами и нексусами.",
        "pin_x": 48,
        "pin_y": 35
      },
      {
        "id": "p17_2",
        "number": 2,
        "name": "Центральное ядро кардиомиоцита",
        "short_name": "Центр. ядро",
        "color": "#7C3AED",
        "description": "Овальное ядро строго в центре волокна в околоядерной зоне.",
        "pin_x": 40,
        "pin_y": 52
      },
      {
        "id": "p17_3",
        "number": 3,
        "name": "Анастомоз между волокнами",
        "short_name": "Анастомоз",
        "color": "#6366F1",
        "description": "Y-образное ветвление кардиомиоцитов в трехмерную сеть.",
        "pin_x": 65,
        "pin_y": 45
      }
    ]
  },
  {
    "id": "slide_18",
    "exam_number": 33,
    "examNumber": 33,
    "module_id": "mod_general_2",
    "moduleId": "mod_general_2",
    "title": "Гладкая мышечная ткань",
    "stain": "Гематоксилин и эозин",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Smooth_muscle_40x.jpg/800px-Smooth_muscle_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Smooth_muscle_40x.jpg/800px-Smooth_muscle_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=7944",
    "layers": "Плотные пласты веретенообразных клеток.",
    "keyCells": "Гладкие миоциты с палочковидными ядрами в центре.",
    "killerFeature": "Веретенообразная форма клеток и палочковидные ядра, изгибающиеся при сокращении.",
    "differential_diagnosis": "От плотной оформленной ткани отличается тем, что волокна клеточные, а ядра лежат ВНУТРИ миоцитов.",
    "differentialDiagnosis": "От плотной оформленной ткани отличается тем, что волокна клеточные, а ядра лежат ВНУТРИ миоцитов.",
    "clinical_note": "Медленное тоническое сокращение без утомления; стенки сосудов, ЖКТ, бронхов, матки.",
    "clinicalNote": "Медленное тоническое сокращение без утомления; стенки сосудов, ЖКТ, бронхов, матки.",
    "quiz_distractors": [
      "Плотная соединительная ткань",
      "Скелетная мышца",
      "Сухожилие"
    ],
    "distractors": [
      "Плотная соединительная ткань",
      "Скелетная мышца",
      "Сухожилие"
    ],
    "exam_checklist": {
      "layers": "Плотные пласты веретенообразных клеток.",
      "key_cells": "Гладкие миоциты с палочковидными ядрами в центре.",
      "killer_feature": "Веретенообразная форма клеток и палочковидные ядра, изгибающиеся при сокращении.",
      "clinical_note": "Медленное тоническое сокращение без утомления; стенки сосудов, ЖКТ, бронхов, матки.",
      "differential_diagnosis": "От плотной оформленной ткани отличается тем, что волокна клеточные, а ядра лежат ВНУТРИ миоцитов.",
      "video_hint_query": "Гладкая мышечная ткань гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p18_1",
        "number": 1,
        "name": "Палочковидное центральное ядро миоцита",
        "short_name": "Ядро миоцита",
        "color": "#7C3AED",
        "description": "Вытянутое сигарообразное ядро в широкой центральной части клетки.",
        "pin_x": 50,
        "pin_y": 45
      },
      {
        "id": "p18_2",
        "number": 2,
        "name": "Оксифильная цитоплазма гладкого миоцита",
        "short_name": "Цитоплазма",
        "color": "#EC4899",
        "description": "Розовая гомогенная цитоплазма без поперечной исчерченности.",
        "pin_x": 42,
        "pin_y": 60
      },
      {
        "id": "p18_3",
        "number": 3,
        "name": "Прослойка эндомизия",
        "short_name": "Эндомизий",
        "color": "#10B981",
        "description": "Тонкая базальная пластинка и ретикулярные волокна вокруг миоцита.",
        "pin_x": 65,
        "pin_y": 35
      }
    ]
  },
  {
    "id": "slide_19",
    "exam_number": 35,
    "examNumber": 35,
    "module_id": "mod_nervous",
    "moduleId": "mod_nervous",
    "title": "Мультиполярные двигательные нейроны спинного мозга",
    "stain": "Тионин по Нисслю",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Motor_neurons_Nissl.jpg/800px-Motor_neurons_Nissl.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Motor_neurons_Nissl.jpg/800px-Motor_neurons_Nissl.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=8250",
    "layers": "Передние рога серого вещества спинного мозга.",
    "keyCells": "Крупные мультиполярные мотонейроны, глиальные клетки.",
    "killerFeature": "Крупные звездчатые тела нейронов с глыбками тигроида (вещество Ниссля) в цитоплазме.",
    "differential_diagnosis": "От псевдоуниполярных нейронов узла отличаются угловатой отростчатой формой и диффузным распределением в сером веществе.",
    "differentialDiagnosis": "От псевдоуниполярных нейронов узла отличаются угловатой отростчатой формой и диффузным распределением в сером веществе.",
    "clinical_note": "Поражение мотонейронов передних рогов характерно для полиомиелита и бокового амиотрофического склероза (БАС).",
    "clinicalNote": "Поражение мотонейронов передних рогов характерно для полиомиелита и бокового амиотрофического склероза (БАС).",
    "quiz_distractors": [
      "Псевдоуниполярные нейроны",
      "Клетки Пуркинье",
      "Пирамидные нейроны"
    ],
    "distractors": [
      "Псевдоуниполярные нейроны",
      "Клетки Пуркинье",
      "Пирамидные нейроны"
    ],
    "exam_checklist": {
      "layers": "Передние рога серого вещества спинного мозга.",
      "key_cells": "Крупные мультиполярные мотонейроны, глиальные клетки.",
      "killer_feature": "Крупные звездчатые тела нейронов с глыбками тигроида (вещество Ниссля) в цитоплазме.",
      "clinical_note": "Поражение мотонейронов передних рогов характерно для полиомиелита и бокового амиотрофического склероза (БАС).",
      "differential_diagnosis": "От псевдоуниполярных нейронов узла отличаются угловатой отростчатой формой и диффузным распределением в сером веществе.",
      "video_hint_query": "Мультиполярные двигательные нейроны спинного мозга гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p19_1",
        "number": 1,
        "name": "Тело мультиполярного нейрона",
        "short_name": "Тело нейрона",
        "color": "#6366F1",
        "description": "Гигантская перикарион звездчатой формы.",
        "pin_x": 48,
        "pin_y": 48
      },
      {
        "id": "p19_2",
        "number": 2,
        "name": "Вещество Ниссля (тигроид)",
        "short_name": "Тигроид",
        "color": "#7C3AED",
        "description": "Темно-синие глыбки гранулярной ЭПС и рибосом.",
        "pin_x": 42,
        "pin_y": 42
      },
      {
        "id": "p19_3",
        "number": 3,
        "name": "Светлое пузыревидное ядро",
        "short_name": "Ядро",
        "color": "#EC4899",
        "description": "Крупное ядро с темным ядрышком («совиный глаз»).",
        "pin_x": 52,
        "pin_y": 50
      }
    ]
  },
  {
    "id": "slide_20",
    "exam_number": 36,
    "examNumber": 36,
    "module_id": "mod_nervous",
    "moduleId": "mod_nervous",
    "title": "Миелиновые нервные волокна (расщипанный препарат)",
    "stain": "Осмиевая кислота",
    "magnification": "x400",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Myelinated_nerve_fibers_osmium.jpg/800px-Myelinated_nerve_fibers_osmium.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Myelinated_nerve_fibers_osmium.jpg/800px-Myelinated_nerve_fibers_osmium.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=8520",
    "layers": "Осевой цилиндр, миелиновая оболочка, неврилемма.",
    "keyCells": "Леммоциты (шванновские клетки), осевой цилиндр нейрона.",
    "killerFeature": "Толстые черные цилиндры с перехватами Ранвье и косыми насечками Шмидта-Лантермана.",
    "differential_diagnosis": "От безмиелиновых отличаются толстой миелиновой муфтой, окрашенной осмием в черный цвет, и узловыми перехватами.",
    "differentialDiagnosis": "От безмиелиновых отличаются толстой миелиновой муфтой, окрашенной осмием в черный цвет, и узловыми перехватами.",
    "clinical_note": "Обеспечивают сальтаторное проведение нервного импульса до 120 м/с; демиелинизация ведет к рассеянному склерозу.",
    "clinicalNote": "Обеспечивают сальтаторное проведение нервного импульса до 120 м/с; демиелинизация ведет к рассеянному склерозу.",
    "quiz_distractors": [
      "Безмиелиновые волокна",
      "Коллагеновые волокна",
      "Эластические волокна"
    ],
    "distractors": [
      "Безмиелиновые волокна",
      "Коллагеновые волокна",
      "Эластические волокна"
    ],
    "exam_checklist": {
      "layers": "Осевой цилиндр, миелиновая оболочка, неврилемма.",
      "key_cells": "Леммоциты (шванновские клетки), осевой цилиндр нейрона.",
      "killer_feature": "Толстые черные цилиндры с перехватами Ранвье и косыми насечками Шмидта-Лантермана.",
      "clinical_note": "Обеспечивают сальтаторное проведение нервного импульса до 120 м/с; демиелинизация ведет к рассеянному склерозу.",
      "differential_diagnosis": "От безмиелиновых отличаются толстой миелиновой муфтой, окрашенной осмием в черный цвет, и узловыми перехватами.",
      "video_hint_query": "Миелиновые нервные волокна (расщипанный препарат) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p20_1",
        "number": 1,
        "name": "Перехват Ранвье",
        "short_name": "Перехват Ранвье",
        "color": "#EC4899",
        "description": "Зона отсутствия миелина между соседними леммоцитами.",
        "pin_x": 50,
        "pin_y": 42
      },
      {
        "id": "p20_2",
        "number": 2,
        "name": "Миелиновая оболочка (черная)",
        "short_name": "Миелин",
        "color": "#0F172A",
        "description": "Многослойная мембрана леммоцита, окрашенная осмием.",
        "pin_x": 42,
        "pin_y": 55
      },
      {
        "id": "p20_3",
        "number": 3,
        "name": "Осевой цилиндр",
        "short_name": "Осевой цилиндр",
        "color": "#6366F1",
        "description": "Светлая сердцевина отростка нейрона.",
        "pin_x": 58,
        "pin_y": 35
      }
    ]
  },
  {
    "id": "slide_21",
    "exam_number": 38,
    "examNumber": 38,
    "module_id": "mod_nervous",
    "moduleId": "mod_nervous",
    "title": "Спинномозговой узел (спинальный ганглий)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Spinal_ganglion_40x.jpg/800px-Spinal_ganglion_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Spinal_ganglion_40x.jpg/800px-Spinal_ganglion_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=8840",
    "layers": "Соединительнотканная капсула, периферическое скопление нейронов, в центре пучки волокон.",
    "keyCells": "Крупные округлые псевдоуниполярные нейроны, окруженные мантийными глиоцитами (сателлитами).",
    "killerFeature": "Шаровидные нейроны группами по периферии с четким венчиком ядер клеток-сателлитов.",
    "differential_diagnosis": "От вегетативного узла отличается строго округлой формой тел нейронов и их краевым расположением под капсулой.",
    "differentialDiagnosis": "От вегетативного узла отличается строго округлой формой тел нейронов и их краевым расположением под капсулой.",
    "clinical_note": "Содержит тела первых чувствительных нейронов соматических и висцеральных рефлекторных дуг.",
    "clinicalNote": "Содержит тела первых чувствительных нейронов соматических и висцеральных рефлекторных дуг.",
    "quiz_distractors": [
      "Симпатический ганглий",
      "Спинной мозг",
      "Мозжечок"
    ],
    "distractors": [
      "Симпатический ганглий",
      "Спинной мозг",
      "Мозжечок"
    ],
    "exam_checklist": {
      "layers": "Соединительнотканная капсула, периферическое скопление нейронов, в центре пучки волокон.",
      "key_cells": "Крупные округлые псевдоуниполярные нейроны, окруженные мантийными глиоцитами (сателлитами).",
      "killer_feature": "Шаровидные нейроны группами по периферии с четким венчиком ядер клеток-сателлитов.",
      "clinical_note": "Содержит тела первых чувствительных нейронов соматических и висцеральных рефлекторных дуг.",
      "differential_diagnosis": "От вегетативного узла отличается строго округлой формой тел нейронов и их краевым расположением под капсулой.",
      "video_hint_query": "Спинномозговой узел (спинальный ганглий) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p21_1",
        "number": 1,
        "name": "Псевдоуниполярный нейрон",
        "short_name": "Нейрон",
        "color": "#6366F1",
        "description": "Крупное сферическое тело чувствительной клетки с ядром в центре.",
        "pin_x": 48,
        "pin_y": 45
      },
      {
        "id": "p21_2",
        "number": 2,
        "name": "Клетки-сателлиты (мантийные глиоциты)",
        "short_name": "Сателлиты",
        "color": "#7C3AED",
        "description": "Венчик мелких темных ядер олигодендроглии вокруг нейрона.",
        "pin_x": 55,
        "pin_y": 48
      },
      {
        "id": "p21_3",
        "number": 3,
        "name": "Пучки миелиновых нервных волокон",
        "short_name": "Волокна",
        "color": "#EC4899",
        "description": "Центральная масса аксонов и дендритов.",
        "pin_x": 65,
        "pin_y": 65
      }
    ]
  },
  {
    "id": "slide_22",
    "exam_number": 40,
    "examNumber": 40,
    "module_id": "mod_nervous",
    "moduleId": "mod_nervous",
    "title": "Кора мозжечка",
    "stain": "Импрегнация серебром",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Cerebellum_cortex_silver.jpg/800px-Cerebellum_cortex_silver.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Cerebellum_cortex_silver.jpg/800px-Cerebellum_cortex_silver.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=9150",
    "layers": "Молекулярный, ганглионарный (слой клеток Пуркинье) и зернистый слои; в глубине белое вещество.",
    "keyCells": "Грушевидные клетки Пуркинье, корзинчатые и звездчатые клетки, клетки-зерна.",
    "killerFeature": "Строгий один ряд огромных грушевидных нейронов с ветвистым веером дендритов.",
    "differential_diagnosis": "От коры больших полушарий отличается строгим трехслойным строением и уникальными клетками Пуркинье.",
    "differentialDiagnosis": "От коры больших полушарий отличается строгим трехслойным строением и уникальными клетками Пуркинье.",
    "clinical_note": "Обеспечивает координацию движений, мышечный тонус и равновесие; поражение дает атаксию и интенционный тремор.",
    "clinicalNote": "Обеспечивает координацию движений, мышечный тонус и равновесие; поражение дает атаксию и интенционный тремор.",
    "quiz_distractors": [
      "Кора больших полушарий",
      "Спинной мозг",
      "Спинальный ганглий"
    ],
    "distractors": [
      "Кора больших полушарий",
      "Спинной мозг",
      "Спинальный ганглий"
    ],
    "exam_checklist": {
      "layers": "Молекулярный, ганглионарный (слой клеток Пуркинье) и зернистый слои; в глубине белое вещество.",
      "key_cells": "Грушевидные клетки Пуркинье, корзинчатые и звездчатые клетки, клетки-зерна.",
      "killer_feature": "Строгий один ряд огромных грушевидных нейронов с ветвистым веером дендритов.",
      "clinical_note": "Обеспечивает координацию движений, мышечный тонус и равновесие; поражение дает атаксию и интенционный тремор.",
      "differential_diagnosis": "От коры больших полушарий отличается строгим трехслойным строением и уникальными клетками Пуркинье.",
      "video_hint_query": "Кора мозжечка гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p22_1",
        "number": 1,
        "name": "Грушевидный нейрон Пуркинье",
        "short_name": "Клетка Пуркинье",
        "color": "#EC4899",
        "description": "Огромный нейрон ганглионарного слоя с древовидным дендритом.",
        "pin_x": 48,
        "pin_y": 48
      },
      {
        "id": "p22_2",
        "number": 2,
        "name": "Молекулярный слой (наружный)",
        "short_name": "Молекулярный",
        "color": "#6366F1",
        "description": "Широкий светлый слой с ветвлениями дендритов и корзинчатыми клетками.",
        "pin_x": 48,
        "pin_y": 25
      },
      {
        "id": "p22_3",
        "number": 3,
        "name": "Зернистый слой (глубокий)",
        "short_name": "Зернистый",
        "color": "#7C3AED",
        "description": "Густонаселенный слой из миллиардов мелких клеток-зерен.",
        "pin_x": 48,
        "pin_y": 75
      }
    ]
  },
  {
    "id": "slide_23",
    "exam_number": 42,
    "examNumber": 42,
    "module_id": "mod_cardio_immune",
    "moduleId": "mod_cardio_immune",
    "title": "Артерия мышечного типа",
    "stain": "Гематоксилин и эозин / Орсеин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Muscular_artery_40x.jpg/800px-Muscular_artery_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Muscular_artery_40x.jpg/800px-Muscular_artery_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=9480",
    "layers": "Интима, медиа (мощный циркулярный мышечный слой), адвентиция.",
    "keyCells": "Эндотелиоциты, гладкие миоциты.",
    "killerFeature": "Яркая волнистая внутренняя эластическая мембрана под эндотелием, круглый просвет.",
    "differential_diagnosis": "От вены отличается толстой мышечной медией, четкими эластическими мембранами и круглым неспадающимся просветом.",
    "differentialDiagnosis": "От вены отличается толстой мышечной медией, четкими эластическими мембранами и круглым неспадающимся просветом.",
    "clinical_note": "Регулирует приток крови к органам и общее периферическое сосудистое сопротивление (АД).",
    "clinicalNote": "Регулирует приток крови к органам и общее периферическое сосудистое сопротивление (АД).",
    "quiz_distractors": [
      "Вена мышечного типа",
      "Артерия эластического типа",
      "Артериола"
    ],
    "distractors": [
      "Вена мышечного типа",
      "Артерия эластического типа",
      "Артериола"
    ],
    "exam_checklist": {
      "layers": "Интима, медиа (мощный циркулярный мышечный слой), адвентиция.",
      "key_cells": "Эндотелиоциты, гладкие миоциты.",
      "killer_feature": "Яркая волнистая внутренняя эластическая мембрана под эндотелием, круглый просвет.",
      "clinical_note": "Регулирует приток крови к органам и общее периферическое сосудистое сопротивление (АД).",
      "differential_diagnosis": "От вены отличается толстой мышечной медией, четкими эластическими мембранами и круглым неспадающимся просветом.",
      "video_hint_query": "Артерия мышечного типа гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p23_1",
        "number": 1,
        "name": "Внутренняя эластическая мембрана",
        "short_name": "Эласт. мембрана",
        "color": "#EC4899",
        "description": "Блестящая розовая волнистая линия под эндотелием.",
        "pin_x": 45,
        "pin_y": 32
      },
      {
        "id": "p23_2",
        "number": 2,
        "name": "Средняя мышечная оболочка (медиа)",
        "short_name": "Медиа",
        "color": "#6366F1",
        "description": "10-40 концентрических слоев гладких миоцитов.",
        "pin_x": 52,
        "pin_y": 50
      },
      {
        "id": "p23_3",
        "number": 3,
        "name": "Наружная оболочка (адвентиция)",
        "short_name": "Адвентиция",
        "color": "#10B981",
        "description": "РВСТ с сосудами сосудов (vasa vasorum).",
        "pin_x": 62,
        "pin_y": 72
      }
    ]
  },
  {
    "id": "slide_24",
    "exam_number": 43,
    "examNumber": 43,
    "module_id": "mod_cardio_immune",
    "moduleId": "mod_cardio_immune",
    "title": "Вена мышечного типа (бедренная вена)",
    "stain": "Гематоксилин и эозин",
    "magnification": "x100",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Vein_histology_40x.jpg/800px-Vein_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Vein_histology_40x.jpg/800px-Vein_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=9720",
    "layers": "Интима, медиа (тонкая), мощная адвентиция с продольными пучками гладких миоцитов.",
    "keyCells": "Эндотелиоциты, гладкие миоциты наружной оболочки.",
    "killerFeature": "Широкий спавшийся просвет, слабая медиа и толстая адвентиция с продольными пучками миоцитов.",
    "differential_diagnosis": "От артерии отличается спавшимся просветом неправильной формы, тонкой медией и пучками миоцитов в адвентиции.",
    "differentialDiagnosis": "От артерии отличается спавшимся просветом неправильной формы, тонкой медией и пучками миоцитов в адвентиции.",
    "clinical_note": "Обеспечивает возврат крови против гравитации; несостоятельность клапанов ведет к варикозу.",
    "clinicalNote": "Обеспечивает возврат крови против гравитации; несостоятельность клапанов ведет к варикозу.",
    "quiz_distractors": [
      "Артерия мышечного типа",
      "Лимфатический сосуд",
      "Мочеточник"
    ],
    "distractors": [
      "Артерия мышечного типа",
      "Лимфатический сосуд",
      "Мочеточник"
    ],
    "exam_checklist": {
      "layers": "Интима, медиа (тонкая), мощная адвентиция с продольными пучками гладких миоцитов.",
      "key_cells": "Эндотелиоциты, гладкие миоциты наружной оболочки.",
      "killer_feature": "Широкий спавшийся просвет, слабая медиа и толстая адвентиция с продольными пучками миоцитов.",
      "clinical_note": "Обеспечивает возврат крови против гравитации; несостоятельность клапанов ведет к варикозу.",
      "differential_diagnosis": "От артерии отличается спавшимся просветом неправильной формы, тонкой медией и пучками миоцитов в адвентиции.",
      "video_hint_query": "Вена мышечного типа (бедренная вена) гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p24_1",
        "number": 1,
        "name": "Спавшийся просвет вены",
        "short_name": "Просвет",
        "color": "#6366F1",
        "description": "Широкий щелевидный просвет со складками интимы.",
        "pin_x": 35,
        "pin_y": 35
      },
      {
        "id": "p24_2",
        "number": 2,
        "name": "Средняя оболочка (тонкая медиа)",
        "short_name": "Медиа",
        "color": "#EC4899",
        "description": "Слабый циркулярный слой гладкомышечных клеток.",
        "pin_x": 50,
        "pin_y": 48
      },
      {
        "id": "p24_3",
        "number": 3,
        "name": "Адвентиция с продольными пучками миоцитов",
        "short_name": "Адвентиция",
        "color": "#7C3AED",
        "description": "Самый мощный слой вены нижних конечностей.",
        "pin_x": 65,
        "pin_y": 65
      }
    ]
  },
  {
    "id": "slide_25",
    "exam_number": 45,
    "examNumber": 45,
    "module_id": "mod_cardio_immune",
    "moduleId": "mod_cardio_immune",
    "title": "Лимфатический узел",
    "stain": "Гематоксилин и эозин",
    "magnification": "x100",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Lymph_node_histology_40x.jpg/800px-Lymph_node_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Lymph_node_histology_40x.jpg/800px-Lymph_node_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=10050",
    "layers": "Капсула, корковое вещество с фолликулами, паракортекс, мозговое вещество с тяжами.",
    "keyCells": "В-лимфоциты, Т-лимфоциты, плазмоциты, макрофаги, ретикулярные клетки.",
    "killerFeature": "Наличие краевого и промежуточных синусов, лимфоидные узелки под капсулой и мозговые тяжи в центре.",
    "differential_diagnosis": "От селезенки отличается наличием коркового и мозгового вещества, краевого синуса и отсутствием центральных артериол.",
    "differentialDiagnosis": "От селезенки отличается наличием коркового и мозгового вещества, краевого синуса и отсутствием центральных артериол.",
    "clinical_note": "Биологический фильтр лимфы; регионарный барьер метастазирования злокачественных опухолей.",
    "clinicalNote": "Биологический фильтр лимфы; регионарный барьер метастазирования злокачественных опухолей.",
    "quiz_distractors": [
      "Селезенка",
      "Тимус",
      "Небная миндалина"
    ],
    "distractors": [
      "Селезенка",
      "Тимус",
      "Небная миндалина"
    ],
    "exam_checklist": {
      "layers": "Капсула, корковое вещество с фолликулами, паракортекс, мозговое вещество с тяжами.",
      "key_cells": "В-лимфоциты, Т-лимфоциты, плазмоциты, макрофаги, ретикулярные клетки.",
      "killer_feature": "Наличие краевого и промежуточных синусов, лимфоидные узелки под капсулой и мозговые тяжи в центре.",
      "clinical_note": "Биологический фильтр лимфы; регионарный барьер метастазирования злокачественных опухолей.",
      "differential_diagnosis": "От селезенки отличается наличием коркового и мозгового вещества, краевого синуса и отсутствием центральных артериол.",
      "video_hint_query": "Лимфатический узел гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p25_1",
        "number": 1,
        "name": "Лимфоидный узелок коры (фолликул)",
        "short_name": "Фолликул",
        "color": "#6366F1",
        "description": "Зона размножения В-лимфоцитов со светлым герминативным центром.",
        "pin_x": 38,
        "pin_y": 35
      },
      {
        "id": "p25_2",
        "number": 2,
        "name": "Краевой подкапсулярный синус",
        "short_name": "Краевой синус",
        "color": "#EC4899",
        "description": "Светлая щель под капсулой для тока лимфы.",
        "pin_x": 25,
        "pin_y": 20
      },
      {
        "id": "p25_3",
        "number": 3,
        "name": "Мозговые тяжи",
        "short_name": "Мозговые тяжи",
        "color": "#7C3AED",
        "description": "Скопления плазмоцитов и макрофагов в центре узла.",
        "pin_x": 60,
        "pin_y": 65
      }
    ]
  },
  {
    "id": "slide_26",
    "exam_number": 47,
    "examNumber": 47,
    "module_id": "mod_cardio_immune",
    "moduleId": "mod_cardio_immune",
    "title": "Селезенка",
    "stain": "Гематоксилин и эозин",
    "magnification": "x100",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Spleen_histology_40x.jpg/800px-Spleen_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Spleen_histology_40x.jpg/800px-Spleen_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=10380",
    "layers": "Толстая капсула с трабекулами, белая пульпа (узелки), красная пульпа.",
    "keyCells": "Т- и В-лимфоциты, макрофаги, эритроциты пульпарных тяжей.",
    "killerFeature": "Лимфоидные узелки обязательно содержат эксцентрично расположенную центральную артериолу.",
    "differential_diagnosis": "От лимфоузла отличается отсутствием краевых синусов и коры, наличием центральной артериолы в узелках.",
    "differentialDiagnosis": "От лимфоузла отличается отсутствием краевых синусов и коры, наличием центральной артериолы в узелках.",
    "clinical_note": "«Кладбище эритроцитов» (деструкция старых клеток макрофагами) и иммунный фильтр системного кровотока.",
    "clinicalNote": "«Кладбище эритроцитов» (деструкция старых клеток макрофагами) и иммунный фильтр системного кровотока.",
    "quiz_distractors": [
      "Лимфатический узел",
      "Тимус",
      "Красный костный мозг"
    ],
    "distractors": [
      "Лимфатический узел",
      "Тимус",
      "Красный костный мозг"
    ],
    "exam_checklist": {
      "layers": "Толстая капсула с трабекулами, белая пульпа (узелки), красная пульпа.",
      "key_cells": "Т- и В-лимфоциты, макрофаги, эритроциты пульпарных тяжей.",
      "killer_feature": "Лимфоидные узелки обязательно содержат эксцентрично расположенную центральную артериолу.",
      "clinical_note": "«Кладбище эритроцитов» (деструкция старых клеток макрофагами) и иммунный фильтр системного кровотока.",
      "differential_diagnosis": "От лимфоузла отличается отсутствием краевых синусов и коры, наличием центральной артериолы в узелках.",
      "video_hint_query": "Селезенка гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p26_1",
        "number": 1,
        "name": "Лимфоидный узелок (белая пульпа)",
        "short_name": "Белая пульпа",
        "color": "#6366F1",
        "description": "Скопление В- и Т-лимфоцитов вокруг сосуда.",
        "pin_x": 45,
        "pin_y": 40
      },
      {
        "id": "p26_2",
        "number": 2,
        "name": "Центральная артерия",
        "short_name": "Центр. артерия",
        "color": "#EC4899",
        "description": "Эксцентрично лежащий артериальный сосуд в узелке.",
        "pin_x": 52,
        "pin_y": 42
      },
      {
        "id": "p26_3",
        "number": 3,
        "name": "Красная пульпа (селезеночные тяжи)",
        "short_name": "Красная пульпа",
        "color": "#991B1B",
        "description": "Венозные синусы и тяжи Бильрота, фильтрующие кровь.",
        "pin_x": 65,
        "pin_y": 65
      }
    ]
  },
  {
    "id": "slide_27",
    "exam_number": 49,
    "examNumber": 49,
    "module_id": "mod_skin_resp",
    "moduleId": "mod_skin_resp",
    "title": "Трахея",
    "stain": "Гематоксилин и эозин",
    "magnification": "x100",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Trachea_histology_40x.jpg/800px-Trachea_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Trachea_histology_40x.jpg/800px-Trachea_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=10700",
    "layers": "Слизистая (многорядный мерцательный эпителий), подслизистая с железами, волокнисто-хрящевая оболочка, адвентиция.",
    "keyCells": "Реснитчатые, бокаловидные, хондроциты изогенных групп.",
    "killerFeature": "Мощная незамкнутая дуга гиалинового хряща под слизистой оболочкой.",
    "differential_diagnosis": "От пищевода отличается мерцательным эпителием и мощной сплошной хрящевой дугой вместо многослойного плоского эпителия.",
    "differentialDiagnosis": "От пищевода отличается мерцательным эпителием и мощной сплошной хрящевой дугой вместо многослойного плоского эпителия.",
    "clinical_note": "Обеспечивает постоянное зияние дыхательного пути для беспрепятственного прохождения воздуха.",
    "clinicalNote": "Обеспечивает постоянное зияние дыхательного пути для беспрепятственного прохождения воздуха.",
    "quiz_distractors": [
      "Бронх среднего калибра",
      "Пищевод",
      "Гортань"
    ],
    "distractors": [
      "Бронх среднего калибра",
      "Пищевод",
      "Гортань"
    ],
    "exam_checklist": {
      "layers": "Слизистая (многорядный мерцательный эпителий), подслизистая с железами, волокнисто-хрящевая оболочка, адвентиция.",
      "key_cells": "Реснитчатые, бокаловидные, хондроциты изогенных групп.",
      "killer_feature": "Мощная незамкнутая дуга гиалинового хряща под слизистой оболочкой.",
      "clinical_note": "Обеспечивает постоянное зияние дыхательного пути для беспрепятственного прохождения воздуха.",
      "differential_diagnosis": "От пищевода отличается мерцательным эпителием и мощной сплошной хрящевой дугой вместо многослойного плоского эпителия.",
      "video_hint_query": "Трахея гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p27_1",
        "number": 1,
        "name": "Многорядный мерцательный эпителий",
        "short_name": "Эпителий",
        "color": "#6366F1",
        "description": "Реснитчатый слой с бокаловидными клетками.",
        "pin_x": 50,
        "pin_y": 20
      },
      {
        "id": "p27_2",
        "number": 2,
        "name": "Белково-слизистые железы подслизистой",
        "short_name": "Железы",
        "color": "#EC4899",
        "description": "Концевые секреторные отделы желез трахеи.",
        "pin_x": 48,
        "pin_y": 40
      },
      {
        "id": "p27_3",
        "number": 3,
        "name": "Гиалиновый хрящ (С-образное полукольцо)",
        "short_name": "Хрящ",
        "color": "#7C3AED",
        "description": "Сплошная пластина хряща с изогенными группами клеток.",
        "pin_x": 52,
        "pin_y": 75
      }
    ]
  },
  {
    "id": "slide_28",
    "exam_number": 50,
    "examNumber": 50,
    "module_id": "mod_skin_resp",
    "moduleId": "mod_skin_resp",
    "title": "Легкое",
    "stain": "Гематоксилин и эозин",
    "magnification": "x100",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Lung_alveoli_40x.jpg/800px-Lung_alveoli_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Lung_alveoli_40x.jpg/800px-Lung_alveoli_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=11020",
    "layers": "Воздухоносные пути (бронхиолы) и респираторный отдел (альвеолярные ходы, мешочки, альвеолы).",
    "keyCells": "Альвеолоциты I и II типа, альвеолярные макрофаги, эндотелиоциты капилляров.",
    "killerFeature": "Кружевная пещеристая сеть из тонкостенных альвеол, разделенных тонкими межальвеолярными перегородками.",
    "differential_diagnosis": "От жировой ткани отличается наличием ядер в тонких перегородках, эритроцитов в капиллярах и срезов бронхиол.",
    "differentialDiagnosis": "От жировой ткани отличается наличием ядер в тонких перегородках, эритроцитов в капиллярах и срезов бронхиол.",
    "clinical_note": "Аэрогематический барьер (толщина 0.5 мкм) осуществляет диффузию O2 и CO2; дефицит сурфактанта ведет к дистресс-синдрому.",
    "clinicalNote": "Аэрогематический барьер (толщина 0.5 мкм) осуществляет диффузию O2 и CO2; дефицит сурфактанта ведет к дистресс-синдрому.",
    "quiz_distractors": [
      "Белая жировая ткань",
      "Щитовидная железа",
      "Трахея"
    ],
    "distractors": [
      "Белая жировая ткань",
      "Щитовидная железа",
      "Трахея"
    ],
    "exam_checklist": {
      "layers": "Воздухоносные пути (бронхиолы) и респираторный отдел (альвеолярные ходы, мешочки, альвеолы).",
      "key_cells": "Альвеолоциты I и II типа, альвеолярные макрофаги, эндотелиоциты капилляров.",
      "killer_feature": "Кружевная пещеристая сеть из тонкостенных альвеол, разделенных тонкими межальвеолярными перегородками.",
      "clinical_note": "Аэрогематический барьер (толщина 0.5 мкм) осуществляет диффузию O2 и CO2; дефицит сурфактанта ведет к дистресс-синдрому.",
      "differential_diagnosis": "От жировой ткани отличается наличием ядер в тонких перегородках, эритроцитов в капиллярах и срезов бронхиол.",
      "video_hint_query": "Легкое гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p28_1",
        "number": 1,
        "name": "Альвеолярный мешочек и альвеолы",
        "short_name": "Альвеолы",
        "color": "#6366F1",
        "description": "Тонкостенные пузырьки, заполненные воздухом.",
        "pin_x": 48,
        "pin_y": 45
      },
      {
        "id": "p28_2",
        "number": 2,
        "name": "Межальвеолярная перегородка с капиллярами",
        "short_name": "Перегородка",
        "color": "#EC4899",
        "description": "Тканевая пластинка с капиллярами и эластином.",
        "pin_x": 62,
        "pin_y": 52
      },
      {
        "id": "p28_3",
        "number": 3,
        "name": "Терминальная бронхиола",
        "short_name": "Бронхиола",
        "color": "#10B981",
        "description": "Мелкий воздухоносный путь без хряща и желез.",
        "pin_x": 35,
        "pin_y": 30
      }
    ]
  },
  {
    "id": "slide_29",
    "exam_number": 52,
    "examNumber": 52,
    "module_id": "mod_endocrine",
    "moduleId": "mod_endocrine",
    "title": "Щитовидная железа",
    "stain": "Гематоксилин и эозин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Thyroid_follicles_40x.jpg/800px-Thyroid_follicles_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Thyroid_follicles_40x.jpg/800px-Thyroid_follicles_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=11340",
    "layers": "Капсула, трабекулы, дольки с фолликулами.",
    "keyCells": "Тироциты (фолликулярные клетки), парафолликулярные С-клетки (кальцитонин).",
    "killerFeature": "Замкнутые фолликулы из однослойного кубического эпителия, заполненные гомогенным розовым коллоидом.",
    "differential_diagnosis": "От легкого отличается наличием коллоида внутри полостей и однослойным железистым эпителием стенки.",
    "differentialDiagnosis": "От легкого отличается наличием коллоида внутри полостей и однослойным железистым эпителием стенки.",
    "clinical_note": "Синтезирует тироксин (Т4) и трийодтиронин (Т3), регулирующие основной обмен; при Базедовой болезни фолликулы резорбируются.",
    "clinicalNote": "Синтезирует тироксин (Т4) и трийодтиронин (Т3), регулирующие основной обмен; при Базедовой болезни фолликулы резорбируются.",
    "quiz_distractors": [
      "Околощитовидная железа",
      "Гипофиз",
      "Легкое"
    ],
    "distractors": [
      "Околощитовидная железа",
      "Гипофиз",
      "Легкое"
    ],
    "exam_checklist": {
      "layers": "Капсула, трабекулы, дольки с фолликулами.",
      "key_cells": "Тироциты (фолликулярные клетки), парафолликулярные С-клетки (кальцитонин).",
      "killer_feature": "Замкнутые фолликулы из однослойного кубического эпителия, заполненные гомогенным розовым коллоидом.",
      "clinical_note": "Синтезирует тироксин (Т4) и трийодтиронин (Т3), регулирующие основной обмен; при Базедовой болезни фолликулы резорбируются.",
      "differential_diagnosis": "От легкого отличается наличием коллоида внутри полостей и однослойным железистым эпителием стенки.",
      "video_hint_query": "Щитовидная железа гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p29_1",
        "number": 1,
        "name": "Коллоид фолликула (тиреоглобулин)",
        "short_name": "Коллоид",
        "color": "#EC4899",
        "description": "Розовое гомогенное вещество с вакуолями резорбции.",
        "pin_x": 50,
        "pin_y": 50
      },
      {
        "id": "p29_2",
        "number": 2,
        "name": "Фолликулярные тироциты",
        "short_name": "Тироциты",
        "color": "#6366F1",
        "description": "Однослойный кубический эпителий стенки фолликула.",
        "pin_x": 38,
        "pin_y": 42
      },
      {
        "id": "p29_3",
        "number": 3,
        "name": "Интерфолликулярный островок с капиллярами",
        "short_name": "Островок",
        "color": "#10B981",
        "description": "Скопление С-клеток и кровеносных фенестрированных капилляров.",
        "pin_x": 65,
        "pin_y": 65
      }
    ]
  },
  {
    "id": "slide_30",
    "exam_number": 54,
    "examNumber": 54,
    "module_id": "mod_endocrine",
    "moduleId": "mod_endocrine",
    "title": "Надпочечник",
    "stain": "Гематоксилин и эозин",
    "magnification": "x100",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Adrenal_cortex_and_medulla_40x.jpg/800px-Adrenal_cortex_and_medulla_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Adrenal_cortex_and_medulla_40x.jpg/800px-Adrenal_cortex_and_medulla_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=11650",
    "layers": "Капсула; кора: клубочковая, пучковая, сетчатая зоны; в центре — мозговое вещество.",
    "keyCells": "Спонгиоциты пучковой зоны (со светлой пенистой цитоплазмой), хромаффиноциты мозгового вещества.",
    "killerFeature": "Три четкие концентрические зоны коры и базофильное мозговое вещество с венозными синусами в центре.",
    "differential_diagnosis": "От почки отличается тяжами эндокринных клеток вместо канальцев и отсутствием сосудистых клубочков.",
    "differentialDiagnosis": "От почки отличается тяжами эндокринных клеток вместо канальцев и отсутствием сосудистых клубочков.",
    "clinical_note": "Клубочковая зона дает альдостерон, пучковая — кортизол (стресс), сетчатая — андрогены, мозговое вещество — адреналин.",
    "clinicalNote": "Клубочковая зона дает альдостерон, пучковая — кортизол (стресс), сетчатая — андрогены, мозговое вещество — адреналин.",
    "quiz_distractors": [
      "Щитовидная железа",
      "Паращитовидная железа",
      "Почка"
    ],
    "distractors": [
      "Щитовидная железа",
      "Паращитовидная железа",
      "Почка"
    ],
    "exam_checklist": {
      "layers": "Капсула; кора: клубочковая, пучковая, сетчатая зоны; в центре — мозговое вещество.",
      "key_cells": "Спонгиоциты пучковой зоны (со светлой пенистой цитоплазмой), хромаффиноциты мозгового вещества.",
      "killer_feature": "Три четкие концентрические зоны коры и базофильное мозговое вещество с венозными синусами в центре.",
      "clinical_note": "Клубочковая зона дает альдостерон, пучковая — кортизол (стресс), сетчатая — андрогены, мозговое вещество — адреналин.",
      "differential_diagnosis": "От почки отличается тяжами эндокринных клеток вместо канальцев и отсутствием сосудистых клубочков.",
      "video_hint_query": "Надпочечник гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p30_1",
        "number": 1,
        "name": "Клубочковая зона коры",
        "short_name": "Клубочковая",
        "color": "#6366F1",
        "description": "Арочные скопления мелких клеток, секретирующих альдостерон.",
        "pin_x": 50,
        "pin_y": 20
      },
      {
        "id": "p30_2",
        "number": 2,
        "name": "Пучковая зона (спонгиоциты)",
        "short_name": "Пучковая",
        "color": "#F59E0B",
        "description": "Параллельные тяжи крупных светлых клеток с липидными каплями.",
        "pin_x": 50,
        "pin_y": 45
      },
      {
        "id": "p30_3",
        "number": 3,
        "name": "Мозговое вещество (хромаффинные клетки)",
        "short_name": "Мозговое в-во",
        "color": "#7C3AED",
        "description": "Крупные базофильные клетки, продуцирующие адреналин и норадреналин.",
        "pin_x": 50,
        "pin_y": 80
      }
    ]
  },
  {
    "id": "slide_31",
    "exam_number": 57,
    "examNumber": 57,
    "module_id": "mod_digestive",
    "moduleId": "mod_digestive",
    "title": "Печень человека и свиньи",
    "stain": "Гематоксилин и эозин",
    "magnification": "x100",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Liver_lobule_histology_40x.jpg/800px-Liver_lobule_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Liver_lobule_histology_40x.jpg/800px-Liver_lobule_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=11980",
    "layers": "Капсула Глиссона, печеночные дольки, междольковые триады.",
    "keyCells": "Гепатоциты (двуядерные), клетки Купфера (звездчатые макрофаги), эндотелиоциты синусоидов.",
    "killerFeature": "Радиальные балки гепатоцитов, сходящиеся к центральной вене; триады по углам долек.",
    "differential_diagnosis": "От поджелудочной железы отличается радиальным балочным строением долек и наличием триад (вена, артерия, желчный проток).",
    "differentialDiagnosis": "От поджелудочной железы отличается радиальным балочным строением долек и наличием триад (вена, артерия, желчный проток).",
    "clinical_note": "Синтез альбумина, детоксикация ксенобиотиков, секреция желчи; фиброз ведет к циррозу печени.",
    "clinicalNote": "Синтез альбумина, детоксикация ксенобиотиков, секреция желчи; фиброз ведет к циррозу печени.",
    "quiz_distractors": [
      "Поджелудочная железа",
      "Слюнная железа",
      "Почка"
    ],
    "distractors": [
      "Поджелудочная железа",
      "Слюнная железа",
      "Почка"
    ],
    "exam_checklist": {
      "layers": "Капсула Глиссона, печеночные дольки, междольковые триады.",
      "key_cells": "Гепатоциты (двуядерные), клетки Купфера (звездчатые макрофаги), эндотелиоциты синусоидов.",
      "killer_feature": "Радиальные балки гепатоцитов, сходящиеся к центральной вене; триады по углам долек.",
      "clinical_note": "Синтез альбумина, детоксикация ксенобиотиков, секреция желчи; фиброз ведет к циррозу печени.",
      "differential_diagnosis": "От поджелудочной железы отличается радиальным балочным строением долек и наличием триад (вена, артерия, желчный проток).",
      "video_hint_query": "Печень человека и свиньи гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p31_1",
        "number": 1,
        "name": "Центральная вена дольки",
        "short_name": "Центр. вена",
        "color": "#6366F1",
        "description": "Тонкостенная вена в центре печеночной дольки.",
        "pin_x": 50,
        "pin_y": 50
      },
      {
        "id": "p31_2",
        "number": 2,
        "name": "Печеночные балки (тяжи гепатоцитов)",
        "short_name": "Балки гепатоцитов",
        "color": "#EC4899",
        "description": "Радиальные двухрядные пластинки из гепатоцитов.",
        "pin_x": 42,
        "pin_y": 40
      },
      {
        "id": "p31_3",
        "number": 3,
        "name": "Междольковая печеночная триада",
        "short_name": "Триада",
        "color": "#10B981",
        "description": "Междольковая артерия, вена и желчный проточек в септе.",
        "pin_x": 75,
        "pin_y": 75
      }
    ]
  },
  {
    "id": "slide_32",
    "exam_number": 60,
    "examNumber": 60,
    "module_id": "mod_urogenital",
    "moduleId": "mod_urogenital",
    "title": "Почка",
    "stain": "Гематоксилин и эозин",
    "magnification": "x200",
    "image_clean_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Kidney_cortex_histology_40x.jpg/800px-Kidney_cortex_histology_40x.jpg",
    "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Kidney_cortex_histology_40x.jpg/800px-Kidney_cortex_histology_40x.jpg",
    "youtubeTimestampUrl": "https://youtu.be/axja21H8i9I?t=12300",
    "layers": "Корковое вещество (тельца и извитые канальцы), мозговое вещество (прямые канальцы и петли Генле).",
    "keyCells": "Подоциты, эндотелий клубочка, эпителий проксимальных канальцев со щеточной каемкой.",
    "killerFeature": "Круглые почечные тельца с сосудистыми клубочками и мочевым пространством капсулы Боумена-Шумлянского.",
    "differential_diagnosis": "От щитовидной железы отличается наличием клубочков внутри полостей и густой сетью проксимальных и дистальных канальцев.",
    "differentialDiagnosis": "От щитовидной железы отличается наличием клубочков внутри полостей и густой сетью проксимальных и дистальных канальцев.",
    "clinical_note": "Фильтрация первичной мочи (180 л/сутки); гломерулонефрит поражает фильтрационный барьер с протеинурией.",
    "clinicalNote": "Фильтрация первичной мочи (180 л/сутки); гломерулонефрит поражает фильтрационный барьер с протеинурией.",
    "quiz_distractors": [
      "Щитовидная железа",
      "Семенник",
      "Поджелудочная железа"
    ],
    "distractors": [
      "Щитовидная железа",
      "Семенник",
      "Поджелудочная железа"
    ],
    "exam_checklist": {
      "layers": "Корковое вещество (тельца и извитые канальцы), мозговое вещество (прямые канальцы и петли Генле).",
      "key_cells": "Подоциты, эндотелий клубочка, эпителий проксимальных канальцев со щеточной каемкой.",
      "killer_feature": "Круглые почечные тельца с сосудистыми клубочками и мочевым пространством капсулы Боумена-Шумлянского.",
      "clinical_note": "Фильтрация первичной мочи (180 л/сутки); гломерулонефрит поражает фильтрационный барьер с протеинурией.",
      "differential_diagnosis": "От щитовидной железы отличается наличием клубочков внутри полостей и густой сетью проксимальных и дистальных канальцев.",
      "video_hint_query": "Почка гистология препарат"
    },
    "layer_annotations": [
      {
        "id": "p32_1",
        "number": 1,
        "name": "Почечное тельце с сосудистым клубочком",
        "short_name": "Тельце",
        "color": "#EC4899",
        "description": "Капиллярный клубочек Мальпиги в капсуле Боумена.",
        "pin_x": 48,
        "pin_y": 48
      },
      {
        "id": "p32_2",
        "number": 2,
        "name": "Проксимальные извитые канальцы",
        "short_name": "Проксим. канальцы",
        "color": "#6366F1",
        "description": "Канальцы с оксифильным эпителием и щеточной каемкой.",
        "pin_x": 35,
        "pin_y": 35
      },
      {
        "id": "p32_3",
        "number": 3,
        "name": "Мочевое пространство капсулы",
        "short_name": "Полость капсулы",
        "color": "#10B981",
        "description": "Светлая полулунная щель вокруг клубочка.",
        "pin_x": 55,
        "pin_y": 45
      }
    ]
  }
];

export const MOCK_SLIDES = EXAM_SLIDES;
