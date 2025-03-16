// State management
const state = {
    isRecording: false,
    startTime: null,
    ws: null,
    transcriptionHistory: []
};

// DOM element initialization function
function initializeElements() {
    return {
        startBtn: document.getElementById('startTranscription'),
        generateSummaryBtn: document.getElementById('generateSummary'),
        transcriptionContent: document.getElementById('transcriptionContent'),
        summaryContent: document.getElementById('summaryContent'),
        loadingIndicator: document.getElementById('loadingIndicator'),
        statusDot: document.getElementById('statusDot'),
        statusText: document.getElementById('statusText'),
        duration: document.getElementById('duration'),
        wordCount: document.getElementById('wordCount'),
        notification: document.getElementById('notification'),
        settingsModal: document.getElementById('settingsModal'),
        settingsBtn: document.getElementById('settingsBtn'),
        closeSettings: document.getElementById('closeSettings'),
        copyTranscriptBtn: document.getElementById('copyTranscript'),
        copySummaryBtn: document.getElementById('copySummary'),
        editBtn: document.getElementById('editBtn'),
        exportBtn: document.getElementById('exportBtn')
    };
}

let elements = null;

// WebSocket management
class WebSocketManager {
    constructor() {
        this.ws = null;
    }

    connect() {
        try {
            this.ws = new WebSocket('ws://localhost:8000/transcribe');
            this.setupEventListeners();
            return true;
        } catch (error) {
            showNotification('Failed to connect to server', 'error');
            return false;
        }
    }

    setupEventListeners() {
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            showNotification('Connected to transcription server', 'success');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.transcription) {
                updateTranscription(data.transcription);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket closed');
            stopRecording();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            showNotification('Connection error occurred', 'error');
            stopRecording();
        };
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Audio recording management
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.stream = null;
    }

    async start() {
        try {
            // First try using tabCapture
            const tabStream = await this.captureTab();
            if (tabStream) {
                this.stream = tabStream;
            } else {
                // If tabCapture fails, try using microphone
                const micStream = await this.captureMicrophone();
                if (!micStream) {
                    throw new Error('No audio source available');
                }
                this.stream = micStream;
            }

            this.mediaRecorder = new MediaRecorder(this.stream);
            this.setupEventListeners();
            this.mediaRecorder.start(1000);
            return true;
        } catch (error) {
            console.error('Audio recording error:', error);
            showNotification(error.message, 'error');
            return false;
        }
    }

    async captureTab() {
        return new Promise((resolve) => {
            chrome.tabCapture.capture({ audio: true }, (stream) => {
                if (chrome.runtime.lastError) {
                    console.log('Tab capture error:', chrome.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(stream);
                }
            });
        });
    }

    async captureMicrophone() {
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        } catch (error) {
            console.error('Microphone capture error:', error);
            return null;
        }
    }

    setupEventListeners() {
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && wsManager.ws) {
                wsManager.send(event.data);
            }
        };

        this.mediaRecorder.onerror = (error) => {
            console.error('MediaRecorder error:', error);
            showNotification('Recording error occurred', 'error');
            stopRecording();
        };
    }

    stop() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            this.mediaRecorder = null;
            this.stream = null;
        }
    }
}

// Initialize managers
const wsManager = new WebSocketManager();
const audioRecorder = new AudioRecorder();

// UI update functions
function updateUI(isRecording) {
    if (!elements) return;
    
    elements.startBtn.innerHTML = `
        <span class="material-icons">${isRecording ? 'stop' : 'mic'}</span>
        ${isRecording ? 'Stop Transcription' : 'Start Transcription'}
    `;
    elements.startBtn.style.background = isRecording ? '#dc3545' : '';
    elements.statusDot.classList.toggle('active', isRecording);
    elements.statusText.textContent = isRecording ? 'Recording' : 'Ready';
    elements.loadingIndicator.style.display = isRecording ? 'flex' : 'none';
}

// Transcription update
function updateTranscription(text) {
    if (!elements) return;
    
    if (text && text !== '[No speech detected]') {
        state.transcriptionHistory.push(text);
        elements.transcriptionContent.textContent = state.transcriptionHistory.join(' ');
        updateWordCount(elements.transcriptionContent.textContent);
    }
}

// Timer management
let durationInterval;
function startTimer() {
    state.startTime = Date.now();
    durationInterval = setInterval(updateDuration, 1000);
}

function stopTimer() {
    clearInterval(durationInterval);
    updateDuration();
}

function updateDuration() {
    if (!elements || !state.startTime) return;
    
    const duration = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    elements.duration.textContent = `Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Word count update
function updateWordCount(text) {
    if (!elements) return;
    
    const wordCount = text.trim().split(/\s+/).length;
    elements.wordCount.textContent = `Words: ${wordCount}`;
}

// Notification management
function showNotification(message, type = 'info') {
    if (!elements) return;
    
    elements.notification.textContent = message;
    elements.notification.style.display = 'block';
    elements.notification.style.background = type === 'error' ? '#dc3545' : 
                                          type === 'success' ? '#28a745' : '#333';

    setTimeout(() => {
        if (elements) {
            elements.notification.style.display = 'none';
        }
    }, 3000);
}

// Recording control
async function startRecording() {
    if (!elements) return;
    
    elements.loadingIndicator.style.display = 'flex';
    
    if (await audioRecorder.start()) {
        if (wsManager.connect()) {
            state.isRecording = true;
            startTimer();
            updateUI(true);
            showNotification('Recording started', 'success');
        } else {
            audioRecorder.stop();
            elements.loadingIndicator.style.display = 'none';
        }
    } else {
        elements.loadingIndicator.style.display = 'none';
    }
}

function stopRecording() {
    audioRecorder.stop();
    wsManager.close();
    state.isRecording = false;
    stopTimer();
    updateUI(false);
    showNotification('Recording stopped');
}

// Event listener setup
function setupEventListeners() {
    if (!elements) return;

    // Transcription control
    elements.startBtn.addEventListener('click', () => {
        if (!state.isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });

    // Copy functionality
    elements.copyTranscriptBtn?.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.transcriptionContent.textContent)
            .then(() => showNotification('Transcription copied to clipboard'))
            .catch(() => showNotification('Failed to copy', 'error'));
    });

    elements.copySummaryBtn?.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.summaryContent.textContent)
            .then(() => showNotification('Summary copied to clipboard'))
            .catch(() => showNotification('Failed to copy', 'error'));
    });

    // Edit functionality
    elements.editBtn?.addEventListener('click', () => {
        elements.summaryContent.contentEditable = true;
        elements.summaryContent.focus();
        showNotification('You can now edit the summary');
    });

    // Export functionality
    elements.exportBtn?.addEventListener('click', () => {
        const content = `
Transcription:
${elements.transcriptionContent.textContent}

Summary:
${elements.summaryContent.textContent}
        `;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcription_${new Date().toISOString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Settings functionality
    elements.settingsBtn?.addEventListener('click', () => {
        elements.settingsModal.style.display = 'flex';
    });

    elements.closeSettings?.addEventListener('click', () => {
        elements.settingsModal.style.display = 'none';
    });

    // Restore previous recording state
    chrome.storage.local.get(['isRecording'], (result) => {
        if (result.isRecording) {
            elements.transcriptionContent.textContent = '🔴 Recording in progress...';
            updateUI(true);
        }
    });
}

// Initialization
function initialize() {
    elements = initializeElements();
    if (!elements.startBtn) {
        console.error('Critical elements not found in the DOM');
        return;
    }
    setupEventListeners();
}

// Ensure DOM is fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}