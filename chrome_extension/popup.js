// function startCapture() {
//     chrome.tabCapture.capture({ audio: true }, (stream) => {
//         if (chrome.runtime.lastError || !stream) {
//             transcriptionBox.innerText = "Error: Could not capture audio.";
//             console.error("Tab Capture Error:", chrome.runtime.lastError);
//             return;
//         }

//         ws = new WebSocket("ws://localhost:8000/transcribe");
//         ws.onopen = () => console.log("Connected to transcription server");

//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             transcriptionBox.innerHTML += `<p>${data.transcription}</p>`;
//             transcriptionBox.scrollTop = transcriptionBox.scrollHeight;
//         };

//         mediaRecorder = new MediaRecorder(stream);
//         mediaRecorder.ondataavailable = (event) => {
//             if (ws.readyState === WebSocket.OPEN) {
//                 ws.send(event.data);
//             }
//         };
//         mediaRecorder.start(1000);

//         startBtn.style.display = "none";
//         stopBtn.style.display = "block";
//         transcriptionBox.innerText = "Listening...";
//         isRecording = true;
//     });
// }


// const loadingIndicator = document.getElementById("loadingIndicator");

// function startCapture() {
//     chrome.tabCapture.capture({ audio: true }, (stream) => {
//         if (chrome.runtime.lastError || !stream) {
//             transcriptionBox.innerText = "Error: Could not capture audio.";
//             console.error("Tab Capture Error:", chrome.runtime.lastError);
//             return;
//         }

//         ws = new WebSocket("ws://localhost:8000/transcribe");
//         ws.onopen = () => console.log("Connected to transcription server");

//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             transcriptionBox.innerHTML += `<p>${data.transcription}</p>`;
//             transcriptionBox.scrollTop = transcriptionBox.scrollHeight;
//         };

//         mediaRecorder = new MediaRecorder(stream);
//         mediaRecorder.ondataavailable = (event) => {
//             if (ws.readyState === WebSocket.OPEN) {
//                 ws.send(event.data);
//             }
//         };
//         mediaRecorder.start(1000);

//         // Update UI to show recording indicator
//         startBtn.style.display = "none";
//         stopBtn.style.display = "block";
//         transcriptionBox.innerText = "Listening...";
//         document.getElementById("loadingIndicator").style.display = "block";
//         isRecording = true;
//     });
// }

// // Function to stop capturing audio
// function stopCapture() {
//     if (mediaRecorder && isRecording) {
//         mediaRecorder.stop();
//         ws.close();
//         isRecording = false;

//         // Update UI to hide recording indicator
//         startBtn.style.display = "block";
//         stopBtn.style.display = "none";
//         document.getElementById("loadingIndicator").style.display = "none";
        
//         transcriptionBox.innerText += "\n[Transcription Stopped]";
//     }
// }

// // Button event listeners
// startBtn.addEventListener("click", () => {
//     document.getElementById("loadingIndicator").style.display = "block"; // show indicator
//     startCapture();
// });
// stopBtn.addEventListener("click", stopCapture);



const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const transcriptionBox = document.getElementById("transcription");
const loadingIndicator = document.getElementById("loadingIndicator");
let ws;
let mediaRecorder;
let isRecording = false;

function updateUIRecordingState(recording) {
    startBtn.style.display = recording ? "none" : "block";
    stopBtn.style.display = recording ? "block" : "none";
    loadingIndicator.style.display = recording ? "block" : "none";
    transcriptionBox.innerText = recording ? "Listening..." : "[Transcription Stopped]";
}

// Restore previous recording state when popup opens
chrome.storage.local.get(["isRecording"]).then((result) => {
    if (result.isRecording) {
        transcriptionBox.innerText = "🔴 Recording in progress...";
        updateUIRecordingState(true);
    } else {
        transcriptionBox.innerText = 'Click "Start" to begin capturing audio.';
        updateUIRecordingState(false);
    }
});

function startCapture() {
    chrome.tabCapture.capture({ audio: true }, (stream) => {
        if (chrome.runtime.lastError || !stream) {
            transcriptionBox.innerText = "Error: Could not capture audio.";
            console.error("Tab Capture Error:", chrome.runtime.lastError);
            return;
        }

        ws = new WebSocket("ws://localhost:8000/transcribe");
        ws.onopen = () => console.log("Connected to transcription server");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            transcriptionBox.innerHTML += `<p>${data.transcription}</p>`;
            transcriptionBox.scrollTop = transcriptionBox.scrollHeight;
        };

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(event.data);
                console.log("Audio chunk sent");
            }
        };
        mediaRecorder.start(1000);

        isRecording = true;
        chrome.storage.local.set({ recording: true });
        updateUIRecordingState(true);
        transcriptionBox.innerText = "Listening...";
    });
}

function stopCapture() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        ws.close();
        isRecording = false;
        
        chrome.storage.local.set({ isRecording: false });
        updateUIRecordingState(false);
        
        transcriptionBox.innerText += "\n[Transcription Stopped]";
    }
}

// Button event listeners
startBtn.addEventListener("click", () => {
    startCapture();
});

stopBtn.addEventListener("click", stopCapture);

// On popup load, check stored state
chrome.storage.local.get(["isRecording"]).then((result) => {
    isRecording = result.isRecording || false;
    updateUIRecordingState(isRecording);
});
