import os
import queue
import threading
import tempfile
import torch
import hydra
from flask import Flask, request, jsonify
from pipelines.pipeline import InferencePipeline

# Global Flask app instance and task queue.
app = Flask(__name__)
task_queue = queue.Queue()

# This global will hold the Hydra configuration so that the Flask route can access it.
global_config = None

def worker(worker_id, cfg, device):
    """
    Worker function that creates its own InferencePipeline instance and 
    continuously processes tasks from the global task_queue.
    Each task is a tuple: (audio_file_path, landmarks_filename, result_queue).
    """
    pipeline = InferencePipeline(cfg.config_filename, device=device, detector=cfg.detector, face_track=True)
    if not callable(pipeline):
        print(f"Worker {worker_id}: The InferencePipeline instance is not callable. Please verify that it implements __call__ or use the correct method.")
        return

    while True:
        # Retrieve a task from the queue. (This call blocks until a task is available.)
        task = task_queue.get()
        if task is None:
            # A 'None' task is our shutdown signal.
            task_queue.task_done()
            break

        audio_file, landmarks_filename, result_queue = task
        print(f"Worker {worker_id} processing audio file: {audio_file}")

        try:
            transcription = pipeline(audio_file, landmarks_filename)
            result_queue.put({'status': 'success', 'transcription': transcription})
        except Exception as e:
            result_queue.put({'status': 'error', 'error': str(e)})
        finally:
            task_queue.task_done()

@app.route('/process', methods=['POST'])
def process():
    """
    Flask route that accepts a POST with an MP4 file.
    The file is saved in a temporary folder, a task is enqueued for a worker, and the result is returned.
    The temporary file is deleted after processing.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Create a temporary file in the system temporary directory.
        # Using NamedTemporaryFile with delete=False so we can pass its name to the worker.
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            file.save(temp_file)
            temp_path = temp_file.name
    except Exception as e:
        return jsonify({'error': f'Error saving temporary file: {str(e)}'}), 500

    # Create a per-request result queue.
    result_queue = queue.Queue()
    # Enqueue the task for processing.
    task_queue.put((temp_path, global_config.landmarks_filename, result_queue))

    # Wait (block) for the result from the worker.
    result = result_queue.get()

    # Delete the temporary file.
    try:
        os.remove(temp_path)
    except Exception as e:
        print(f"Warning: Could not delete temporary file {temp_path}. Error: {e}")

    if result.get('status') == 'success':
        return jsonify({'transcription': result.get('transcription')})
    else:
        return jsonify({'error': result.get('error')}), 500

@hydra.main(version_base=None, config_path="hydra_configs", config_name="default")
def main(cfg):
    """
    Hydra main function.
    Sets up the device, starts four worker threads, and launches the Flask web server.
    """
    global global_config
    global_config = cfg  # Make the config available to the Flask route.

    # Determine the inference device.
    device = torch.device(f"cuda:{cfg.gpu_idx}" if torch.cuda.is_available() and cfg.gpu_idx >= 0 else "cpu")
    print(f"Running inference on device: {device}")

    # Start four worker threads.
    num_workers = 4
    threads = []
    for i in range(num_workers):
        t = threading.Thread(target=worker, args=(i+1, cfg, device), daemon=True)
        t.start()
        threads.append(t)

    # Launch the Flask app. Adjust host/port as needed.
    # The 'threaded=True' option allows Flask to handle each request in a separate thread.
    app.run(host="0.0.0.0", port=5001, threaded=True)

    # (Optional) When the Flask app stops, send a shutdown signal to worker threads.
    for _ in range(num_workers):
        task_queue.put(None)
    for t in threads:
        t.join()

if __name__ == "__main__":
    main()