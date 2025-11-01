import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(200).json({ parsed: null });
    }

    // Simple command parsing (in production, use OpenAI)
    const parsed = {
      budget: 0,
      quantity: 1,
      category: 'general',
      action: 'search'
    };

    // Extract numbers for budget
    const budgetMatch = command.match(/\$?(\d+)/);
    if (budgetMatch) {
      parsed.budget = parseInt(budgetMatch[1]);
    }

    // Extract quantity
    const quantityMatch = command.match(/(\d+)\s+(items?|products?|listings?)/i);
    if (quantityMatch) {
      parsed.quantity = parseInt(quantityMatch[1]);
    }

    // Detect action
    if (command.toLowerCase().includes('find') || command.toLowerCase().includes('search')) {
      parsed.action = 'search';
    } else if (command.toLowerCase().includes('buy') || command.toLowerCase().includes('purchase')) {
      parsed.action = 'buy';
    } else if (command.toLowerCase().includes('list') || command.toLowerCase().includes('sell')) {
      parsed.action = 'list';
    }

    // Detect category
    const categories = ['laptop', 'phone', 'camera', 'furniture', 'electronics', 'vehicle', 'collectible'];
    for (const cat of categories) {
      if (command.toLowerCase().includes(cat)) {
        parsed.category = cat;
        break;
      }
    }

    res.status(200).json({ parsed });
  } catch (error: any) {
    // Preview errors shouldn't block the UI
    res.status(200).json({ parsed: null });
  }
}
