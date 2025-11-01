// Flip Command Executor - Orchestrate end-to-end flip command execution
import { CommandParser } from './CommandParser';
import { BudgetManager } from '../budget/BudgetManager';
import { ApprovalManager } from '../approval/ApprovalManager';
import { DatabaseClient } from '../../database/client';
import { EventBus } from '../events/EventBus';
import type { 
  FlipCommand, 
  ParsedCommandParams,
  Budget,
  EnrichedOpportunity,
  DealAnalysis,
  NegotiationThread,
  FlipExecutionState 
} from '../../types';

interface FlipCommandExecutorConfig {
  db: DatabaseClient;
  eventBus: EventBus;
  commandParser: CommandParser;
  budgetManager: BudgetManager;
  approvalManager: ApprovalManager;
  agents: {
    marketResearch: any;
    dealAnalyzer: any;
    negotiation: any;
    listing: any;
  };
}

export class FlipCommandExecutor {
  private db: DatabaseClient;
  private eventBus: EventBus;
  private commandParser: CommandParser;
  private budgetManager: BudgetManager;
  private approvalManager: ApprovalManager;
  private agents: FlipCommandExecutorConfig['agents'];
  private activeCommands: Map<string, FlipExecutionState> = new Map();
  
  constructor(config: FlipCommandExecutorConfig) {
    this.db = config.db;
    this.eventBus = config.eventBus;
    this.commandParser = config.commandParser;
    this.budgetManager = config.budgetManager;
    this.approvalManager = config.approvalManager;
    this.agents = config.agents;
  }
  
  /**
   * Execute a flip command from start to finish
   */
  async executeCommand(naturalLanguage: string): Promise<FlipCommand> {
    console.log(`🚀 Starting flip command: "${naturalLanguage}"`);
    
    try {
      // Step 1: Parse the command
      const parsed = await this.commandParser.parseCommand(naturalLanguage);
      
      // Validate feasibility
      const validation = this.commandParser.validateFeasibility(parsed);
      if (!validation.feasible) {
        throw new Error(validation.reason || 'Command not feasible');
      }
      
      // Step 2: Create budget
      const tempCommandId = this.generateId();
      const budget = await this.budgetManager.createBudget(tempCommandId, parsed.budget);
      
      // Step 3: Create command record
      const command = await this.createCommandRecord(naturalLanguage, parsed, budget.id);
      
      // Step 4: Execute the flip workflow
      await this.executeFlipWorkflow(command, parsed, budget);
      
      return command;
    } catch (error) {
      console.error('Flip command execution error:', error);
      throw error;
    }
  }
  
  /**
   * Main flip workflow with approval gates
   */
  private async executeFlipWorkflow(
    command: FlipCommand,
    parsed: ParsedCommandParams,
    budget: Budget
  ): Promise<void> {
    const state: FlipExecutionState = {
      command,
      budget,
      discoveredItems: [],
      listings: []
    };
    
    this.activeCommands.set(command.id, state);
    
    try {
      // Emit command started event
      this.eventBus.publish('command:created' as any, { command });
      
      // GATE 1: FIND ITEMS
      await this.updateCommandStatus(command.id, 'finding', 'Searching for items...');
      state.discoveredItems = await this.findItems(parsed);
      
      if (state.discoveredItems.length === 0) {
        throw new Error('No suitable items found');
      }
      
      // Request approval for best item
      const selectedItem = await this.getApprovalForItem(state, state.discoveredItems);
      if (!selectedItem) {
        throw new Error('No item approved by user');
      }
      
      state.selectedItem = selectedItem;
      
      // GATE 2: ANALYZE DEAL
      await this.updateCommandStatus(command.id, 'negotiating', 'Analyzing deal...');
      const analysis = await this.agents.dealAnalyzer.analyzeDeal(selectedItem);
      state.analysis = analysis;
      
      const analyzeApproved = await this.approvalManager.requestApproval(
        command.id,
        'negotiate',
        {
          step: 'negotiate',
          opportunity: selectedItem,
          analysis,
          expectedProfit: analysis.profitAnalysis?.netProfit,
          budgetImpact: selectedItem.price,
          riskScore: analysis.profitMargin < 30 ? 0.7 : 0.3,
          reasoning: analysis.recommendation.reasoning
        }
      );
      
      if (!analyzeApproved) {
        throw new Error('Analysis not approved by user');
      }
      
      // GATE 3: NEGOTIATE & PURCHASE
      await this.updateCommandStatus(command.id, 'purchasing', 'Negotiating purchase...');
      
      // Check budget
      const canAfford = await this.budgetManager.canAfford(budget.id, analysis.recommendation.maxPrice);
      if (!canAfford) {
        throw new Error('Insufficient budget for this purchase');
      }
      
      // Reserve funds
      await this.budgetManager.reserveFunds(budget.id, analysis.recommendation.maxPrice);
      
      const negotiation = await this.agents.negotiation.initiateNegotiation(
        selectedItem,
        analysis
      );
      state.negotiation = negotiation;
      
      const purchaseApproved = await this.approvalManager.requestApproval(
        command.id,
        'purchase',
        {
          step: 'purchase',
          opportunity: selectedItem,
          analysis,
          negotiationThread: negotiation,
          expectedProfit: analysis.profitAnalysis?.netProfit,
          budgetImpact: selectedItem.price,
          reasoning: [`Negotiated price: $${selectedItem.price}`, ...analysis.recommendation.reasoning]
        }
      );
      
      if (!purchaseApproved) {
        await this.budgetManager.releaseFunds(budget.id, analysis.recommendation.maxPrice);
        throw new Error('Purchase not approved by user');
      }
      
      // Execute purchase
      await this.budgetManager.spendFunds(budget.id, selectedItem.price);
      
      // GATE 4: CREATE LISTING
      await this.updateCommandStatus(command.id, 'listing', 'Creating listings...');
      
      const listingPlatforms = parsed.constraints?.platforms || ['facebook', 'craigslist', 'ebay'];
      const listingResults = await this.agents.listing.createListing(selectedItem, listingPlatforms);
      
      const listApproved = await this.approvalManager.requestApproval(
        command.id,
        'list',
        {
          step: 'list',
          listing: listingResults,
          expectedProfit: analysis.profitAnalysis?.netProfit,
          reasoning: ['Listings created successfully']
        }
      );
      
      if (!listApproved) {
        // TODO: Delete listings if not approved
        console.warn('Listings not approved but already created');
      }
      
      // Complete the command
      await this.updateCommandStatus(command.id, 'completed', 'Command completed successfully');
      await this.budgetManager.completeBudget(budget.id);
      
      this.eventBus.publish('command:completed' as any, { command });
      
    } catch (error) {
      console.error('Flip workflow error:', error);
      await this.updateCommandStatus(command.id, 'failed', `Error: ${error}`);
      this.eventBus.publish('command:failed' as any, { command, error });
      throw error;
    } finally {
      this.activeCommands.delete(command.id);
    }
  }
  
