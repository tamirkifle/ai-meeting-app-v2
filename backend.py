# # import onnxruntime as ort
# # import numpy as np
# # import websockets
# # import asyncio
# # import json
# # import io
# # import wave
# # from fastapi import FastAPI, WebSocket
# # from scipy.io import wavfile

# # # Load Whisper ONNX Encoder & Decoder Models
# # encoder_path = "./whisper_base_en-whisperencoder.onnx"
# # decoder_path = "./whisper_base_en-whisperdecoder.onnx"

# # encoder_session = ort.InferenceSession(encoder_path)
# # decoder_session = ort.InferenceSession(decoder_path)

# # print("✅ Whisper ONNX Encoder & Decoder Loaded Successfully!")

# # app = FastAPI()

# # async def transcribe_audio(audio_data):
# #     """Convert raw audio to Whisper format and transcribe using ONNX."""
# #     # Convert WebSocket audio stream to WAV format
# #     with wave.open(io.BytesIO(audio_data), "wb") as wf:
# #         wf.setnchannels(1)
# #         wf.setsampwidth(2)  # 16-bit PCM
# #         wf.setframerate(16000)
# #         wf.writeframes(audio_data)

# #     # Load audio into numpy array
# #     _, audio_array = wavfile.read(io.BytesIO(audio_data))
# #     audio_array = audio_array.astype(np.float32) / 32768.0  # Normalize

# #     # Step 1: Run Encoder ONNX Model
# #     encoder_inputs = {encoder_session.get_inputs()[0].name: audio_array}
# #     encoder_output = encoder_session.run(None, encoder_inputs)[0]

# #     # Step 2: Run Decoder ONNX Model
# #     decoder_inputs = {decoder_session.get_inputs()[0].name: encoder_output}
# #     decoder_output = decoder_session.run(None, decoder_inputs)[0]

# #     # Convert model output to text
# #     transcription = "".join([chr(int(c)) for c in decoder_output])

# #     return transcription

# # async def transcribe_audio(audio_data):
# #     # Convert raw PCM bytes into numpy array correctly
# #     audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

# #     # Whisper expects mono-channel audio at 16kHz sampling rate; ensure correct shape
# #     if len(audio_array.shape) > 1:
# #         audio_array = np.mean(audio_array, axis=1)

# #     # Whisper expects shape [1, length], add batch dimension
# #     audio_array = np.expand_dims(audio_array, axis=0)

# #     # Run Encoder ONNX Model
# #     encoder_inputs = {encoder_session.get_inputs()[0].name: audio_array}
# #     encoder_output = encoder_session.run(None, encoder_inputs)[0]

# #     # Run Decoder ONNX Model (assuming decoder takes encoder output directly)
# #     decoder_inputs = {decoder_session.get_inputs()[0].name: encoder_output}
# #     decoder_output = decoder_session.run(None, decoder_inputs)[0]

# #     # Convert model output to text correctly (assuming decoder_output gives token IDs)
# #     transcription_chars = [chr(int(c)) for c in decoder_output.flatten() if c > 0]
# #     transcription = "".join(transcription).strip()

# #     return transcription

# # import numpy as np
# # import librosa

# # async def transcribe_audio(audio_data):
# #     # Convert raw PCM bytes into numpy array (int16 PCM)
# #     audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

# #     # Ensure mono channel (if stereo)
# #     if len(audio_array.shape) > 1:
# #         audio_array = np.mean(audio_array, axis=1)

# #     # Generate Mel spectrogram (Whisper expects Mel spectrogram)
# #     import librosa
# #     mel_spectrogram = librosa.feature.melspectrogram(y=audio_array, sr=16000, n_mels=80, hop_length=160, n_fft=400)
# #     mel_spectrogram_db = librosa.power_to_db(mel_spectrogram).astype(np.float32)

# #     # Whisper expects shape [batch_size, num_mel_bins, num_frames]
# #     mel_spectrogram = np.expand_dims(mel_spectrogram, axis=0)  # Add batch dimension

# #     # Run Encoder ONNX Model
# #     encoder_inputs = {encoder_session.get_inputs()[0].name: mel_spectrogram}
# #     encoder_output = encoder_session.run(None, encoder_inputs)[0]

# #     # Prepare Decoder inputs (typically requires additional tokens; simplified here)
# #     decoder_inputs = {decoder_session.get_inputs()[0].name: encoder_output}
# #     decoder_output = decoder_session.run(None, decoder_inputs)[0]

