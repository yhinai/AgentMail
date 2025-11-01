# AutoBazaaar: Complete Technical Implementation Guide
## Autonomous Commerce Agent - Comprehensive PRD

---

# Table of Contents
1. [System Overview](#system-overview)
2. [Technical Architecture](#technical-architecture)
3. [Core Components Implementation](#core-components-implementation)
4. [Agent Implementations](#agent-implementations)
5. [Database Architecture](#database-architecture)
6. [API Integrations](#api-integrations)
7. [Security & Performance](#security-performance)
8. [Deployment Architecture](#deployment-architecture)
9. [Monitoring & Analytics](#monitoring-analytics)
10. [Testing Strategy](#testing-strategy)

---

# System Overview

## Core Concept
AutoBazaaar is a fully autonomous AI agent system that identifies arbitrage opportunities across online marketplaces, negotiates purchases via email, manages inventory, creates optimized listings, handles buyer communications, and executes profitable transactions without human intervention.

## Technical Stack
```yaml
Runtime:
  - Node.js 20.x LTS
  - TypeScript 5.3+
  - PM2 for process management

Core Framework:
  - Express.js for API server
  - Socket.io for real-time updates
  - Bull Queue for job processing
  - Node-cron for scheduled tasks

AI/ML:
  - OpenAI GPT-4 Turbo (gpt-4-turbo-preview)
  - Custom TensorFlow.js models for price prediction
  - Langchain for agent orchestration

Databases:
  - Convex for real-time data
  - Redis for caching and queues
  - PostgreSQL for analytics (optional)
  - Pinecone for vector embeddings

External APIs:
  - AgentMail for email automation
  - Browser-Use for web scraping
  - Hyperspell for memory management
  - Perplexity for market research
  - Composio for marketplace integrations
  - LiveKit for voice interface
  - Mastra for workflow orchestration

Frontend:
  - React 18 with TypeScript
  - Tailwind CSS for styling
  - Recharts for analytics
  - Framer Motion for animations
```

## System Requirements
```yaml
Minimum Hardware:
  - CPU: 4 cores @ 2.4GHz
  - RAM: 8GB
  - Storage: 50GB SSD
  - Network: 100Mbps

Recommended:
  - CPU: 8 cores @ 3.0GHz
  - RAM: 16GB
  - Storage: 100GB NVMe
  - Network: 1Gbps
  - GPU: Optional for ML inference
```

---

# Technical Architecture

## High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         AutoBazaaar System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────────────┐              │
│  │   Frontend   │◄────────►│    API Gateway      │              │
│  │  Dashboard   │         │   (Express + WS)     │              │
│  └──────────────┘         └──────────────────────┘              │
│                                    │                             │
│                                    ▼                             │
│  ┌───────────────────────────────────────────────────────┐      │
│  │              Message Bus (Redis Pub/Sub)              │      │
│  └───────────────────────────────────────────────────────┘      │
│                      │              │              │             │
│          ┌───────────▼──────┐ ┌────▼────┐ ┌──────▼──────┐      │
│          │  Agent Manager   │ │  Queue  │ │   Event     │      │
│          │  (Orchestrator)  │ │ Manager │ │   Stream    │      │
│          └──────────────────┘ └─────────┘ └─────────────┘      │
│                      │                                           │
│     ┌────────────────┼────────────────────────────┐             │
│     ▼                ▼                ▼           ▼             │
│ ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐          │
│ │Research│    │Analyzer│    │  Nego  │    │Listing │          │
│ │ Agent │    │ Agent  │    │ Agent  │    │ Agent  │          │
│ └────────┘    └────────┘    └────────┘    └────────┘          │
│     │              │              │              │               │
│     └──────────────┴──────────────┴──────────────┘             │
│                           │                                      │
│                    ┌──────▼──────┐                              │
│                    │   Database  │                              │
│                    │   Layer     │                              │
│                    └─────────────┘                              │
│                           │                                      │
│        ┌──────────────────┼──────────────────┐                 │
│        ▼                  ▼                  ▼                  │
│   ┌─────────┐      ┌──────────┐      ┌──────────┐             │
│   │ Convex  │      │  Redis   │      │Hyperspell│             │
│   │   DB    │      │  Cache   │      │  Memory  │             │
│   └─────────┘      └──────────┘      └──────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Microservices Architecture
```typescript
// src/architecture/services.ts
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
```

## Event-Driven Architecture
```typescript
// src/architecture/events.ts
export enum SystemEvents {
  // Discovery Events
  OPPORTUNITY_FOUND = 'opportunity.found',
  OPPORTUNITY_ANALYZED = 'opportunity.analyzed',
  OPPORTUNITY_EXPIRED = 'opportunity.expired',
  
  // Negotiation Events
  NEGOTIATION_STARTED = 'negotiation.started',
  NEGOTIATION_RESPONSE = 'negotiation.response',
  NEGOTIATION_ACCEPTED = 'negotiation.accepted',
  NEGOTIATION_REJECTED = 'negotiation.rejected',
  NEGOTIATION_COUNTER = 'negotiation.counter',
  
  // Transaction Events
  PURCHASE_INITIATED = 'purchase.initiated',
  PURCHASE_COMPLETED = 'purchase.completed',
  PURCHASE_FAILED = 'purchase.failed',
  
  // Listing Events
  LISTING_CREATED = 'listing.created',
  LISTING_UPDATED = 'listing.updated',
  LISTING_SOLD = 'listing.sold',
  
  // System Events
  AGENT_ERROR = 'agent.error',
  RATE_LIMIT_HIT = 'system.rateLimit',
  MEMORY_UPDATE = 'memory.update'
}

export interface EventPayload<T = any> {
  eventId: string;
  eventType: SystemEvents;
  timestamp: number;
  source: string;
  data: T;
  metadata?: Record<string, any>;
}

export class EventBus {
  private emitter: EventEmitter;
  private redis: Redis;
  
  async publish<T>(event: SystemEvents, payload: T): Promise<void> {
    const eventPayload: EventPayload<T> = {
      eventId: uuidv4(),
      eventType: event,
      timestamp: Date.now(),
      source: this.serviceName,
      data: payload
    };
    
    // Local emission
    this.emitter.emit(event, eventPayload);
    
    // Distributed emission via Redis
    await this.redis.publish(`events:${event}`, JSON.stringify(eventPayload));
    
    // Store in event stream
    await this.storeEvent(eventPayload);
  }
  
  async subscribe(event: SystemEvents, handler: (payload: EventPayload) => void): Promise<void> {
    // Local subscription
    this.emitter.on(event, handler);
    
    // Distributed subscription
    await this.redis.subscribe(`events:${event}`);
    this.redis.on('message', (channel, message) => {
      if (channel === `events:${event}`) {
        handler(JSON.parse(message));
      }
    });
  }
}
```

---

# Core Components Implementation

## 1. Orchestrator Service
```typescript
// src/core/orchestrator/index.ts
import { EventBus } from '../events/EventBus';
import { QueueManager } from '../queue/QueueManager';
import { AgentRegistry } from '../agents/AgentRegistry';
import { MetricsCollector } from '../metrics/MetricsCollector';

export class AutoBazaaarOrchestrator {
  private eventBus: EventBus;
  private queueManager: QueueManager;
  private agentRegistry: AgentRegistry;
  private metrics: MetricsCollector;
  private config: OrchestratorConfig;
  private state: OrchestratorState;
  
  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.eventBus = new EventBus();
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
    
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
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
    console.log('🚀 AutoBazaaar Orchestrator initialized');
  }
  
  private async registerAgents(): Promise<void> {
    // Market Research Agent
    const marketAgent = new MarketResearchAgent({
      browserUse: this.config.browserUse,
      perplexity: this.config.perplexity,
      maxConcurrent: 5
    });
    await this.agentRegistry.register('market-research', marketAgent);
    
    // Deal Analyzer Agent
    const analyzerAgent = new DealAnalyzerAgent({
      mlModel: this.config.mlModel,
      historicalData: this.config.historicalData
    });
    await this.agentRegistry.register('deal-analyzer', analyzerAgent);
    
    // Negotiation Agent
    const negotiationAgent = new NegotiationAgent({
      agentMail: this.config.agentMail,
      openai: this.config.openai,
      hyperspell: this.config.hyperspell
    });
    await this.agentRegistry.register('negotiation', negotiationAgent);
    
    // Listing Agent
    const listingAgent = new ListingAgent({
      browserUse: this.config.browserUse,
      composio: this.config.composio,
      imageOptimizer: this.config.imageOptimizer
    });
    await this.agentRegistry.register('listing', listingAgent);
  }
  
  private setupEventHandlers(): void {
    // Opportunity found - trigger analysis
    this.eventBus.subscribe(SystemEvents.OPPORTUNITY_FOUND, async (event) => {
      await this.queueManager.addJob('analyze-deal', {
        opportunity: event.data,
        priority: this.calculatePriority(event.data)
      });
    });
    
    // Analysis complete - decide action
    this.eventBus.subscribe(SystemEvents.OPPORTUNITY_ANALYZED, async (event) => {
      const analysis = event.data;
      
      if (analysis.recommendation.action === 'BUY' || 
          analysis.recommendation.action === 'NEGOTIATE') {
        await this.queueManager.addJob('start-negotiation', {
          opportunity: analysis.opportunity,
          analysis: analysis,
          strategy: this.selectNegotiationStrategy(analysis)
        });
      }
    });
    
    // Negotiation accepted - execute purchase
    this.eventBus.subscribe(SystemEvents.NEGOTIATION_ACCEPTED, async (event) => {
      await this.queueManager.addJob('execute-purchase', {
        negotiation: event.data,
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
      await this.handleAgentError(event.data);
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
      'update-prices': this.processPriceUpdate.bind(this)
    };
    
    // Register processors
    for (const [queueName, processor] of Object.entries(queueProcessors)) {
      this.queueManager.registerProcessor(queueName, processor, {
        concurrency: this.config.queueConcurrency[queueName] || 3,
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
    setInterval(() => this.scanMarkets(), this.config.scanInterval || 60000);
    setInterval(() => this.updatePrices(), this.config.priceUpdateInterval || 300000);
    setInterval(() => this.checkNegotiations(), this.config.negotiationCheckInterval || 30000);
    setInterval(() => this.optimizeListings(), this.config.listingOptimizeInterval || 3600000);
    
    // Initial scan
    await this.scanMarkets();
  }
  
  private async scanMarkets(): Promise<void> {
    const scanConfig = {
      categories: this.config.targetCategories,
      platforms: this.config.targetPlatforms,
      budget: this.config.maxBudget,
      minProfit: this.config.minProfitMargin
    };
    
    await this.queueManager.addJob('market-scan', scanConfig, {
      priority: 'normal',
      removeOnComplete: true
    });
  }
  
  private async processMarketScan(job: Job): Promise<void> {
    const agent = this.agentRegistry.get('market-research');
    const opportunities = await agent.findOpportunities(job.data);
    
    // Emit events for each opportunity
    for (const opportunity of opportunities) {
      await this.eventBus.publish(SystemEvents.OPPORTUNITY_FOUND, opportunity);
    }
    
    // Update metrics
    this.metrics.record('opportunities.discovered', opportunities.length);
  }
  
  private async processAnalyzeDeal(job: Job): Promise<void> {
    const agent = this.agentRegistry.get('deal-analyzer');
    const analysis = await agent.analyzeDeal(job.data.opportunity);
    
    await this.eventBus.publish(SystemEvents.OPPORTUNITY_ANALYZED, {
      opportunity: job.data.opportunity,
      analysis: analysis
    });
    
    // Store analysis results
    await this.storeAnalysis(analysis);
  }
  
  private async processNegotiation(job: Job): Promise<void> {
    const agent = this.agentRegistry.get('negotiation');
    const result = await agent.initiateNegotiation(
      job.data.opportunity,
      job.data.analysis,
      job.data.strategy
    );
    
    await this.eventBus.publish(SystemEvents.NEGOTIATION_STARTED, result);
  }
  
  private selectNegotiationStrategy(analysis: DealAnalysis): NegotiationStrategy {
    // Dynamic strategy selection based on analysis
    const profitMargin = analysis.profitMargin;
    const urgency = analysis.opportunity.timeRemaining;
    const sellerType = analysis.sellerProfile?.type;
    
    if (profitMargin > 0.5 && urgency < 3600000) {
      return 'URGENT_CASH';
    } else if (sellerType === 'business') {
      return 'PROFESSIONAL_BUYER';
    } else if (analysis.opportunity.category === 'collectibles') {
      return 'COLLECTOR_ENTHUSIAST';
    } else {
      return 'FRIENDLY_LOCAL';
    }
  }
  
  private calculatePriority(opportunity: Opportunity): 'high' | 'normal' | 'low' {
    const profitScore = opportunity.profitScore;
    const timeRemaining = opportunity.expiresAt - Date.now();
    
    if (profitScore > 80 || timeRemaining < 3600000) return 'high';
    if (profitScore > 50) return 'normal';
    return 'low';
  }
  
  private async handleAgentError(error: AgentError): Promise<void> {
    console.error(`Agent error: ${error.agent} - ${error.message}`);
    
    // Log to monitoring
    await this.metrics.recordError(error);
    
    // Retry logic
    if (error.retryable && error.attempts < 3) {
      await this.queueManager.addJob(error.jobType, error.jobData, {
        delay: Math.pow(2, error.attempts) * 1000,
        attempts: error.attempts + 1
      });
    }
    
    // Alert if critical
    if (error.severity === 'critical') {
      await this.alertAdmin(error);
    }
  }
}
```

## 2. Queue Management System
```typescript
// src/core/queue/QueueManager.ts
import Bull from 'bull';
import { Redis } from 'ioredis';

export class QueueManager {
  private queues: Map<string, Bull.Queue>;
  private processors: Map<string, QueueProcessor>;
  private redis: Redis;
  private metrics: QueueMetrics;
  
  constructor(redisConfig: RedisConfig) {
    this.redis = new Redis(redisConfig);
    this.queues = new Map();
    this.processors = new Map();
    this.metrics = new QueueMetrics();
  }
  
  async createQueue(name: string, options?: QueueOptions): Promise<Bull.Queue> {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }
    
    const queue = new Bull(name, {
      redis: this.redis,
      defaultJobOptions: {
        removeOnComplete: options?.removeOnComplete ?? true,
        removeOnFail: options?.removeOnFail ?? false,
        attempts: options?.attempts ?? 3,
        backoff: options?.backoff ?? {
          type: 'exponential',
          delay: 2000
        }
      }
    });
    
    // Setup event listeners
    this.setupQueueListeners(queue);
    
    this.queues.set(name, queue);
    return queue;
  }
  
  async registerProcessor(
    queueName: string,
    processor: ProcessorFunction,
    options?: ProcessorOptions
  ): Promise<void> {
    const queue = await this.createQueue(queueName);
    
    queue.process(options?.concurrency ?? 1, async (job) => {
      const startTime = Date.now();
      
      try {
        // Add context to job
        const context = this.createJobContext(job);
        
        // Execute processor
        const result = await processor(job.data, context);
        
        // Record metrics
        this.metrics.recordSuccess(queueName, Date.now() - startTime);
        
        return result;
      } catch (error) {
        // Record failure
        this.metrics.recordFailure(queueName, error);
        
        // Determine if should retry
        if (this.shouldRetry(error, job)) {
          throw error; // Bull will retry
        } else {
          // Don't retry, mark as failed
          await this.handleFailedJob(job, error);
          return null;
        }
      }
    });
    
    this.processors.set(queueName, { processor, options });
  }
  
  async addJob<T>(
    queueName: string,
    data: T,
    options?: JobOptions
  ): Promise<Bull.Job<T>> {
    const queue = await this.createQueue(queueName);
    
    const job = await queue.add(data, {
      priority: options?.priority === 'high' ? 1 : options?.priority === 'low' ? 3 : 2,
      delay: options?.delay,
      attempts: options?.attempts,
      backoff: options?.backoff,
      removeOnComplete: options?.removeOnComplete,
      removeOnFail: options?.removeOnFail
    });
    
    this.metrics.recordJobAdded(queueName);
    return job;
  }
  
  async addBulkJobs<T>(
    queueName: string,
    jobs: Array<{ data: T; options?: JobOptions }>
  ): Promise<Bull.Job<T>[]> {
    const queue = await this.createQueue(queueName);
    
    const bulkJobs = jobs.map(job => ({
      data: job.data,
      opts: {
        priority: job.options?.priority === 'high' ? 1 : 2,
        delay: job.options?.delay,
        attempts: job.options?.attempts
      }
    }));
    
    return await queue.addBulk(bulkJobs);
  }
  
  private setupQueueListeners(queue: Bull.Queue): void {
    queue.on('completed', (job, result) => {
      console.log(`Job ${job.id} completed in queue ${queue.name}`);
      this.metrics.recordCompletion(queue.name);
    });
    
    queue.on('failed', (job, error) => {
      console.error(`Job ${job.id} failed in queue ${queue.name}:`, error);
      this.metrics.recordFailure(queue.name, error);
    });
    
    queue.on('stalled', (job) => {
      console.warn(`Job ${job.id} stalled in queue ${queue.name}`);
      this.metrics.recordStalled(queue.name);
    });
    
    queue.on('progress', (job, progress) => {
      console.log(`Job ${job.id} progress: ${progress}%`);
    });
  }
  
  private createJobContext(job: Bull.Job): JobContext {
    return {
      jobId: job.id.toString(),
      attemptNumber: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts || 3,
      queue: job.queue.name,
      timestamp: Date.now(),
      updateProgress: (progress: number) => job.progress(progress),
      log: (message: string) => job.log(message)
    };
  }
  
  private shouldRetry(error: any, job: Bull.Job): boolean {
    // Don't retry if max attempts reached
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      return false;
    }
    
    // Don't retry on certain errors
    const nonRetryableErrors = [
      'INVALID_INPUT',
      'AUTHENTICATION_FAILED',
      'INSUFFICIENT_FUNDS',
      'ITEM_NOT_FOUND'
    ];
    
    if (error.code && nonRetryableErrors.includes(error.code)) {
      return false;
    }
    
    // Retry on network errors
    const retryableErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'RATE_LIMIT',
      'SERVICE_UNAVAILABLE'
    ];
    
    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }
    
    // Default to retry
    return true;
  }
  
  async getQueueStatus(queueName: string): Promise<QueueStatus> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused()
    ]);
    
    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      metrics: this.metrics.getQueueMetrics(queueName)
    };
  }
  
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) await queue.pause();
  }
  
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) await queue.resume();
  }
  
  async drainQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) await queue.empty();
  }
}
```

---

# Agent Implementations

## 1. Market Research Agent (Complete Implementation)
```typescript
// src/agents/MarketResearchAgent.ts
import { BrowserUse } from '@browser-use/sdk';
import { PerplexityAPI } from '@perplexity/sdk';
import { Page } from 'puppeteer';
import pLimit from 'p-limit';
import { z } from 'zod';

const ScrapedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  description: z.string().optional(),
  url: z.string().url(),
  images: z.array(z.string().url()),
  location: z.string().optional(),
  seller: z.object({
    id: z.string(),
    name: z.string().optional(),
    rating: z.number().optional(),
    responseTime: z.string().optional()
  }),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']).optional(),
  category: z.string(),
  platform: z.string(),
  listingDate: z.date(),
  views: z.number().optional(),
  watchers: z.number().optional()
});

export class MarketResearchAgent {
  private browserUse: BrowserUse;
  private perplexity: PerplexityAPI;
  private limit: pLimit;
  private cache: Map<string, CachedResult>;
  private proxies: string[];
  private currentProxyIndex: number = 0;
  
  constructor(config: MarketResearchConfig) {
    this.browserUse = new BrowserUse({
      apiKey: config.browserUseKey,
      headless: config.headless ?? true,
      defaultTimeout: 30000,
      viewport: { width: 1920, height: 1080 }
    });
    
    this.perplexity = new PerplexityAPI({
      apiKey: config.perplexityKey
    });
    
    this.limit = pLimit(config.maxConcurrent || 5);
    this.cache = new Map();
    this.proxies = config.proxies || [];
  }
  
  async findOpportunities(params: SearchParams): Promise<EnrichedOpportunity[]> {
    const searchTasks = this.createSearchTasks(params);
    
    // Execute searches in parallel with rate limiting
    const searchResults = await Promise.allSettled(
      searchTasks.map(task => 
        this.limit(() => this.executeSearch(task))
      )
    );
    
    // Aggregate successful results
    const allItems = searchResults
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value as ScrapedItem[]);
    
    // Deduplicate items
    const uniqueItems = this.deduplicateItems(allItems);
    
    // Enrich with market data
    const enrichedItems = await this.enrichItems(uniqueItems, params);
    
    // Filter and rank
    const opportunities = this.filterAndRank(enrichedItems, params);
    
    // Store in cache
    this.updateCache(opportunities);
    
    return opportunities;
  }
  
  private createSearchTasks(params: SearchParams): SearchTask[] {
    const tasks: SearchTask[] = [];
    
    for (const platform of params.platforms || ['facebook', 'craigslist', 'ebay']) {
      for (const category of params.categories || ['electronics']) {
        tasks.push({
          platform,
          category,
          location: params.location,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          sortBy: params.sortBy || 'newest',
          limit: params.itemsPerPlatform || 50
        });
      }
    }
    
    return tasks;
  }
  
  private async executeSearch(task: SearchTask): Promise<ScrapedItem[]> {
    switch (task.platform) {
      case 'facebook':
        return await this.scrapeFacebookMarketplace(task);
      case 'craigslist':
        return await this.scrapeCraigslist(task);
      case 'ebay':
        return await this.scrapeEbay(task);
      case 'mercari':
        return await this.scrapeMercari(task);
      case 'offerup':
        return await this.scrapeOfferUp(task);
      default:
        throw new Error(`Unsupported platform: ${task.platform}`);
    }
  }
  
  private async scrapeFacebookMarketplace(task: SearchTask): Promise<ScrapedItem[]> {
    const session = await this.browserUse.newSession({
      proxy: this.getNextProxy()
    });
    
    try {
      const page = session.page;
      
      // Navigate to Facebook Marketplace
      await page.goto('https://www.facebook.com/marketplace', {
        waitUntil: 'networkidle2'
      });
      
      // Handle login if needed
      if (await page.$('input[name="email"]')) {
        await this.handleFacebookLogin(page);
      }
      
      // Apply search filters
      await this.applyFacebookFilters(page, task);
      
      // Scroll and collect items
      const items: ScrapedItem[] = [];
      let previousHeight = 0;
      let scrollAttempts = 0;
      
      while (items.length < task.limit && scrollAttempts < 10) {
        // Extract visible items
        const newItems = await page.evaluate(() => {
          const products: any[] = [];
          
          document.querySelectorAll('[data-testid="marketplace-feed-item"]').forEach(el => {
            const link = el.querySelector('a')?.getAttribute('href');
            if (!link) return;
            
            const title = el.querySelector('[class*="title"]')?.textContent?.trim();
            const priceText = el.querySelector('[class*="price"]')?.textContent;
            const price = priceText ? parseInt(priceText.replace(/\D/g, '')) : null;
            const image = el.querySelector('img')?.src;
            const location = el.querySelector('[class*="location"]')?.textContent?.trim();
            const timeText = el.querySelector('[class*="time"]')?.textContent?.trim();
            
            if (title && price) {
              products.push({
                id: link.split('/').pop()?.split('?')[0] || '',
                title,
                price,
                url: `https://www.facebook.com${link}`,
                images: image ? [image] : [],
                location,
                platform: 'facebook',
                listingDate: timeText || new Date().toISOString(),
                seller: {
                  id: 'unknown',
                  name: el.querySelector('[class*="seller"]')?.textContent?.trim()
                }
              });
            }
          });
          
          return products;
        });
        
        // Add new unique items
        for (const item of newItems) {
          if (!items.find(i => i.id === item.id)) {
            items.push(this.validateScrapedItem(item));
          }
        }
        
        // Scroll for more items
        const currentHeight = await page.evaluate('document.body.scrollHeight');
        if (currentHeight === previousHeight) {
          scrollAttempts++;
        } else {
          scrollAttempts = 0;
        }
        
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await this.randomDelay(2000, 4000);
        previousHeight = currentHeight;
      }
      
      // Get detailed info for top items
      const detailedItems = await this.getDetailedInfo(page, items.slice(0, 20));
      
      return detailedItems;
      
    } catch (error) {
      console.error('Facebook scraping error:', error);
      return [];
    } finally {
      await session.close();
    }
  }
  
  private async scrapeCraigslist(task: SearchTask): Promise<ScrapedItem[]> {
    const session = await this.browserUse.newSession({
      proxy: this.getNextProxy()
    });
    
    try {
      const page = session.page;
      const location = task.location || 'sfbay';
      const category = this.mapCategoryToCraigslist(task.category);
      
      // Build search URL
      const searchUrl = `https://${location}.craigslist.org/search/${category}?` + 
        `min_price=${task.minPrice || ''}&max_price=${task.maxPrice || ''}&sort=date`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // Extract listings
      const listings = await page.evaluate(() => {
        const items: any[] = [];
        
        document.querySelectorAll('.result-row').forEach(row => {
          const link = row.querySelector('.result-title')?.getAttribute('href');
          const title = row.querySelector('.result-title')?.textContent?.trim();
          const priceText = row.querySelector('.result-price')?.textContent;
          const price = priceText ? parseInt(priceText.replace(/\D/g, '')) : null;
          const location = row.querySelector('.result-hood')?.textContent?.trim();
          const dateText = row.querySelector('.result-date')?.getAttribute('datetime');
          const image = row.querySelector('.result-image img')?.getAttribute('src');
          
          if (title && price && link) {
            items.push({
              id: row.getAttribute('data-pid') || '',
              title,
              price,
              url: link.startsWith('http') ? link : `https://sfbay.craigslist.org${link}`,
              images: image ? [image] : [],
              location: location?.replace(/[()]/g, '').trim(),
              platform: 'craigslist',
              listingDate: dateText || new Date().toISOString(),
              seller: {
                id: 'cl-' + (row.getAttribute('data-pid') || ''),
                name: 'Craigslist User'
              },
              category: 'electronics'
            });
          }
        });
        
        return items;
      });
      
      // Get details for top listings
      const detailedItems = await this.getCraigslistDetails(page, listings.slice(0, 30));
      
      return detailedItems.map(item => this.validateScrapedItem(item));
      
    } catch (error) {
      console.error('Craigslist scraping error:', error);
      return [];
    } finally {
      await session.close();
    }
  }
  
  private async scrapeEbay(task: SearchTask): Promise<ScrapedItem[]> {
    const session = await this.browserUse.newSession({
      proxy: this.getNextProxy()
    });
    
    try {
      const page = session.page;
      
      // Build eBay search URL
      const searchUrl = new URL('https://www.ebay.com/sch/i.html');
      searchUrl.searchParams.set('_nkw', task.category);
      searchUrl.searchParams.set('_sop', '10'); // Newly listed
      searchUrl.searchParams.set('LH_BIN', '1'); // Buy It Now only
      searchUrl.searchParams.set('_udhi', task.maxPrice?.toString() || '');
      searchUrl.searchParams.set('_udlo', task.minPrice?.toString() || '');
      
      await page.goto(searchUrl.toString(), { waitUntil: 'networkidle2' });
      
      // Extract listings
      const listings = await page.evaluate(() => {
        const items: any[] = [];
        
        document.querySelectorAll('.s-item').forEach(item => {
          const link = item.querySelector('.s-item__link')?.getAttribute('href');
          const title = item.querySelector('.s-item__title')?.textContent?.trim();
          const priceText = item.querySelector('.s-item__price')?.textContent;
          const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : null;
          const image = item.querySelector('.s-item__image img')?.getAttribute('src');
          const shippingText = item.querySelector('.s-item__shipping')?.textContent;
          const sellerInfo = item.querySelector('.s-item__seller-info-text')?.textContent;
          const watchers = item.querySelector('.s-item__watchcount')?.textContent;
          
          if (title && price && link) {
            const itemId = link.split('/').pop()?.split('?')[0] || '';
            
            items.push({
              id: itemId,
              title: title.replace('New Listing', '').trim(),
              price,
              url: link,
              images: image ? [image] : [],
              shipping: shippingText || 'Calculate',
              seller: {
                id: 'ebay-seller',
                name: sellerInfo?.split('(')[0]?.trim(),
                rating: sellerInfo?.match(/\((\d+)\)/)?.[1]
              },
              watchers: watchers ? parseInt(watchers.replace(/\D/g, '')) : 0,
              platform: 'ebay',
              listingDate: new Date().toISOString(),
              category: 'electronics'
            });
          }
        });
        
        return items;
      });
      
      return listings.slice(0, task.limit).map(item => this.validateScrapedItem(item));
      
    } catch (error) {
      console.error('eBay scraping error:', error);
      return [];
    } finally {
      await session.close();
    }
  }
  
  private async enrichItems(
    items: ScrapedItem[],
    params: SearchParams
  ): Promise<EnrichedOpportunity[]> {
    const enrichmentTasks = items.map(item => 
      this.limit(() => this.enrichSingleItem(item))
    );
    
    const enrichedResults = await Promise.allSettled(enrichmentTasks);
    
    return enrichedResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value as EnrichedOpportunity);
  }
  
  private async enrichSingleItem(item: ScrapedItem): Promise<EnrichedOpportunity> {
    // Get market data from Perplexity
    const marketQuery = `${item.title} current market price resale value 2024 ${item.category}`;
    
    const [marketData, demandData] = await Promise.all([
      this.perplexity.search({
        query: marketQuery,
        focus: 'commerce',
        recency_filter: '1month'
      }),
      this.perplexity.search({
        query: `${item.title} "selling fast" "high demand" "sold out" popularity`,
        focus: 'commerce',
        recency_filter: '1week'
      })
    ]);
    
    // Extract insights
    const marketPrices = this.extractPricesFromText(marketData.answer);
    const avgMarketPrice = this.calculateAverage(marketPrices) || item.price * 1.4;
    const demandScore = this.calculateDemandScore(demandData.answer);
    const priceVolatility = this.calculateVolatility(marketPrices);
    
    // Calculate profit metrics
    const profitPotential = avgMarketPrice - item.price;
    const profitMargin = (profitPotential / item.price) * 100;
    const roi = ((avgMarketPrice - item.price) / item.price) * 100;
    
    // Risk assessment
    const riskScore = this.calculateRiskScore({
      volatility: priceVolatility,
      demandScore,
      profitMargin,
      platform: item.platform,
      sellerRating: item.seller.rating
    });
    
    // Calculate final profit score
    const profitScore = this.calculateProfitScore({
      profitMargin,
      demandScore,
      riskScore,
      timeOnMarket: this.calculateTimeOnMarket(item.listingDate)
    });
    
    return {
      ...item,
      marketData: {
        averagePrice: avgMarketPrice,
        pricePoints: marketPrices,
        volatility: priceVolatility,
        demandScore,
        competitorCount: marketPrices.length,
        insights: this.extractInsights(marketData.answer)
      },
      profitAnalysis: {
        purchasePrice: item.price,
        estimatedSalePrice: avgMarketPrice,
        profitPotential,
        profitMargin,
        roi,
        platformFees: this.calculatePlatformFees(avgMarketPrice, item.platform),
        netProfit: profitPotential - this.calculatePlatformFees(avgMarketPrice, item.platform)
      },
      riskAssessment: {
        score: riskScore,
        factors: this.getRiskFactors(item, marketData),
        recommendation: this.getRecommendation(profitScore, riskScore)
      },
      profitScore,
      enrichedAt: new Date()
    };
  }
  
  private extractPricesFromText(text: string): number[] {
    const priceRegex = /\$([0-9,]+(?:\.[0-9]{2})?)/g;
    const matches = text.matchAll(priceRegex);
    const prices: number[] = [];
    
    for (const match of matches) {
      const price = parseFloat(match[1].replace(',', ''));
      if (price > 0 && price < 1000000) {
        prices.push(price);
      }
    }
    
    return prices;
  }
  
  private calculateDemandScore(text: string): number {
    const demandKeywords = {
      high: ['selling fast', 'high demand', 'sold out', 'popular', 'hot item', 'trending'],
      medium: ['good demand', 'selling well', 'interested', 'moderate demand'],
      low: ['slow', 'low demand', 'sitting', 'not moving', 'oversupplied']
    };
    
    let score = 0.5; // Base score
    
    for (const keyword of demandKeywords.high) {
      if (text.toLowerCase().includes(keyword)) score += 0.1;
    }
    
    for (const keyword of demandKeywords.low) {
      if (text.toLowerCase().includes(keyword)) score -= 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  private calculateRiskScore(factors: RiskFactors): number {
    let risk = 0;
    
    // Volatility risk
    if (factors.volatility > 0.3) risk += 0.2;
    if (factors.volatility > 0.5) risk += 0.2;
    
    // Demand risk
    if (factors.demandScore < 0.3) risk += 0.2;
    
    // Platform risk
    const platformRisk = {
      'craigslist': 0.3,  // Higher risk - cash deals
      'facebook': 0.2,    // Medium risk
      'ebay': 0.1,        // Lower risk - buyer protection
      'mercari': 0.15,
      'offerup': 0.25
    };
    risk += platformRisk[factors.platform] || 0.2;
    
    // Seller risk
    if (!factors.sellerRating || factors.sellerRating < 4) risk += 0.1;
    
    // Profit margin risk
    if (factors.profitMargin < 20) risk += 0.2;
    
    return Math.min(1, risk);
  }
  
  private calculateProfitScore(factors: any): number {
    // Weighted scoring
    const weights = {
      profitMargin: 0.4,
      demandScore: 0.3,
      risk: 0.2,
      timeOnMarket: 0.1
    };
    
    const scores = {
      profitMargin: Math.min(factors.profitMargin / 100, 1),
      demandScore: factors.demandScore,
      risk: 1 - factors.riskScore,
      timeOnMarket: Math.max(0, 1 - (factors.timeOnMarket / 86400000)) // Decay over 24h
    };
    
    return Object.keys(weights).reduce((total, key) => {
      return total + (weights[key] * scores[key]);
    }, 0) * 100;
  }
  
  private filterAndRank(
    items: EnrichedOpportunity[],
    params: SearchParams
  ): EnrichedOpportunity[] {
    // Apply filters
    const filtered = items.filter(item => {
      if (params.minProfit && item.profitAnalysis.netProfit < params.minProfit) return false;
      if (params.minProfitMargin && item.profitAnalysis.profitMargin < params.minProfitMargin) return false;
      if (params.maxRisk && item.riskAssessment.score > params.maxRisk) return false;
      if (params.minDemand && item.marketData.demandScore < params.minDemand) return false;
      return true;
    });
    
    // Sort by profit score
    return filtered.sort((a, b) => b.profitScore - a.profitScore);
  }
  
  private getNextProxy(): string | undefined {
    if (this.proxies.length === 0) return undefined;
    
    const proxy = this.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return proxy;
  }
  
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  private validateScrapedItem(item: any): ScrapedItem {
    try {
      return ScrapedItemSchema.parse(item);
    } catch (error) {
      // Provide defaults for missing fields
      return {
        id: item.id || `${item.platform}-${Date.now()}`,
        title: item.title || 'Unknown Item',
        price: item.price || 0,
        url: item.url || '',
        images: item.images || [],
        platform: item.platform || 'unknown',
        listingDate: item.listingDate ? new Date(item.listingDate) : new Date(),
        seller: item.seller || { id: 'unknown' },
        category: item.category || 'general',
        ...item
      };
    }
  }
}
```

## 2. Negotiation Agent (Advanced Email System)
```typescript
// src/agents/NegotiationAgent.ts
import { AgentMail } from '@agentmail/sdk';
import { OpenAI } from 'openai';
import { Hyperspell } from '@hyperspell/client';
import { z } from 'zod';
import { EventEmitter } from 'events';

export class NegotiationAgent extends EventEmitter {
  private agentMail: AgentMail;
  private openai: OpenAI;
  private hyperspell: Hyperspell;
  private activeThreads: Map<string, NegotiationThread>;
  private strategies: Map<string, NegotiationStrategy>;
  private templates: EmailTemplateEngine;
  private responseAnalyzer: ResponseAnalyzer;
  
  constructor(config: NegotiationConfig) {
    super();
    
    this.agentMail = new AgentMail({
      apiKey: config.agentMailKey,
      fromEmail: config.fromEmail || 'deals@autobazaaar.com',
      fromName: config.fromName || 'Alex from AutoBazaaar',
      trackOpens: true,
      trackClicks: true,
      webhookUrl: config.webhookUrl
    });
    
    this.openai = new OpenAI({
      apiKey: config.openaiKey
    });
    
    this.hyperspell = new Hyperspell({
      apiKey: config.hyperspellKey,
      namespace: 'negotiations'
    });
    
    this.activeThreads = new Map();
    this.strategies = this.loadStrategies();
    this.templates = new EmailTemplateEngine(this.openai);
    this.responseAnalyzer = new ResponseAnalyzer(this.openai);
    
    this.setupWebhooks();
    this.startMonitoring();
  }
  
  async initiateNegotiation(
    opportunity: EnrichedOpportunity,
    analysis: DealAnalysis,
    strategyName?: string
  ): Promise<NegotiationResult> {
    // Select strategy
    const strategy = strategyName 
      ? this.strategies.get(strategyName)
      : this.selectOptimalStrategy(opportunity, analysis);
    
    if (!strategy) {
      throw new Error('No suitable negotiation strategy found');
    }
    
    // Get seller contact info
    const sellerContact = await this.extractSellerContact(opportunity);
    
    // Retrieve seller history
    const sellerHistory = await this.getSellerHistory(sellerContact);
    
    // Generate personalized email
    const emailContent = await this.generateInitialEmail(
      opportunity,
      analysis,
      strategy,
      sellerHistory
    );
    
    // Send email
    const emailResult = await this.agentMail.send({
      to: sellerContact.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      headers: {
        'X-Opportunity-ID': opportunity.id,
        'X-Strategy': strategy.name,
        'X-Round': '1'
      },
      scheduleSend: this.calculateOptimalSendTime(sellerHistory),
      trackingSettings: {
        opens: true,
        clicks: true,
        unsubscribe: false
      }
    });
    
    // Create negotiation thread
    const thread: NegotiationThread = {
      id: emailResult.messageId,
      opportunityId: opportunity.id,
      strategy: strategy.name,
      sellerContact,
      rounds: [{
        number: 1,
        timestamp: new Date(),
        type: 'initial_offer',
        ourOffer: this.calculateInitialOffer(opportunity.price, strategy),
        message: emailContent.text,
        messageId: emailResult.messageId,
        status: 'sent'
      }],
      status: 'active',
      currentOffer: this.calculateInitialOffer(opportunity.price, strategy),
      maxAcceptable: analysis.recommendation.maxPrice,
      metrics: {
        responseTime: null,
        openTime: null,
        clickCount: 0
      }
    };
    
    // Store thread
    this.activeThreads.set(thread.id, thread);
    
    // Store in memory system
    await this.storeNegotiationMemory(thread);
    
    // Schedule follow-up
    this.scheduleFollowUp(thread, strategy);
    
    // Emit event
    this.emit('negotiation:started', thread);
    
    return {
      success: true,
      threadId: thread.id,
      initialOffer: thread.currentOffer,
      strategy: strategy.name
    };
  }
  
  private async generateInitialEmail(
    opportunity: EnrichedOpportunity,
    analysis: DealAnalysis,
    strategy: NegotiationStrategy,
    sellerHistory: SellerHistory
  ): Promise<EmailContent> {
    // Build context
    const context = {
      item: {
        title: opportunity.title,
        price: opportunity.price,
        condition: opportunity.condition,
        location: opportunity.location,
        platform: opportunity.platform,
        listingAge: this.calculateListingAge(opportunity.listingDate)
      },
      offer: {
        amount: this.calculateInitialOffer(opportunity.price, strategy),
        justification: this.generateOfferJustification(opportunity, analysis),
        urgency: strategy.urgencyLevel
      },
      buyer: {
        persona: strategy.buyerPersona,
        tone: strategy.communicationTone,
        approach: strategy.approachStyle
      },
      seller: {
        previousInteractions: sellerHistory.interactions,
        responseRate: sellerHistory.responseRate,
        averageDiscount: sellerHistory.averageDiscount,
        preferredStyle: sellerHistory.preferredCommunicationStyle
      }
    };
    
    // Generate with GPT-4
    const systemPrompt = this.buildSystemPrompt(strategy);
    const userPrompt = this.buildUserPrompt(context);
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: strategy.creativity || 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });
    
    const response = JSON.parse(completion.choices[0].message.content!);
    
    // Apply template
    const formatted = await this.templates.format(response, strategy.templateName);
    
    return {
      subject: response.subject,
      html: formatted.html,
      text: formatted.text,
      preview: response.preview
    };
  }
  
  private buildSystemPrompt(strategy: NegotiationStrategy): string {
    return `You are an expert negotiator using the ${strategy.name} strategy.
    
    Persona: ${strategy.buyerPersona}
    Tone: ${strategy.communicationTone}
    Approach: ${strategy.approachStyle}
    
    Key tactics:
    ${strategy.tactics.map(t => `- ${t}`).join('\n')}
    
    Generate an email that:
    1. Shows genuine interest in the item
    2. Builds rapport with the seller
    3. Presents a compelling offer
    4. Creates appropriate urgency
    5. Leaves room for negotiation
    6. Maintains authenticity
    
    Output JSON with:
    - subject: Compelling subject line (max 60 chars)
    - preview: Email preview text (max 100 chars)
    - greeting: Personalized greeting
    - opening: Opening statement showing interest
    - offer: The offer paragraph with justification
    - urgency: Urgency/scarcity element
    - closing: Call to action
    - signature: Sign-off`;
  }
  
  async handleIncomingEmail(email: IncomingEmail): Promise<void> {
    // Find associated thread
    const thread = this.findThreadByEmail(email);
    if (!thread) {
      await this.handleColdInbound(email);
      return;
    }
    
    // Analyze response
    const analysis = await this.responseAnalyzer.analyze(email, thread);
    
    // Update thread metrics
    thread.metrics.responseTime = Date.now() - thread.rounds[thread.rounds.length - 1].timestamp.getTime();
    
    // Process based on analysis
    switch (analysis.intent) {
      case 'ACCEPT':
        await this.handleAcceptance(thread, analysis);
        break;
        
      case 'COUNTER':
        await this.handleCounterOffer(thread, analysis);
        break;
        
      case 'REJECT':
        await this.handleRejection(thread, analysis);
        break;
        
      case 'QUESTION':
        await this.handleQuestion(thread, analysis);
        break;
        
      case 'NEGOTIATE':
        await this.handleNegotiation(thread, analysis);
        break;
        
      default:
        await this.handleUnclear(thread, analysis);
    }
    
    // Update memory
    await this.updateNegotiationMemory(thread);
    
    // Emit event
    this.emit('negotiation:updated', thread);
  }
  
  private async handleCounterOffer(
    thread: NegotiationThread,
    analysis: ResponseAnalysis
  ): Promise<void> {
    const strategy = this.strategies.get(thread.strategy)!;
    const counterPrice = analysis.extractedPrice!;
    
    // Decision logic
    let response: EmailContent;
    let newStatus: string;
    
    if (counterPrice <= thread.maxAcceptable) {
      // Accept the counter
      response = await this.generateAcceptanceEmail(thread, counterPrice);
      newStatus = 'accepted';
      thread.finalPrice = counterPrice;
      
    } else if (counterPrice <= thread.maxAcceptable * 1.1 && thread.rounds.length < 3) {
      // Make another counter offer
      const newOffer = this.calculateCounterOffer(
        thread.currentOffer,
        counterPrice,
        thread.maxAcceptable,
        thread.rounds.length
      );
      
      response = await this.generateCounterEmail(thread, newOffer, analysis);
      thread.currentOffer = newOffer;
      newStatus = 'negotiating';
      
    } else if (thread.rounds.length >= strategy.maxRounds) {
      // Final offer
      response = await this.generateFinalOfferEmail(thread);
      newStatus = 'final_offer';
      
    } else {
      // Continue negotiating
      const newOffer = this.calculateStrategicOffer(thread, counterPrice);
      response = await this.generateNegotiationEmail(thread, newOffer, analysis);
      thread.currentOffer = newOffer;
      newStatus = 'negotiating';
    }
    
    // Send response
    const emailResult = await this.agentMail.reply({
      threadId: thread.id,
      ...response,
      headers: {
        'X-Round': (thread.rounds.length + 1).toString()
      }
    });
    
    // Update thread
    thread.rounds.push({
      number: thread.rounds.length + 1,
      timestamp: new Date(),
      type: 'counter_response',
      theirOffer: counterPrice,
      ourOffer: thread.currentOffer,
      message: response.text,
      messageId: emailResult.messageId,
      status: newStatus
    });
    
    thread.status = newStatus;
  }
  
  private calculateCounterOffer(
    currentOffer: number,
    theirCounter: number,
    maxAcceptable: number,
    roundNumber: number
  ): number {
    // Progressive negotiation algorithm
    const gap = theirCounter - currentOffer;
    const remainingBudget = maxAcceptable - currentOffer;
    const roundMultiplier = 1 - (roundNumber * 0.1); // Decrease flexibility over rounds
    
    let newOffer: number;
    
    if (gap <= 50) {
      // Small gap - meet closer to middle
      newOffer = currentOffer + (gap * 0.6);
    } else if (gap <= 100) {
      // Medium gap - move moderately
      newOffer = currentOffer + (gap * 0.4 * roundMultiplier);
    } else {
      // Large gap - move conservatively
      newOffer = currentOffer + Math.min(gap * 0.3 * roundMultiplier, remainingBudget * 0.5);
    }
    
    // Ensure we don't exceed max
    return Math.min(newOffer, maxAcceptable);
  }
  
  private async generateCounterEmail(
    thread: NegotiationThread,
    newOffer: number,
    analysis: ResponseAnalysis
  ): Promise<EmailContent> {
    const strategy = this.strategies.get(thread.strategy)!;
    
    const prompt = `Generate a counter-offer email:
    
    Context:
    - Their counter: $${analysis.extractedPrice}
    - Our new offer: $${newOffer}
    - Round: ${thread.rounds.length + 1}
    - Strategy: ${strategy.name}
    - Their sentiment: ${analysis.sentiment}
    - Their concerns: ${analysis.extractedConcerns?.join(', ')}
    
    Requirements:
    1. Acknowledge their counter professionally
    2. Justify our new offer with specific reasons
    3. Show flexibility but maintain boundaries
    4. Address any concerns they raised
    5. Keep momentum toward closing
    6. Tone: ${strategy.communicationTone}
    
    Previous message excerpt: "${analysis.messageExcerpt}"`;
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: this.buildSystemPrompt(strategy) },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    
    const response = JSON.parse(completion.choices[0].message.content!);
    return this.templates.format(response, 'counter_offer');
  }
  
  private async scheduleFollowUp(
    thread: NegotiationThread,
    strategy: NegotiationStrategy
  ): Promise<void> {
    const delay = this.calculateFollowUpDelay(thread, strategy);
    
    setTimeout(async () => {
      // Check if still active and no response
      if (thread.status === 'active' && !thread.lastResponseTime) {
        const followUp = await this.generateFollowUpEmail(thread);
        
        await this.agentMail.send({
          threadId: thread.id,
          ...followUp
        });
        
        thread.rounds.push({
          number: thread.rounds.length + 1,
          timestamp: new Date(),
          type: 'follow_up',
          message: followUp.text,
          status: 'sent'
        });
        
        // Schedule another follow-up if configured
        if (strategy.maxFollowUps > 1 && thread.followUpCount < strategy.maxFollowUps) {
          thread.followUpCount = (thread.followUpCount || 0) + 1;
          this.scheduleFollowUp(thread, strategy);
        }
      }
    }, delay);
  }
  
  private loadStrategies(): Map<string, NegotiationStrategy> {
    const strategies = new Map();
    
    // Friendly Local Buyer
    strategies.set('FRIENDLY_LOCAL', {
      name: 'FRIENDLY_LOCAL',
      buyerPersona: 'Friendly neighbor looking for a good deal',
      communicationTone: 'casual, warm, personable',
      approachStyle: 'build rapport, emphasize convenience, mention local pickup',
      tactics: [
        'Mention you live/work nearby',
        'Emphasize quick and easy transaction',
        'Offer cash payment',
        'Be flexible on pickup time',
        'Share a relevant personal detail'
      ],
      openingOffer: 0.7,  // 70% of asking
      maxOffer: 0.85,     // 85% max
      incrementSize: 0.05,
      urgencyLevel: 'low',
      maxRounds: 4,
      followUpDelay: 24 * 60 * 60 * 1000, // 24 hours
      maxFollowUps: 2,
      creativity: 0.7,
      templateName: 'friendly_casual'
    });
    
    // Professional Buyer
    strategies.set('PROFESSIONAL_BUYER', {
      name: 'PROFESSIONAL_BUYER',
      buyerPersona: 'Professional buyer for business use',
      communicationTone: 'formal, respectful, businesslike',
      approachStyle: 'emphasize bulk potential, quick decision, reliable buyer',
      tactics: [
        'Mention business/professional use',
        'Hint at repeat business potential',
        'Emphasize prompt payment',
        'Request invoice/receipt',
        'Professional email signature'
      ],
      openingOffer: 0.65,
      maxOffer: 0.8,
      incrementSize: 0.05,
      urgencyLevel: 'medium',
      maxRounds: 3,
      followUpDelay: 12 * 60 * 60 * 1000, // 12 hours
      maxFollowUps: 1,
      creativity: 0.5,
      templateName: 'professional'
    });
    
    // Urgent Cash Buyer
    strategies.set('URGENT_CASH', {
      name: 'URGENT_CASH',
      buyerPersona: 'Buyer with immediate need and cash ready',
      communicationTone: 'direct, urgent, decisive',
      approachStyle: 'emphasize immediate purchase, cash in hand, no hassle',
      tactics: [
        'Stress immediate availability',
        'Mention cash in hand',
        'Can pickup within hours',
        'No need for lengthy discussion',
        'Create time pressure'
      ],
      openingOffer: 0.6,
      maxOffer: 0.75,
      incrementSize: 0.075,
      urgencyLevel: 'high',
      maxRounds: 2,
      followUpDelay: 2 * 60 * 60 * 1000, // 2 hours
      maxFollowUps: 1,
      creativity: 0.6,
      templateName: 'urgent'
    });
    
    // Collector/Enthusiast
    strategies.set('COLLECTOR', {
      name: 'COLLECTOR',
      buyerPersona: 'Passionate collector or enthusiast',
      communicationTone: 'knowledgeable, enthusiastic, appreciative',
      approachStyle: 'show expertise, appreciate item value, build connection',
      tactics: [
        'Demonstrate knowledge about item',
        'Mention collection or specific use',
        'Appreciate condition/rarity',
        'Share enthusiasm for the item',
        'Offer to preserve/care for item'
      ],
      openingOffer: 0.75,
      maxOffer: 0.9,
      incrementSize: 0.05,
      urgencyLevel: 'low',
      maxRounds: 5,
      followUpDelay: 48 * 60 * 60 * 1000, // 48 hours
      maxFollowUps: 3,
      creativity: 0.8,
      templateName: 'enthusiast'
    });
    
    return strategies;
  }
}