  /**
   * Find items matching the command criteria
   */
  private async findItems(parsed: ParsedCommandParams): Promise<EnrichedOpportunity[]> {
    const searchParams = {
      categories: [parsed.category],
      minPrice: parsed.constraints?.platforms ? undefined : 10,
      maxPrice: parsed.budget / parsed.quantity,
      platforms: parsed.constraints?.platforms,
      minProfitMargin: parsed.constraints?.minProfitMargin || 20,
      itemsPerPlatform: 5
    };
    
    const opportunities = await this.agents.marketResearch.findOpportunities(searchParams);
    
    // Emit discovered items for real-time UI updates
    for (const item of opportunities) {
      this.eventBus.publish('item:discovered' as any, { item });
    }
    
    // Sort by profit score and return top items
    return opportunities
      .sort((a, b) => b.profitScore - a.profitScore)
      .slice(0, parsed.quantity);
  }
  
  /**
   * Request approval for item discovery
   */
  private async getApprovalForItem(
    state: FlipExecutionState,
    items: EnrichedOpportunity[]
  ): Promise<EnrichedOpportunity | null> {
    // Start with the best item
    for (const item of items) {
      const approved = await this.approvalManager.requestApproval(
        state.command.id,
        'find_item',
        {
          step: 'find_item',
          opportunity: item,
          expectedProfit: item.profitAnalysis?.netProfit,
          budgetImpact: item.price,
          riskScore: item.riskAssessment?.score,
          reasoning: [
            `Profit: $${item.profitAnalysis?.netProfit?.toFixed(2)}`,
            `Margin: ${item.profitAnalysis?.profitMargin?.toFixed(1)}%`,
            `Price: $${item.price}`
          ]
        }
      );
      
      if (approved) {
        await this.db.updateCommand(state.command.id, { itemsFound: items.length });
        return item;
      }
    }
    
    return null;
  }
  
  /**
   * Create command record in database
   */
  private async createCommandRecord(
    naturalLanguage: string,
    parsed: ParsedCommandParams,
    budgetId: string
  ): Promise<FlipCommand> {
    const command: Omit<FlipCommand, 'id'> = {
      naturalLanguage,
      parsed,
      status: 'parsing',
      currentStep: 'Initializing',
      budgetId,
      itemsFound: 0,
      itemsPurchased: 0,
      itemsListed: 0,
      createdAt: Date.now()
    };
    
    const commandId = await this.db.createCommand(command);
    
    return {
      ...command,
      id: commandId
    };
  }
  
  /**
   * Update command status
   */
  private async updateCommandStatus(
    commandId: string,
    status: FlipCommand['status'],
    currentStep: string
  ): Promise<void> {
    await this.db.updateCommand(commandId, {
      status,
      currentStep
    });
    
    this.eventBus.publish('command:progress' as any, {
      commandId,
      status,
      currentStep
    });
  }
  
  /**
   * Get execution state
   */
  getExecutionState(commandId: string): FlipExecutionState | undefined {
    return this.activeCommands.get(commandId);
  }
  
  /**
   * Helper to generate IDs
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