# #     # Convert output tokens to text (assuming decoder outputs token IDs)
# #     transcription = "".join([chr(int(c)) for c in decoder_output.flatten() if c > 0]).strip()

# #     return transcription

# # import numpy as np
# # import librosa

# # async def transcribe_audio(audio_data):
# #     # Convert raw PCM bytes into numpy array
# #     audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

# #     # Ensure mono channel
# #     if audio_array.ndim > 1:
# #         audio_array = np.mean(audio_array, axis=1)

# #     # Generate Mel spectrogram as required by Whisper model
# #     mel_spectrogram = librosa.feature.melspectrogram(
# #         y=audio_array,
# #         sr=16000,
# #         n_fft=400,
# #         hop_length=160,
# #         n_mels=80
# #     )
    
# #     # Convert power spectrogram to log scale
# #     mel_spectrogram_db = librosa.power_to_db(mel_spectrogram).astype(np.float32)

# #     # Whisper expects [batch_size, num_mel_bins, num_frames]
# #     mel_input = np.expand_dims(mel_spectrogram_db, axis=0)

# #     # Run Encoder ONNX model
# #     encoder_inputs = {encoder_session.get_inputs()[0].name: mel_input}
# #     encoder_output = encoder_session.run(None, encoder_inputs)[0]

# #     # Decoder step depends on specific Whisper ONNX implementation; 
# #     # ensure you follow exact decoder inputs from your model provider.
    
# #     decoder_inputs = {decoder_session.get_inputs()[0].name: encoder_output}
# #     decoder_output = decoder_session.run(None, decoder_inputs)[0]

# #     # Convert token IDs to text properly; this depends on Whisper tokenizer implementation.
# #     transcription_text_tokens = [chr(int(c)) for c in decoder_output.flatten() if c > 0]
    
# #     transcription_text = "".join(transcription_text_tokens).strip()

# #     return transcription_text


# # @app.websocket("/transcribe")
# # async def websocket_transcription(websocket: WebSocket):
# #     """WebSocket for receiving audio from Chrome extension & sending transcriptions."""
# #     await websocket.accept()
# #     print("Client Connected for Transcription")

# #     while True:
# #         try:
# #             audio_data = await websocket.receive_bytes()
# #             transcription = await transcribe_audio(audio_data)
# #             await websocket.send_text(json.dumps({"transcription": transcription}))
# #         except Exception as e:
# #             print(f"Error: {e}")
# #             break

# # @app.get("/")
# # def root():
# #     return {"message": "Meeting Transcription Backend Running"}

# # if __name__ == "__main__":
# #     import uvicorn
# #     uvicorn.run(app, host="0.0.0.0", port=8000)


# # import numpy as np
# # import librosa
# # import onnxruntime as ort
# # from fastapi import FastAPI, WebSocket
# # import json

# # encoder_path = "./whisper_base_en-whisperencoder.onnx"
# # decoder_path = "./whisper_base_en-whisperdecoder.onnx"

# # encoder_session = ort.InferenceSession(encoder_path)
# # decoder_session = ort.InferenceSession(decoder_path)

# # print("✅ Whisper ONNX Encoder & Decoder Loaded Successfully!")

# # app = FastAPI()

# # async def transcribe_audio(audio_data):
# #     # Ensure audio data length is even (multiple of 2 bytes per sample)
# #     if len(audio_data) % 2 != 0:
# #         audio_data = audio_data[:-1]  # Trim last byte if odd length

# #     # Convert PCM bytes to numpy float32 array
# #     audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

# #     # Generate Mel spectrogram required by Whisper model
# #     mel_spectrogram = librosa.feature.melspectrogram(
# #         y=audio_array,
# #         sr=16000,
# #         n_mels=80,
# #         hop_length=160,
# #         n_fft=400
# #     )
# #     mel_spectrogram_db = librosa.power_to_db(mel_spectrogram).astype(np.float32)

# #     # Whisper expects shape [batch_size, num_mel_bins, num_frames]
# #     mel_spectrogram_db_expanded = np.expand_dims(mel_spectrogram_db, axis=0)

# #     # Encoder inference
# #     encoder_inputs = {encoder_session.get_inputs()[0].name: mel_spectrogram_db_expanded}
# #     encoder_output = encoder_session.run(None, encoder_inputs)[0]

