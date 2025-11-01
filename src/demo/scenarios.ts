// Demo scenarios for ProfitPilot
import type { Product, EmailMessage } from '../types';
import { ProfitPilotOrchestrator } from '../workflows/orchestrator';

export interface DemoScenario {
  name: string;
  description: string;
  execute: (orchestrator: ProfitPilotOrchestrator) => Promise<void>;
}

export const demoProducts: Product[] = [
  {
    id: 'demo-1',
    title: 'iPhone 13 Pro Max 256GB - Excellent Condition',
    description: 'iPhone 13 Pro Max in excellent condition. Unlocked, works with all carriers. Includes original box and charger. No scratches, battery health 95%.',
    cost: 650,
    targetPrice: 799,
    category: 'Electronics',
    condition: 'like-new',
    images: ['https://example.com/iphone.jpg'],
    createdAt: new Date(),
  },
  {
    id: 'demo-2',
    title: 'Nintendo Switch OLED with 3 Games',
    description: 'Nintendo Switch OLED console with Super Mario Odyssey, Zelda Breath of the Wild, and Animal Crossing. Console is in perfect condition, lightly used. All games included.',
    cost: 280,
    targetPrice: 399,
    category: 'Gaming',
    condition: 'like-new',
    images: ['https://example.com/switch.jpg'],
    createdAt: new Date(),
  },
  {
    id: 'demo-3',
    title: 'Dyson V11 Cordless Vacuum - Refurbished',
    description: 'Dyson V11 Absolute cordless vacuum. Refurbished by Dyson, works perfectly. Includes all attachments and charging dock. Excellent suction power.',
    cost: 320,
    targetPrice: 449,
    category: 'Home & Garden',
    condition: 'refurbished',
    images: ['https://example.com/dyson.jpg'],
    createdAt: new Date(),
  },
];

export const demoEmails: EmailMessage[] = [
  {
    id: 'email-1',
    from: 'buyer1@example.com',
    to: 'seller@profitpilot.com',
    subject: 'Interested in iPhone 13 Pro Max',
    body: 'Hi, I saw your listing for the iPhone 13 Pro Max. Is it still available? What\'s the best price you can do?',
    timestamp: new Date(),
  },
  {
    id: 'email-2',
    from: 'buyer1@example.com',
    to: 'seller@profitpilot.com',
    subject: 'Re: Interested in iPhone 13 Pro Max',
    body: 'Would you take $700? That\'s my budget.',
    threadId: 'thread-1',
    timestamp: new Date(Date.now() + 60000),
  },
  {
    id: 'email-3',
    from: 'buyer2@example.com',
    to: 'seller@profitpilot.com',
    subject: 'Nintendo Switch - Still Available?',
    body: 'Hello! Is the Nintendo Switch still available? I\'m very interested!',
    timestamp: new Date(Date.now() + 120000),
  },
  {
    id: 'email-4',
    from: 'buyer3@example.com',
    to: 'seller@profitpilot.com',
    subject: 'Dyson V11 - Price Question',
    body: 'I see you have a Dyson V11 listed at $449. Would you consider $400?',
    timestamp: new Date(Date.now() + 180000),
  },
];

export const scenarios: DemoScenario[] = [
  {
    name: 'Load Inventory',
    description: 'Load 3 demo products ready to sell',
    execute: async (orchestrator: ProfitPilotOrchestrator) => {
      console.log('\n📦 Scenario 1: Loading Inventory');
      console.log('Loading 3 products...');
      
      for (const product of demoProducts) {
        console.log(`  ✓ ${product.title} - $${product.targetPrice}`);
      }
      
      console.log('✅ Inventory loaded successfully');
      await delay(1000);
    },
  },
  {
    name: 'Create Listings',
    description: 'Create listings on multiple platforms',
    execute: async (orchestrator: ProfitPilotOrchestrator) => {
      console.log('\n🌐 Scenario 2: Creating Listings');
      console.log('Creating listings on Craigslist, Facebook, and eBay...');
      
      for (const product of demoProducts) {
        await orchestrator.createListing(product);
        await delay(2000);
      }
      
      console.log('✅ Listings created on all platforms');
      await delay(1000);
    },
  },
  {
    name: 'Process Inquiry',
    description: 'Process incoming buyer inquiry',
    execute: async (orchestrator: ProfitPilotOrchestrator) => {
      console.log('\n📧 Scenario 3: Processing Inquiry');
      console.log('New email received from buyer...');
      
      const email = demoEmails[0];
      console.log(`  From: ${email.from}`);
      console.log(`  Subject: ${email.subject}`);
      
      await orchestrator.handleIncomingEmail(email);
      console.log('✅ Response sent automatically');
      await delay(2000);
    },
  },
  {
    name: 'Handle Negotiation',
    description: 'Multi-round negotiation',
    execute: async (orchestrator: ProfitPilotOrchestrator) => {
      console.log('\n🤝 Scenario 4: Handling Negotiation');
      console.log('Buyer counters with $700 (asking $799)...');
      
      await orchestrator.handleNegotiation(
        'thread-1',
        'buyer1@example.com',
        'iPhone 13 Pro Max 256GB - Excellent Condition',
        700
      );
      
      console.log('✅ Counter-offer sent: $750 with urgency bonus');
      await delay(2000);
    },
  },
  {
    name: 'Close Deal',
    description: 'Complete transaction',
    execute: async (orchestrator: ProfitPilotOrchestrator) => {
      console.log('\n✅ Scenario 5: Closing Deal');
      console.log('Buyer accepts offer...');
      
      // Simulate accepted negotiation
      const negotiation = await orchestrator['db'].createNegotiationState({
        buyerEmail: 'buyer1@example.com',
        product: 'iPhone 13 Pro Max 256GB - Excellent Condition',
        threadId: 'thread-1',
        currentPrice: 750,
        initialPrice: 799,
        minPrice: 650,
        rounds: 2,
        offers: [
          { price: 799, from: 'seller', timestamp: new Date() },
          { price: 700, from: 'buyer', timestamp: new Date() },
          { price: 750, from: 'seller', timestamp: new Date() },
        ],
        status: 'accepted',
        listingUrls: ['https://example.com/listing1'],
        agreedPrice: 750,
      });
      
      await orchestrator.closeDeal(negotiation);
      console.log('✅ Deal closed! Transaction completed.');
      console.log(`   Profit: $${750 - 650} = $100`);
      await delay(2000);
    },
  },
  {
    name: 'Show Metrics',
    description: 'Display real-time metrics',
    execute: async (orchestrator: ProfitPilotOrchestrator) => {
      console.log('\n📊 Scenario 6: Showing Metrics');
      
      const metrics = await orchestrator.getMetrics();
      
      console.log('  Deals Completed:', metrics.dealsCompleted);
      console.log('  Total Profit: $' + metrics.totalProfit.toFixed(2));
      console.log('  Total Revenue: $' + metrics.totalRevenue.toFixed(2));
      console.log('  Conversion Rate:', (metrics.conversionRate * 100).toFixed(1) + '%');
      console.log('  Emails Processed:', metrics.emailsProcessed);
      console.log('  Average Response Time:', metrics.averageResponseTime + 'ms');
      
      console.log('✅ Metrics displayed');
      await delay(1000);
    },
  },
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
