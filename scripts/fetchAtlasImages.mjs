// scripts/fetchAtlasImages.mjs
// Automated fetcher and verifier of Wikimedia Commons histological micrographs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SLIDE_SEARCH_TERMS = [
  { id: 'slide_01', examNumber: 1, query: 'mesothelium histology' },
  { id: 'slide_02', examNumber: 2, query: 'simple columnar epithelium duodenum histology' },
  { id: 'slide_03', examNumber: 3, query: 'trachea ciliated epithelium histology' },
  { id: 'slide_04', examNumber: 4, query: 'stratified squamous nonkeratinized esophagus histology' },
  { id: 'slide_05', examNumber: 5, query: 'epidermis keratinized stratified squamous histology' },
  { id: 'slide_06', examNumber: 6, query: 'urothelium transitional epithelium histology' },
  { id: 'slide_07', examNumber: 7, query: 'tendon dense regular connective tissue histology' },
  { id: 'slide_08', examNumber: 8, query: 'hyaline cartilage histology' },
  { id: 'slide_09', examNumber: 9, query: 'elastic cartilage histology' },
  { id: 'slide_10', examNumber: 10, query: 'fibrocartilage histology' },
  { id: 'slide_11', examNumber: 11, query: 'compact bone osteon histology' },
  { id: 'slide_12', examNumber: 12, query: 'endochondral ossification histology' },
  { id: 'slide_13', examNumber: 13, query: 'skeletal muscle histology cross section' },
  { id: 'slide_14', examNumber: 14, query: 'cardiac muscle intercalated disc histology' },
  { id: 'slide_15', examNumber: 15, query: 'smooth muscle histology' },
  { id: 'slide_16', examNumber: 16, query: 'blood smear Giemsa erythrocytes leukocytes' },
  { id: 'slide_17', examNumber: 17, query: 'spinal cord histology Nissl cross section' },
  { id: 'slide_18', examNumber: 18, query: 'cerebellar cortex Purkinje histology' },
  { id: 'slide_19', examNumber: 19, query: 'cerebral cortex pyramidal neurons histology' },
  { id: 'slide_20', examNumber: 20, query: 'dorsal root ganglion histology' },
  { id: 'slide_21', examNumber: 21, query: 'myelinated nerve fiber histology node Ranvier' },
  { id: 'slide_22', examNumber: 22, query: 'retina layers histology' },
  { id: 'slide_23', examNumber: 23, query: 'organ of Corti histology' },
  { id: 'slide_24', examNumber: 24, query: 'cornea cross section histology' },
  { id: 'slide_25', examNumber: 25, query: 'aorta cross section elastic artery histology' },
  { id: 'slide_26', examNumber: 26, query: 'muscular artery vein cross section histology' },
  { id: 'slide_27', examNumber: 27, query: 'pia mater arterioles capillaries histology' },
  { id: 'slide_28', examNumber: 28, query: 'Purkinje fibers heart conduction histology' },
  { id: 'slide_29', examNumber: 29, query: 'myocardium ventricular cardiac muscle histology' },
  { id: 'slide_30', examNumber: 30, query: 'thymus histology Hassall corpuscle' },
  { id: 'slide_31', examNumber: 31, query: 'lymph node cortex medulla histology' },
  { id: 'slide_32', examNumber: 32, query: 'spleen histology red white pulp' },
  { id: 'slide_33', examNumber: 33, query: 'palatine tonsil histology crypts' },
  { id: 'slide_34', examNumber: 34, query: 'pituitary gland adenohypophysis histology' },
  { id: 'slide_35', examNumber: 35, query: 'pineal gland histology corpora arenacea' },
  { id: 'slide_36', examNumber: 36, query: 'thyroid gland follicles colloid histology' },
  { id: 'slide_37', examNumber: 37, query: 'parathyroid gland chief cells histology' },
  { id: 'slide_38', examNumber: 38, query: 'adrenal gland cortex medulla histology' },
  { id: 'slide_39', examNumber: 39, query: 'thick skin palm epidermis stratum lucidum histology' },
  { id: 'slide_40', examNumber: 40, query: 'thin skin hair follicle sebaceous gland histology' },
  { id: 'slide_41', examNumber: 41, query: 'trachea wall cartilage mucosa histology' },
  { id: 'slide_42', examNumber: 42, query: 'lung alveoli bronchiole histology' },
  { id: 'slide_43', examNumber: 43, query: 'filiform papillae tongue histology' },
  { id: 'slide_44', examNumber: 44, query: 'foliate papillae tongue taste buds histology' },
  { id: 'slide_45', examNumber: 45, query: 'tooth enamel dentin pulp histology' },
  { id: 'slide_46', examNumber: 46, query: 'tooth development bell stage enamel organ histology' },
  { id: 'slide_47', examNumber: 47, query: 'parotid gland serous acini histology' },
  { id: 'slide_48', examNumber: 48, query: 'submandibular gland mixed acini histology' },
  { id: 'slide_49', examNumber: 49, query: 'sublingual gland mucous acini histology' },
  { id: 'slide_50', examNumber: 50, query: 'esophagus wall cross section histology' },
  { id: 'slide_51', examNumber: 51, query: 'stomach fundic glands parietal cells histology' },
  { id: 'slide_52', examNumber: 52, query: 'stomach pyloric glands pits histology' },
  { id: 'slide_53', examNumber: 53, query: 'duodenum Brunner glands villi histology' },
  { id: 'slide_54', examNumber: 54, query: 'jejunum small intestine villi crypts histology' },
  { id: 'slide_55', examNumber: 55, query: 'colon large intestine crypts goblet cells histology' },
  { id: 'slide_56', examNumber: 56, query: 'appendix vermiformis lymphoid follicles histology' },
  { id: 'slide_57', examNumber: 57, query: 'liver lobule central vein portal triad histology' },
  { id: 'slide_58', examNumber: 58, query: 'pancreas islets Langerhans acini histology' },
  { id: 'slide_59', examNumber: 59, query: 'kidney cortex renal corpuscle glomerulus histology' },
  { id: 'slide_60', examNumber: 60, query: 'kidney medulla collecting ducts Henle loop histology' },
  { id: 'slide_61', examNumber: 61, query: 'ureter cross section transitional epithelium histology' },
  { id: 'slide_62', examNumber: 62, query: 'urinary bladder detrusor transitional epithelium histology' },
  { id: 'slide_63', examNumber: 63, query: 'testis seminiferous tubules spermatogenesis histology' },
  { id: 'slide_64', examNumber: 64, query: 'epididymis stereocilia sperm histology' },
  { id: 'slide_65', examNumber: 65, query: 'prostate gland corpora amylacea stroma histology' },
  { id: 'slide_66', examNumber: 66, query: 'ovary graafian follicle oocyte histology' },
  { id: 'slide_67', examNumber: 67, query: 'uterus endometrium myometrium histology' },
  { id: 'slide_68', examNumber: 68, query: 'lactating mammary gland alveoli milk histology' },
  { id: 'slide_69', examNumber: 69, query: 'placenta chorionic villi fetal histology' },
  { id: 'slide_70', examNumber: 70, query: 'placenta maternal surface decidua basalis histology' },
];

