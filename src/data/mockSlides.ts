import { Module, Slide } from '../types';

// Helper function to create realistic histological SVG micrographs as data URIs.
// Guaranteed 100% offline uptime, rapid loading, and infinite zoom capability.
function createHistologySlideSvg(
  type: 'trachea' | 'esophagus' | 'ureter',
  annotated: boolean
): string {
  let innerSvg = '';

  if (type === 'trachea') {
    // Trachea histology: Lumen at top, Pseudostratified ciliated columnar epithelium,
    // Lamina propria, Submucosa with seromucous glands, Hyaline cartilage C-ring, Adventitia
    innerSvg = `
      <!-- Background / field of view -->
      <rect width="800" height="600" fill="#FBF8FA"/>
      <!-- Soft histological background texture -->
      <circle cx="400" cy="300" r="380" fill="#F8EFF4" stroke="#D1D5DB" stroke-width="2"/>
      
      <!-- Adventitia outer connective layer (bottom) -->
      <path d="M 60,490 Q 400,470 740,490 L 740,590 L 60,590 Z" fill="#F2DCE5" opacity="0.8"/>
      <path d="M 80,510 Q 250,490 400,520 T 720,500" stroke="#C084FC" stroke-width="2" stroke-dasharray="6,4" fill="none"/>

      <!-- Hyaline Cartilage C-ring (massive basophilic arc) -->
      <path d="M 100,340 C 220,320 580,320 700,340 C 710,430 680,450 670,460 C 550,440 250,440 130,460 C 120,440 90,420 100,340 Z" fill="#DDD6FE" stroke="#8B5CF6" stroke-width="2.5"/>
      <!-- Chondrocytes in isogenous groups & territorial matrix -->
      <g fill="#7C3AED" opacity="0.85">
        <ellipse cx="200" cy="380" rx="9" ry="6"/><ellipse cx="215" cy="383" rx="7" ry="5"/>
        <ellipse cx="320" cy="370" rx="8" ry="7"/><ellipse cx="335" cy="375" rx="8" ry="6"/>
        <ellipse cx="440" cy="390" rx="10" ry="7"/><ellipse cx="458" cy="392" rx="9" ry="6"/>
        <ellipse cx="560" cy="370" rx="8" ry="6"/><ellipse cx="575" cy="374" rx="7" ry="5"/>
        <ellipse cx="260" cy="415" rx="8" ry="5"/><ellipse cx="380" cy="420" rx="9" ry="6"/>
        <ellipse cx="500" cy="415" rx="8" ry="6"/><ellipse cx="620" cy="400" rx="9" ry="6"/>
      </g>

      <!-- Submucosa with seromucous gland acini -->
      <path d="M 110,240 C 250,225 550,225 690,240 L 700,335 C 580,318 220,318 100,335 Z" fill="#FCE7F3" opacity="0.9"/>
      <g fill="#BE185D" opacity="0.65">
        <circle cx="210" cy="270" r="14" fill="#FBCFE8" stroke="#DB2777" stroke-width="1.5"/>
        <circle cx="206" cy="268" r="3"/><circle cx="214" cy="273" r="3"/><circle cx="212" cy="265" r="3"/>
        <circle cx="340" cy="260" r="15" fill="#FBCFE8" stroke="#DB2777" stroke-width="1.5"/>
        <circle cx="336" cy="258" r="3"/><circle cx="344" cy="263" r="3"/>
        <circle cx="470" cy="275" r="14" fill="#FBCFE8" stroke="#DB2777" stroke-width="1.5"/>
        <circle cx="467" cy="272" r="3"/><circle cx="474" cy="277" r="3"/>
        <circle cx="590" cy="265" r="14" fill="#FBCFE8" stroke="#DB2777" stroke-width="1.5"/>
        <circle cx="586" cy="263" r="3"/><circle cx="593" cy="267" r="3"/>
      </g>

      <!-- Mucosa Lamina Propria (connective tissue + elastic fibers) -->
      <path d="M 120,170 C 250,160 550,160 680,170 L 690,240 C 550,225 250,225 110,240 Z" fill="#FDE2E4" stroke="#F472B6" stroke-width="1"/>

      <!-- Pseudostratified ciliated columnar epithelium -->
      <path d="M 120,120 C 250,110 550,110 680,120 L 680,170 C 550,160 250,160 120,170 Z" fill="#E0E7FF" stroke="#4F46E5" stroke-width="2"/>
      <!-- Nuclei at different heights (pseudostratified) -->
      <g fill="#3730A3">
        <circle cx="150" cy="145" r="5"/><circle cx="165" cy="135" r="5"/><circle cx="180" cy="150" r="5"/>
        <circle cx="210" cy="140" r="5"/><circle cx="230" cy="152" r="5"/><circle cx="250" cy="138" r="5"/>
        <circle cx="290" cy="148" r="5"/><circle cx="310" cy="136" r="5"/><circle cx="330" cy="150" r="5"/>
        <circle cx="370" cy="137" r="5"/><circle cx="390" cy="151" r="5"/><circle cx="410" cy="140" r="5"/>
        <circle cx="450" cy="149" r="5"/><circle cx="470" cy="136" r="5"/><circle cx="490" cy="150" r="5"/>
        <circle cx="530" cy="138" r="5"/><circle cx="550" cy="151" r="5"/><circle cx="570" cy="139" r="5"/>
        <circle cx="610" cy="148" r="5"/><circle cx="630" cy="137" r="5"/><circle cx="650" cy="150" r="5"/>
      </g>
      <!-- Cilia on apical surface -->
      <path d="M 120,118 Q 125,110 130,118 M 140,118 Q 145,110 150,118 M 160,118 Q 165,110 170,118 M 200,116 Q 205,108 210,116 M 250,114 Q 255,106 260,114 M 300,113 Q 305,105 310,113 M 350,112 Q 355,104 360,112 M 400,112 Q 405,104 410,112 M 450,112 Q 455,104 460,112 M 500,113 Q 505,105 510,113 M 550,114 Q 555,106 560,114 M 600,116 Q 605,108 610,116 M 650,118 Q 655,110 660,118" stroke="#6366F1" stroke-width="2"/>

      <!-- Lumen indicator (top white space) -->
      <text x="400" y="80" text-anchor="middle" fill="#64748B" font-family="sans-serif" font-size="16" letter-spacing="3">ПРОСВЕТ ТРАХЕИ</text>
    `;

    if (annotated) {
      innerSvg += `
        <!-- Annotation pointers -->
        <g font-family="sans-serif" font-size="12" font-weight="bold">
          <!-- 1: Многорядный эпителий -->
          <line x1="80" y1="135" x2="160" y2="135" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="160" cy="135" r="3" fill="#0F172A"/>
          <rect x="15" y="122" width="60" height="26" rx="4" fill="#0F172A"/>
          <text x="45" y="139" fill="#FFF" text-anchor="middle">1. ЭПИТ</text>

          <!-- 2: Железы подслизистой -->
          <line x1="80" y1="265" x2="200" y2="265" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="200" cy="265" r="3" fill="#0F172A"/>
          <rect x="15" y="252" width="60" height="26" rx="4" fill="#0F172A"/>
          <text x="45" y="269" fill="#FFF" text-anchor="middle">2. ЖЕЛ</text>

          <!-- 3: Гиалиновый хрящ -->
          <line x1="720" y1="380" x2="630" y2="380" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="630" cy="380" r="3" fill="#0F172A"/>
          <rect x="725" y="367" width="65" height="26" rx="4" fill="#0F172A"/>
          <text x="757" y="384" fill="#FFF" text-anchor="middle">3. ХРЯЩ</text>

          <!-- 4: Адвентиция -->
          <line x1="720" y1="520" x2="620" y2="520" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="620" cy="520" r="3" fill="#0F172A"/>
          <rect x="725" y="507" width="65" height="26" rx="4" fill="#0F172A"/>
          <text x="757" y="524" fill="#FFF" text-anchor="middle">4. АДВ</text>
        </g>
      `;
    }
  } else if (type === 'esophagus') {
    // Esophagus histology: Star-shaped folded lumen, Stratified squamous non-keratinized epithelium,
    // Lamina propria, Muscularis mucosae, Submucosa with esophageal glands proper, Muscularis externa
    innerSvg = `
      <rect width="800" height="600" fill="#FAF5F8"/>
      <circle cx="400" cy="300" r="380" fill="#FDF2F8" stroke="#D1D5DB" stroke-width="2"/>

      <!-- Muscularis externa (circular & longitudinal smooth/skeletal muscle layers) -->
      <path d="M 50,470 C 200,430 600,430 750,470 L 760,590 L 40,590 Z" fill="#FECDD3" stroke="#F43F5E" stroke-width="2"/>
      <path d="M 50,400 C 200,360 600,360 750,400 L 750,470 C 600,430 200,430 50,470 Z" fill="#FFE4E6" stroke="#FB7185" stroke-width="1.5"/>

      <!-- Submucosa with deep proper esophageal glands -->
      <path d="M 70,260 C 220,240 580,240 730,260 L 750,400 C 600,360 200,360 50,400 Z" fill="#FCE7F3"/>
      <!-- Gland acini -->
      <g fill="#BE185D" opacity="0.6">
        <circle cx="220" cy="310" r="16" fill="#FBCFE8" stroke="#E11D48" stroke-width="1.5"/>
        <circle cx="216" cy="308" r="3"/><circle cx="224" cy="312" r="3"/>
        <circle cx="360" cy="330" r="18" fill="#FBCFE8" stroke="#E11D48" stroke-width="1.5"/>
        <circle cx="355" cy="328" r="3"/><circle cx="366" cy="333" r="3"/>
        <circle cx="520" cy="310" r="16" fill="#FBCFE8" stroke="#E11D48" stroke-width="1.5"/>
        <circle cx="516" cy="308" r="3"/><circle cx="524" cy="313" r="3"/>
      </g>

      <!-- Muscularis mucosae (thin smooth muscle line) -->
      <path d="M 90,240 C 240,225 560,225 710,240" stroke="#E11D48" stroke-width="3.5" fill="none"/>

      <!-- Lamina propria (papillae interdigitating with epithelium) -->
      <path d="M 100,180 C 180,200 230,170 300,195 C 370,170 430,205 500,180 C 570,200 630,175 700,190 L 710,240 C 560,225 240,225 90,240 Z" fill="#FDF2F8"/>

      <!-- Stratified squamous non-keratinized epithelium (thick pink layer with flattened surface cells) -->
      <path d="M 100,110 C 180,130 230,100 300,125 C 370,100 430,135 500,110 C 570,130 630,105 700,120 L 700,190 C 630,175 570,200 500,180 C 430,205 370,170 300,195 C 230,170 180,200 100,180 Z" fill="#EDE9FE" stroke="#6D28D9" stroke-width="2"/>
      
      <!-- Multi-layered nuclei (basal round, spinous polygonal, superficial flat) -->
      <g fill="#5B21B6" opacity="0.8">
        <!-- Basal stratum -->
        <circle cx="140" cy="178" r="4"/><circle cx="170" cy="182" r="4"/><circle cx="210" cy="175" r="4"/>
        <circle cx="260" cy="188" r="4"/><circle cx="310" cy="186" r="4"/><circle cx="360" cy="178" r="4"/>
        <circle cx="410" cy="192" r="4"/><circle cx="460" cy="188" r="4"/><circle cx="510" cy="179" r="4"/>
        <!-- Spinous stratum -->
        <circle cx="150" cy="155" r="4"/><circle cx="200" cy="150" r="4"/><circle cx="250" cy="160" r="4"/>
        <circle cx="300" cy="155" r="4"/><circle cx="350" cy="150" r="4"/><circle cx="400" cy="162" r="4"/>
        <circle cx="450" cy="155" r="4"/><circle cx="500" cy="150" r="4"/><circle cx="550" cy="158" r="4"/>
        <!-- Flattened superficial -->
        <ellipse cx="160" cy="128" rx="6" ry="2"/><ellipse cx="230" cy="120" rx="6" ry="2"/>
        <ellipse cx="310" cy="132" rx="6" ry="2"/><ellipse cx="380" cy="122" rx="6" ry="2"/>
        <ellipse cx="460" cy="130" rx="6" ry="2"/><ellipse cx="530" cy="124" rx="6" ry="2"/>
      </g>

      <text x="400" y="70" text-anchor="middle" fill="#64748B" font-family="sans-serif" font-size="16" letter-spacing="3">ПРОСВЕТ ПИЩЕВОДА (СКЛАДКА)</text>
    `;

    if (annotated) {
      innerSvg += `
        <g font-family="sans-serif" font-size="12" font-weight="bold">
          <!-- 1: Многослойный плоский неороговевающий эпителий -->
          <line x1="80" y1="140" x2="180" y2="140" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="180" cy="140" r="3" fill="#0F172A"/>
          <rect x="15" y="127" width="60" height="26" rx="4" fill="#0F172A"/>
          <text x="45" y="144" fill="#FFF" text-anchor="middle">1. МПЭ</text>

          <!-- 2: Мышечная пластинка слизистой -->
          <line x1="720" y1="235" x2="620" y2="235" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="620" cy="235" r="3" fill="#0F172A"/>
          <rect x="725" y="222" width="65" height="26" rx="4" fill="#0F172A"/>
          <text x="757" y="239" fill="#FFF" text-anchor="middle">2. МПС</text>

          <!-- 3: Собственные железы пищевода -->
          <line x1="80" y1="320" x2="210" y2="320" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="210" cy="320" r="3" fill="#0F172A"/>
          <rect x="15" y="307" width="60" height="26" rx="4" fill="#0F172A"/>
          <text x="45" y="324" fill="#FFF" text-anchor="middle">3. ЖЕЛ</text>

          <!-- 4: Мышечная оболочка -->
          <line x1="720" y1="440" x2="620" y2="440" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="620" cy="440" r="3" fill="#0F172A"/>
          <rect x="725" y="427" width="65" height="26" rx="4" fill="#0F172A"/>
          <text x="757" y="444" fill="#FFF" text-anchor="middle">4. МЫШЦ</text>
        </g>
      `;
    }
  } else {
    // Ureter histology: Star-shaped folded lumen, Transitional epithelium (urothelium),
    // Lamina propria, Muscular layers (inner longitudinal, outer circular), Adventitia
    innerSvg = `
      <rect width="800" height="600" fill="#F8FAFC"/>
      <circle cx="400" cy="300" r="280" fill="#F1F5F9" stroke="#94A3B8" stroke-width="2"/>

      <!-- Adventitia outer connective coat -->
      <circle cx="400" cy="300" r="275" fill="none" stroke="#CBD5E1" stroke-width="12" stroke-dasharray="8,6"/>

      <!-- Outer Circular Muscular Layer -->
      <circle cx="400" cy="300" r="240" fill="none" stroke="#F43F5E" stroke-width="36" opacity="0.35"/>

      <!-- Inner Longitudinal Muscular Layer (bundles) -->
      <g fill="#E11D48" opacity="0.5">
        <ellipse cx="230" cy="300" rx="18" ry="28"/>
        <ellipse cx="570" cy="300" rx="18" ry="28"/>
        <ellipse cx="400" cy="130" rx="28" ry="18"/>
        <ellipse cx="400" cy="470" rx="28" ry="18"/>
        <ellipse cx="280" cy="180" rx="22" ry="22"/>
        <ellipse cx="520" cy="180" rx="22" ry="22"/>
        <ellipse cx="280" cy="420" rx="22" ry="22"/>
        <ellipse cx="520" cy="420" rx="22" ry="22"/>
      </g>

      <!-- Lamina Propria (pink mucosal fold core) -->
      <!-- Star-shaped lumen folded contour -->
      <path d="M 400,200 L 420,260 L 485,235 L 450,290 L 510,320 L 445,340 L 460,400 L 400,365 L 340,400 L 355,340 L 290,320 L 350,290 L 315,235 L 380,260 Z" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="2"/>

      <!-- Transitional Epithelium (Urothelium) lining lumen -->
      <path d="M 400,215 L 416,265 L 470,245 L 440,290 L 490,315 L 436,332 L 448,380 L 400,352 L 352,380 L 364,332 L 310,315 L 360,290 L 330,245 L 384,265 Z" fill="#DDD6FE" stroke="#7C3AED" stroke-width="3"/>

      <!-- Large umbrella cells facing the lumen -->
      <g fill="#5B21B6" opacity="0.9">
        <circle cx="400" cy="225" r="4"/><circle cx="460" cy="252" r="4"/><circle cx="430" cy="292" r="4"/>
        <circle cx="475" cy="316" r="4"/><circle cx="430" cy="330" r="4"/><circle cx="440" cy="370" r="4"/>
        <circle cx="400" cy="345" r="4"/><circle cx="360" cy="370" r="4"/><circle cx="370" cy="330" r="4"/>
        <circle cx="325" cy="316" r="4"/><circle cx="370" cy="292" r="4"/><circle cx="340" cy="252" r="4"/>
      </g>

      <!-- Lumen center -->
      <path d="M 400,235 L 410,270 L 450,258 L 428,290 L 465,310 L 425,325 L 435,360 L 400,340 L 365,360 L 375,325 L 335,310 L 372,290 L 350,258 L 390,270 Z" fill="#FFFFFF"/>
      <text x="400" y="305" text-anchor="middle" fill="#94A3B8" font-family="sans-serif" font-size="11" font-weight="bold">ПРОСВЕТ</text>
    `;

    if (annotated) {
      innerSvg += `
        <g font-family="sans-serif" font-size="12" font-weight="bold">
          <!-- 1: Звездчатый просвет с уротелием -->
          <line x1="160" y1="230" x2="330" y2="245" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="330" cy="245" r="3" fill="#0F172A"/>
          <rect x="90" y="217" width="65" height="26" rx="4" fill="#0F172A"/>
          <text x="122" y="234" fill="#FFF" text-anchor="middle">1. УРОТ</text>

          <!-- 2: Собственная пластинка -->
          <line x1="640" y1="210" x2="465" y2="225" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="465" cy="225" r="3" fill="#0F172A"/>
          <rect x="645" y="197" width="65" height="26" rx="4" fill="#0F172A"/>
          <text x="677" y="214" fill="#FFF" text-anchor="middle">2. ПЛАСТ</text>

          <!-- 3: Внутренний продольный мышечный слой -->
          <line x1="160" y1="360" x2="280" y2="370" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="280" cy="370" r="3" fill="#0F172A"/>
          <rect x="90" y="347" width="65" height="26" rx="4" fill="#0F172A"/>
          <text x="122" y="364" fill="#FFF" text-anchor="middle">3. ПРОД</text>

          <!-- 4: Наружный циркулярный мышечный слой -->
          <line x1="640" y1="380" x2="550" y2="360" stroke="#0F172A" stroke-width="1.5"/>
          <circle cx="550" cy="360" r="3" fill="#0F172A"/>
          <rect x="645" y="367" width="65" height="26" rx="4" fill="#0F172A"/>
          <text x="677" y="384" fill="#FFF" text-anchor="middle">4. ЦИРК</text>
        </g>
      `;
    }
  }

  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">${innerSvg}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}

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
    image_clean_url: createHistologySlideSvg('trachea', false),
    image_annotated_url: createHistologySlideSvg('trachea', true),
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
    image_clean_url: createHistologySlideSvg('esophagus', false),
    image_annotated_url: createHistologySlideSvg('esophagus', true),
    exam_checklist: {
      layers: '1. Слизистая (многослойный плоский неороговевающий эпителий, собственная пластинка, мышечная пластинка из гладких миоцитов) 2. Подслизистая основа (собственные железы пищевода) 3. Мышечная оболочка (верхняя треть поперечнополосатая, нижняя гладкая) 4. Адвентициальная оболочка',
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
    image_clean_url: createHistologySlideSvg('ureter', false),
    image_annotated_url: createHistologySlideSvg('ureter', true),
    exam_checklist: {
      layers: '1. Слизистая оболочка (переходный эпителий / уротелий, выраженная складчатость, собственная пластинка) 2. Подслизистая основа (слабо выражена) 3. Мышечная оболочка (внутренний продольный, наружный циркулярный; в нижней трети + наружный продольный) 4. Адвентициальная',
      key_cells: 'Зонтичные (поверхностные крупные полиплоидные клетки с кутикулой), грушевидные промежуточные, мелкие базальные',
      killer_feature: 'Звездчатый узкий просвет с переходным эпителием (уротелием), полное отсутствие желез в стенке и четкая двух-трехслойная гладкая мускулатура'
    },
    quiz_distractors: [
      'Пищевод (поперечный срез)',
      'Трахея (поперечный срез)',
      'Семенной канатик'
    ],
    order_index: 3
  }
];
