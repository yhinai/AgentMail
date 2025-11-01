import { Product, EmailMessage, DemoScenario, DemoStep } from '../types';

export const demoProducts: Product[] = [
  {
    id: 'demo_1',
    title: 'MacBook Pro 14" M2 - 16GB RAM, 512GB SSD',
    description:
      'Excellent condition MacBook Pro. Lightly used, all original accessories included. Perfect for work or creative projects.',
    price: 0, // Will be calculated by market agent
    cost: 1200,
    category: 'Electronics',
    condition: 'like-new',
    createdAt: new Date(),
  },
  {
    id: 'demo_2',
    title: 'Sony WH-1000XM5 Noise Canceling Headphones',
    description:
      'Premium wireless headphones with industry-leading noise cancellation. Includes charging cable and original box.',
    price: 0,
    cost: 200,
    category: 'Electronics',
    condition: 'used',
    createdAt: new Date(),
  },
  {
    id: 'demo_3',
    title: 'Canon EOS R6 Camera Body - Excellent Condition',
    description:
      'Professional mirrorless camera. Low shutter count, well maintained. Perfect for photography enthusiasts.',
    price: 0,
    cost: 1500,
    category: 'Electronics',
    condition: 'like-new',
    createdAt: new Date(),
  },
];

export const demoEmails: EmailMessage[] = [
  {
    id: 'email_1',
    from: 'buyer1@example.com',
    to: 'seller@profitpilot.com',
    subject: 'Interested in MacBook Pro',
    body: 'Hi, I saw your listing for the MacBook Pro. Is it still available? What\'s your best price? Thanks!',
    receivedAt: new Date(),
    isRead: false,
  },
  {
    id: 'email_2',
    from: 'buyer2@example.com',
    to: 'seller@profitpilot.com',
    subject: 'MacBook Pro - Offer',
    body: 'Hi, I can offer $1400 for the MacBook Pro. Let me know if that works!',
    receivedAt: new Date(Date.now() + 5000),
    isRead: false,
  },
  {
    id: 'email_3',
    from: 'buyer3@example.com',
    to: 'seller@profitpilot.com',
    subject: 'Sony Headphones',
    body: 'Are the Sony headphones still available? Would you take $220?',
    receivedAt: new Date(Date.now() + 10000),
    isRead: false,
  },
];

export const demoScenarios: DemoScenario[] = [
  {
    id: 'full_demo',
    name: 'Full ProfitPilot Demo',
    description: 'Complete end-to-end demonstration of ProfitPilot capabilities',
    duration: 300, // 5 minutes
    steps: [
      {
        id: 'step_1',
        action: 'load_inventory',
        description: 'Load demo inventory products',
        delay: 1000,
        data: { products: demoProducts },
      },
      {
        id: 'step_2',
        action: 'market_analysis',
        description: 'Analyze market prices for products',
        delay: 2000,
        data: {},
      },
      {
        id: 'step_3',
        action: 'create_listings',
        description: 'Create listings on multiple platforms',
        delay: 3000,
        data: {},
      },
      {
        id: 'step_4',
        action: 'receive_email',
        description: 'Simulate buyer inquiry email',
        delay: 2000,
        data: { email: demoEmails[0] },
      },
      {
        id: 'step_5',
        action: 'process_email',
        description: 'Process and respond to email',
        delay: 3000,
        data: {},
      },
      {
        id: 'step_6',
        action: 'receive_offer',
        description: 'Receive buyer counter-offer',
        delay: 2000,
        data: { email: demoEmails[1] },
      },
      {
        id: 'step_7',
        action: 'negotiate',
        description: 'Handle negotiation',
        delay: 3000,
        data: {},
      },
      {
        id: 'step_8',
        action: 'close_deal',
        description: 'Close deal successfully',
        delay: 2000,
        data: {},
      },
      {
        id: 'step_9',
        action: 'show_metrics',
        description: 'Display final metrics',
        delay: 1000,
        data: {},
      },
    ],
  },
  {
    id: 'quick_demo',
    name: 'Quick Demo',
    description: 'Quick 2-minute demo',
    duration: 120,
    steps: [
      {
        id: 'quick_1',
        action: 'load_inventory',
        description: 'Load products',
        delay: 500,
        data: { products: demoProducts.slice(0, 2) },
      },
      {
        id: 'quick_2',
        action: 'create_listings',
        description: 'Create listings',
        delay: 2000,
        data: {},
      },
      {
        id: 'quick_3',
        action: 'receive_email',
        description: 'Process inquiry',
        delay: 2000,
        data: { email: demoEmails[0] },
      },
      {
        id: 'quick_4',
        action: 'close_deal',
        description: 'Close deal',
        delay: 2000,
        data: {},
      },
    ],
  },
];

