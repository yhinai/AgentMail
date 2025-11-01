// AutoBazaaar Orchestrator - Main orchestrator service with agent registration and event handling
import { EventBus } from '../events/EventBus';
import { QueueManager } from '../queue/QueueManager';
import { AgentRegistry, Agent } from '../agents/AgentRegistry';
import { MetricsCollector } from '../metrics/MetricsCollector';
import { SystemEvents } from '../../types';
import { IntegrationManager } from '../../integrations';
import type {
  OrchestratorConfig,
  OrchestratorState,
  AgentError,
  EnrichedOpportunity,
  DealAnalysis,
  NegotiationStrategy,
  JobContext
} from '../../types';

// Agent interfaces (will be implemented in agent files)
interface MarketResearchAgent extends Agent {
  findOpportunities(params: any): Promise<EnrichedOpportunity[]>;
}

interface DealAnalyzerAgent extends Agent {
  analyzeDeal(opportunity: EnrichedOpportunity): Promise<DealAnalysis>;
}

interface NegotiationAgent extends Agent {
  initiateNegotiation(
    opportunity: EnrichedOpportunity,
    analysis: DealAnalysis,
    strategy?: string
  ): Promise<any>;
}

interface ListingAgent extends Agent {
  createListing(item: any, platforms: string[]): Promise<any>;
}

export class AutoBazaaarOrchestrator {
  private eventBus: EventBus;
  private queueManager: QueueManager;
  private agentRegistry: AgentRegistry;
  private metrics: MetricsCollector;
  private config: OrchestratorConfig;
  private state: OrchestratorState;
  private integrations: IntegrationManager;
  private intervals: NodeJS.Timeout[] = [];
  
  constructor(config: OrchestratorConfig, integrations: IntegrationManager) {
    this.config = config;
    this.integrations = integrations;
    
    this.eventBus = new EventBus(config.redis, 'orchestrator');
    this.queueManager = new QueueManager(config.redis);
    this.agentRegistry = new AgentRegistry();
    this.metrics = new MetricsCollector();
    
    this.state = {
      status: 'initializing',
      activeAgents: new Map(),
      runningTasks: new Map(),
      performance: {
        tasksCompleted: 0,
        tasksFailure: 0,
        avgResponseTime: 0,
        uptime: 0
      }
    };
    
    // Initialize asynchronously
    this.initialize().catch(error => {
      console.error('Failed to initialize orchestrator:', error);
      this.state.status = 'error';
    });
  }
  
  private async initialize(): Promise<void> {
    try {
      // Register all agents
      await this.registerAgents();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Initialize queues
      await this.initializeQueues();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start main loop
      this.startMainLoop();
      
      this.state.status = 'running';
      this.state.performance.uptime = Date.now();
      console.log('🚀 AutoBazaaar Orchestrator initialized');
    } catch (error) {
      console.error('Orchestrator initialization error:', error);
      this.state.status = 'error';
      throw error;
    }
  }
  
  private async registerAgents(): Promise<void> {
    // Market Research Agent
    if (this.integrations.browserUse && this.integrations.perplexity) {
      const { MarketResearchAgent } = await import('../../agents/MarketResearchAgent');
      const marketAgent = new MarketResearchAgent({
        browserUse: this.integrations.browserUse,
        perplexity: this.integrations.perplexity,
        maxConcurrent: 5
      });
      await this.agentRegistry.register('market-research', marketAgent as Agent);
    }
    
    // Deal Analyzer Agent
    if (this.integrations.openai) {
      const { DealAnalyzerAgent } = await import('../../agents/DealAnalyzerAgent');
      const analyzerAgent = new DealAnalyzerAgent({
        openai: this.integrations.openai
      });
      await this.agentRegistry.register('deal-analyzer', analyzerAgent as Agent);
    }
    
    // Negotiation Agent
    if (this.integrations.agentMail && this.integrations.openai && this.integrations.hyperspell) {
      const { NegotiationAgent } = await import('../../agents/NegotiationAgent');
      const negotiationAgent = new NegotiationAgent({
        agentMail: this.integrations.agentMail,
        openai: this.integrations.openai,
        hyperspell: this.integrations.hyperspell
      });
      await this.agentRegistry.register('negotiation', negotiationAgent as Agent);
    }
    
    // Listing Agent
    if (this.integrations.browserUse && this.integrations.composio) {
      const { ListingAgent } = await import('../../agents/ListingAgent');
      const listingAgent = new ListingAgent({
        browserUse: this.integrations.browserUse,
        composio: this.integrations.composio
      });
      await this.agentRegistry.register('listing', listingAgent as Agent);
    }
  }
  