// Response Analyzer
class ResponseAnalyzer {
  constructor(private openai: OpenAI) {}
  
  async analyze(email: IncomingEmail, thread: NegotiationThread): Promise<ResponseAnalysis> {
    const prompt = `Analyze this negotiation response:
    
    Original listing price: $${thread.opportunity.price}
    Our last offer: $${thread.currentOffer}
    Email subject: ${email.subject}
    Email body: ${email.text}
    
    Extract and determine:
    1. Intent: ACCEPT, COUNTER, REJECT, QUESTION, NEGOTIATE, UNCLEAR
    2. If counter-offer, extract exact price
    3. Sentiment: positive, neutral, negative
    4. Key concerns or objections mentioned
    5. Urgency indicators
    6. Decision factors they mention
    7. Their negotiation style
    
    Output as JSON.`;
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const analysis = JSON.parse(completion.choices[0].message.content!);
    
    return {
      intent: analysis.intent,
      extractedPrice: analysis.price,
      sentiment: analysis.sentiment,
      extractedConcerns: analysis.concerns,
      urgencyLevel: analysis.urgency,
      decisionFactors: analysis.factors,
      negotiationStyle: analysis.style,
      confidence: analysis.confidence,
      messageExcerpt: email.text.substring(0, 200)
    };
  }
}

