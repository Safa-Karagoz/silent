import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFiles: 2,
      maxFileSize: 25 * 1024 * 1024, // 25MB max file size
      allowEmptyFiles: false,
      filter: (part) => {
        return part.mimetype?.includes('audio/') || false
      }
    })

    // Parse the form
    const [fields, files] = await form.parse(req)
    const audioFiles = files.files

    if (!audioFiles || audioFiles.length === 0) {
      return res.status(400).json({ error: 'No audio files provided' })
    }

    // Prepare the form data for ElevenLabs
    const formData = new FormData()
    formData.append('name', 'Voice Sample')
    formData.append('description', 'Voice samples for voice cloning')
    formData.append('labels', '{}')
    formData.append('remove_background_noise', 'false')

    // Add each audio file to the form data
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i]
      const fileBuffer = await fs.promises.readFile(file.filepath)
      const blob = new Blob([fileBuffer], { type: file.mimetype || 'audio/webm' })
      formData.append('files', blob, `sample${i + 1}.webm`)
    }

    // Make request to ElevenLabs API
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: formData,
    })

    if (!elevenLabsResponse.ok) {
      const errorData = await elevenLabsResponse.json()
      throw new Error(`ElevenLabs API error: ${JSON.stringify(errorData)}`)
    }

    const data = await elevenLabsResponse.json()

    // Clean up temporary files
    await Promise.all(
      audioFiles.map((file: { filepath: fs.PathLike }) => fs.promises.unlink(file.filepath))
    )
    console.log('Voice upload processed:', data)
    return res.status(200).json(data)

  } catch (error) {
    console.error('Error processing voice upload:', error)
    return res.status(500).json({ 
      error: 'Failed to process voice upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}