import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import client from '@/lib/db/client';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

interface UserDocument {
  email: string;
  selectedVoiceId: string | null;
  selectedVoiceName: string | null;
  customVoiceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = client.db();

  // GET request handling
  if (req.method === 'GET') {
    try {
      const user = await db.collection('users').findOne({ 
        email: session.user.email 
      });

      if (user) {
        return res.status(200).json({
          voiceId: user.selectedVoiceId,
          voiceName: user.selectedVoiceName,
          customVoiceId: user.customVoiceId
        });
      }

      await db.collection('users').updateOne(
        { email: session.user.email },
        {
          $set: {
            selectedVoiceId: null,
            selectedVoiceName: null,
            customVoiceId: null,
            updatedAt: new Date()
          },
          $setOnInsert: {
            email: session.user.email,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      return res.status(200).json({
        voiceId: null,
        voiceName: null,
        customVoiceId: null
      });

    } catch (error) {
      console.error('Database operation failed:', error);
      return res.status(500).json({ error: 'Database operation failed' });
    }
  }

  // PUT request handling
  if (req.method === 'PUT') {
    try {
      const { voiceId, voiceName, customVoiceId } = req.body;

      // Update user document
      const updateFields: Partial<UserDocument> = {
        updatedAt: new Date()
      };

      if (voiceId !== undefined) updateFields.selectedVoiceId = voiceId;
      if (voiceName !== undefined) updateFields.selectedVoiceName = voiceName;
      if (customVoiceId !== undefined) updateFields.customVoiceId = customVoiceId;

      const result = await db.collection('users').updateOne(
        { email: session.user.email },
        {
          $set: updateFields,
          $setOnInsert: {
            email: session.user.email,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      if (!result.acknowledged) {
        return res.status(500).json({ error: 'Failed to update voice settings' });
      }

      return res.status(200).json({
        success: true,
        message: 'Voice settings updated successfully'
      });

    } catch (error) {
      console.error('Database operation failed:', error);
      return res.status(500).json({ error: 'Database operation failed' });
    }
  }

  // DELETE request handling for removing custom voice
  if (req.method === 'DELETE') {
    try {
      const result = await db.collection('users').updateOne(
        { email: session.user.email },
        {
          $set: {
            customVoiceId: null,
            updatedAt: new Date()
          }
        }
      );

      if (!result.acknowledged) {
        return res.status(500).json({ error: 'Failed to remove custom voice' });
      }

      return res.status(200).json({
        success: true,
        message: 'Custom voice removed successfully'
      });

    } catch (error) {
      console.error('Database operation failed:', error);
      return res.status(500).json({ error: 'Database operation failed' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
}