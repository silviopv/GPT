import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const generatedDir = path.resolve(__dirname, '../generated');
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });


const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(generatedDir));

const categoryThemes = {
  papelaria: { bg: '#F3EFEA', accent: '#D6C7B2', label: 'PAPELARIA' },
  fachada: { bg: '#E8EEF5', accent: '#BFD4EA', label: 'FACHADA' },
  embalagem: { bg: '#FAF1E8', accent: '#EBCFAF', label: 'EMBALAGEM' },
  camiseta: { bg: '#EFEFEF', accent: '#D2D2D2', label: 'CAMISETA' },
  mobile: { bg: '#ECEBFF', accent: '#CBC7FF', label: 'MOBILE' },
  desktop: { bg: '#EAF8F5', accent: '#BCE7DD', label: 'DESKTOP' },
  tablet: { bg: '#FFF5EA', accent: '#FFD9B0', label: 'TABLET' }
};

const variants = [
  { width: 560, height: 360, left: 70, top: 70, rotate: -6 },
  { width: 480, height: 330, left: 100, top: 85, rotate: 4 },
  { width: 510, height: 300, left: 90, top: 95, rotate: -2 },
  { width: 540, height: 340, left: 80, top: 80, rotate: 8 }
];

function randomId() {
  return crypto.randomUUID().slice(0, 8);
}

async function createMockup(sourceBuffer, category, prompt, variantIndex) {
  const theme = categoryThemes[category] || categoryThemes.mobile;
  const variant = variants[variantIndex % variants.length];

  const resizedUserImage = await sharp(sourceBuffer)
    .resize(variant.width, variant.height, { fit: 'cover' })
    .rotate(variant.rotate, { background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const caption = [theme.label, prompt?.trim()].filter(Boolean).join(' • ');

  const svgCaption = `
    <svg width="760" height="520" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="760" height="520" rx="26" fill="${theme.bg}"/>
      <rect x="34" y="34" width="692" height="452" rx="20" fill="${theme.accent}" fill-opacity="0.32"/>
      <text x="380" y="455" text-anchor="middle" fill="#1f2937" font-size="21" font-family="Arial, sans-serif" font-weight="700">${caption.slice(0, 70)}</text>
      <text x="380" y="482" text-anchor="middle" fill="#4b5563" font-size="14" font-family="Arial, sans-serif">Gerado automaticamente pela plataforma de mockups</text>
    </svg>
  `;

  const shadow = await sharp({
    create: {
      width: variant.width + 30,
      height: variant.height + 30,
      channels: 4,
      background: { r: 17, g: 24, b: 39, alpha: 0.17 }
    }
  })
    .blur(14)
    .png()
    .toBuffer();

  return sharp(Buffer.from(svgCaption))
    .composite([
      { input: shadow, left: variant.left + 10, top: variant.top + 18 },
      { input: resizedUserImage, left: variant.left, top: variant.top }
    ])
    .png()
    .toBuffer();
}

async function buildResponseSet(fileBuffer, category, prompt, seedShift = 0) {
  const items = [];

  for (let i = 0; i < 4; i += 1) {
    const mockupBuffer = await createMockup(fileBuffer, category, prompt, i + seedShift);
    const id = randomId();
    const fileName = `${Date.now()}-${id}.png`;
    const outputPath = path.resolve(generatedDir, fileName);

    fs.writeFileSync(outputPath, mockupBuffer);

    items.push({
      id,
      imageUrl: `/assets/${fileName}`
    });
  }

  return items;
}

app.post('/api/mockups', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Envie uma imagem PNG válida.' });
    }

    const { category = 'mobile', prompt = '' } = req.body;
    const mockups = await buildResponseSet(req.file.buffer, category, prompt);

    return res.json({
      category,
      prompt,
      mockups
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao gerar mockups.', detail: error.message });
  }
});

app.post('/api/mockups/regenerate', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Envie uma imagem PNG válida.' });
    }

    const { category = 'mobile', prompt = '', seed = 1 } = req.body;
    const single = await createMockup(req.file.buffer, category, prompt, Number(seed));
    const id = randomId();
    const fileName = `${Date.now()}-${id}.png`;
    const outputPath = path.resolve(generatedDir, fileName);
    fs.writeFileSync(outputPath, single);

    return res.json({
      id,
      imageUrl: `/assets/${fileName}`
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao refazer mockup.', detail: error.message });
  }
});

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/assets')) return next();
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Mockup app running on http://localhost:${port}`);
});
