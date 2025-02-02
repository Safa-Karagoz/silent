import threading
import queue
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

    # Create a thread-safe queue and add the audio files.
    task_queue = queue.Queue()
    for audio_file in audio_files:
        task_queue.put(audio_file)

    # Define the worker function.
    def worker(worker_id):
        # Each thread gets its own pipeline instance.
        pipeline = InferencePipeline(cfg.config_filename, device=device, detector=cfg.detector, face_track=True)
        if not callable(pipeline):
            print(f"Worker {worker_id}: The InferencePipeline instance is not callable. Please verify that it implements __call__ or use the correct method.")
            return

        while True:
            try:
                # Try to get a file from the queue; if the queue is empty, break out.
                audio_file = task_queue.get(block=False)
            except queue.Empty:
                break  # No more items to process.

            print(f"Worker {worker_id} processing audio file: {audio_file}")
            try:
                # Call the pipeline with the file path and (optionally) the landmarks file.
                transcription = pipeline(audio_file, cfg.landmarks_filename)
                print(f"Worker {worker_id} transcription for {audio_file}: {transcription}")
            except Exception as e:
                print(f"Worker {worker_id} error processing {audio_file}: {e}")
            finally:
                task_queue.task_done()

    # Create and start four worker threads.
    num_workers = 4
    threads = []
    for i in range(num_workers):
        t = threading.Thread(target=worker, args=(i+1,), daemon=True)
        t.start()
        threads.append(t)

    # Wait until all tasks are processed.
    task_queue.join()

    # Optionally, wait for all threads to finish.
    for t in threads:
        t.join()

if __name__ == "__main__":
    main()
