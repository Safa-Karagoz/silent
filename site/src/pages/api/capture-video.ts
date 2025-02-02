// pages/api/capture-video.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the form data from the request
    const data = await req.body;
    
    // Log the capture details
    console.log('Received video capture:', {
      timestamp: new Date().toISOString(),
      size: data.length,
    });

    return res.status(200).json({ message: 'Capture received successfully' });
  } catch (error) {
    console.error('Error handling upload:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}