// Email Template Engine
class EmailTemplateEngine {
  private templates: Map<string, EmailTemplate>;
  
  constructor(private openai: OpenAI) {
    this.templates = this.loadTemplates();
  }
  
  async format(content: any, templateName: string): Promise<FormattedEmail> {
    const template = this.templates.get(templateName) || this.templates.get('default')!;
    
    const html = this.renderHTML(content, template);
    const text = this.renderText(content, template);
    
    return { html, text };
  }
  
  private renderHTML(content: any, template: EmailTemplate): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ${template.fontFamily}; color: ${template.textColor}; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${template.headerColor}; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 20px; border: 1px solid #e0e0e0; }
    .offer { background: #f0f8ff; padding: 15px; border-left: 4px solid #4169e1; margin: 20px 0; }
    .cta { background: ${template.ctaColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>${content.greeting}</p>
      <p>${content.opening}</p>
      <div class="offer">${content.offer}</div>
      <p>${content.urgency}</p>
      <p>${content.closing}</p>
      <a href="mailto:deals@autobazaaar.com?subject=Re: ${content.subject}" class="cta">Reply to Accept</a>
      <p>${content.signature}</p>
    </div>
    <div class="footer">
      ${template.footer}
    </div>
  </div>
</body>
</html>`;
  }
  
  private renderText(content: any, template: EmailTemplate): string {
    return `${content.greeting}

${content.opening}

${content.offer}

${content.urgency}

${content.closing}

${content.signature}

${template.footer}`;
  }
  
  private loadTemplates(): Map<string, EmailTemplate> {
    // Define templates for different strategies
    const templates = new Map();
    
    templates.set('friendly_casual', {
      fontFamily: 'Arial, sans-serif',
      headerColor: '#4CAF50',
      textColor: '#333',
      ctaColor: '#4CAF50',
      footer: 'Sent from my iPhone'
    });
    
    templates.set('professional', {
      fontFamily: 'Helvetica, Arial, sans-serif',
      headerColor: '#2C3E50',
      textColor: '#2C3E50',
      ctaColor: '#3498DB',
      footer: 'This email and any attachments are confidential.'
    });
    
    return templates;
  }
}
```

---

# Database Architecture

## Complete Convex Schema
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Discovered opportunities
  opportunities: defineTable({
    // Basic info
    externalId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    platform: v.string(),
    url: v.string(),
    
    // Pricing
    listingPrice: v.number(),
    originalPrice: v.optional(v.number()),
    marketPrice: v.optional(v.number()),
    
    // Images and media
    images: v.array(v.string()),
    primaryImage: v.optional(v.string()),
    
    // Location
    location: v.optional(v.object({
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zip: v.optional(v.string()),
      coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number()
      }))
    })),
    
    // Seller info
    seller: v.object({
      id: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      rating: v.optional(v.number()),
      responseTime: v.optional(v.string()),
      platform: v.string()
    }),
    
    // Analysis
    profitAnalysis: v.optional(v.object({
      purchasePrice: v.number(),
      estimatedSalePrice: v.number(),
      profitPotential: v.number(),
      profitMargin: v.number(),
      roi: v.number(),
      platformFees: v.number(),
      netProfit: v.number()
    })),
    
    marketData: v.optional(v.object({
      averagePrice: v.number(),
      pricePoints: v.array(v.number()),
      volatility: v.number(),
      demandScore: v.number(),
      competitorCount: v.number(),
      insights: v.array(v.string())
    })),
    
    riskAssessment: v.optional(v.object({
      score: v.number(),
      factors: v.array(v.string()),
      recommendation: v.string()
    })),
    
    // Scoring
    profitScore: v.number(),
    priorityScore: v.optional(v.number()),
    
    // Status
    status: v.string(), // 'discovered', 'analyzing', 'approved', 'negotiating', 'purchased', 'passed', 'expired'
    statusReason: v.optional(v.string()),
    
    // Timestamps
    discoveredAt: v.number(),
    analyzedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    lastUpdated: v.number()
  })
    .index("by_status", ["status"])
    .index("by_platform", ["platform"])
    .index("by_score", ["profitScore"])
    .index("by_category", ["category"])
    .index("by_discovered", ["discoveredAt"]),
  
