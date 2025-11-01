// Service architecture definitions for AutoBazaaar

export interface ServiceArchitecture {
  core: {
    apiGateway: APIGatewayService;
    orchestrator: OrchestratorService;
    eventBus: EventBusService;
    queueManager: QueueManagerService;
  };
  
  agents: {
    marketResearch: MarketResearchAgent;
    dealAnalyzer: DealAnalyzerAgent;
    negotiation: NegotiationAgent;
    listing: ListingAgent;
    transaction: TransactionAgent;
    inventory: InventoryAgent;
  };
  
  support: {
    auth: AuthenticationService;
    rateLimit: RateLimiterService;
    cache: CacheService;
    logger: LoggingService;
    metrics: MetricsService;
    alerts: AlertingService;
  };
  
  integrations: {
    agentMail: AgentMailIntegration;
    browserUse: BrowserUseIntegration;
    hyperspell: HyperspellIntegration;
    perplexity: PerplexityIntegration;
    composio: ComposioIntegration;
    openai: OpenAIIntegration;
  };
}

// Service type definitions (placeholders)
export interface APIGatewayService {}
export interface OrchestratorService {}
export interface EventBusService {}
export interface QueueManagerService {}
export interface MarketResearchAgent {}
export interface DealAnalyzerAgent {}
export interface NegotiationAgent {}
export interface ListingAgent {}
export interface TransactionAgent {}
export interface InventoryAgent {}
export interface AuthenticationService {}
export interface RateLimiterService {}
export interface CacheService {}
export interface LoggingService {}
export interface MetricsService {}
export interface AlertingService {}
export interface AgentMailIntegration {}
export interface BrowserUseIntegration {}
export interface HyperspellIntegration {}
export interface PerplexityIntegration {}
export interface ComposioIntegration {}
export interface OpenAIIntegration {}

