
import numpy as np
import librosa
import onnxruntime as ort
from fastapi import FastAPI, WebSocket
import json
import os
import uvicorn
import socket

# Check if model files exist
if not os.path.exists("./models/whisper_base_en-whisperencoder.onnx") or \
   not os.path.exists("./models/whisper_base_en-whisperdecoder.onnx"):
    print("❌ Error: Whisper ONNX model files not found!")
    print("Please ensure the model files are in the ./models directory")
    exit(1)

# Load Whisper ONNX models
encoder_path = "./models/whisper_base_en-whisperencoder.onnx"
decoder_path = "./models/whisper_base_en-whisperdecoder.onnx"

try:
    encoder_session = ort.InferenceSession(encoder_path)
    decoder_session = ort.InferenceSession(decoder_path)
    print("✅ Whisper ONNX Encoder & Decoder Loaded Successfully!")
except Exception as e:
    print(f"❌ Error loading ONNX models: {e}")
    exit(1)

app = FastAPI()

# Constants
EXPECTED_NUM_FRAMES = 3000  # Number of frames expected by Whisper
NUM_MEL_BINS = 80  # Number of Mel spectrogram bins

def find_available_port(start_port=8000, max_tries=10):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_tries):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('0.0.0.0', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"Could not find an available port after {max_tries} attempts")



def preprocess_audio(audio_data):
    """Preprocess audio data into the format required by Whisper model"""
    try:
        # Ensure audio data length is even
        if len(audio_data) % 2 != 0:
            audio_data = audio_data[:-1]

        # Convert PCM bytes to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

        # Ensure mono channel
        if audio_array.ndim > 1:
            audio_array = np.mean(audio_array, axis=1)

        # Generate Mel spectrogram
        mel_spectrogram = librosa.feature.melspectrogram(
            y=audio_array,
            sr=16000,
            n_mels=NUM_MEL_BINS,
            hop_length=160,
            n_fft=400
        )
        
        # Convert to log scale
        mel_spectrogram_db = librosa.power_to_db(mel_spectrogram).astype(np.float32)

        # Resize to match expected frame count
        if mel_spectrogram_db.shape[1] > EXPECTED_NUM_FRAMES:
            mel_spectrogram_db = mel_spectrogram_db[:, :EXPECTED_NUM_FRAMES]
        elif mel_spectrogram_db.shape[1] < EXPECTED_NUM_FRAMES:
            # Pad to expected frame count
            padding = np.zeros((NUM_MEL_BINS, EXPECTED_NUM_FRAMES - mel_spectrogram_db.shape[1]))
            mel_spectrogram_db = np.concatenate([mel_spectrogram_db, padding], axis=1)

        # Add batch dimension
        mel_input = np.expand_dims(mel_spectrogram_db, axis=0)

        return mel_input
    except Exception as e:
        print(f"❌ Error in audio preprocessing: {e}")
        raise

def initialize_decoder_caches():
    """Initialize decoder cache tensors"""
    # Create empty cache tensors
    k_cache_cross = np.zeros((1, 6, 1500, 64), dtype=np.float32)
    v_cache_cross = np.zeros((1, 6, 1500, 64), dtype=np.float32)
    k_cache_self = np.zeros((1, 6, 1500, 64), dtype=np.float32)
    v_cache_self = np.zeros((1, 6, 1500, 64), dtype=np.float32)
    
    return {
        'k_cache_cross': k_cache_cross,
        'v_cache_cross': v_cache_cross,
        'k_cache_self': k_cache_self,
        'v_cache_self': v_cache_self,
        'index': np.array([0], dtype=np.int64)
    }

async def transcribe_audio(audio_data):
    """Transcribe audio using Whisper ONNX models"""
    try:
        # Preprocess audio
        mel_input = preprocess_audio(audio_data)
        
        # Run encoder
        encoder_inputs = {encoder_session.get_inputs()[0].name: mel_input}
        encoder_output = encoder_session.run(None, encoder_inputs)[0]
        
        # Initialize decoder inputs
        decoder_inputs = {
            'x': encoder_output,
            'index': np.array([0], dtype=np.int64),
            **initialize_decoder_caches()
        }
        
        # Run decoder
        decoder_output = decoder_session.run(None, decoder_inputs)[0]
        
        # Convert output to text
        transcription_tokens = [chr(int(c)) for c in decoder_output.flatten() if c > 0]
        transcription = "".join(transcription_tokens).strip()
        
        print("✅ Transcription Result:", transcription)
        return transcription
        
    except Exception as e:
        print(f"❌ Error during transcription: {e}")
        return "[Transcription Error]"

@app.websocket("/transcribe")
async def websocket_transcription(websocket: WebSocket):
    """Handle WebSocket connection and audio transcription"""
    await websocket.accept()
    print("✅ Client Connected for Transcription")

    try:
        while True:
            audio_data = await websocket.receive_bytes()
            print(f"🔍 Received audio data of length: {len(audio_data)} bytes")
            
            transcription = await transcribe_audio(audio_data)
            await websocket.send_text(json.dumps({"transcription": transcription}))
            
    except Exception as e:
        print(f"❌ Error during transcription: {e}")
    finally:
        print("INFO: connection closed")

@app.get("/")
def root():
    return {"message": "Meeting Transcription Backend Running"}

if __name__ == "__main__":
    # import uvicorn
    # uvicorn.run(app, host="0.0.0.0", port=8000)
    try:
        port = find_available_port()
        print(f"✅ Starting server on port {port}")
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        exit(1)