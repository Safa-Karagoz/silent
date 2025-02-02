import cv2
import time
import os

def main():
    # Open the webcam (device index 0).
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    # Set the desired resolution.
    desired_width = 640
    desired_height = 480
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, desired_width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, desired_height)

    # Get the FPS; if unavailable, fall back to 30.
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30
    print(f"Using FPS: {fps}")

    # Define clip duration (in seconds) and calculate number of frames per clip.
    clip_duration = 3  # seconds
    num_frames_clip = int(clip_duration * fps)
    print(f"Recording {num_frames_clip} frames per clip.")

    # Define codec and file format for output.
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')

    # Record 5 clips.
    for clip_num in range(1, 6):
        print(f"Recording clip {clip_num}...")
        frames = []
        # Capture frames until we have enough for a 3-second clip.
        while len(frames) < num_frames_clip:
            ret, frame = cap.read()
            if not ret:
                print("Warning: Failed to capture frame.")
                break
            frames.append(frame)
            # (Optional) Display the live feed.
            cv2.imshow("Live Feed", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        if len(frames) == 0:
            print("No frames captured; exiting.")
            break

        # Determine frame size from the captured frames.
        height, width, _ = frames[0].shape

        # Create an output filename.
        output_filename = f"clip_{clip_num}.mp4"
        # Initialize the video writer.
        out = cv2.VideoWriter(output_filename, fourcc, fps, (width, height))
        for f in frames:
            out.write(f)
        out.release()
        print(f"Clip {clip_num} saved as {output_filename}.")

        # Optional: Wait a short moment before recording the next clip.
        time.sleep(1)

        # Check if the user pressed 'q' to quit early.
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup: release resources.
    cap.release()
    cv2.destroyAllWindows()
    print("Recording complete.")

if __name__ == "__main__":
    main()
