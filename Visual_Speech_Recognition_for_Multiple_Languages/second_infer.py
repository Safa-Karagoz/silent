import torch
import hydra
from pipelines.pipeline import InferencePipeline

@hydra.main(version_base=None, config_path="hydra_configs", config_name="default")
def main(cfg):
    # For testing purposes, we use a fixed list of files.
    # (Adjust the list as needed. Note: these are still MP4 files; if you intend to run audio inference,
    #  make sure your pipeline supports audio inputs.)
    audio_files = ["clip_1.mp4", "clip_2.mp4", "clip_3.mp4", "clip_4.mp4", "clip_5.mp4"]
    if not audio_files:
        print("No audio files provided in configuration.")
        return

    # Set up the inference device.
    device = torch.device(f"cuda:{cfg.gpu_idx}" if torch.cuda.is_available() and cfg.gpu_idx >= 0 else "cpu")
    print(f"Running inference on device: {device}")

    # Create an instance of the inference pipeline.
    pipeline = InferencePipeline(cfg.config_filename, device=device, detector=cfg.detector, face_track=True)

    # Check whether the pipeline instance is callable. This assumes that InferencePipeline is designed to be callable.
    if not callable(pipeline):
        print("Error: The InferencePipeline instance is not callable. Ensure that the class implements a __call__ method or use the correct inference method.")
        return

    # Loop over each file and run inference.
    for audio_file in audio_files:
        print(f"Processing audio file: {audio_file}")
        try:
            # Call the pipeline with the file path and (optionally) the landmarks file.
            transcription = pipeline(audio_file, cfg.landmarks_filename)
            print(f"Transcription for {audio_file}: {transcription}")
        except Exception as e:
            print(f"Error processing {audio_file}: {e}")

if __name__ == "__main__":
    main()
