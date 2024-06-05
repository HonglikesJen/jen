from flask import Flask, render_template, request, jsonify, send_from_directory, url_for
from flask_socketio import SocketIO
import yt_dlp
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

DOWNLOAD_FOLDER = 'downloads'
FFMPEG_PATH = os.path.join(os.getcwd(), 'ffmpeg')
FFPROBE_PATH = os.path.join(os.getcwd(), 'ffprobe')

if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/formats', methods=['POST'])
def formats():
    url = request.json.get('url')
    ydl_opts = {'ffmpeg_location': FFMPEG_PATH}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=False)
            formats = [f for f in info_dict.get('formats', []) if f['ext'] in ['mp4', 'mp3']]
            return jsonify({'formats': formats})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    format_id = data.get('format')
    ydl_opts = {
        'format': format_id,
        'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
        'ffmpeg_location': FFMPEG_PATH
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url)
            filename = ydl.prepare_filename(info_dict)
            download_url = url_for('download_file', filename=os.path.basename(filename), _external=True)
            return jsonify({'download_url': download_url, 'filename': os.path.basename(filename)})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/convert_to_mp3', methods=['POST'])
def convert_to_mp3():
    data = request.json
    url = data.get('url')
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(DOWNLOAD_FOLDER, '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'ffmpeg_location': FFMPEG_PATH
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url)
            filename = ydl.prepare_filename(info_dict).replace('.webm', '.mp3').replace('.m4a', '.mp3')
            download_url = url_for('download_file', filename=os.path.basename(filename), _external=True)
            return jsonify({'download_url': download_url, 'filename': os.path.basename(filename)})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/downloads/<filename>')
def download_file(filename):
    return send_from_directory(DOWNLOAD_FOLDER, filename, as_attachment=True)

# Ensure not to use socketio.run, but to use app.run when running locally
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=False, host='0.0.0.0', port=port)
