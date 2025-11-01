import type { NextApiRequest, NextApiResponse } from 'next';
import type { Metrics } from '../../../types';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Metrics>
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  // In production, this would fetch from Convex
  // For demo, return mock metrics
  const metrics: Metrics = {
    dealsCompleted: 10,
    totalProfit: 2100.00,
    totalRevenue: 7500.00,
    conversionRate: 0.35,
    averageResponseTime: 8500,
    averageNegotiationRounds: 2.3,
    activeListings: 15,
    emailsProcessed: 50,
    lastUpdated: new Date(),
  };

  res.status(200).json(metrics);
}
