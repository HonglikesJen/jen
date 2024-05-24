const socket = io();

document.getElementById('download-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const url = document.getElementById('url').value;
    const messageDiv = document.getElementById('message');
    const progressDiv = document.getElementById('progress');
    const progressPercent = document.getElementById('progress-percent');
    const downloadButton = document.getElementById('download-button');

    downloadButton.disabled = true;
    progressDiv.classList.remove('hidden');
    messageDiv.innerHTML = '';

    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => response.json())
    .then(data => {
        downloadButton.disabled = false;

        if (data.success) {
            messageDiv.innerHTML = `<a href="${data.file}" download>Click here to download your MP3</a>`;
        } else {
            messageDiv.innerHTML = `Error: ${data.error}`;
        }

        progressDiv.classList.add('hidden');
    })
    .catch(error => {
        downloadButton.disabled = false;
        progressDiv.classList.add('hidden');
        messageDiv.innerHTML = `Error: ${error.message}`;
    });

    socket.on('progress', (data) => {
        progressPercent.textContent = `${data.percent}%`;
    });
});
