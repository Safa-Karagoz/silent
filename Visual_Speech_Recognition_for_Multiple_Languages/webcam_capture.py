# webcam_capture.py
import cv2
import threading
from collections import deque

class WebcamStream:
    def __init__(self, src=0, buffer_size=30):
        self.stream = cv2.VideoCapture(src)
        # Set resolution directly on self.stream
        self.stream.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
        self.stream.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
        
        # Verify camera opened successfully
        if not self.stream.isOpened():
            raise RuntimeError("Could not open video source")
            
        self.grabbed, self.frame = self.stream.read()
        self.stopped = False
        self.buffer = deque(maxlen=buffer_size)
        self.lock = threading.Lock()
        self.thread = threading.Thread(target=self.update, daemon=True)
        self.thread.start()

    def update(self):
        while not self.stopped:
            grabbed, frame = self.stream.read()
            with self.lock:
                self.grabbed = grabbed
                if grabbed:
                    self.frame = frame
                    self.buffer.append(frame)

    def read(self):
        with self.lock:
            if self.grabbed:
                return True, self.frame.copy()
            return False, None

    def get_buffer(self):
        with self.lock:
            return list(self.buffer)

    def stop(self):
        self.stopped = True
        self.thread.join()
        self.stream.release()

    