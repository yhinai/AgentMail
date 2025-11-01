/**
 * API endpoint for email activity feed
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseClient } from '../../../../database/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = new DatabaseClient();
    const limit = parseInt(req.query.limit as string) || 50;

    // Get activity from Convex database
    const activity = await db.getRecentActivity(limit);

    // Calculate stats from activity
    const stats = {
      total: activity.length,
      pending: activity.filter((a: any) => a.type === 'received').length,
      processing: 0,
      completed: activity.filter((a: any) => a.type === 'analyzed').length,
      failed: activity.filter((a: any) => a.type === 'error').length,
    };

    return res.status(200).json({
      activity,
      stats,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error fetching email activity:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
