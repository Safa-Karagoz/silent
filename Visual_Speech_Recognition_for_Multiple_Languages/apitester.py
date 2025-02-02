import os
import requests

# The URL of your API endpoint.
API_URL = "http://127.0.0.1:5001/process"

# List of clip filenames you want to send.
clip_filenames = [f"clip_{i}.mp4" for i in range(1, 6)]

def send_clip(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    # Open the file in binary mode and send it as a file in the POST request.
    with open(file_path, "rb") as file_data:
        files = {'file': (os.path.basename(file_path), file_data, 'video/mp4')}
        try:
            response = requests.post(API_URL, files=files)
            response.raise_for_status()  # Raises an error for bad responses.
            result = response.json()
            print(f"Response for {file_path}: {result}")
        except requests.exceptions.RequestException as e:
            print(f"Error sending {file_path}: {e}")

def main():
    for clip in clip_filenames:
        send_clip(clip)

if __name__ == "__main__":
    main()
