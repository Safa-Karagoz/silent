import os
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import threading
import queue
import torch
import asyncio
from typing import Dict
import uuid
from pipelines.pipeline import InferencePipeline
import hydra
from omegaconf import DictConfig

app = FastAPI()

# Global queues and results storage
task_queue = queue.Queue()
results: Dict[str, str] = {}
results_lock = threading.Lock()

def init_worker(cfg: DictConfig, worker_id: int):
    device = torch.device(f"cuda:{cfg.gpu_idx}" if torch.cuda.is_available() and cfg.gpu_idx >= 0 else "cpu")
    pipeline = InferencePipeline(cfg.config_filename, device=device, detector=cfg.detector, face_track=True)
    
    while True:
        try:
            task_id, file_path = task_queue.get(block=True)
            print(f"Worker {worker_id} processing file: {file_path}")
            
            try:
                transcription = pipeline(file_path, cfg.landmarks_filename)
                with results_lock:
                    results[task_id] = transcription
            except Exception as e:
                with results_lock:
                    results[task_id] = str(e)
            finally:
                # Cleanup temp file
                if os.path.exists(file_path):
                    os.remove(file_path)
                task_queue.task_done()
        except Exception as e:
            print(f"Worker {worker_id} error: {e}")

def start_workers(cfg: DictConfig, num_workers: int = 4):
    for i in range(num_workers):
        t = threading.Thread(
            target=init_worker,
            args=(cfg, i+1),
            daemon=True
        )
        t.start()

@app.on_event("startup")
async def startup_event():
    # Initialize Hydra config
    with hydra.initialize(version_base=None, config_path="hydra_configs"):
        cfg = hydra.compose(config_name="default")
        start_workers(cfg)

@app.post("/process")
async def process_audio(file: UploadFile):
    if not file.filename.endswith('.mp4'):
        raise HTTPException(400, "Only MP4 files are supported")
    
    # Generate unique ID and save file temporarily
    task_id = str(uuid.uuid4())
    temp_path = f"/tmp/{task_id}.mp4"
    
    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(500, f"Error saving file: {str(e)}")
    
    # Add to processing queue
    task_queue.put((task_id, temp_path))
    
    # Wait for results
    while True:
        with results_lock:
            if task_id in results:
                result = results.pop(task_id)
                return JSONResponse({"result": result})
        await asyncio.sleep(0.1)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)