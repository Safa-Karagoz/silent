// pages/api/capture-video.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Configure formidable
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      filename: (_name, _ext, part) => {
        const timestamp = Date.now();
        return `chunk_${timestamp}.webm`;
      }
    });

    // Parse the form data
    const formData = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const files = formData as { files: formidable.Files };
    const videoFile = files.files.video?.[0];

    if (!videoFile) {
      console.error('No video file found in request');
      console.log('Files received:', files);
      return res.status(400).json({ error: 'Invalid video upload - no file found' });
    }

    // Log detailed file information
    console.log('File details:', {
      timestamp: new Date().toISOString(),
      filename: videoFile.originalFilename,
      newFilename: videoFile.newFilename,
      size: videoFile.size,
      type: videoFile.mimetype,
      filepath: videoFile.filepath
    });

    // Read and check file content
    const fileBuffer = fs.readFileSync(videoFile.filepath);
    console.log('File buffer size:', fileBuffer.length);
    console.log('First 50 bytes:', fileBuffer.slice(0, 50).toString('hex'));

    return res.status(200).json({ 
      message: 'Video chunk received and saved successfully',
      filename: videoFile.newFilename,
      size: videoFile.size
    });

  } catch (error) {
    console.error('Error handling upload:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return res.status(500).json({ 
      error: 'Error processing video upload',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}