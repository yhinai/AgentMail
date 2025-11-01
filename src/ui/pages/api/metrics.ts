import type { NextApiRequest, NextApiResponse } from 'next';
import type { Metrics } from '../../../types';
import { DatabaseClient } from '../../../database/client';
import { getEmailService } from '../../../services/EmailServiceSingleton';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Metrics | { error: string }>
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  try {
    // Try to get metrics from database
    const db = new DatabaseClient();
    const dbMetrics = await db.getMetrics();

    // Try to get email stats from email service
    let emailStats;
    try {
      const emailService = getEmailService();
      emailStats = await emailService.getQueueStats();
    } catch (e) {
      emailStats = { total: 0, completed: 0 };
    }

    // Merge both sources
    const metrics: Metrics = {
      ...dbMetrics,
      emailsProcessed: emailStats.total || dbMetrics.emailsProcessed || 0,
      conversionRate: emailStats.total > 0
        ? emailStats.completed / emailStats.total
        : dbMetrics.conversionRate || 0,
    };

    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);

    // Return zero metrics on error
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
