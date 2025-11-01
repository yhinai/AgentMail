import type { NextApiRequest, NextApiResponse } from 'next';
import type { Metrics } from '../../../types';
import { getEmailService } from '../../../services/EmailServiceSingleton';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Metrics>
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    // Get real email service data
    const emailService = getEmailService();
    const stats = emailService.getQueueStats();

    // Return metrics with real email data
    const metrics: Metrics = {
      dealsCompleted: 0,
      totalProfit: 0,
      totalRevenue: 0,
      conversionRate: stats.total > 0 ? stats.completed / stats.total : 0,
      averageResponseTime: 30,
      averageNegotiationRounds: 0,
      activeListings: 0,
      emailsProcessed: stats.total,
      lastUpdated: new Date(),
    };

    res.status(200).json(metrics);
  } catch (error: any) {
    // Fallback to mock data if email service not initialized
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
