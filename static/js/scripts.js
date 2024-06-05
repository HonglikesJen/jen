function analyzeUrl() {
    const url = document.getElementById('url').value;
    const analyzeButton = document.querySelector('button[onclick="analyzeUrl()"]');
    const downloadButton = document.querySelector('button[onclick="startDownload()"]');
    const convertButton = document.querySelector('button[onclick="convertToMp3()"]');

    if (url.trim() === '') {
        alert('請輸入 YouTube 視頻 URL');
        return;
    }

    analyzeButton.disabled = true;
    fetch('/formats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => response.json())
    .then(data => {
        analyzeButton.disabled = false;
        if (data.error) {
            alert('獲取格式失敗：' + data.error);
            return;
        }
        const formatSelect = document.getElementById('format');
        formatSelect.innerHTML = '';
        data.formats.forEach(format => {
            const option = document.createElement('option');
            option.value = format.format_id;
            option.textContent = `${format.format} - ${format.ext}`;
            formatSelect.appendChild(option);
        });
    })
    .catch(error => {
        alert('獲取格式失敗：' + error);
        analyzeButton.disabled = false;
    });
}

function startDownload() {
    const url = document.getElementById('url').value;
    const format = document.getElementById('format').value;
    const downloadButton = document.querySelector('button[onclick="startDownload()"]');
    const convertButton = document.querySelector('button[onclick="convertToMp3()"]');

    if (url.trim() === '') {
        alert('請輸入 YouTube 視頻 URL');
        return;
    }
    if (format.trim() === '') {
        alert('請選擇格式');
        return;
    }

    downloadButton.disabled = true;
    convertButton.disabled = true;

    const downloadItem = document.createElement('li');
    const progressBar = document.createElement('div');
    progressBar.className = 'progress';
    const progress = document.createElement('div');
    progress.className = 'progress-bar';
    progressBar.appendChild(progress);
    downloadItem.appendChild(progressBar);
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.onclick = function () {
        downloadItem.remove();
        downloadButton.disabled = false;
        convertButton.disabled = false;
    };
    downloadItem.appendChild(cancelButton);
    document.getElementById('download-list').appendChild(downloadItem);
    
    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url, format: format })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('下載失敗：' + data.error);
            downloadItem.remove();
            downloadButton.disabled = false;
            convertButton.disabled = false;
            return;
        }
        
        const a = document.createElement('a');
        a.href = data.download_url;
        a.download = data.filename;
        a.click();

        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += 10;
            progress.style.width = progressValue + '%';
            if (progressValue >= 100) {
                clearInterval(interval);
                alert('下載完成');
                downloadButton.disabled = false;
                convertButton.disabled = false;
            }
        }, 1000);
    })
    .catch(error => {
        alert('下載失敗：' + error);
        downloadItem.remove();
        downloadButton.disabled = false;
        convertButton.disabled = false;
    });
}

function convertToMp3() {
    const url = document.getElementById('url').value;
    const downloadButton = document.querySelector('button[onclick="startDownload()"]');
    const convertButton = document.querySelector('button[onclick="convertToMp3()"]');

    if (url.trim() === '') {
        alert('請輸入 YouTube 視頻 URL');
        return;
    }

    downloadButton.disabled = true;
    convertButton.disabled = true;

    const downloadItem = document.createElement('li');
    const progressBar = document.createElement('div');
    progressBar.className = 'progress';
    const progress = document.createElement('div');
    progress.className = 'progress-bar';
    progressBar.appendChild(progress);
    downloadItem.appendChild(progressBar);
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.onclick = function () {
        downloadItem.remove();
        downloadButton.disabled = false;
        convertButton.disabled = false;
    };
    downloadItem.appendChild(cancelButton);
    document.getElementById('download-list').appendChild(downloadItem);
    
    fetch('/convert_to_mp3', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('轉換失敗：' + data.error);
            downloadItem.remove();
            downloadButton.disabled = false;
            convertButton.disabled = false;
            return;
        }
        
        const a = document.createElement('a');
        a.href = data.download_url;
        a.download = data.filename;
        a.click();

        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += 10;
            progress.style.width = progressValue + '%';
            if (progressValue >= 100) {
                clearInterval(interval);
                alert('轉換完成');
                downloadButton.disabled = false;
                convertButton.disabled = false;
            }
        }, 1000);
    })
    .catch(error => {
        alert('轉換失敗：' + error);
        downloadItem.remove();
        downloadButton.disabled = false;
        convertButton.disabled = false;
    });
}
