/**
 * Test Real Email Processing
 * Fetches your actual email from AgentMail and processes it
 */

import { AgentMailClient } from './src/services/AgentMailClient';
import { ResponseGenerator } from './src/services/ResponseGenerator';
import * as dotenv from 'dotenv';

dotenv.config();

async function testRealEmail() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📧 PROCESSING YOUR REAL EMAIL');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = new AgentMailClient();
  const generator = new ResponseGenerator();

  try {
    // Get inboxes
    console.log('📬 Fetching inboxes...');
    const inboxes = await client.listInboxes();

    if (inboxes.length === 0) {
      console.error('❌ No inboxes found');
      return;
    }

    const inbox = inboxes[0];
    console.log(`✅ Inbox: ${inbox.inbox_id}\n`);

    // Get messages
    console.log('📥 Fetching messages...');
    const messages = await client.listMessages(inbox.inbox_id, 10);

    console.log(`✅ Found ${messages.length} message(s)\n`);

    if (messages.length === 0) {
      console.log('ℹ️  No messages yet. Send an email to:', inbox.inbox_id);
      return;
    }

    // Get full message details
    const messagePreview = messages[0];
    console.log('📄 Fetching full message details...');

    const message = await client.getMessage(inbox.inbox_id, messagePreview.message_id);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📨 YOUR EMAIL:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`From: ${message.from}`);
    console.log(`To: ${message.to.join(', ')}`);
    console.log(`Subject: ${message.subject}`);
    console.log(`Body:\n${message.body || 'No body content'}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Analyze with basic detection (no JSON mode)
    console.log('🔍 Analyzing email...');

    const bodyText = message.body || message.subject || '';
    const bodyLower = bodyText.toLowerCase();
    let intent: 'inquiry' | 'offer' | 'negotiation' | 'closing' | 'complaint' | 'other' = 'inquiry';

    if (bodyLower.includes('offer') || bodyLower.includes('$')) {
      intent = 'offer';
    } else if (bodyLower.includes('interested') || bodyLower.includes('available')) {
      intent = 'inquiry';
    } else if (bodyLower.includes('buy') || bodyLower.includes('purchase')) {
      intent = 'closing';
    }

    const analysis = {
      intent,
      urgency: bodyLower.includes('urgent') || bodyLower.includes('asap') ? 'high' as const : 'medium' as const,
      sentiment: 'positive' as const,
      confidence: 0.8,
      keyPoints: [message.subject],
    };

    console.log('✅ Analysis complete:');
    console.log(`   Intent: ${analysis.intent}`);
    console.log(`   Urgency: ${analysis.urgency}`);
    console.log(`   Sentiment: ${analysis.sentiment}\n`);

    // Generate template response
    console.log('✍️  Generating response...');

    const context = {
      buyerEmail: message.from,
      product: 'iPhone 13',
      productCost: 600,
      targetPrice: 800,
      currentPrice: 800,
    };

    const response = generator.generateTemplateResponse(analysis, context);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📤 GENERATED RESPONSE:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Subject: ${response.subject}`);
    console.log(`\nBody:\n${response.body}`);
    console.log(`\nStrategy: ${response.strategy}`);
    console.log(`Tone: ${response.tone}`);
    console.log(`Should Send: ${response.shouldSend}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Ask if user wants to send
    console.log('💬 Would you like to send this response?');
    console.log('   To send: Update AUTO_RESPOND=true in .env and run again\n');

    console.log('✅ Test complete!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testRealEmail();
