// Command Parser - LLM-based natural language command parsing
import { OpenAIIntegration } from '../../integrations/OpenAIIntegration';

export interface ParsedCommand {
  budget: number;
  quantity: number;
  category: string;
  action: 'buy_and_resell' | 'find_only' | 'analyze_only';
  minProfitMargin?: number;
  platforms?: string[];
  location?: string;
  additionalFilters?: Record<string, any>;
}

export interface CommandParseResult {
  success: boolean;
  command?: ParsedCommand;
  error?: string;
  confidence?: number;
}

export class CommandParser {
  private openai: OpenAIIntegration;
  
  constructor(openai: OpenAIIntegration) {
    this.openai = openai;
  }
  
  async parseCommand(userInput: string): Promise<CommandParseResult> {
    try {
      const systemPrompt = `You are a command parser for an e-commerce arbitrage system. 
Parse natural language commands and extract structured parameters.

Commands typically involve:
- Budget (e.g., "$50", "50 dollars", "budget of 50")
- Quantity (e.g., "1 item", "buy 2 items", "one flippable item")
- Category (e.g., "electronics", "clothing", "home goods")
- Action (e.g., "buy and resell", "find items", "analyze opportunities")

Common action patterns:
- "buy X and resell" or "resell it" → action: "buy_and_resell"
- "find" or "show" → action: "find_only"
- "analyze" → action: "analyze_only"

Extract numeric values, normalize categories to lowercase, and infer missing parameters with reasonable defaults.
If quantity is not specified, default to 1.
If category is not specified but implied (e.g., "flippable item"), you may infer a general category like "general" or return null.

Return JSON with:
{
  "budget": number (required),
  "quantity": number (required, default 1),
  "category": string (required, lowercase, or null if cannot determine),
  "action": "buy_and_resell" | "find_only" | "analyze_only" (required),
  "minProfitMargin": number (optional, percentage like 20 for 20%),
  "platforms": string[] (optional, e.g., ["facebook", "craigslist"]),
  "location": string (optional),
  "additionalFilters": object (optional, any other relevant filters)
}`;

      const userPrompt = `Parse this command: "${userInput}"`;

      const response = await this.openai.jsonCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.3,
        maxTokens: 300
      });

      // Validate and normalize response
      const command: ParsedCommand = {
        budget: this.extractBudget(response.budget, userInput),
        quantity: response.quantity || 1,
        category: this.normalizeCategory(response.category),
        action: this.normalizeAction(response.action),
        minProfitMargin: response.minProfitMargin,
        platforms: response.platforms,
        location: response.location,
        additionalFilters: response.additionalFilters
      };

      // Validate required fields
      if (!command.budget || command.budget <= 0) {
        return {
          success: false,
          error: 'Budget must be specified and greater than 0'
        };
      }

      if (!command.category) {
        return {
          success: false,
          error: 'Category could not be determined from the command'
        };
      }

      if (!command.action) {
        return {
          success: false,
          error: 'Action could not be determined from the command'
        };
      }

      return {
        success: true,
        command,
        confidence: response.confidence || 0.8
      };
    } catch (error: any) {
      console.error('Command parsing error:', error);
      return {
        success: false,
        error: error.message || 'Failed to parse command'
      };
    }
  }

  private extractBudget(budget: any, originalInput: string): number {
    if (typeof budget === 'number' && budget > 0) {
      return budget;
    }

    if (typeof budget === 'string') {
      const numMatch = budget.match(/\$?(\d+(?:\.\d+)?)/);
      if (numMatch) {
        return parseFloat(numMatch[1]);
      }
    }

    // Fallback: try to extract from original input
    const budgetMatch = originalInput.match(/\$(\d+(?:\.\d+)?)/);
    if (budgetMatch) {
      return parseFloat(budgetMatch[1]);
    }

    return 0;
  }

  private normalizeCategory(category: any): string {
    if (!category || typeof category !== 'string') {
      return '';
    }

    const normalized = category.toLowerCase().trim();
    
    // Map common variations
    const categoryMap: Record<string, string> = {
      'electronic': 'electronics',
      'electronics': 'electronics',
      'electronical': 'electronics',
      'tech': 'electronics',
      'technology': 'electronics',
      'clothing': 'clothing',
      'apparel': 'clothing',
      'clothes': 'clothing',
      'furniture': 'furniture',
      'home goods': 'home',
      'home': 'home',
      'collectibles': 'collectibles',
      'toys': 'toys',
      'books': 'books',
      'sports': 'sports',
      'automotive': 'automotive',
      'cars': 'automotive'
    };

    return categoryMap[normalized] || normalized;
  }

  private normalizeAction(action: any): 'buy_and_resell' | 'find_only' | 'analyze_only' {
    if (!action || typeof action !== 'string') {
      return 'find_only';
    }

    const normalized = action.toLowerCase().trim();

    if (normalized.includes('buy') && (normalized.includes('resell') || normalized.includes('sell'))) {
      return 'buy_and_resell';
    }

    if (normalized.includes('analyze') || normalized.includes('analysis')) {
      return 'analyze_only';
    }

    if (normalized.includes('find') || normalized.includes('show') || normalized.includes('search')) {
      return 'find_only';
    }

    // Default to buy_and_resell if action seems purchase-oriented
    return 'buy_and_resell';
  }
}