  private setupEventHandlers(): void {
    // Opportunity found - trigger analysis
    this.eventBus.subscribe(SystemEvents.OPPORTUNITY_FOUND, async (event) => {
      const opportunity = event.data as EnrichedOpportunity;
      await this.queueManager.addJob('analyze-deal', {
        opportunity,
        priority: this.calculatePriority(opportunity)
      }, {
        priority: this.calculatePriority(opportunity)
      });
    });
    
    // Analysis complete - decide action
    this.eventBus.subscribe(SystemEvents.OPPORTUNITY_ANALYZED, async (event) => {
      const { opportunity, analysis } = event.data as { opportunity: EnrichedOpportunity; analysis: DealAnalysis };
      
      if (analysis.recommendation.action === 'BUY' || 
          analysis.recommendation.action === 'NEGOTIATE') {
        await this.queueManager.addJob('start-negotiation', {
          opportunity,
          analysis,
          strategy: this.selectNegotiationStrategy(analysis)
        }, {
          priority: 'high'
        });
      }
    });
    
    // Negotiation accepted - execute purchase
    this.eventBus.subscribe(SystemEvents.NEGOTIATION_ACCEPTED, async (event) => {
      await this.queueManager.addJob('execute-purchase', {
        negotiation: event.data,
        priority: 'high'
      }, {
        priority: 'high'
      });
    });
    
    // Purchase completed - create listing
    this.eventBus.subscribe(SystemEvents.PURCHASE_COMPLETED, async (event) => {
      await this.queueManager.addJob('create-listing', {
        item: event.data,
        platforms: this.selectListingPlatforms(event.data)
      });
    });
    
    // Error handling
    this.eventBus.subscribe(SystemEvents.AGENT_ERROR, async (event) => {
      await this.handleAgentError(event.data as AgentError);
    });
  }
  
