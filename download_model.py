import os
import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import onnx
from onnxruntime.transformers.float16 import convert_float_to_float16

def download_and_convert_model():
    print("Downloading Whisper model...")
    model_name = "openai/whisper-base"
    processor = WhisperProcessor.from_pretrained(model_name)
    model = WhisperForConditionalGeneration.from_pretrained(model_name)
    
    # 创建模型目录
    os.makedirs("models", exist_ok=True)
    
    # 保存处理器
    processor.save_pretrained("models")
    
    # 准备示例输入
    dummy_input = torch.randn(1, 80, 3000)  # 示例输入大小
    
    # 导出编码器
    print("Exporting encoder...")
    encoder = model.get_encoder()
    torch.onnx.export(
        encoder,
        dummy_input,
        "models/whisper_base_en-whisperencoder.onnx",
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size", 2: "sequence_length"},
            "output": {0: "batch_size", 1: "sequence_length"}
        }
    )
    
    # 导出解码器
    print("Exporting decoder...")
    decoder = model.get_decoder()
    decoder_dummy_input = torch.randint(0, 50000, (1, 1))  # 示例输入
    torch.onnx.export(
        decoder,
        decoder_dummy_input,
        "models/whisper_base_en-whisperdecoder.onnx",
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size", 1: "sequence_length"},
            "output": {0: "batch_size", 1: "sequence_length"}
        }
    )
    
    print("Model conversion completed!")

if __name__ == "__main__":
    download_and_convert_model() 