  // Negotiation threads
  negotiations: defineTable({
    opportunityId: v.id("opportunities"),
    threadId: v.string(),
    
    // Strategy
    strategy: v.string(),
    strategyParams: v.optional(v.any()),
    
    // Participants
    seller: v.object({
      email: v.string(),
      name: v.optional(v.string()),
      platform: v.string()
    }),
    
    // Negotiation rounds
    rounds: v.array(v.object({
      number: v.number(),
      timestamp: v.number(),
      type: v.string(), // 'initial', 'counter', 'accept', 'reject', 'follow_up'
      
      // Offers
      ourOffer: v.optional(v.number()),
      theirOffer: v.optional(v.number()),
      
      // Communication
      messageId: v.optional(v.string()),
      message: v.string(),
      response: v.optional(v.string()),
      responseTime: v.optional(v.number()),
      
      // Analysis
      sentiment: v.optional(v.string()),
      intent: v.optional(v.string()),
      concerns: v.optional(v.array(v.string())),
      
      // Status
      status: v.string()
    })),
    
    // Current state
    currentOffer: v.number(),
    maxAcceptable: v.number(),
    status: v.string(), // 'active', 'accepted', 'rejected', 'expired', 'abandoned'
    
    // Outcome
    finalPrice: v.optional(v.number()),
    savingsAchieved: v.optional(v.number()),
    
    // Metrics
    metrics: v.object({
      responseTime: v.optional(v.number()),
      openTime: v.optional(v.number()),
      clickCount: v.number(),
      roundCount: v.number()
    }),
    
    // Timestamps
    startedAt: v.number(),
    lastActivityAt: v.number(),
    completedAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_opportunity", ["opportunityId"])
    .index("by_thread", ["threadId"]),
  
  // Purchased inventory
  inventory: defineTable({
    // References
    opportunityId: v.id("opportunities"),
    negotiationId: v.optional(v.id("negotiations")),
    
    // Item details
    title: v.string(),
    description: v.string(),
    category: v.string(),
    condition: v.string(),
    sku: v.optional(v.string()),
    
    // Images
    images: v.array(v.string()),
    processedImages: v.optional(v.array(v.object({
      url: v.string(),
      size: v.string(), // 'thumbnail', 'medium', 'large'
      width: v.number(),
      height: v.number()
    }))),
    
    // Purchase details
    purchasePrice: v.number(),
    purchasePlatform: v.string(),
    purchaseDate: v.number(),
    
    // Seller
    seller: v.object({
      id: v.string(),
      name: v.optional(v.string()),
      contact: v.optional(v.string())
    }),
    
    // Location/Storage
    location: v.string(), // 'in_transit', 'warehouse', 'listed', 'sold'
    storageLocation: v.optional(v.string()),
    
    // Status
    status: v.string(), // 'pending_delivery', 'in_stock', 'listed', 'sold', 'returned'
    
    // Timestamps
    acquiredAt: v.number(),
    listedAt: v.optional(v.number()),
    soldAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"]),
  
  // Active listings across platforms
  listings: defineTable({
    inventoryId: v.id("inventory"),
    
    // Platform details
    platform: v.string(),
    platformListingId: v.string(),
    url: v.string(),
    
    // Listing content
    title: v.string(),
    description: v.string(),
    price: v.number(),
    shippingPrice: v.optional(v.number()),
    
    // Images
    images: v.array(v.string()),
    
    // Status
    status: v.string(), // 'draft', 'active', 'paused', 'sold', 'expired', 'removed'
    visibility: v.string(), // 'public', 'private', 'scheduled'
    
    // Performance metrics
    metrics: v.object({
      views: v.number(),
      watchers: v.number(),
      saves: v.number(),
      inquiries: v.number(),
      clicks: v.number()
    }),
    
    // Optimization
    lastOptimized: v.optional(v.number()),
    optimizationScore: v.optional(v.number()),
    suggestedPrice: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number())
  })
    .index("by_inventory", ["inventoryId"])
    .index("by_platform", ["platform"])
    .index("by_status", ["status"]),
  
  // Financial transactions
  transactions: defineTable({
    // Type and references
    type: v.string(), // 'purchase', 'sale', 'fee', 'refund', 'adjustment'
    category: v.string(), // 'inventory', 'platform_fee', 'shipping', 'return'
    
    // References
    inventoryId: v.optional(v.id("inventory")),
    listingId: v.optional(v.id("listings")),
    negotiationId: v.optional(v.id("negotiations")),
    
    // Financial details
    amount: v.number(),
    currency: v.string(),
    
    // Fee breakdown
    fees: v.optional(v.object({
      platform: v.number(),
      payment: v.number(),
      shipping: v.number(),
      other: v.number(),
      total: v.number()
    })),
    
    netAmount: v.number(),
    
    // Parties
    counterparty: v.optional(v.object({
      type: v.string(), // 'buyer', 'seller', 'platform'
      id: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string())
    })),
    
    // Payment details
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.string(), // 'pending', 'processing', 'completed', 'failed', 'refunded'
    
    // Platform specifics
    platform: v.string(),
    platformTransactionId: v.optional(v.string()),
    
    // Status and timestamps
    status: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    
    // Accounting
    taxAmount: v.optional(v.number()),
    notes: v.optional(v.string())
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_date", ["createdAt"])
    .index("by_inventory", ["inventoryId"]),
  
  // Performance metrics and analytics
  metrics: defineTable({
    // Time period
    period: v.string(), // 'hour', 'day', 'week', 'month'
    timestamp: v.number(),
    date: v.string(), // YYYY-MM-DD
    
    // Discovery metrics
    discovery: v.object({
      opportunitiesFound: v.number(),
      opportunitiesAnalyzed: v.number(),
      opportunitiesApproved: v.number(),
      avgProfitScore: v.number()
    }),
    
    // Negotiation metrics
    negotiation: v.object({
      started: v.number(),
      completed: v.number(),
      successful: v.number(),
      avgRounds: v.number(),
      avgResponseTime: v.number(),
      avgDiscount: v.number()
    }),
    
    // Sales metrics
    sales: v.object({
      listed: v.number(),
      sold: v.number(),
      avgTimeToSell: v.number(),
      avgSalePrice: v.number()
    }),
    
    // Financial metrics
    financial: v.object({
      totalSpent: v.number(),
      totalRevenue: v.number(),
      totalProfit: v.number(),
      totalFees: v.number(),
      roi: v.number(),
      profitMargin: v.number()
    }),
    
    // Efficiency metrics
    efficiency: v.object({
      automationRate: v.number(),
      errorRate: v.number(),
      avgProcessingTime: v.number()
    })
  })
    .index("by_period", ["period"])
    .index("by_date", ["date"])
    .index("by_timestamp", ["timestamp"]),
  
  // System configuration
  config: defineTable({
    key: v.string(),
    value: v.any(),
    category: v.string(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string())
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"]),
  
  // Agent memory (Hyperspell integration)
  memory: defineTable({
    // Categorization
    type: v.string(), // 'seller', 'product', 'strategy', 'pattern'
    category: v.string(),
    
    // Key for retrieval
    key: v.string(),
    
    // Memory content
    data: v.any(),
    
    // Embeddings for similarity search
    embedding: v.optional(v.array(v.number())),
    
    // Usage tracking
    accessCount: v.number(),
    lastAccessed: v.number(),
    
    // Metadata
    source: v.string(),
    confidence: v.number(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number())
  })
    .index("by_type", ["type"])
    .index("by_key", ["key"])
    .index("by_access", ["lastAccessed"]),
  
  // Alerts and notifications
  alerts: defineTable({
    type: v.string(), // 'opportunity', 'negotiation', 'sale', 'error', 'metric'
    severity: v.string(), // 'info', 'warning', 'error', 'critical'
    
    title: v.string(),
    message: v.string(),
    
    // Context
    context: v.optional(v.any()),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    
    // Status
    status: v.string(), // 'new', 'acknowledged', 'resolved', 'ignored'
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.string()),
    
    // Actions
    suggestedAction: v.optional(v.string()),
    actionTaken: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    resolvedAt: v.optional(v.number())
  })
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_type", ["type"])
    .index("by_created", ["createdAt"])
});
```

---

# API Integrations

## Complete API Integration Layer
```typescript
// src/integrations/index.ts
export class IntegrationManager {
  private agentMail: AgentMailIntegration;
  private browserUse: BrowserUseIntegration;
  private hyperspell: HyperspellIntegration;
  private perplexity: PerplexityIntegration;
  private composio: ComposioIntegration;
  private livekit: LiveKitIntegration;
  private openai: OpenAIIntegration;
  
  constructor(config: IntegrationConfig) {
    this.initializeIntegrations(config);
    this.setupHealthChecks();
  }
  
  private initializeIntegrations(config: IntegrationConfig): void {
    // Initialize each integration with retry logic
    this.agentMail = new AgentMailIntegration({
      apiKey: config.agentMail.apiKey,
      webhookUrl: config.agentMail.webhookUrl,
      retryConfig: {
        maxAttempts: 3,
        backoffMs: 1000
      }
    });
    
    // ... initialize other integrations
  }
  
  private setupHealthChecks(): void {
    setInterval(async () => {
      const health = await this.checkHealth();
      if (health.unhealthy.length > 0) {
        await this.handleUnhealthyIntegrations(health.unhealthy);
      }
    }, 60000); // Check every minute
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.agentMail.healthCheck(),
      this.browserUse.healthCheck(),
      this.hyperspell.healthCheck(),
      this.perplexity.healthCheck(),
      this.composio.healthCheck(),
      this.openai.healthCheck()
    ]);
    
    const healthy = [];
    const unhealthy = [];
    
    checks.forEach((check, index) => {
      const service = Object.keys(this)[index];
      if (check.status === 'fulfilled' && check.value.healthy) {
        healthy.push(service);
      } else {
        unhealthy.push({
          service,
          error: check.status === 'rejected' ? check.reason : check.value.error
        });
      }
    });
    
    return { healthy, unhealthy };
  }
}

// AgentMail Integration
export class AgentMailIntegration {
  private client: AgentMail;
  private webhookHandler: WebhookHandler;
  private messageQueue: Queue<EmailMessage>;
  
  constructor(config: AgentMailConfig) {
    this.client = new AgentMail(config);
    this.webhookHandler = new WebhookHandler(config.webhookUrl);
    this.messageQueue = new Queue('agentmail-messages');
    
    this.setupWebhooks();
  }
  
  private setupWebhooks(): void {
    this.webhookHandler.on('email.received', async (data) => {
      await this.messageQueue.add('process-inbound', data);
    });
    
    this.webhookHandler.on('email.opened', async (data) => {
      await this.handleEmailOpened(data);
    });
    
    this.webhookHandler.on('email.clicked', async (data) => {
      await this.handleEmailClicked(data);
    });
    
    this.webhookHandler.on('email.bounced', async (data) => {
      await this.handleEmailBounced(data);
    });
  }
  
  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    return await this.withRetry(async () => {
      const result = await this.client.send({
        from: params.from || 'deals@autobazaaar.com',
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        headers: params.headers,
        attachments: params.attachments,
        trackingSettings: {
          opens: true,
          clicks: true,
          unsubscribe: false
        }
      });
      
      // Store in database
      await this.storeEmailRecord(result);
      
      return result;
    });
  }
  
  async replyToEmail(threadId: string, content: EmailContent): Promise<EmailResult> {
    return await this.withRetry(async () => {
      return await this.client.reply({
        threadId,
        ...content
      });
    });
  }
  
  async getThreadHistory(threadId: string): Promise<EmailThread> {
    return await this.client.getThread(threadId);
  }
  
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.retryConfig.maxAttempts) {
          await this.delay(this.config.retryConfig.backoffMs * attempt);
        }
      }
    }
    
    throw lastError;
  }
}
```

---

# Security & Performance

## Security Implementation
```typescript
// src/security/index.ts
export class SecurityManager {
  private rateLimit: RateLimiter;
  private encryption: EncryptionService;
  private auth: AuthenticationService;
  private audit: AuditLogger;
  
