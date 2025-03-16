// chrome.action.onClicked.addListener((tab) => {
//     chrome.tabCapture.capture(
//         { audio: true, video: false }, 
//         (stream) => {
//             if (!stream) {
//                 console.error("Error: Could not capture audio from tab.");
//                 return;
//             }

//             console.log("✅ Audio Capture Started");
//             const mediaRecorder = new MediaRecorder(stream);
//             mediaRecorder.ondataavailable = (event) => {
//                 console.log("Sending audio chunk...");
//                 sendAudioToBackend(event.data);
//             };
//             mediaRecorder.start(1000); // Send chunks every 1 second
//         }
//     );
// });

// Send audio to backend WebSocket
function sendAudioToBackend(audioData) {
    let ws = new WebSocket("ws://localhost:8000/transcribe");

    ws.onopen = () => {
        console.log("✅ Connected to backend");
        ws.send(audioData);
    };

    ws.onmessage = (event) => {
        console.log("Transcription:", event.data);
    };

    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };

    ws.onclose = () => {
        console.log("WebSocket closed");
    };
}
