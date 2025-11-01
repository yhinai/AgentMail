/**
 * Webhook endpoint for AgentMail email notifications
 * Receives incoming email events from AgentMail
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Import the email service (we'll make it a singleton)
import { getEmailService } from '../../../../services/EmailServiceSingleton';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📨 Webhook received:', JSON.stringify(req.body, null, 2));

    // Verify webhook secret (if configured)
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = req.headers['x-webhook-secret'];
      if (providedSecret !== webhookSecret) {
        console.warn('⚠️  Invalid webhook secret');
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const { event, data } = req.body;

    // Get email service instance
    const emailService = getEmailService();

    // Handle different event types
    switch (event) {
      case 'message.received':
        console.log('📬 New message received');
        const emailId = emailService.handleWebhookEmail(data);

        // Trigger processing (emit event that orchestrator can listen to)
        console.log(`✅ Email queued for processing: ${emailId}`);

        return res.status(200).json({
          success: true,
          emailId,
          message: 'Email queued for processing',
        });

      case 'message.sent':
        console.log('📤 Message sent confirmation');
        return res.status(200).json({ success: true });

      case 'message.delivered':
        console.log('✅ Message delivered');
        return res.status(200).json({ success: true });

      case 'message.bounced':
        console.warn('⚠️  Message bounced');
        return res.status(200).json({ success: true });

      case 'message.complained':
        console.warn('⚠️  Spam complaint received');
        return res.status(200).json({ success: true });

      default:
        console.log(`ℹ️  Unknown event type: ${event}`);
        return res.status(200).json({ success: true });
    }

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// Disable body parser for raw webhook data (if needed)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
