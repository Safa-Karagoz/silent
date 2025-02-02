import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ElevenLabsClient } from 'elevenlabs';

// Initialize ElevenLabs client
const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Set headers for streaming audio
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Get the audio stream from ElevenLabs
    const audioStream = await client.textToSpeech.convertAsStream(voiceId, {
      text,
      model_id: 'eleven_multilingual_v2',
    });

    // Stream the audio data to the client
    for await (const chunk of audioStream) {
      // Check if the client is still connected
      if (res.writableEnded) {
        break;
      }
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    console.error('TTS Error:', error);
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: 'Text to speech conversion failed' });
    }
  }
}