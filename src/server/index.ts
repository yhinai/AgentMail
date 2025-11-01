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