  constructor() {
    this.rateLimit = new RateLimiter({
      windowMs: 60000,
      maxRequests: 100,
      keyGenerator: (req) => req.ip
    });
    
    this.encryption = new EncryptionService({
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    this.auth = new AuthenticationService({
      jwtSecret: process.env.JWT_SECRET!,
      tokenExpiry: '24h'
    });
    
    this.audit = new AuditLogger({
      level: 'info',
      storage: 'database'
    });
  }
  
  // API key validation
  async validateAPIKey(key: string, service: string): Promise<boolean> {
    const hashedKey = await this.encryption.hash(key);
    const validKey = await this.getStoredKey(service);
    
    const isValid = hashedKey === validKey;
    
    await this.audit.log({
      action: 'api_key_validation',
      service,
      success: isValid,
      timestamp: new Date()
    });
    
    return isValid;
  }
  
  // Rate limiting
  async checkRateLimit(identifier: string): Promise<boolean> {
    return await this.rateLimit.check(identifier);
  }
  
  // Data encryption
  async encryptSensitiveData(data: any): Promise<string> {
    return await this.encryption.encrypt(JSON.stringify(data));
  }
  
  async decryptSensitiveData(encrypted: string): Promise<any> {
    const decrypted = await this.encryption.decrypt(encrypted);
    return JSON.parse(decrypted);
  }
  
  // Secure proxy rotation
  getSecureProxy(): ProxyConfig {
    // Rotate through authenticated proxies
    return {
      host: process.env[`PROXY_HOST_${Math.floor(Math.random() * 5)}`]!,
      port: 8080,
      auth: {
        username: process.env.PROXY_USERNAME!,
        password: process.env.PROXY_PASSWORD!
      }
    };
  }
  
  // Input validation
  validateInput<T>(input: any, schema: z.ZodSchema<T>): T {
    try {
      return schema.parse(input);
    } catch (error) {
      this.audit.log({
        action: 'input_validation_failed',
        error: error.message,
        input: this.sanitizeForLog(input)
      });
      throw new ValidationError('Invalid input', error);
    }
  }
  
  // XSS prevention
  sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href']
    });
  }
}
```

## Performance Optimization
```typescript
// src/performance/index.ts
export class PerformanceManager {
  private cache: CacheManager;
  private connectionPool: ConnectionPool;
  private metrics: MetricsCollector;
  
