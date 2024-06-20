const API_URL = "https://plankton-app-hqpjh.ondigitalocean.app"
document.addEventListener('DOMContentLoaded', function() {
    const photoForm = document.getElementById('photoForm');
    const photoInput = document.getElementById('photoInput');
    const cameraVideoStream = document.getElementById('camera-stream')
    const shutterButton = document.getElementById('shutter')
    const canvas = document.getElementById('canvas')

    let width = window.innerWidth
    let height = 0
    let streaming = false

// Connect media device
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: {facingMode: {
                exact: "environment"
            }} })) {
        navigator.mediaDevices.getUserMedia({ video: {facingMode: {
                    exact: "environment"
                }} }).then ((stream) => {
            cameraVideoStream.srcObject = stream
            cameraVideoStream.play()
        })
    }
    const canvasContext = canvas.getContext('2d');
    cameraVideoStream.addEventListener('loadedmetadata', function() {
        canvasContext.translate(cameraVideoStream.videoWidth, 0);
        canvasContext.scale(-1, 1);
    });

    cameraVideoStream.addEventListener(
        "canplay",
        (ev) => {
            if (!streaming) {
                height = cameraVideoStream.videoHeight / (cameraVideoStream.videoWidth / width);

                if (isNaN(height)) {
                    height = width / (4 / 3);
                }

                canvas.setAttribute("width", width);
                canvas.setAttribute("height", height);
                cameraVideoStream.setAttribute("width", width);
                cameraVideoStream.setAttribute("height", height);
                streaming = true;
            }
        },
        false
    );

    document.addEventListener('DOMContentLoaded', function() {
        // Existing code...

        // Function to toggle the visibility of the result card
        document.getElementById('toggle-result-card').addEventListener('click', function() {
            const resultCard = document.getElementById('result-card');
            resultCard.style.display = 'none';
        });
    });

// Capture snapshots using HTML Canvas
    async function captureImage() {
        const canvasContext = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        canvasContext.drawImage(cameraVideoStream, 0, 0, width, height);

        // Convert captured data to Blob URL
        canvas.toBlob(async (blob) => {
            const base64data = await getBase64(blob);

            await sendDataToServer(base64data);
        }, 'image/jpeg');

    }

    shutterButton.addEventListener('click', () => captureImage())

    // Function to send the Base64 data to the server
    async function sendDataToServer(base64data) {
        // Assuming the server expects the Base64 data under the key 'photo'
        const dataToSend = {base64Image: await base64data};

        fetch(API_URL, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        })
            .then(response => response.json())
            .then(data => {
                const resultCard = document.getElementById('result-card');
                const resultText = document.getElementById('result-text');
                resultCard.style.display = 'block'; // Show the result card
                if (data.hasOwnProperty('status') && data.status === 400) {
                    resultText.textContent = JSON.stringify('Aucune plaque trouvée dans la photo');
                } else {
                    if (data.hasOwnProperty('raison') && data.raison === null) {
                        resultText.textContent = JSON.stringify('La plaque '+data.plateNumber+ ' n\'est pas blacklist');
                    } else {
                        resultText.textContent = JSON.stringify('La plaque '+data.plateNumber+ ' est blacklist: '+data.raison.name);
                    }
                }
            })
            .catch((error) => {
                const resultCard = document.getElementById('result-card');
                const resultText = document.getElementById('result-text');
                resultCard.style.display = 'block'; // Show the result card
                resultText.textContent = JSON.stringify('Failed to upload the photo: '+ JSON.stringify(error));

            });

    }
});

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
            if ((encoded.length % 4) > 0) {
                encoded += '='.repeat(4 - (encoded.length % 4));
            }
            resolve(encoded);
        };
        reader.onerror = error => reject(error);
    });
}
