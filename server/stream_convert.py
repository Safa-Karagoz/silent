from elevenlabs import stream
from elevenlabs.client import ElevenLabs
import threading
import queue
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def text_input_worker(text_queue):
    """Worker function to get text input from user"""
    print("Start typing! (Press Ctrl+D or Ctrl+Z to stop)")
    try:
        while True:
            text = input()
            if text.strip():  # Only process non-empty lines
                text_queue.put(text)
    except (EOFError, KeyboardInterrupt):
        text_queue.put(None)  # Signal to stop

def process_text_to_speech(text_queue, client):
    """Process text from queue and convert to speech"""
    while True:
        text = text_queue.get()
        if text is None:  # Check for stop signal
            break
            
        try:
            audio_stream = client.text_to_speech.convert_as_stream(
                text=text,
                voice_id="JBFqnCBsd6RMkjVDRZzb",
                model_id="eleven_flash_v2_5"
            )
            
            # Stream the audio
            stream(audio_stream)
            
        except Exception as e:
            print(f"Error processing text: {e}")

def main():
    # Get API key from environment variables
    api_key = os.getenv('ELEVENLABS_API_KEY')
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not found in environment variables")
    
    # Initialize the ElevenLabs client
    client = ElevenLabs(api_key=api_key)
    
    # Create a queue for text input
    text_queue = queue.Queue()
    
    # Start the input thread
    input_thread = threading.Thread(
        target=text_input_worker, 
        args=(text_queue,)
    )
    input_thread.daemon = True
    input_thread.start()
    
    # Process the text-to-speech in the main thread
    process_text_to_speech(text_queue, client)

if __name__ == "__main__":
    main()