import cv2
import time
import os
import threading
import queue
import os
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
import torch
import hydra
import tempfile

# Import your inference pipeline class.
from pipelines.pipeline import InferencePipeline

# Create a thread-safe queue for passing clip filenames and timestamps.
task_queue = queue.Queue()

def inference_worker(pipeline, cfg):
    """
    Worker thread that continuously takes a clip file (from the RAM disk) off the queue and runs inference.
    Each worker uses its own pipeline instance.
    """
    while True:
        clip_filename, timestamp = task_queue.get()
        try:
            # Run inference on the provided clip file.
            transcription = pipeline(clip_filename, cfg.landmarks_filename)
            print(f"Transcription for clip ending at {timestamp}: {transcription}")
        except Exception as e:
            print(f"Error processing {clip_filename}: {e}")
        finally:
            # Remove the temporary file.
            try:
                os.remove(clip_filename)
            except Exception:
                pass
            task_queue.task_done()

@hydra.main(version_base=None, config_path="hydra_configs", config_name="default")
def main(cfg):
    # Open the webcam (camera index 0).
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    # Lower the camera resolution to reduce processing overhead.
    # For example, set the resolution to 640x480.
    desired_width = 640
    desired_height = 480
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, desired_width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, desired_height)

    # Determine the camera's FPS; if unavailable, assume a fallback value.
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30

    # Clip parameters.
    clip_duration = 3       # seconds per clip
    overlap_duration = 2    # seconds between inferences
    num_frames_clip = int(clip_duration * fps)

    frames_buffer = []      # Buffer to store captured frames.
    last_infer_time = time.time()

    # Set up the inference device.
    device = torch.device(f"cuda:{cfg.gpu_idx}" if torch.cuda.is_available() and cfg.gpu_idx >= 0 else "cpu")

    # Create two pipeline instances, one for each worker thread.
    pipeline_worker1 = InferencePipeline(cfg.config_filename, device=device, detector=cfg.detector, face_track=True)
    pipeline_worker2 = InferencePipeline(cfg.config_filename, device=device, detector=cfg.detector, face_track=True)

    # Start two worker threads.
    worker_thread1 = threading.Thread(target=inference_worker, args=(pipeline_worker1, cfg), daemon=True)
    worker_thread2 = threading.Thread(target=inference_worker, args=(pipeline_worker2, cfg), daemon=True)
    worker_thread1.start()
    worker_thread2.start()

    # Use a RAM disk if available; otherwise, fall back to the system's temporary directory.
    temp_dir = "/dev/shm" if os.path.exists("/dev/shm") else tempfile.gettempdir()

    print("Starting live video capture. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Warning: Failed to capture frame.")
            break

        # Add the new frame to the buffer.
        frames_buffer.append(frame)
        if len(frames_buffer) > num_frames_clip:
            frames_buffer = frames_buffer[-num_frames_clip:]

        current_time = time.time()
        # When enough time has passed and a full clip is available, write it to the RAM disk.
        if current_time - last_infer_time >= overlap_duration and len(frames_buffer) == num_frames_clip:
            # Generate a unique temporary filename using a high-resolution timestamp.
            tmp_filename = os.path.join(temp_dir, f"live_clip_{int(current_time*1000)}.mp4")
            height, width, _ = frames_buffer[0].shape
            # Use an appropriate codec (here: mp4v).
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(tmp_filename, fourcc, fps, (width, height))
            for f in frames_buffer:
                out.write(f)
            out.release()

            # Put the filename and a timestamp on the task queue.
            timestamp_str = time.strftime("%H:%M:%S", time.localtime(current_time))
            task_queue.put((tmp_filename, timestamp_str))
            last_infer_time = current_time

            # Optionally, clear the buffer to avoid overlapping clips.
            frames_buffer = []

        # (Optional) Show the live feed.
        cv2.imshow("Live Video", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Wait for any pending inference tasks to complete.
    task_queue.join()
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
