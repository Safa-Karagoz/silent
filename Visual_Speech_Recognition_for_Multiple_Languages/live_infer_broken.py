# live_infer.py
import cv2
import time
import torch
import hydra
from pipelines.pipeline import LiveInferencePipeline

if __name__ == "__main__":
    pipeline = LiveInferencePipeline(
        config_filename="hydra_configs/live_config.ini",  # You'll need to create this
        detector="mediapipe",
        device="cuda:0" if torch.cuda.is_available() else "cpu"
    )
    
    try:
        pipeline.run()
    except KeyboardInterrupt:
        pipeline.camera.stop()
        print("\nLive transcription stopped.")