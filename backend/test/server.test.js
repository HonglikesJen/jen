const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const downloadDir = path.join(__dirname, 'downloads');

if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/downloads', express.static(downloadDir));

app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!/^https?\:\/\/(www\.youtube\.com|youtu\.be)\/.+/.test(url)) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL' });
    }

    try {
        const audioPath = path.join(downloadDir, `${Date.now()}.mp3`);
        const command = `yt-dlp -x --audio-format mp3 -o "${audioPath}" ${url}`;
        const downloadProcess = exec(command);

        downloadProcess.on('exit', (code) => {
            if (code === 0) {
                res.json({ success: true, file: `/downloads/${path.basename(audioPath)}` });
            } else {
                res.status(500).json({ success: false, error: 'Download failed' });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 在測試中需要調用的服務
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

describe('POST /download', () => {
    jest.setTimeout(30000);

    afterAll(() => {
        server.close();
    });

    it('should return 400 for invalid URL', async () => {
        const response = await request(app)
            .post('/download')
            .send({ url: 'invalid-url' });
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid YouTube URL');
    });

    it('should return 200 for valid URL', async () => {
        const response = await request(app)
            .post('/download')
            .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.file).toMatch(/downloads\/.+\.mp3$/);
    });
});
