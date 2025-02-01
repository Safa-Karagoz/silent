import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }
        
        const data = await response.json();
        
        // The API returns an object with a voices array
        if (!data.voices || !Array.isArray(data.voices)) {
            throw new Error('Unexpected API response format');
        }

        const premadeVoices = data.voices.filter((voice: any) => voice.category === 'premade');
        res.status(200).json(premadeVoices);
    } catch (error: any) {
        console.error("Error fetching voices:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}