# #     # Decoder inference (simplified; actual Whisper decoder might need additional inputs)
# #     decoder_inputs = {decoder_session.get_inputs()[0].name: encoder_output}
# #     decoder_output = decoder_session.run(None, decoder_inputs)[0]

# #     # Convert decoder output tokens into text (simplified decoding)
# #     transcription_tokens = [chr(int(c)) for c in decoder_output.flatten() if c > 0]
# #     transcription = "".join(transcription_tokens).strip()

# #     print("✅ Transcription Result:", transcription)  # <-- Logging transcription result

# #     return transcription

# # @app.websocket("/transcribe")
# # async def websocket_transcription(websocket: WebSocket):
# #     await websocket.accept()
# #     print("✅ Client Connected for Transcription")

# #     try:
# #         while True:
# #             audio_data = await websocket.receive_bytes()

# #             # Fix for buffer alignment error:
# #             if len(audio_data) % 2 != 0:
# #                 audio_data = audio_data[:-1]  # Remove last byte if odd length

# #             transcription = await transcribe_audio(audio_data)
# #             await websocket.send_text(json.dumps({"transcription": transcription}))

# #     except Exception as e:
# #         print(f"❌ Error during transcription: {e}")

# # @app.get("/")
# # def root():
# #     return {"message": "Meeting Transcription Backend Running"}

# # if __name__ == "__main__":
# #     import uvicorn
# #     uvicorn.run(app, host="0.0.0.0", port=8000)



# import numpy as np
# import librosa
# import onnxruntime as ort
# from fastapi import FastAPI, WebSocket
# import json

# # Load Whisper ONNX models
# encoder_path = "./whisper_base_en-whisperencoder.onnx"
# decoder_path = "./whisper_base_en-whisperdecoder.onnx"

# encoder_session = ort.InferenceSession(encoder_path)
# decoder_session = ort.InferenceSession(decoder_path)

# print("✅ Whisper ONNX Encoder & Decoder Loaded Successfully!")

# app = FastAPI()

# # Constants for Whisper preprocessing
# EXPECTED_NUM_FRAMES = 3000  # Fixed number of frames required by the model
# NUM_MEL_BINS = 80          # Number of Mel filter banks

# def preprocess_audio(audio_data):
#     """Convert raw PCM audio to a fixed-size Mel spectrogram."""
#     # Convert raw PCM bytes to numpy array
#     audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

#     # Ensure mono channel (if stereo)
#     if len(audio_array.shape) > 1:
#         audio_array = np.mean(audio_array, axis=1)

#     # Generate Mel spectrogram
#     mel_spectrogram = librosa.feature.melspectrogram(
#         y=audio_array,
#         sr=16000,
#         n_fft=400,
#         hop_length=160,
#         n_mels=NUM_MEL_BINS
#     )
    
#     # Convert to log scale (dB)
#     mel_spectrogram_db = librosa.power_to_db(mel_spectrogram).astype(np.float32)

#     # Pad or truncate to ensure fixed size [NUM_MEL_BINS, EXPECTED_NUM_FRAMES]
#     if mel_spectrogram_db.shape[1] < EXPECTED_NUM_FRAMES:
#         # Pad with zeros if not enough frames
#         padding = EXPECTED_NUM_FRAMES - mel_spectrogram_db.shape[1]
#         mel_spectrogram_db = np.pad(mel_spectrogram_db, ((0, 0), (0, padding)), mode="constant")
#     else:
#         # Truncate if too many frames
#         mel_spectrogram_db = mel_spectrogram_db[:, :EXPECTED_NUM_FRAMES]

#     # Add batch dimension to match model input shape [1, NUM_MEL_BINS, EXPECTED_NUM_FRAMES]
#     mel_spectrogram_db = np.expand_dims(mel_spectrogram_db, axis=0)

#     return mel_spectrogram_db

# # async def transcribe_audio(audio_data):
# #     """Run Whisper ONNX models to transcribe audio."""
# #     # Preprocess audio into fixed-size Mel spectrogram
# #     mel_input = preprocess_audio(audio_data)

# #     # Run encoder model
# #     encoder_inputs = {encoder_session.get_inputs()[0].name: mel_input}
# #     encoder_output = encoder_session.run(None, encoder_inputs)[0]

# #     # Run decoder model (simplified; actual implementation may vary)
# #     decoder_inputs = {decoder_session.get_inputs()[0].name: encoder_output}
# #     decoder_output = decoder_session.run(None, decoder_inputs)[0]

