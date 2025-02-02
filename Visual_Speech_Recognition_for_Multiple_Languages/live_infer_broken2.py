import cv2
import time
import os
import tempfile
import torch
import hydra

# Import your inference pipeline class.
from pipelines.pipeline import InferencePipeline

@hydra.main(version_base=None, config_path="hydra_configs", config_name="default")
def main(cfg):
    # Open the webcam (camera index 0).
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    # Determine the camera's FPS; if not available, assume 30.
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 10

    # Parameters for the sliding window clip
    clip_duration = 2       # seconds per clip (length of each video file)
    overlap_duration = 0     # seconds of overlap between successive clips
    num_frames_clip = int(clip_duration * fps)
    # We use overlap_duration to decide when to trigger a new inference.
    
    frames_buffer = []       # buffer to store the most recent frames
    last_infer_time = time.time()

    # === Setup the inference pipeline ===
    # (Make sure the config file and any other settings match your setup.)

    device = torch.device(f"cuda:{cfg.gpu_idx}" if torch.cuda.is_available() and cfg.gpu_idx >= 0 else "cpu")
    pipeline = InferencePipeline(cfg.config_filename, device=device, detector=cfg.detector, face_track=True)(cfg.data_filename, cfg.landmarks_filename)

    print("Starting live video capture. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Warning: Failed to capture frame.")
            break

        # Add the new frame to the buffer
        frames_buffer.append(frame)

        # If we have more than needed for one clip, trim the buffer to just the most recent clip
        if len(frames_buffer) > num_frames_clip:
            frames_buffer = frames_buffer[-num_frames_clip:]

        current_time = time.time()
        # Trigger inference every 'overlap_duration' seconds (if we have a full clip)
        if current_time - last_infer_time >= overlap_duration and len(frames_buffer) == num_frames_clip:
            # Write the buffered frames to a temporary video file
            tmp_filename = os.path.join(tempfile.gettempdir(), f"live_clip_{int(current_time)}.mp4")
            height, width, _ = frames_buffer[0].shape
            # Use an appropriate codec (here we use mp4v)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(tmp_filename, fourcc, fps, (width, height))

            for f in frames_buffer:
                out.write(f)
            out.release()

            # Call the inference pipeline.
            # Here we pass the temporary video filename. If your pipeline expects a landmarks file, you can pass None.
            transcription = InferencePipeline(cfg.config_filename, device=device, detector=cfg.detector, face_track=True)(tmp_filename, cfg.landmarks_filename)
            print(f"Transcription for clip ending at {time.strftime('%H:%M:%S')}: {transcription}")

            # Update the time for the next inference trigger.
            last_infer_time = current_time

        # (Optional) Show the live feed in a window.
        cv2.imshow("Live Video", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Clean up
    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