  constructor() {
    this.cache = new CacheManager({
      redis: {
        host: process.env.REDIS_HOST!,
        port: 6379
      },
      ttl: 3600,
      maxSize: 1000
    });
    
    this.connectionPool = new ConnectionPool({
      min: 5,
      max: 20,
      idleTimeoutMillis: 30000
    });
    
    this.metrics = new MetricsCollector();
  }
  
  // Caching layer
  async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = await this.cache.get(key);
    if (cached) {
      this.metrics.recordCacheHit(key);
      return cached as T;
    }
    
    const fresh = await fetcher();
    await this.cache.set(key, fresh);
    this.metrics.recordCacheMiss(key);
    
    return fresh;
  }
  
  // Connection pooling
  async executeWithConnection<T>(operation: (conn: Connection) => Promise<T>): Promise<T> {
    const conn = await this.connectionPool.acquire();
    
    try {
      return await operation(conn);
    } finally {
      await this.connectionPool.release(conn);
    }
  }
  
  // Batch processing
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchOptions = {}
  ): Promise<R[]> {
    const batchSize = options.batchSize || 10;
    const concurrency = options.concurrency || 5;
    
    const results: R[] = [];
    const queue = [...items];
    const inProgress = new Set<Promise<R>>();
    
    while (queue.length > 0 || inProgress.size > 0) {
      while (inProgress.size < concurrency && queue.length > 0) {
        const batch = queue.splice(0, batchSize);
        
        const promise = Promise.all(batch.map(processor)).then(batchResults => {
          results.push(...batchResults);
          inProgress.delete(promise);
          return batchResults;
        });
        
        inProgress.add(promise);
      }
      
      if (inProgress.size > 0) {
        await Promise.race(inProgress);
      }
    }
    
    return results;
  }
  
  // Query optimization
  optimizeQuery(query: string): string {
    // Add indexes hints
    if (query.includes('WHERE platform =')) {
      query = query.replace('FROM opportunities', 'FROM opportunities USE INDEX (by_platform)');
    }
    
    // Limit default
    if (!query.includes('LIMIT')) {
      query += ' LIMIT 100';
    }
    
    return query;
  }
  
  // Memory management
  async cleanupMemory(): Promise<void> {
    if (global.gc) {
      global.gc();
    }
    
    await this.cache.cleanup();
    await this.connectionPool.drain();
    
    this.metrics.recordMemoryUsage(process.memoryUsage());
  }
}
```

---

# Deployment Architecture

## Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      REDIS_URL: redis://redis:6379
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      - redis
      - postgres
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: autobazaaar
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis-data:
  postgres-data:
```

