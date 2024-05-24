const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { exec } = require('child_process');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

    if (!url || !/^https?\:\/\/(www\.youtube\.com|youtu\.be)\/.+/.test(url)) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL' });
    }

    try {
        const audioPath = path.join(downloadDir, `${Date.now()}.mp3`);
        
        const command = `yt-dlp -x --audio-format mp3 -o "${audioPath}" ${url}`;
        const downloadProcess = exec(command);

        downloadProcess.stdout.on('data', (data) => {
            const progressMatch = data.match(/(\d+\.\d+)%/);
            if (progressMatch) {
                const percent = progressMatch[1];
                io.emit('progress', { percent });
            }
        });

        downloadProcess.on('exit', (code) => {
            if (code === 0) {
                res.json({ success: true, file: `/downloads/${path.basename(audioPath)}` });
            } else {
                res.status(500).json({ success: false, error: 'Download failed' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
