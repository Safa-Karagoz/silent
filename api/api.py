import threading
import queue
import torch
import os
import tempfile
import subprocess

import hydra
from pipelines.pipeline import InferencePipeline
from flask import Flask, request, jsonify
from flask_cors import CORS

task_queue = queue.Queue()
app = Flask(__name__)
CORS(app, resources={r"/process": {"origins": ["http://localhost:3000"]}})

def worker(worker_id, cfg):
    pipeline = InferencePipeline(
        cfg.config_filename,
        device=(
            torch.device(f"cuda:{cfg.gpu_idx}")
            if torch.cuda.is_available() and cfg.gpu_idx >= 0
            else torch.device("cpu")
        ),
        detector=cfg.detector,
        face_track=True,
    )
    if not callable(pipeline):
        print(f"Worker {worker_id}: InferencePipeline is not callable.")
        return
    while True:
        task = task_queue.get()
        file_path = task.get("file")
        print(f"Worker {worker_id} processing file: {file_path}")
        try:
            transcription = pipeline(file_path, cfg.landmarks_filename)
            if "result_queue" in task:
                task["result_queue"].put(transcription)
            else:
                print(f"Worker {worker_id} transcription for {file_path}: {transcription}")
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            error_msg = f"Worker {worker_id} error processing {file_path}:\n{error_details}"
            if "result_queue" in task:
                task["result_queue"].put(error_msg)
            else:
                print(error_msg)
        finally:
            task_queue.task_done()

@app.route("/process", methods=["POST"])
def process():
    try:
        # Step 1: Handle file input
        if "file" in request.files:
            file_storage = request.files["file"]
            raw_data = file_storage.read()
            filename = file_storage.filename
            print(f"Received file upload: {filename}")
        else:
            raw_data = request.get_data()
            filename = request.headers.get("X-Filename")
            if not filename:
                filename = f"upload_{int(os.times()[4])}.webm"
            print(f"Received raw data with filename: {filename}")
            
        # Step 2: Validate input
        if not raw_data:
            print("No data received in request")
            return jsonify({"error": "No data received"}), 400
            
        if not (filename.lower().endswith(".mp4") or filename.lower().endswith(".webm")):
            print(f"Invalid file type: {filename}")
            return jsonify({"error": "Only .mp4 or .webm files are allowed"}), 400
            
        # Step 3: Save to temporary file
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        print(f"Saving to temporary path: {temp_path}")
        
        try:
            with open(temp_path, "wb") as f:
                f.write(raw_data)
            print(f"Successfully saved file of size: {len(raw_data)} bytes")
        except Exception as e:
            print(f"Error saving file: {str(e)}")
            return jsonify({"error": f"Error saving file: {e}"}), 500
            
        # Step 4: Prepare audio file
        audio_temp_path = temp_path + ".wav"
        print(f"Converting to WAV: {audio_temp_path}")
        
        # First check if the input has an audio stream
        probe_result = subprocess.run([
            "ffmpeg", "-i", temp_path
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Step 5: Handle audio conversion
        if "Stream #0:1" not in probe_result.stderr.decode():
            print("No audio stream detected, creating silent audio")
            result = subprocess.run([
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", "aevalsrc=0:d=3",  # Generate 3 seconds of silence
                "-acodec", "pcm_s16le",
                "-ar", "44100",
                "-ac", "2",
                audio_temp_path
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        else:
            print("Audio stream detected, extracting audio")
            result = subprocess.run([
                "ffmpeg", "-y", 
                "-i", temp_path,
                "-vn",  # No video
                "-acodec", "pcm_s16le",
                "-ar", "44100",
                "-ac", "2",
                audio_temp_path
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
        # Step 6: Check FFmpeg result
        if result.returncode != 0:
            err_output = result.stderr.decode("utf-8", errors="replace")
            print(f"FFmpeg conversion failed: {err_output}")
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Error removing temp file: {str(e)}")
            return jsonify({"error": f"Audio extraction failed: {err_output}"}), 500
            
        # Step 7: Process through inference pipeline
        print("Starting inference pipeline")
        result_queue = queue.Queue()
        task_queue.put({"file": audio_temp_path, "result_queue": result_queue})
        
        try:
            transcription = result_queue.get(timeout=120)
            print(f"Got transcription result: {transcription}")
        except queue.Empty:
            print("Processing timed out")
            transcription = "Error: Processing timed out."
        except Exception as e:
            print(f"Error during processing: {str(e)}")
            transcription = f"Error during processing: {str(e)}"
        finally:
            # Step 8: Cleanup temporary files
            for path in (temp_path, audio_temp_path):
                try:
                    os.remove(path)
                    print(f"Successfully removed temporary file: {path}")
                except Exception as e:
                    print(f"Error removing temporary file {path}: {e}")
                    
        # Step 9: Return result
        return jsonify({"transcription": transcription})
        
    except Exception as e:
        # Step 10: Global error handling
        import traceback
        print(f"Unexpected error in /process endpoint: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Server error: {str(e)}"}), 500
        
@hydra.main(version_base=None, config_path="hydra_configs", config_name="default")
def main(cfg):
    audio_files = []
    if not audio_files:
        print("No static audio files provided in configuration.")
    device = torch.device(f"cuda:{cfg.gpu_idx}" if torch.cuda.is_available() and cfg.gpu_idx >= 0 else torch.device("cpu"))
    print(f"Running inference on device: {device}")
    num_workers = 4
    threads = []
    for i in range(num_workers):
        t = threading.Thread(target=worker, args=(i+1, cfg), daemon=True)
        t.start()
        threads.append(t)
    for audio_file in audio_files:
        task_queue.put({"file": audio_file})
    if audio_files:
        print("Processing static audio files...")
        task_queue.join()
        print("Static audio file processing complete.")
    app.run(host="0.0.0.0", port=5001)

if __name__ == "__main__":
    main()
