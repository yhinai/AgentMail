// Command Executor - Orchestrates command execution workflow
import { CommandParser, ParsedCommand } from './CommandParser';
import { AutoBazaaarOrchestrator } from '../orchestrator';
import { QueueManager } from '../queue/QueueManager';
import { EventBus } from '../events/EventBus';
import { AgentRegistry } from '../agents/AgentRegistry';
import type { EnrichedOpportunity, DealAnalysis } from '../../types';
import { SystemEvents } from '../../types';

export interface CommandExecutionResult {
  success: boolean;
  commandId: string;
  status: 'pending' | 'finding' | 'analyzing' | 'negotiating' | 'listing' | 'completed' | 'failed';
  opportunities?: EnrichedOpportunity[];
  selectedOpportunity?: EnrichedOpportunity;
  analysis?: DealAnalysis;
  negotiationId?: string;
  listingUrls?: string[];
  expectedProfit?: number;
  error?: string;
  progress?: number; // 0-100
}

export interface CommandExecutionContext {
  commandId: string;
  parsedCommand: ParsedCommand;
  orchestrator: AutoBazaaarOrchestrator;
  queueManager: QueueManager;
  eventBus: EventBus;
  agentRegistry: AgentRegistry;
}

export class CommandExecutor {
  private activeCommands: Map<string, CommandExecutionResult> = new Map();
  private context: CommandExecutionContext | null = null;

  async executeCommand(
    parsedCommand: ParsedCommand,
    context: CommandExecutionContext
  ): Promise<CommandExecutionResult> {
    this.context = context;
    const commandId = context.commandId;

    // Initialize execution result
    const result: CommandExecutionResult = {
      success: false,
      commandId,
      status: 'pending'
    };
    this.activeCommands.set(commandId, result);

    try {
      // Step 1: Find opportunities
      result.status = 'finding';
      result.progress = 10;
      const opportunities = await this.findOpportunities(parsedCommand, context);
      result.opportunities = opportunities;

      if (opportunities.length === 0) {
        result.status = 'failed';
        result.error = 'No opportunities found matching criteria';
        return result;
      }

      // Step 2: Analyze opportunities
      result.status = 'analyzing';
      result.progress = 30;
      const analysis = await this.analyzeBestOpportunity(opportunities, context);
      result.analysis = analysis;
      result.selectedOpportunity = analysis.opportunity;

      // Check if analysis recommends proceeding
      if (analysis.recommendation.action === 'PASS') {
        result.status = 'failed';
        result.error = `Analysis recommends passing: ${analysis.recommendation.reasoning.join(', ')}`;
        return result;
      }

      // For find_only or analyze_only, stop here
      if (parsedCommand.action === 'find_only' || parsedCommand.action === 'analyze_only') {
        result.status = 'completed';
        result.progress = 100;
        result.success = true;
        result.expectedProfit = this.calculateExpectedProfit(analysis);
        return result;
      }

      // Step 3: Negotiate (for buy_and_resell)
      result.status = 'negotiating';
      result.progress = 50;
      const negotiationResult = await this.initiateNegotiation(analysis, context);
      result.negotiationId = negotiationResult.threadId;

      // Wait for negotiation to complete (or handle asynchronously)
      // For now, we'll mark as negotiating and let the event system handle completion
      result.progress = 70;
      
      // The negotiation completion will be handled by event handlers
      // which will trigger listing creation automatically

      return result;
    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message || 'Command execution failed';
      console.error('Command execution error:', error);
      return result;
    }
  }

  private async findOpportunities(
    command: ParsedCommand,
    context: CommandExecutionContext
  ): Promise<EnrichedOpportunity[]> {
    const marketAgent = context.agentRegistry.get('market-research') as any;
    
    if (!marketAgent) {
      throw new Error('Market research agent not available');
    }

    const searchParams = {
      platforms: command.platforms || ['facebook', 'craigslist', 'ebay'],
      categories: [command.category],
      maxPrice: command.budget,
      minPrice: command.budget * 0.1, // Allow items up to 90% of budget
      minProfitMargin: command.minProfitMargin || 20,
      itemsPerPlatform: Math.ceil(command.quantity * 3) // Get more options
    };

    const opportunities = await marketAgent.findOpportunities(searchParams);

    // Sort by profit score and return top N
    const sorted = opportunities.sort((a: EnrichedOpportunity, b: EnrichedOpportunity) => 
      (b.profitScore || 0) - (a.profitScore || 0)
    );

    return sorted.slice(0, command.quantity * 5); // Return multiple options
  }

