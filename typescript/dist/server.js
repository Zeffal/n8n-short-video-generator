"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env from the parent directory
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '..', '..', '.env') });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5050;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const BASEROW_TOKEN = process.env.BASEROW_TOKEN;
const BASEROW_TABLE_API = process.env.BASEROW_TABLE_API;
const VIDEO_FIELD = process.env.VIDEO_FIELD;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve static files from the root static directory, not from dist
const PROJECT_ROOT = path_1.default.resolve(__dirname);
app.use('/static', express_1.default.static(path_1.default.join(PROJECT_ROOT, 'static')));
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(PROJECT_ROOT, 'templates', 'index.html'));
});
app.post('/submit', async (req, res) => {
    const data = req.body;
    const payload = {
        'The Main Topic': data.mainTopic,
        'Duration': data.duration,
        'Video Type': data.videoType,
        'Generative Style': 'In the style of should be soft purple or dominant purple to complement the theme and recess blue neon color theme, colorful dreams. filmstock: Sony a7R IV camera, Meike dreams 85mm F1.8 --ar 1:1 --v 6.0',
        'TTS Voice': data.ttsVoice,
        'Image Provider': 'together.ai',
        'BGM music': process.env.BGM_MUSIC,
        'Watermark Logo': process.env.WATERMARK_LOGO,
    };
    try {
        const response = await (0, node_fetch_1.default)(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const text = await response.text();
        res.json({ message: 'Sent to n8n', status: response.status, n8n_response: text });
    }
    catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});
app.get('/get_video', async (_req, res) => {
    try {
        const response = await (0, node_fetch_1.default)(BASEROW_TABLE_API, {
            headers: { Authorization: `Token ${BASEROW_TOKEN}` },
        });
        const data = await response.json();
        const rows = data.results || [];
        if (!rows.length) {
            return res.status(404).json({ error: 'No videos found.' });
        }
        const latestRow = rows.reduce((a, b) => (a.id > b.id ? a : b));
        const video_url = latestRow[VIDEO_FIELD];
        const title = latestRow['Title'] || '';
        const description = latestRow['Description'] || '';
        if (!video_url) {
            return res.status(404).json({ error: 'No video URL available.' });
        }
        res.json({ video_url, title, description });
    }
    catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});
app.get('/videos', async (_req, res) => {
    try {
        const response = await (0, node_fetch_1.default)(BASEROW_TABLE_API, {
            headers: { Authorization: `Token ${BASEROW_TOKEN}` },
        });
        const data = await response.json();
        const results = (data.results || []).map((row) => ({
            id: row.id,
            video_url: row[VIDEO_FIELD],
            title: row['Title'] || '',
            description: row['Description'] || '',
            main_topic: row['Main Topic'] || '',
            duration: row['Duration'] || '',
            status: row['Status'] || '',
        })).filter((row) => row.video_url);
        res.json({ videos: results });
    }
    catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
