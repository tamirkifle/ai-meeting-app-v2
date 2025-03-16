// State management
const state = {
    isRecording: false,
    startTime: null,
    ws: null,
    transcriptionHistory: [],
    backendPort: null
};

// LLM Client for summary generation
class LLMClient {
    constructor() {
        this.baseUrl = 'http://192.168.68.64:1234';
    }

    async isServerAvailable() {
        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'HEAD'
            });
            return response.ok;
        } catch (error) {
            console.error('LLM server check failed:', error);
            return false;
        }
    }

    async generateSummary(text) {
        try {
            const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: "You are a meeting summary assistant. Please summarize the meeting concisely, highlighting the following points:\n1. Main discussion topics (1-2 points)\n2. Key decisions or conclusions (if any)\n3. Next steps (if any)\n\nRequirements:\n- Use bullet points\n- Each point should be no more than 20 words\n- Exclude unnecessary details\n- If there is any unclear or incorrect information, simply state 'Unable to generate a valid summary'"

                        },
                        {
                            role: "user",
                            content: `Please summarize the following meeting transcript:\n\n${text}`
                        }
                    ],
                    model: "deepseek-r1-distill-qwen-7b",
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Summary generation failed:', error);
            throw new Error('Failed to generate summary. Please check if LMStudio is running and the model is loaded.');
        }
    }
}

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
        this.isConnecting = false;
    }

    async findBackendPort() {
        console.log('Looking for backend server...');
        for (let port = 8000; port <= 8010; port++) {
            try {
                console.log(`Trying port ${port}...`);
                const response = await fetch(`http://localhost:${port}/`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.message === "Meeting Transcription Backend Running") {
                        console.log(`✅ Found backend on port ${port}`);
                        return port;
                    }
                }
            } catch (error) {
                console.log(`Port ${port} not available:`, error.message);
            }
        }
        throw new Error("Could not find backend server. Please ensure the Python backend is running.");
    }

    async connect() {
        if (this.isConnecting) {
            console.log('Already attempting to connect...');
            return false;
        }
        
        this.isConnecting = true;
        console.log('Attempting to connect to WebSocket...');

        try {
            if (!state.backendPort) {
                state.backendPort = await this.findBackendPort();
            }

            console.log(`Connecting to WebSocket on port ${state.backendPort}...`);
            this.ws = new WebSocket(`ws://localhost:${state.backendPort}/transcribe`);
            this.setupEventListeners();
            return true;
        } catch (error) {
            console.error('WebSocket connection error:', error);
            showNotification(`Connection error: ${error.message}`, 'error');
            return false;
        } finally {
            this.isConnecting = false;
        }
    }

    setupEventListeners() {
        this.ws.onopen = () => {
            console.log('✅ WebSocket connected');
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
            state.backendPort = null; // Reset port on connection close
            stopRecording();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            showNotification('Connection error occurred', 'error');
            state.backendPort = null; // Reset port on error
            stopRecording();
        };
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        } else {
            console.error('WebSocket not ready');
            showNotification('Connection not ready. Please try again.', 'error');
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
            console.log('Starting audio recording...');
            // First try using tabCapture
            const tabStream = await this.captureTab();
            if (tabStream) {
                console.log('✅ Using tab audio');
                this.stream = tabStream;
            } else {
                // If tabCapture fails, try using microphone
                console.log('Tab capture failed, trying microphone...');
                const micStream = await this.captureMicrophone();
                if (!micStream) {
                    throw new Error('No audio source available');
                }
                console.log('✅ Using microphone');
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
        // Remove UI event listeners from here, only keep MediaRecorder events
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
const llmClient = new LLMClient();

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
    if (!elements) {
        console.error('DOM elements not initialized');
        return;
    }
    
    try {
        console.log('Initializing recording...');
        elements.startBtn.disabled = true;
        showNotification('Connecting to transcription server...', 'info');

        // Connect to WebSocket server
        const connected = await wsManager.connect();
        if (!connected) {
            throw new Error('Failed to connect to transcription server');
        }

        // Start audio recording
        const started = await audioRecorder.start();
        if (!started) {
            throw new Error('Failed to start audio recording');
        }

        // Update UI and state
        state.isRecording = true;
        updateUI(true);
        startTimer();
        elements.startBtn.disabled = false;
        showNotification('Recording started successfully', 'success');

    } catch (error) {
        console.error('Start recording error:', error);
        showNotification(error.message, 'error');
        stopRecording();
        elements.startBtn.disabled = false;
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

// Summary generation
async function generateSummary() {
    if (!elements || !elements.transcriptionContent.textContent.trim()) {
        showNotification('No transcription content to summarize', 'error');
        return;
    }

    try {
        elements.loadingIndicator.style.display = 'flex';
        elements.generateSummaryBtn.disabled = true;

        // Check if LMStudio server is available
        const isAvailable = await llmClient.isServerAvailable();
        if (!isAvailable) {
            throw new Error('LMStudio server is not available. Please ensure it is running on port 1234.');
        }

        const transcriptionText = elements.transcriptionContent.textContent;
        const summary = await llmClient.generateSummary(transcriptionText);

        elements.summaryContent.textContent = summary;
        showNotification('Summary generated successfully', 'success');

    } catch (error) {
        console.error('Summary generation error:', error);
        showNotification(error.message, 'error');
    } finally {
        elements.loadingIndicator.style.display = 'none';
        elements.generateSummaryBtn.disabled = false;
    }
}

// Event listener setup
function setupEventListeners() {
    if (!elements) {
        console.error('Cannot setup event listeners: elements not initialized');
        return;
    }

    console.log('Setting up event listeners...');

    // Transcription control
    elements.startBtn.addEventListener('click', () => {
        console.log('Start button clicked');
        if (!state.isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });

    // Summary generation
    if (elements.generateSummaryBtn) {
        console.log('Adding generate summary button listener');
        elements.generateSummaryBtn.addEventListener('click', generateSummary);
    }

    // Copy functionality
    if (elements.copyTranscriptBtn) {
        elements.copyTranscriptBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(elements.transcriptionContent.textContent)
                .then(() => showNotification('Transcription copied to clipboard'))
                .catch(() => showNotification('Failed to copy', 'error'));
        });
    }

    if (elements.copySummaryBtn) {
        elements.copySummaryBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(elements.summaryContent.textContent)
                .then(() => showNotification('Summary copied to clipboard'))
                .catch(() => showNotification('Failed to copy', 'error'));
        });
    }

    // Edit functionality
    if (elements.editBtn) {
        elements.editBtn.addEventListener('click', () => {
            elements.summaryContent.contentEditable = true;
            elements.summaryContent.focus();
            showNotification('You can now edit the summary');
        });
    }

    // Export functionality
    if (elements.exportBtn) {
        elements.exportBtn.addEventListener('click', () => {
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
    }

    // Settings functionality
    if (elements.settingsBtn && elements.settingsModal && elements.closeSettings) {
        elements.settingsBtn.addEventListener('click', () => {
            elements.settingsModal.style.display = 'flex';
        });

        elements.closeSettings.addEventListener('click', () => {
            elements.settingsModal.style.display = 'none';
        });
    }

    // Restore previous recording state
    chrome.storage.local.get(['isRecording'], (result) => {
        if (result.isRecording) {
            elements.transcriptionContent.textContent = '🔴 Recording in progress...';
            updateUI(true);
        }
    });

    console.log('Event listeners setup completed');
}

// Initialization
function initialize() {
    console.log('Initializing application...');
    elements = initializeElements();
    
    // Log which elements were found and which weren't
    Object.entries(elements).forEach(([key, value]) => {
        console.log(`${key}: ${value ? '✅ Found' : '❌ Not found'}`);
    });
    
    if (!elements.startBtn) {
        console.error('Critical elements not found in the DOM');
        return;
    }
    
    setupEventListeners();
    console.log('Initialization completed');
}

// Ensure DOM is fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}