# #     # Convert output tokens to text (simplified decoding logic)
# #     transcription_tokens = [chr(int(c)) for c in decoder_output.flatten() if c > 0]
# #     transcription = "".join(transcription_tokens).strip()

# #     print("✅ Transcription Result:", transcription)  # Log transcription result

# #     return transcription

# async def transcribe_audio(audio_data):
#     """Run Whisper ONNX models to transcribe audio."""
#     try:
#         # Debugging logs
#         print(f"🔍 Raw audio data length: {len(audio_data)} bytes")
        
#         # Ensure buffer size is valid
#         if len(audio_data) % 2 != 0:
#             print("⚠️ Buffer size not divisible by 2. Adjusting...")
#             audio_data = audio_data[:-1]

#         # Convert raw PCM bytes to numpy array
#         audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
        
#         # Log shape and type of numpy array
#         print(f"🔍 Converted audio array shape: {audio_array.shape}")
#         print(f"🔍 Audio array dtype: {audio_array.dtype}")

#         # Preprocess and run ONNX models (as before)
#         mel_input = preprocess_audio(audio_array)
#         encoder_inputs = {encoder_session.get_inputs()[0].name: mel_input}
#         encoder_output = encoder_session.run(None, encoder_inputs)[0]

#         decoder_inputs = {decoder_session.get_inputs()[0].name: encoder_output}
#         decoder_output = decoder_session.run(None, decoder_inputs)[0]

#         transcription_tokens = [chr(int(c)) for c in decoder_output.flatten() if c > 0]
#         transcription = "".join(transcription_tokens).strip()

#         print("✅ Transcription Result:", transcription)
#         return transcription

#     except Exception as e:
#         print(f"❌ Error during transcribe_audio: {e}")
#         raise e

# # @app.websocket("/transcribe")
# # async def websocket_transcription(websocket: WebSocket):
# #     """WebSocket endpoint for real-time transcription."""
# #     await websocket.accept()
# #     print("✅ Client Connected for Transcription")

# #     try:
# #         while True:
# #             audio_data = await websocket.receive_bytes()
# #             transcription = await transcribe_audio(audio_data)
# #             await websocket.send_text(json.dumps({"transcription": transcription}))
    
# #     except Exception as e:
# #         print(f"❌ Error during transcription: {e}")

# @app.websocket("/transcribe")
# async def websocket_transcription(websocket: WebSocket):
#     """WebSocket endpoint for real-time transcription."""
#     await websocket.accept()
#     print("✅ Client Connected for Transcription")

#     try:
#         while True:
#             audio_data = await websocket.receive_bytes()

#             # Debugging logs
#             print(f"🔍 Received audio data of length: {len(audio_data)} bytes")
#             print(f"🔍 Data type: {type(audio_data)}")

#             # Check if buffer size is valid
#             if len(audio_data) % 2 != 0:
#                 print("⚠️ Buffer size not divisible by 2. Adjusting...")
#                 audio_data = audio_data[:-1]  # Trim last byte if odd length

#             transcription = await transcribe_audio(audio_data)
#             await websocket.send_text(json.dumps({"transcription": transcription}))
    
#     except Exception as e:
#         print(f"❌ Error during transcription: {e}")

# @app.get("/")
# def root():
#     return {"message": "Meeting Transcription Backend Running"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)

import numpy as np
import librosa
import onnxruntime as ort
from fastapi import FastAPI, WebSocket
import json

# Load Whisper ONNX models
encoder_path = "./whisper_base_en-whisperencoder.onnx"
decoder_path = "./whisper_base_en-whisperdecoder.onnx"

encoder_session = ort.InferenceSession(encoder_path)
decoder_session = ort.InferenceSession(decoder_path)

print("✅ Whisper ONNX Encoder & Decoder Loaded Successfully!")

app = FastAPI()

# Constants for Whisper preprocessing
EXPECTED_NUM_FRAMES = 3000  # Fixed number of frames required by the model
NUM_MEL_BINS = 80          # Number of Mel filter banks

