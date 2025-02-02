import cv2
import subprocess
import os
from datetime import datetime

def record_video(
    output_folder="videos",
    output_filename=None,
    fps=30.0,
    frame_size=(640, 480),
    show_preview=True
):
    """
    Record video from webcam and save it to a file.
    
    Args:
        output_folder (str): Folder to save the video
        output_filename (str): Name of output file (if None, generates timestamp-based name)
        fps (float): Frames per second for recording
        frame_size (tuple): Width and height of the video frame
        show_preview (bool): Whether to show preview window while recording
    
    Returns:
        str: Path to the recorded video file if successful, None otherwise
    """
    try:
        # [Previous recording code remains the same]
        # Create output folder if it doesn't exist
        os.makedirs(output_folder, exist_ok=True)
        
        # Generate filename with timestamp if not provided
        if output_filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"recording_{timestamp}.mp4"
        
        output_path = os.path.join(output_folder, output_filename)
        
        # Initialize video capture
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise RuntimeError(
                "Could not access webcam. "
                "Please check:\n"
                "1. Webcam is connected\n"
                "2. Camera permissions in System Settings\n"
                "3. No other application is using the webcam"
            )
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, frame_size[0])
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, frame_size[1])
        cap.set(cv2.CAP_PROP_FPS, fps)
        
        # Get actual frame size (might be different from requested)
        actual_frame_size = (
            int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        )
        
        # Initialize video writer with platform-specific codec
        if os.name == 'nt':  # Windows
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        else:  # macOS and Linux
            fourcc = cv2.VideoWriter_fourcc(*'avc1')  # H.264 codec
            
        out = cv2.VideoWriter(
            output_path,
            fourcc,
            fps,
            actual_frame_size,
            isColor=True
        )
        
        if not out.isOpened():
            raise RuntimeError("Failed to create video writer. Check codec compatibility.")
        
        print(f"Recording started. Press 'q' to stop.")
        print(f"Frame size: {actual_frame_size}")
        print(f"FPS: {fps}")
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                if frame_count == 0:
                    raise RuntimeError("Could not read frame from webcam.")
                break
                
            frame_count += 1
            out.write(frame)
            
            if show_preview:
                cv2.imshow("Recording (Press 'q' to stop)", frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
        
        # Clean up
        cap.release()
        out.release()
        cv2.destroyAllWindows()
        
        if frame_count == 0:
            raise RuntimeError("No frames were recorded.")
            
        print(f"\nRecording completed:")
        print(f"- Saved to: {output_path}")
        print(f"- Frames recorded: {frame_count}")
        print(f"- Duration: {frame_count/fps:.1f} seconds")
        
        return output_path
        
    except Exception as e:
        print(f"Error during recording: {str(e)}")
        # Clean up in case of error
        if 'cap' in locals():
            cap.release()
        if 'out' in locals():
            out.release()
        cv2.destroyAllWindows()
        return None

def run_inference(
    video_path,
    config_path="configs/LRS3_V_WER19.1.ini",
    detector="mediapipe"
):
    """
    Run inference on the recorded video file.
    
    Args:
        video_path (str): Path to the input video file
        config_path (str): Path to the configuration file
        detector (str): Name of the detector to use
    
    Returns:
        bool: True if inference completed successfully, False otherwise
    """
    try:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
            
        print(f"\nRunning inference on {video_path}")
        print(f"Using config: {config_path}")
        print(f"Detector: {detector}")
        
        # Construct the command as a single string
        command = f"python infer.py config_filename={config_path} data_filename={video_path} detector={detector}"
        
        print(f"Executing command: {command}")
        
        # Run the inference command with shell=True and without capturing output
        # This allows us to see real-time output
        result = subprocess.run(
            command,
            shell=True,
            text=True,
            check=False  # Don't raise exception on non-zero exit
        )
        
        if result.returncode != 0:
            print(f"\nInference failed with exit code: {result.returncode}")
            return False
            
        print("\nInference completed successfully!")
        return True
        
    except Exception as e:
        print(f"\nError running inference: {str(e)}")
        print("Full error details:", str(e.__class__.__name__), str(e))
        return False

if __name__ == "__main__":
    # Example usage with both recording and inference
    video_file = record_video(
        output_folder="recordings",
        fps=30.0,
        frame_size=(1280, 720),  # 720p
        show_preview=True
    )
    
    if video_file and os.path.exists(video_file):
        print(f"\nVideo file successfully created at: {video_file}")
        # Run inference on the recorded video
        success = run_inference(
            video_path=video_file,
            config_path="configs/LRS3_V_WER19.1.ini",
            detector="mediapipe"
        )
        if success:
            print("\nEntire pipeline completed successfully!")
        else:
            print("\nPipeline failed during inference step.")
            print("Please check that:")
            print("1. The infer.py script exists in the current directory")
            print("2. The config file exists at the specified path")
            print("3. All required dependencies are installed")
            print("4. You have the correct Python environment activated")
    else:
        print("\nPipeline failed during video recording step.")