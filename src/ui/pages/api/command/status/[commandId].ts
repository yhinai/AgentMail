import type { NextApiRequest, NextApiResponse } from 'next';
import { getCommandStatus } from '../../../../lib/commandStore';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { commandId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get command status from shared store
    const command = getCommandStatus(commandId as string);

    if (!command) {
      return res.status(404).json({ 
        error: 'Command not found',
        commandId 
      });
    }

    res.status(200).json(command);
  } catch (error: any) {
    console.error('Command status API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get command status'
    });
  }
}
