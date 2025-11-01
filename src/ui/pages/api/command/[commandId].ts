import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory store for command status (in production, use Redis or Convex)
const commandStore = new Map<string, any>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { commandId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get command status from store
    const command = commandStore.get(commandId as string);

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

// Export function to update command status
export function updateCommandStatus(commandId: string, update: any) {
  const existing = commandStore.get(commandId) || {};
  commandStore.set(commandId, { ...existing, ...update });
}