  private async analyzeBestOpportunity(
    opportunities: EnrichedOpportunity[],
    context: CommandExecutionContext
  ): Promise<DealAnalysis> {
    const analyzerAgent = context.agentRegistry.get('deal-analyzer') as any;
    
    if (!analyzerAgent) {
      throw new Error('Deal analyzer agent not available');
    }

    // Analyze all opportunities and pick the best one
    const analyses = await Promise.all(
      opportunities.map(opp => analyzerAgent.analyzeDeal(opp))
    );

    // Sort by recommendation confidence and profit margin
    const sorted = analyses.sort((a, b) => {
      const scoreA = (a.recommendation.confidence || 0) * (a.profitMargin || 0);
      const scoreB = (b.recommendation.confidence || 0) * (b.profitMargin || 0);
      return scoreB - scoreA;
    });

    // Return the best one
    return sorted[0];
  }

  private async initiateNegotiation(
    analysis: DealAnalysis,
    context: CommandExecutionContext
  ): Promise<{ threadId: string; success: boolean }> {
    const negotiationAgent = context.agentRegistry.get('negotiation') as any;
    
    if (!negotiationAgent) {
      throw new Error('Negotiation agent not available');
    }

    const strategy = this.selectNegotiationStrategy(analysis);
    
    const result = await negotiationAgent.initiateNegotiation(
      analysis.opportunity,
      analysis,
      strategy
    );

    return {
      threadId: result.threadId,
      success: result.success
    };
  }

  private selectNegotiationStrategy(analysis: DealAnalysis): string {
    const profitMargin = analysis.profitMargin;
    
    if (profitMargin > 50) {
      return 'URGENT_CASH';
    } else if (analysis.sellerProfile?.type === 'business') {
      return 'PROFESSIONAL_BUYER';
    } else {
      return 'FRIENDLY_LOCAL';
    }
  }

  private calculateExpectedProfit(analysis: DealAnalysis): number {
    const purchasePrice = analysis.opportunity.price;
    const estimatedSalePrice = analysis.opportunity.profitAnalysis?.estimatedSalePrice || 
                               analysis.opportunity.marketData?.averagePrice ||
                               purchasePrice * 1.3;
    
    // Calculate platform fees based on platform
    const platformFeeRates: Record<string, number> = {
      'ebay': 0.13,
      'mercari': 0.10,
      'facebook': 0.05,
      'craigslist': 0,
      'offerup': 0.12
    };
    
    const feeRate = platformFeeRates[analysis.opportunity.platform.toLowerCase()] || 0.10;
    const platformFees = analysis.opportunity.profitAnalysis?.platformFees || 
                         estimatedSalePrice * feeRate;
    
    // Calculate net profit
    const netProfit = estimatedSalePrice - purchasePrice - platformFees;
    
    return Math.max(0, netProfit); // Don't return negative profits
  }

  updateCommandStatus(commandId: string, updates: Partial<CommandExecutionResult>): void {
    const existing = this.activeCommands.get(commandId);
    if (existing) {
      Object.assign(existing, updates);
      this.activeCommands.set(commandId, existing);
    }
  }

  getCommandStatus(commandId: string): CommandExecutionResult | undefined {
    return this.activeCommands.get(commandId);
  }

  // Handle negotiation accepted event
  async handleNegotiationAccepted(
    negotiationId: string,
    finalPrice: number,
    opportunityId: string
  ): Promise<void> {
    // Find command that's waiting for this negotiation
    for (const [commandId, result] of this.activeCommands.entries()) {
      if (result.negotiationId === negotiationId) {
        result.status = 'listing';
        result.progress = 80;
        
        // Trigger listing creation
        await this.context?.queueManager.addJob('create-listing', {
          opportunityId,
          purchasePrice: finalPrice,
          negotiationId
        }, {
          priority: 'high'
        });
        
        break;
      }
    }
  }

  // Handle listing created event
  async handleListingCreated(
    listingUrls: string[],
    opportunityId: string
  ): Promise<void> {
    // Find command and mark as completed
    for (const [commandId, result] of this.activeCommands.entries()) {
      if (result.selectedOpportunity?.id === opportunityId) {
        result.status = 'completed';
        result.progress = 100;
        result.success = true;
        result.listingUrls = listingUrls;
        
        // Calculate final expected profit
        if (result.analysis) {
          result.expectedProfit = this.calculateExpectedProfit(result.analysis);
        }
        
        break;
      }
    }
  }
}

