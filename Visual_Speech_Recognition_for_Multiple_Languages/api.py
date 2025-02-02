import threading
import queue
import torch
import os
import tempfile

import hydra
from pipelines.pipeline import InferencePipeline
from flask import Flask, request, jsonify

# Create a global task queue.
task_queue = queue.Queue()

# Define the worker function.
def worker(worker_id, cfg):
    # Each thread creates its own pipeline instance.
    pipeline = InferencePipeline(cfg.config_filename, device=(
        torch.device(f"cuda:{cfg.gpu_idx}") if torch.cuda.is_available() and cfg.gpu_idx >= 0 else torch.device("cpu")
    ), detector=cfg.detector, face_track=True)

    if not callable(pipeline):
        print(f"Worker {worker_id}: The InferencePipeline instance is not callable. Please verify that it implements __call__ or use the correct method.")
        return

    while True:
        # Get a task from the queue (blocking).
        task = task_queue.get()
        # A task is expected to be a dict with at least the "file" key.
        audio_file = task.get("file")
        print(f"Worker {worker_id} processing audio file: {audio_file}")
        try:
            # Process the file (optionally with a landmarks file).
            transcription = pipeline(audio_file, cfg.landmarks_filename)
            # If the task was submitted via the Flask API, return the result via its result_queue.
            if "result_queue" in task:
                task["result_queue"].put(transcription)
            else:
                print(f"Worker {worker_id} transcription for {audio_file}: {transcription}")
        except Exception as e:
            error_msg = f"Worker {worker_id} error processing {audio_file}: {e}"
            if "result_queue" in task:
                task["result_queue"].put(error_msg)
            else:
                print(error_msg)
        finally:
            task_queue.task_done()

@hydra.main(version_base=None, config_path="hydra_configs", config_name="default")
def main(cfg):
    # For testing purposes, we use a fixed list of files.
    # (Adjust the list as needed. Note: these are still MP4 files; if you intend to run audio inference,
    #  make sure your pipeline supports audio inputs.)
    audio_files = []
    if not audio_files:
        print("No static audio files provided in configuration.")

    # Inform which device will be used.
    device = torch.device(f"cuda:{cfg.gpu_idx}" if torch.cuda.is_available() and cfg.gpu_idx >= 0 else "cpu")
    print(f"Running inference on device: {device}")

    # Start four worker threads.
    num_workers = 4
    threads = []
    for i in range(num_workers):
        t = threading.Thread(target=worker, args=(i+1, cfg), daemon=True)
        t.start()
        threads.append(t)

    # Enqueue static audio files for testing.
    for audio_file in audio_files:
        # Each task is a dict with at least a "file" key.
        task_queue.put({"file": audio_file})
    
    # Optionally, wait until the static tasks are processed before starting the API.
    # (If you want the API to be available immediately, you can remove or modify this join.)
    if audio_files:
        print("Processing static audio files...")
        task_queue.join()
        print("Static audio file processing complete.")

    # Create the Flask application.
    app = Flask(__name__)

    @app.route("/process", methods=["POST"])
    def process():
        """
        Expects a POST request with a file part (key "file") containing an .mp4 file.
        Saves the file to a temporary location, enqueues the task to the worker pool,
        and waits for the transcription result to return to the client.
        """
        if "file" not in request.files:
            return "No file part in the request.", 400
        file = request.files["file"]
        if file.filename == "":
            return "No file selected.", 400
        if not file.filename.lower().endswith(".mp4"):
            return "Only .mp4 files are allowed.", 400

        # Save the uploaded file to a temporary directory.
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, file.filename)
        file.save(temp_path)
        print(f"Received file {file.filename} and saved to {temp_path}")

        # Create a dedicated queue for retrieving the result from the worker.
        result_queue = queue.Queue()

        # Enqueue the task with the temporary file path and the result queue.
        task_queue.put({"file": temp_path, "result_queue": result_queue})

        try:
            # Wait for the result (with a timeout, e.g., 120 seconds).
            transcription = result_queue.get(timeout=120)
        except queue.Empty:
            transcription = "Error: Processing timed out."
        finally:
            # Clean up the temporary file.
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Error removing temporary file {temp_path}: {e}")
        return jsonify({"transcription": transcription})

    # Run the Flask app.
    app.run(host="0.0.0.0", port=5001)

if __name__ == "__main__":
    main()