## Kubernetes Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autobazaaar
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: autobazaaar
  template:
    metadata:
      labels:
        app: autobazaaar
    spec:
      containers:
      - name: app
        image: autobazaaar:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: autobazaaar-secrets
              key: redis-url
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: autobazaaar-service
spec:
  selector:
    app: autobazaaar
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: autobazaaar-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: autobazaaar
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

# Monitoring & Analytics

## Monitoring Setup
```typescript
// src/monitoring/index.ts
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import * as Sentry from '@sentry/node';

export class MonitoringService {
  private metrics: MeterProvider;
  private errorTracker: typeof Sentry;
  
  constructor() {
    this.initializeMetrics();
    this.initializeErrorTracking();
    this.setupCustomMetrics();
  }
  
  private initializeMetrics(): void {
    const exporter = new PrometheusExporter({
      port: 9090,
      endpoint: '/metrics'
    });
    
    this.metrics = new MeterProvider({
      exporter,
      interval: 5000
    });
  }
  
  private initializeErrorTracking(): void {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app })
      ]
    });
    
    this.errorTracker = Sentry;
  }
  
  private setupCustomMetrics(): void {
    const meter = this.metrics.getMeter('autobazaaar');
    
    // Business metrics
    this.profitCounter = meter.createCounter('profit_total', {
      description: 'Total profit generated'
    });
    
    this.dealsCounter = meter.createCounter('deals_completed', {
      description: 'Number of completed deals'
    });
    
    this.responseTimeHistogram = meter.createHistogram('negotiation_response_time', {
      description: 'Time to respond to negotiations',
      boundaries: [100, 500, 1000, 5000, 10000, 30000]
    });
    
    // System metrics
    this.apiLatency = meter.createHistogram('api_latency', {
      description: 'API response latency',
      boundaries: [10, 50, 100, 500, 1000, 5000]
    });
    
    this.queueDepth = meter.createUpDownCounter('queue_depth', {
      description: 'Number of items in queue'
    });
  }
  
  recordProfit(amount: number, deal: any): void {
    this.profitCounter.add(amount, {
      platform: deal.platform,
      category: deal.category
    });
  }
  
  recordDeal(deal: any): void {
    this.dealsCounter.add(1, {
      status: deal.status,
      platform: deal.platform
    });
  }
  
  recordError(error: Error, context?: any): void {
    this.errorTracker.captureException(error, {
      extra: context
    });
  }
  
  async getMetrics(): Promise<any> {
    return {
      profit: await this.profitCounter.getMetric(),
      deals: await this.dealsCounter.getMetric(),
      responseTime: await this.responseTimeHistogram.getMetric(),
      apiLatency: await this.apiLatency.getMetric(),
      queueDepth: await this.queueDepth.getMetric()
    };
  }
}
```