def preprocess_audio(audio_data):
    """Convert raw PCM audio to a fixed-size Mel spectrogram."""
    audio_array = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

    # Ensure mono channel (if stereo)
    if len(audio_array.shape) > 1:
        audio_array = np.mean(audio_array, axis=1)

    # Pad short signals
    min_signal_length = 400  # Minimum required for n_fft=400
    if len(audio_array) < min_signal_length:
        padding = min_signal_length - len(audio_array)
        audio_array = np.pad(audio_array, (0, padding), mode="constant")
    
    # Generate Mel spectrogram
    mel_spectrogram = librosa.feature.melspectrogram(
        y=audio_array,
        sr=16000,
        n_fft=min(len(audio_array), 400),  # Adjust n_fft dynamically
        hop_length=160,
        n_mels=80
    )
    
    # Convert to log scale (dB)
    mel_spectrogram_db = librosa.power_to_db(mel_spectrogram).astype(np.float32)

    # Pad or truncate to ensure fixed size [80, 3000]
    EXPECTED_NUM_FRAMES = 3000
    if mel_spectrogram_db.shape[1] < EXPECTED_NUM_FRAMES:
        padding = EXPECTED_NUM_FRAMES - mel_spectrogram_db.shape[1]
        mel_spectrogram_db = np.pad(mel_spectrogram_db, ((0, 0), (0, padding)), mode="constant")
    else:
        mel_spectrogram_db = mel_spectrogram_db[:, :EXPECTED_NUM_FRAMES]

    # Add batch dimension to match model input shape [1, 80, 3000]
    mel_spectrogram_db = np.expand_dims(mel_spectrogram_db, axis=0)

    return mel_spectrogram_db

def initialize_decoder_caches():
    """Initialize decoder cache tensors with correct shapes."""
    batch_size = 6      # From decoder input specs
    num_heads = 8       # Number of attention heads
    head_dim = 64       # Dimension per attention head

    # Cross-attention caches
    num_frames_cross = 1500
    k_cache_cross = np.zeros((batch_size, num_heads, head_dim, num_frames_cross), dtype=np.float32)
    v_cache_cross = np.zeros((batch_size, num_heads, num_frames_cross, head_dim), dtype=np.float32)

    # Self-attention caches
    num_frames_self = 224
    k_cache_self = np.zeros((batch_size, num_heads, head_dim, num_frames_self), dtype=np.float32)
    v_cache_self = np.zeros((batch_size, num_heads, num_frames_self, head_dim), dtype=np.float32)

    return k_cache_cross, v_cache_cross, k_cache_self, v_cache_self


async def transcribe_audio(audio_data):
    """Run Whisper ONNX models to transcribe audio."""
    try:
        # Preprocess audio into fixed-size Mel spectrogram
        mel_input = preprocess_audio(audio_data)

        # Run encoder model
        encoder_inputs = {encoder_session.get_inputs()[0].name: mel_input}
        encoder_output = encoder_session.run(None, encoder_inputs)[0]

        # Initialize decoder caches
        k_cache_cross, v_cache_cross, k_cache_self, v_cache_self = initialize_decoder_caches()

        # Prepare decoder inputs
        index = np.array([[0]], dtype=np.int32)   # Start decoding at index=0
        x = np.array([[0]], dtype=np.int32)      # Initial token input

        decoder_inputs = {
            "x": x,
            "index": index,
            "k_cache_cross": k_cache_cross,
            "v_cache_cross": v_cache_cross,
            "k_cache_self": k_cache_self,
            "v_cache_self": v_cache_self,
        }

        # Run decoder model
        decoder_output = decoder_session.run(None, decoder_inputs)[0]

        # Convert output tokens to text
        transcription_tokens = [chr(int(c)) for c in decoder_output.flatten() if c > 0]
        transcription = "".join(transcription_tokens).strip()

        # Filter gibberish using thresholds (if applicable)
        if len(transcription) < 5 or transcription.isnumeric():
            transcription = "[Unintelligible]"

        print("✅ Transcription Result:", transcription)
        return transcription

    except Exception as e:
        print(f"❌ Error during transcription: {e}")

@app.websocket("/transcribe")
async def websocket_transcription(websocket: WebSocket):
    await websocket.accept()
    print("✅ Client Connected for Transcription")

    try:
        while True:
            audio_data = await websocket.receive_bytes()

            # Log buffer details
            print(f"🔍 Received audio data of length: {len(audio_data)} bytes")

            # Ensure buffer size is divisible by 2
            if len(audio_data) % 2 != 0:
                print("⚠️ Buffer size not divisible by 2. Trimming...")
                audio_data = audio_data[:-1]

            transcription = await transcribe_audio(audio_data)
            await websocket.send_text(json.dumps({"transcription": transcription}))

    except Exception as e:
        print(f"❌ Error during transcription: {e}")

@app.get("/")
def root():
    return {"message": "Meeting Transcription Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
