# AI Meeting Assistant Chrome Extension

A Chrome extension that provides real-time meeting transcription and AI-powered summarization using LMStudio and a local language model.

## Features

- 🎙️ Real-time audio transcription from tab audio or microphone
- 📝 Live text transcription display
- 🤖 AI-powered meeting summarization
- 📊 Meeting statistics (duration, word count)
- 💾 Export functionality for transcripts and summaries
- ⚙️ Configurable settings for audio source and transcription preferences

## System Requirements

- Windows/macOS/Linux
- Google Chrome browser
- Python 3.8 or higher
- Node.js and npm (for development)
- At least 16GB RAM (for running the language model)

## Installation Guide

### 1. Install Required Tools

1. **Python Setup**:
   ```bash
   # Download Python from https://www.python.org/downloads/
   # During installation, make sure to check "Add Python to PATH"
   
   # Verify installation
   python --version
   pip --version
   ```

2. **LMStudio Setup**:
   - Download LMStudio from [https://lmstudio.ai/](https://lmstudio.ai/)
   - Install and launch LMStudio
   - Download the "deepseek-r1-distill-qwen-7b" model
   - Start the local server on port 1234

### 2. Backend Server Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/ai-meeting-app.git
   cd ai-meeting-app
   ```

2. **Create Virtual Environment**:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start Backend Server**:
   ```bash
   python backend.py
   ```
   The server will automatically find an available port (default: 8000)

### 3. Chrome Extension Setup

1. **Open Chrome Extensions Page**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right

2. **Load the Extension**:
   - Click "Load unpacked"
   - Select the `chrome_extension` folder from the project directory

## Usage Guide

### Starting a Meeting Recording

1. Click the extension icon in Chrome
2. Click "Start Transcription"
3. Choose audio source when prompted:
   - Tab audio (for online meetings)
   - Microphone (for in-person meetings)

### During the Meeting

- Live transcription appears in the left panel
- Meeting duration and word count are shown at the bottom
- Status indicator shows recording state

### After the Meeting

1. Click "Stop Transcription" to end recording
2. Click "Generate" to create an AI summary
3. Options for the summary:
   - Edit the summary
   - Copy to clipboard
   - Export as text file

### Settings Configuration

Click the "Settings" button to configure:
- Preferred audio source
- Noise reduction
- Auto-summary generation
- Word count display

## Component Architecture

### Frontend (Chrome Extension)
- `popup.html`: Main UI interface
- `popup.js`: Core functionality
  - `AudioRecorder`: Handles audio capture
  - `WebSocketManager`: Manages server communication
  - `LLMClient`: Interfaces with LMStudio for summarization

### Backend (Python Server)
- `backend.py`: WebSocket server
  - Audio processing
  - Real-time transcription
  - Client communication

### External Services
- LMStudio: Local language model server
  - Runs on port 1234
  - Provides summarization capabilities

## Troubleshooting

### Common Issues

1. **Extension Not Loading**:
   - Verify Developer mode is enabled
   - Check for console errors
   - Ensure all files are in correct locations

2. **Audio Not Recording**:
   - Check microphone permissions
   - Verify audio source selection
   - Ensure no other apps are using the audio device

3. **Summarization Failed**:
   - Confirm LMStudio is running
   - Check port 1234 is available
   - Verify model is properly loaded

4. **Backend Connection Issues**:
   - Ensure Python server is running
   - Check for port conflicts
   - Verify WebSocket connection

## Future Improvements

1. **Enhanced Features**:
   - Multiple language support
   - Speaker diarization
   - Custom summarization templates
   - Meeting agenda integration

2. **Technical Improvements**:
   - Offline mode support
   - Better error handling
   - Performance optimization
   - Automated testing

3. **User Experience**:
   - More customization options
   - Improved UI/UX
   - Meeting analytics
   - Cloud backup integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository.