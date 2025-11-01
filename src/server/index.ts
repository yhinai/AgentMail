// Express API Server - Main API server with routes and middleware
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { SecurityManager } from '../security';
import { PerformanceManager } from '../performance';
import { EventBus } from '../core/events/EventBus';
import { QueueManager } from '../core/queue/QueueManager';
import { AutoBazaaarOrchestrator } from '../core/orchestrator';
import { IntegrationManager } from '../integrations';
import config from '../config';
import { SystemEvents } from '../types';

const app: Express = express();

// Initialize services
const securityManager = new SecurityManager();
const performanceManager = new PerformanceManager();
const eventBus = new EventBus(config.redis, 'api-server');
const queueManager = new QueueManager(config.redis);
const integrations = new IntegrationManager();
const orchestrator = new AutoBazaaarOrchestrator({
  redis: config.redis,
  targetCategories: config.orchestrator.targetCategories,
  targetPlatforms: config.orchestrator.targetPlatforms,
  maxBudget: config.orchestrator.maxBudget,
  minProfitMargin: config.orchestrator.minProfitMargin,
  scanInterval: config.orchestrator.scanInterval,
  priceUpdateInterval: config.orchestrator.priceUpdateInterval,
  negotiationCheckInterval: config.orchestrator.negotiationCheckInterval,
  listingOptimizeInterval: config.orchestrator.listingOptimizeInterval
}, integrations);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityManager.getExpressRateLimiter());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = await integrations.checkHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    integrations: health
  });
});

// Metrics endpoint
app.get('/api/metrics', async (req: Request, res: Response) => {
  const performanceMetrics = performanceManager.getMetrics();
  const orchestratorState = orchestrator.getState();
  
  res.json({
    performance: performanceMetrics,
    orchestrator: orchestratorState,
    timestamp: new Date().toISOString()
  });
});

// Opportunities endpoints
app.get('/api/opportunities', async (req: Request, res: Response) => {
  // Get opportunities from database
  // This would query Convex in production
  res.json({ opportunities: [] });
});

app.get('/api/opportunities/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  // Get specific opportunity
  res.json({ id });
});

// Negotiations endpoints
app.get('/api/negotiations', async (req: Request, res: Response) => {
  // Get active negotiations
  res.json({ negotiations: [] });
});

app.get('/api/negotiations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  // Get specific negotiation
  res.json({ id });
});

// Listings endpoints
app.get('/api/listings', async (req: Request, res: Response) => {
  // Get active listings
  res.json({ listings: [] });
});

// Queue status endpoint
app.get('/api/queues/:queueName', async (req: Request, res: Response) => {
  try {
    const status = await queueManager.getQueueStatus(req.params.queueName);
    res.json(status);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Trigger manual scan
app.post('/api/scan', async (req: Request, res: Response) => {
  await queueManager.addJob('market-scan', {
    categories: req.body.categories || config.orchestrator.targetCategories,
    platforms: req.body.platforms || config.orchestrator.targetPlatforms,
    maxPrice: req.body.maxPrice || config.orchestrator.maxBudget,
    minProfitMargin: req.body.minProfitMargin || config.orchestrator.minProfitMargin
  }, {
    priority: 'high'
  });
  
  res.json({ success: true, message: 'Market scan queued' });
});

// Flip Command endpoints
app.post('/api/commands/flip', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    // Initialize flip command executor
    const { FlipCommandExecutor } = await import('../core/commands/FlipCommandExecutor');
    const { CommandParser } = await import('../core/commands/CommandParser');
    const { BudgetManager } = await import('../core/budget/BudgetManager');
    const { ApprovalManager } = await import('../core/approval/ApprovalManager');
    const { DatabaseClient } = await import('../database/client');
    
    const db = new DatabaseClient();
    const parser = new CommandParser({ openai: integrations.openai! });
    const budgetManager = new BudgetManager({ db });
    const approvalManager = new ApprovalManager({ db, eventBus });
    
    // Get agents from orchestrator
    const agents = {
      marketResearch: orchestrator.agentRegistry.get('market-research'),
      dealAnalyzer: orchestrator.agentRegistry.get('deal-analyzer'),
      negotiation: orchestrator.agentRegistry.get('negotiation'),
      listing: orchestrator.agentRegistry.get('listing')
    };
    
    const executor = new FlipCommandExecutor({
      db,
      eventBus,
      commandParser: parser,
      budgetManager,
      approvalManager,
      agents
    });
    
    // Execute command asynchronously
    executor.executeCommand(command).catch(err => {
      console.error('Flip command error:', err);
    });
    
    res.json({ success: true, message: 'Flip command started' });
  } catch (error: any) {
    console.error('Flip command creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/commands/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { DatabaseClient } = await import('../database/client');
    const db = new DatabaseClient();
    
    const command = await db.getCommand(id);
    if (!command) {
      return res.status(404).json({ error: 'Command not found' });
    }
    
    res.json({ command });
  } catch (error: any) {
    console.error('Get command error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approval endpoints
app.post('/api/approvals/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const { ApprovalManager } = await import('../core/approval/ApprovalManager');
    const { DatabaseClient } = await import('../database/client');
    const db = new DatabaseClient();
    const approvalManager = new ApprovalManager({ db, eventBus });
    
    await approvalManager.handleApprovalDecision(id, true, reason);
    
    res.json({ success: true, message: 'Approval granted' });
  } catch (error: any) {
    console.error('Approve error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/approvals/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const { ApprovalManager } = await import('../core/approval/ApprovalManager');
    const { DatabaseClient } = await import('../database/client');
    const db = new DatabaseClient();
    const approvalManager = new ApprovalManager({ db, eventBus });
    
    await approvalManager.handleApprovalDecision(id, false, reason);
    
    res.json({ success: true, message: 'Approval rejected' });
  } catch (error: any) {
    console.error('Reject error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/approvals/pending', async (req: Request, res: Response) => {
  try {
    const { ApprovalManager } = await import('../core/approval/ApprovalManager');
    const { DatabaseClient } = await import('../database/client');
    const db = new DatabaseClient();
    const approvalManager = new ApprovalManager({ db, eventBus });
    
    const approvals = await approvalManager.getAllPendingApprovals();
    
    res.json({ approvals });
  } catch (error: any) {
    console.error('Get approvals error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Budget endpoints
app.get('/api/budgets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { BudgetManager } = await import('../core/budget/BudgetManager');
    const { DatabaseClient } = await import('../database/client');
    const db = new DatabaseClient();
    const budgetManager = new BudgetManager({ db });
    
    const budget = await budgetManager.getBudget(id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    const summary = await budgetManager.getBudgetSummary(id);
    
    res.json({ budget, summary });
  } catch (error: any) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = config.port;

async function startServer() {
  try {
    // Setup WebSocket
    const { setupWebSocket } = await import('./websocket');
    const server = app.listen(PORT, () => {
      console.log(`🚀 AutoBazaaar API Server running on port ${PORT}`);
    });
    
    setupWebSocket(server, eventBus);
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await orchestrator.stop();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;

