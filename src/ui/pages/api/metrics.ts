import type { NextApiRequest, NextApiResponse } from 'next';
import type { Metrics } from '../../../types';
import { DatabaseClient } from '../../../database/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Metrics | { error: string }>
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  try {
    // Fetch real metrics from database
    const db = new DatabaseClient();
    const metrics = await db.getMetrics();
    
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    
    // Return zero metrics on error instead of mock data
    const metrics: Metrics = {
      dealsCompleted: 0,
      totalProfit: 0,
      totalRevenue: 0,
      conversionRate: 0,
      averageResponseTime: 0,
      averageNegotiationRounds: 0,
      activeListings: 0,
      emailsProcessed: 0,
      lastUpdated: new Date(),
    };
    
    res.status(200).json(metrics);
  }
}
