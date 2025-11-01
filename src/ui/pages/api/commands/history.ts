import type { NextApiRequest, NextApiResponse } from 'next';
import { getCommandStatus } from '../command';

// Get all command IDs from the command store
const commandIds: string[] = [];

export function registerCommand(commandId: string) {
  if (!commandIds.includes(commandId)) {
    commandIds.push(commandId);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get active commands from store
    const activeCommands = commandIds
      .map(id => getCommandStatus(id))
      .filter(cmd => cmd !== undefined);

    // No mock commands - only show real command history
    const mockCommands: any[] = [];

    // Combine active and mock commands
    const allCommands = [...activeCommands, ...mockCommands];

    res.status(200).json({ commands: allCommands });
  } catch (error: any) {
    console.error('Command history API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch command history'
    });
  }
}