const USER_AGENT = 'HistoTMA/1.0 (https://alwayswannacry23.github.io/histo-tma; dev@histotma.local)';

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp.status === 200;
  } catch (err) {
    return false;
  }
}

async function searchWikimedia(query) {
  const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=1000&format=json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(endpoint, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.query || !data.query.pages) return [];

    const pages = Object.values(data.query.pages);
    const candidates = [];
    for (const p of pages) {
      if (p.imageinfo && p.imageinfo[0]) {
        const info = p.imageinfo[0];
        const title = p.title || '';
        const lower = title.toLowerCase();
        // Filter out non-image files or unsuitable diagrams
        if (
          lower.endsWith('.svg') ||
          lower.endsWith('.pdf') ||
          lower.endsWith('.tif') ||
          lower.endsWith('.tiff') ||
          lower.includes('icon') ||
          lower.includes('logo') ||
          lower.includes('drawing')
        ) {
          continue;
        }
        const thumbUrl = info.thumburl || info.url;
        candidates.push({
          title,
          url: thumbUrl,
        });
      }
    }
    return candidates;
  } catch (err) {
    console.error(`Search error for "${query}":`, err.message);
    return [];
  }
}

async function main() {
  console.log(`Starting Atlas image search for all ${SLIDE_SEARCH_TERMS.length} slides...`);
  const results = {};

  for (const item of SLIDE_SEARCH_TERMS) {
    console.log(`\n[${item.examNumber}/70] Searching: "${item.query}"...`);
    const candidates = await searchWikimedia(item.query);
    const validUrls = [];

    for (const cand of candidates) {
      if (validUrls.length >= 2) break;
      const isOk = await checkUrl(cand.url);
      if (isOk) {
        console.log(`  ✓ Valid 200: ${cand.title}`);
        validUrls.push({
          url: cand.url,
          title: cand.title.replace('File:', '').replace(/\.[^/.]+$/, ''),
        });
      }
    }

    results[item.id] = {
      examNumber: item.examNumber,
      query: item.query,
      atlasImages: validUrls,
    };

    // Polite delay
    await new Promise((r) => setTimeout(r, 250));
  }

  const outputPath = path.resolve(__dirname, '../src/data/atlas_image_urls.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nSuccessfully saved atlas images to ${outputPath}`);
}

main().catch(console.error);