  private async initializeQueues(): Promise<void> {
    // Define queue processors
    const queueProcessors = {
      'market-scan': this.processMarketScan.bind(this),
      'analyze-deal': this.processAnalyzeDeal.bind(this),
      'start-negotiation': this.processNegotiation.bind(this),
      'execute-purchase': this.processPurchase.bind(this),
      'create-listing': this.processListing.bind(this),
      'update-prices': this.processPriceUpdate.bind(this),
      'execute-command': this.processExecuteCommand.bind(this)
    };
    
    // Register processors
    for (const [queueName, processor] of Object.entries(queueProcessors)) {
      await this.queueManager.registerProcessor(queueName, processor, {
        concurrency: this.config.queueConcurrency?.[queueName] || 3,
        retries: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
    }
  }
  
  private async startMainLoop(): Promise<void> {
    // Schedule recurring tasks
    this.intervals.push(
      setInterval(() => this.scanMarkets(), this.config.scanInterval || 60000)
    );
    this.intervals.push(
      setInterval(() => this.updatePrices(), this.config.priceUpdateInterval || 300000)
    );
    this.intervals.push(
      setInterval(() => this.checkNegotiations(), this.config.negotiationCheckInterval || 30000)
    );
    this.intervals.push(
      setInterval(() => this.optimizeListings(), this.config.listingOptimizeInterval || 3600000)
    );
    
    // Initial scan
    await this.scanMarkets();
  }
  
  private async scanMarkets(): Promise<void> {
    const scanConfig = {
      categories: this.config.targetCategories || [],
      platforms: this.config.targetPlatforms || [],
      maxPrice: this.config.maxBudget,
      minProfitMargin: this.config.minProfitMargin
    };
    
    await this.queueManager.addJob('market-scan', scanConfig, {
      priority: 'normal',
      removeOnComplete: true
    });
  }
  
  private async processMarketScan(data: any, context: JobContext): Promise<void> {
    const agent = this.agentRegistry.get('market-research') as unknown as MarketResearchAgent;
    if (!agent) {
      throw new Error('Market research agent not found');
    }
    
    const opportunities = await agent.findOpportunities(data);
    
    // Emit events for each opportunity
    for (const opportunity of opportunities) {
      await this.eventBus.publish(SystemEvents.OPPORTUNITY_FOUND, opportunity);
    }
    
    // Update metrics
    this.metrics.record('opportunities.discovered', opportunities.length);
    this.state.performance.tasksCompleted++;
  }
  
  private async processAnalyzeDeal(data: any, context: JobContext): Promise<void> {
    const agent = this.agentRegistry.get('deal-analyzer') as unknown as DealAnalyzerAgent;
    if (!agent) {
      throw new Error('Deal analyzer agent not found');
    }
    
    const analysis = await agent.analyzeDeal(data.opportunity);
    
    await this.eventBus.publish(SystemEvents.OPPORTUNITY_ANALYZED, {
      opportunity: data.opportunity,
      analysis
    });
    
    // Store analysis results (optional)
    await this.storeAnalysis(analysis);
    
    this.state.performance.tasksCompleted++;
  }
  
  private async processNegotiation(data: any, context: JobContext): Promise<void> {
    const agent = this.agentRegistry.get('negotiation') as unknown as NegotiationAgent;
    if (!agent) {
      throw new Error('Negotiation agent not found');
    }
    
    const result = await agent.initiateNegotiation(
      data.opportunity,
      data.analysis,
      data.strategy
    );
    
    await this.eventBus.publish(SystemEvents.NEGOTIATION_STARTED, result);
    
    this.state.performance.tasksCompleted++;
  }
  
  private async processPurchase(data: any, context: JobContext): Promise<void> {
    // Purchase execution logic
    // This would integrate with payment processors, etc.
    await this.eventBus.publish(SystemEvents.PURCHASE_COMPLETED, data);
    this.state.performance.tasksCompleted++;
  }
  
  private async processListing(data: any, context: JobContext): Promise<void> {
    const agent = this.agentRegistry.get('listing') as unknown as ListingAgent;
    if (!agent) {
      throw new Error('Listing agent not found');
    }
    
    await agent.createListing(data.item, data.platforms);
    await this.eventBus.publish(SystemEvents.LISTING_CREATED, data);
    
    this.state.performance.tasksCompleted++;
  }
  
  private async processPriceUpdate(data: any, context: JobContext): Promise<void> {
    // Price update logic
    await this.eventBus.publish(SystemEvents.LISTING_UPDATED, data);
    this.state.performance.tasksCompleted++;
  }

  private async processExecuteCommand(data: any, context: JobContext): Promise<void> {
    try {
      // Import CommandExecutor dynamically to avoid circular dependencies
      const { CommandExecutor } = await import('../command/CommandExecutor');
      const executor = new CommandExecutor();

      // Execute command with orchestrator context
      const commandContext = {
        commandId: data.commandId,
        parsedCommand: data.parsedCommand,
        orchestrator: this,
        queueManager: this.queueManager,
        eventBus: this.eventBus,
        agentRegistry: this.agentRegistry
      };

      await executor.executeCommand(data.parsedCommand, commandContext);
      
      this.state.performance.tasksCompleted++;
    } catch (error) {
      console.error('Command execution error:', error);
      this.state.performance.tasksFailure++;
      throw error;
    }
  }
  
  private selectNegotiationStrategy(analysis: DealAnalysis): string {
    // Dynamic strategy selection based on analysis
    const profitMargin = analysis.profitMargin;
    const sellerType = analysis.sellerProfile?.type;
    
    if (profitMargin > 50 && analysis.opportunity.profitAnalysis && analysis.opportunity.profitAnalysis.profitMargin > 50) {
      return 'URGENT_CASH';
    } else if (sellerType === 'business') {
      return 'PROFESSIONAL_BUYER';
    } else if (analysis.opportunity.category === 'collectibles') {
      return 'COLLECTOR';
    } else {
      return 'FRIENDLY_LOCAL';
    }
  }
  
  private calculatePriority(opportunity: EnrichedOpportunity): 'high' | 'normal' | 'low' {
    const profitScore = opportunity.profitScore;
    
    if (profitScore > 80) return 'high';
    if (profitScore > 50) return 'normal';
    return 'low';
  }
  
  private selectListingPlatforms(item: any): string[] {
    // Select platforms based on item characteristics
    return this.config.targetPlatforms || ['facebook', 'craigslist', 'ebay'];
  }
  
  private async updatePrices(): Promise<void> {
    // Price update logic
    await this.queueManager.addJob('update-prices', {}, {
      priority: 'low'
    });
  }
  
  private async checkNegotiations(): Promise<void> {
    // Check for negotiation updates
    // This would be handled by the negotiation agent
  }
  
  private async optimizeListings(): Promise<void> {
    // Listing optimization logic
  }
  
  private async handleAgentError(error: AgentError): Promise<void> {
    console.error(`Agent error: ${error.agent} - ${error.message}`);
    
    // Log to monitoring
    this.metrics.recordError(error, { agent: error.agent });
    
    // Retry logic
    if (error.retryable && error.attempts < 3) {
      await this.queueManager.addJob(error.jobType || 'unknown', error.jobData || {}, {
        delay: Math.pow(2, error.attempts) * 1000,
        attempts: error.attempts + 1
      });
    }
    
    // Alert if critical
    if (error.severity === 'critical') {
      await this.alertAdmin(error);
    }
    
    this.state.performance.tasksFailure++;
  }
  
  private async storeAnalysis(analysis: DealAnalysis): Promise<void> {
    // Store in database (optional)
    // Could use Convex or other storage
  }
  
  private async alertAdmin(error: AgentError): Promise<void> {
    // Send alert to admin
    console.error('CRITICAL ERROR:', error);
    // Could integrate with alerting service
  }
  
  private startHealthMonitoring(): void {
    setInterval(async () => {
      // Check agent health
      const health = await this.agentRegistry.healthCheckAll();
      
      for (const [agentName, isHealthy] of health) {
        if (!isHealthy) {
          console.warn(`Agent ${agentName} is unhealthy`);
        }
      }
      
      // Update uptime
      if (this.state.status === 'running') {
        this.state.performance.uptime = Date.now() - (this.state.performance.uptime || Date.now());
      }
    }, 60000); // Check every minute
  }
  
  async stop(): Promise<void> {
    this.state.status = 'stopped';
    
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    // Stop all agents
    await this.agentRegistry.stopAll();
    
    // Close queues
    await this.queueManager.close();
    
    // Close event bus
    await this.eventBus.close();
    
    console.log('AutoBazaaar Orchestrator stopped');
  }
  
  getState(): OrchestratorState {
    return { ...this.state };
  }

  getAgentRegistry(): AgentRegistry {
    return this.agentRegistry;
  }
}

