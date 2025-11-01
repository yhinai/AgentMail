// Command Parser - Natural language command parsing using OpenAI
import { OpenAIIntegration } from '../../integrations/OpenAIIntegration';
import type { ParsedCommandParams } from '../../types';

interface CommandParserConfig {
  openai: OpenAIIntegration;
}

export class CommandParser {
  private openai: OpenAIIntegration;
  
  constructor(config: CommandParserConfig) {
    this.openai = config.openai;
  }
  
  /**
   * Parse a natural language flip command into structured parameters
   */
  async parseCommand(command: string): Promise<ParsedCommandParams> {
    const prompt = `Parse this flip command into structured parameters:

Command: "${command}"

Extract:
1. Budget amount (in dollars)
2. Quantity of items to buy
3. Category (e.g., "electronics", "furniture", "appliances", "automotive", "collectibles")
4. Any constraints (min profit margin, max risk, platforms, etc.)

Output JSON with this structure:
{
  "budget": number (required),
  "quantity": number (required, default to 1 if not specified),
  "category": string (required),
  "constraints": {
    "minProfitMargin": number (optional, in percentage),
    "maxRisk": number (optional, 0-1 scale),
    "platforms": array of strings (optional, e.g., ["facebook", "craigslist", "ebay"])
  }
}

If budget or category cannot be determined, set to reasonable defaults.
Budget default: 50
Quantity default: 1
Category default: "electronics"`;

    try {
      const parsed = await this.openai.jsonCompletion([
        {
          role: 'system',
          content: 'You are a command parser that extracts structured parameters from natural language flip commands. Be precise with numbers and categories.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.1, // Low temperature for consistency
        maxTokens: 200
      });
      
      // Validate and ensure required fields
      const result: ParsedCommandParams = {
        budget: this.extractBudget(parsed.budget, command) || 50,
        quantity: parsed.quantity || 1,
        category: parsed.category || this.inferCategory(command) || 'electronics',
        constraints: parsed.constraints || {}
      };
      
      // Validate parsed result
      this.validateParsedCommand(result);
      
      return result;
    } catch (error) {
      console.error('Command parsing error:', error);
      // Fallback to simple extraction
      return this.fallbackParse(command);
    }
  }
  
  private extractBudget(parsedBudget: any, command: string): number | null {
    // Try parsed value first
    if (typeof parsedBudget === 'number' && parsedBudget > 0) {
      return parsedBudget;
    }
    
    // Fallback: look for $XX pattern
    const dollarMatch = command.match(/\$\s*(\d+)/);
    if (dollarMatch) {
      return parseInt(dollarMatch[1]);
    }
    
    // Fallback: look for "XX budget" pattern
    const budgetMatch = command.match(/(\d+)\s*budget/i);
    if (budgetMatch) {
      return parseInt(budgetMatch[1]);
    }
    
    return null;
  }
  
  private inferCategory(command: string): string | null {
    const categoryKeywords: Record<string, string> = {
      'electronic': 'electronics',
      'phone': 'electronics',
      'laptop': 'electronics',
      'computer': 'electronics',
      'tablet': 'electronics',
      'headphone': 'electronics',
      'speaker': 'electronics',
      'camera': 'electronics',
      'furniture': 'furniture',
      'chair': 'furniture',
      'table': 'furniture',
      'couch': 'furniture',
      'sofa': 'furniture',
      'appliance': 'appliances',
      'washer': 'appliances',
      'dryer': 'appliances',
      'refrigerator': 'appliances',
      'car': 'automotive',
      'vehicle': 'automotive',
      'motorcycle': 'automotive',
      'bike': 'bikes',
      'collectible': 'collectibles',
      'antique': 'collectibles',
      'vintage': 'collectibles'
    };
    
    const lowerCommand = command.toLowerCase();
    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (lowerCommand.includes(keyword)) {
        return category;
      }
    }
    
    return null;
  }
  
  private validateParsedCommand(params: ParsedCommandParams): void {
    if (!params.budget || params.budget <= 0) {
      throw new Error('Invalid or missing budget');
    }
    
    if (!params.quantity || params.quantity <= 0) {
      throw new Error('Invalid or missing quantity');
    }
    
    if (!params.category || params.category.trim().length === 0) {
      throw new Error('Invalid or missing category');
    }
  }
  
  private fallbackParse(command: string): ParsedCommandParams {
    console.warn('Using fallback parser for command:', command);
    
    const budget = this.extractBudget(null, command) || 50;
    const quantity = 1; // Default to 1 item
    const category = this.inferCategory(command) || 'electronics';
    
    return {
      budget,
      quantity,
      category,
      constraints: {}
    };
  }
  
  /**
   * Validate if a command is feasible given system constraints
   */
  validateFeasibility(params: ParsedCommandParams): { feasible: boolean; reason?: string } {
    if (params.budget < 5) {
      return { feasible: false, reason: 'Budget too low (minimum $5)' };
    }
    
    if (params.budget > 10000) {
      return { feasible: false, reason: 'Budget too high (maximum $10,000)' };
    }
    
    if (params.quantity > 10) {
      return { feasible: false, reason: 'Quantity too high (maximum 10 items)' };
    }
    
    const validCategories = [
      'electronics', 'furniture', 'appliances', 
      'automotive', 'collectibles', 'bikes', 'tools', 'sports'
    ];
    
    if (!validCategories.includes(params.category.toLowerCase())) {
      return { feasible: false, reason: `Unsupported category: ${params.category}` };
    }
    
    return { feasible: true };
  }
}