---

# Testing Strategy

## Comprehensive Test Suite
```typescript
// tests/integration/end-to-end.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { AutoBazaaarSystem } from '../../src/index';

describe('AutoBazaaar End-to-End Tests', () => {
  let system: AutoBazaaarSystem;
  
  beforeAll(async () => {
    system = new AutoBazaaarSystem({
      testMode: true,
      mockExternalAPIs: true
    });
    await system.start();
  });
  
  afterAll(async () => {
    await system.stop();
  });
  
  describe('Complete Deal Flow', () => {
    it('should find opportunity, negotiate, and create listing', async () => {
      // 1. Seed test opportunity
      const opportunity = await system.seedOpportunity({
        title: 'Test MacBook Pro',
        price: 800,
        marketPrice: 1200,
        platform: 'craigslist'
      });
      
      // 2. Trigger analysis
      const analysis = await system.analyzeOpportunity(opportunity);
      expect(analysis.recommendation.action).toBe('NEGOTIATE');
      
      // 3. Start negotiation
      const negotiation = await system.startNegotiation(opportunity, analysis);
      expect(negotiation.status).toBe('active');
      
      // 4. Simulate seller response
      await system.simulateSellerResponse(negotiation.threadId, {
        type: 'counter',
        price: 750
      });
      
      // 5. Check auto-response
      const thread = await system.getNegotiationThread(negotiation.threadId);
      expect(thread.rounds.length).toBe(2);
      expect(thread.status).toBe('accepted');
      
      // 6. Verify listing creation
      const listings = await system.getListingsByOpportunity(opportunity.id);
      expect(listings.length).toBeGreaterThan(0);
      
      // 7. Check profit calculation
      const profit = await system.calculateProfit(opportunity.id);
      expect(profit.net).toBeGreaterThan(0);
    });
  });
  
  describe('Negotiation Strategies', () => {
    it.each([
      ['FRIENDLY_LOCAL', 0.7, 0.85],
      ['PROFESSIONAL_BUYER', 0.65, 0.8],
      ['URGENT_CASH', 0.6, 0.75],
      ['COLLECTOR', 0.75, 0.9]
    ])('should apply %s strategy correctly', async (strategy, minOffer, maxOffer) => {
      const opportunity = await system.seedOpportunity({
        price: 1000
      });
      
      const negotiation = await system.startNegotiation(opportunity, null, strategy);
      
      expect(negotiation.initialOffer).toBe(1000 * minOffer);
      expect(negotiation.maxAcceptable).toBe(1000 * maxOffer);
    });
  });
  
  describe('Performance Tests', () => {
    it('should handle 100 concurrent opportunities', async () => {
      const opportunities = await Promise.all(
        Array.from({ length: 100 }, (_, i) => 
          system.seedOpportunity({
            title: `Item ${i}`,
            price: 100 + i
          })
        )
      );
      
      const startTime = Date.now();
      
      await Promise.all(
        opportunities.map(opp => system.processOpportunity(opp))
      );
      
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});
```

---

# Complete Implementation Checklist

## Pre-Hackathon Setup
- [ ] Register all API accounts (AgentMail, Browser-Use, Hyperspell, Perplexity, etc.)
- [ ] Set up development environment with TypeScript
- [ ] Configure Convex database
- [ ] Set up Redis for caching/queues
- [ ] Create email accounts for negotiations
- [ ] Obtain proxy services for scraping
- [ ] Set up monitoring (Sentry, Prometheus)

## Core Implementation
- [ ] Multi-agent orchestrator
- [ ] Market research agent with 5 platform scrapers
- [ ] Negotiation agent with 4 strategies
- [ ] Deal analyzer with ML model
- [ ] Listing agent with SEO optimization
- [ ] Database schema implementation
- [ ] Queue management system
- [ ] Event-driven architecture
- [ ] WebSocket real-time updates

## Integrations
- [ ] AgentMail webhook handling
- [ ] Browser-Use anti-detection
- [ ] Hyperspell memory patterns
- [ ] Perplexity market analysis
- [ ] Composio marketplace APIs
- [ ] OpenAI GPT-4 integration
- [ ] LiveKit voice interface (stretch)

## Security & Performance
- [ ] Rate limiting
- [ ] Proxy rotation
- [ ] Data encryption
- [ ] Input validation
- [ ] Caching layer
- [ ] Connection pooling
- [ ] Error handling
- [ ] Retry mechanisms

## Testing & Monitoring
- [ ] Unit tests for each agent
- [ ] Integration tests for workflows
- [ ] End-to-end test scenarios
- [ ] Performance benchmarks
- [ ] Monitoring dashboards
- [ ] Alert configurations

## Demo Preparation
- [ ] Live dashboard UI
- [ ] Demo scenarios scripted
- [ ] Backup data prepared
- [ ] Presentation materials
- [ ] Live profit tracking
- [ ] Voice command setup

---

This comprehensive PRD provides everything needed to build AutoBazaaar from scratch, with production-ready code, detailed architectures, and complete implementation guidelines. The system is designed to demonstrate real profit generation during the hackathon while showcasing sophisticated multi-agent orchestration and advanced AI negotiation capabilities.
