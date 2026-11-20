import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SEED_PATH = path.join(ROOT_DIR, 'shared', 'seedKrathongs.json');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_PATH = path.join(DATA_DIR, 'krathongs.json');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const VALID_STYLES = new Set([
  'banana-leaf',
  'lotus',
  'coconut',
  'bread',
  'royal-gold',
]);

function createDefaultAvatar(name, primaryColor, accentColor, idx) {
  const skinTones = ['#f6d5b8', '#e9bc96', '#d9a176', '#f2cba9'];
  const hairTones = ['#1e1b18', '#2d1e18', '#422c20', '#111827'];
  const skin = skinTones[idx % skinTones.length];
  const hair = hairTones[idx % hairTones.length];
  const initial = (String(name || 'ก').trim().charAt(0) || 'ก').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#bg)"/>
    <circle cx="155" cy="44" r="16" fill="#fef9c3"/>
    <path d="M40 200 C42 148 70 135 100 135 C130 135 158 148 160 200 Z" fill="${primaryColor}"/>
    <path d="M76 138 L100 158 L124 138" fill="none" stroke="${accentColor}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="100" cy="88" rx="34" ry="38" fill="${hair}"/>
    <circle cx="100" cy="96" r="28" fill="${skin}"/>
    <circle cx="89" cy="96" r="3.2" fill="#1f2937"/>
    <circle cx="111" cy="96" r="3.2" fill="#1f2937"/>
    <path d="M90 109 Q100 118 110 109" fill="none" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>
    <rect x="14" y="14" width="32" height="32" rx="10" fill="${accentColor}"/>
    <text x="30" y="36" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="18" fill="#0f172a">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function loadInitialData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DATA_PATH)) {
    try {
      const raw = fs.readFileSync(DATA_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.error('Failed to read existing krathongs.json, re-seeding:', err);
    }
  }

  const seedRaw = fs.readFileSync(SEED_PATH, 'utf8');
  const seeded = JSON.parse(seedRaw).map((item, index) => ({
    ...item,
    photoUrl:
      item.photoUrl ||
      createDefaultAvatar(item.name, item.primaryColor, item.accentColor, index),
  }));
  fs.writeFileSync(DATA_PATH, JSON.stringify(seeded, null, 2), 'utf8');
  return seeded;
}

let krathongs = loadInitialData();
let writeChain = Promise.resolve();

function persistData() {
  const snapshot = JSON.stringify(krathongs, null, 2);
  writeChain = writeChain
    .then(() => fs.promises.writeFile(DATA_PATH, snapshot, 'utf8'))
    .catch((err) => console.error('Failed to persist krathongs:', err));
  return writeChain;
}

function findFreeRiverSpot(existingList) {
  const minDistSq = 3.6 * 3.6;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const x = Number(((Math.random() - 0.5) * 56).toFixed(2));
    const z = Number((-9.2 + Math.random() * 19.2).toFixed(2));
    // Keep clear of the wooden pier at x in [-4.8, 4.8], z < -9.2
    if (Math.abs(x) < 5.2 && z < -8.2) continue;

    const tooClose = existingList.some((k) => {
      const dx = k.position.x - x;
      const dz = k.position.z - z;
      return dx * dx + dz * dz < minDistSq;
    });
    if (!tooClose) return { x, z };
  }

  return {
    x: Number(((Math.random() - 0.5) * 54).toFixed(2)),
    z: Number((-4 + Math.random() * 14).toFixed(2)),
  };
}

const app = express();
app.use(express.json({ limit: '3mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, count: krathongs.length });
});

app.get('/api/krathongs', (_req, res) => {
  res.json(krathongs);
});

app.post('/api/krathongs', async (req, res) => {
  const { name, wish, style, primaryColor, accentColor, photoUrl } = req.body ?? {};

  const cleanName = typeof name === 'string' ? name.trim().slice(0, 60) : '';
  const cleanWish = typeof wish === 'string' ? wish.trim().slice(0, 240) : '';
  const cleanStyle = VALID_STYLES.has(style) ? style : 'banana-leaf';

  if (!cleanName || !cleanWish) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อและคำอธิษฐานให้ครบถ้วน' });
  }

  const entry = {
    id: `k-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    wish: cleanWish,
    style: cleanStyle,
    primaryColor:
      typeof primaryColor === 'string' && primaryColor.startsWith('#')
        ? primaryColor
        : '#16a34a',
    accentColor:
      typeof accentColor === 'string' && accentColor.startsWith('#')
        ? accentColor
        : '#fbbf24',
    photoUrl:
      typeof photoUrl === 'string' && photoUrl.startsWith('data:image/')
        ? photoUrl
        : createDefaultAvatar(cleanName, '#16a34a', '#fbbf24', krathongs.length),
    votes: 0,
    position: findFreeRiverSpot(krathongs),
    createdAt: new Date().toISOString(),
    isUserCreated: true,
  };

  krathongs.push(entry);
  await persistData();
  return res.status(201).json(entry);
});

app.post('/api/krathongs/:id/vote', async (req, res) => {
  const { id } = req.params;
  const target = krathongs.find((k) => k.id === id);
  if (!target) {
    return res.status(404).json({ error: 'ไม่พบกระทงที่เลือก' });
  }

  target.votes += 1;
  await persistData();
  return res.json(target);
});

if (fs.existsSync(DIST_DIR)) {
  app.use(
    express.static(DIST_DIR, {
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store');
        }
      },
    })
  );
  app.get('/{*splat}', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Loy Krathong 3D API server running on http://localhost:${PORT}`);
});
