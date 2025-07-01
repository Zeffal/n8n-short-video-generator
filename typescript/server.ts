import express, { Request, Response } from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from the parent directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5050;

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const BASEROW_TABLE_API = process.env.BASEROW_TABLE_API;
const VIDEO_FIELD = process.env.VIDEO_FIELD;

console.log('[ENV DEBUG]', {
  WEBHOOK_URL,
  BASEROW_TOKEN,
  BASEROW_TABLE_API,
  VIDEO_FIELD,
  BGM_MUSIC: process.env.BGM_MUSIC,
  WATERMARK_LOGO: process.env.WATERMARK_LOGO,
});

app.use(cors());
app.use(express.json());
// Serve static files from the root static directory, not from dist
const PROJECT_ROOT = path.resolve(__dirname);

app.use('/static', express.static(path.join(PROJECT_ROOT, 'static')));

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(PROJECT_ROOT, 'templates', 'index.html'));
});

app.post('/submit', async (req: Request, res: Response) => {
  console.log('[POST /submit] Incoming:', req.body);

  const data = req.body;
  const payload = {
    'The Main Topic': data.mainTopic,
    'Duration': data.duration,
    'Video Type': data.videoType,
    'Generative Style':
      'In the style of should be soft purple or dominant purple to complement the theme and recess blue neon color theme, colorful dreams. filmstock: Sony a7R IV camera, Meike dreams 85mm F1.8 --ar 1:1 --v 6.0',
    'TTS Voice': data.ttsVoice,
    'Image Provider': 'together.ai',
    'BGM music': process.env.BGM_MUSIC,
    'Watermark Logo': process.env.WATERMARK_LOGO,
  };
  try {
    const response = await fetch(WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    res.json({ message: 'Sent to n8n', status: response.status, n8n_response: text });
  } catch (e: any) {
    res.status(500).json({ error: e.toString() });
  }
});

app.get('/get_video', async (_req: Request, res: Response) => {
  console.log('[GET /get_video] Request received');

  try {
    const response = await fetch(BASEROW_TABLE_API!, {
      headers: { Authorization: `Token ${BASEROW_TOKEN}` },
    });
    const data = await response.json();
    const rows = data.results || [];
    if (!rows.length) {
      return res.status(404).json({ error: 'No videos found.' });
    }
    const latestRow = rows.reduce((a: any, b: any) => (a.id > b.id ? a : b));
    const video_url = latestRow[VIDEO_FIELD!];
    const title = latestRow['Title'] || '';
    const description = latestRow['Description'] || '';
    if (!video_url) {
      return res.status(404).json({ error: 'No video URL available.' });
    }
    res.json({ video_url, title, description });
  } catch (e: any) {
    res.status(500).json({ error: e.toString() });
  }
});

app.get('/videos', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(BASEROW_TABLE_API!, {
      headers: { Authorization: `Token ${BASEROW_TOKEN}` },
    });
    const data = await response.json();
    const results = (data.results || []).map((row: any) => ({
      id: row.id,
      video_url: row[VIDEO_FIELD!],
      title: row['Title'] || '',
      description: row['Description'] || '',
      main_topic: row['Main Topic'] || '',
      duration: row['Duration'] || '',
      status: row['Status'] || '',
    })).filter((row: any) => row.video_url);
    res.json({ videos: results });
  } catch (e: any) {
    res.status(500).json({ error: e.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
