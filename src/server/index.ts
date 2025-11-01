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
import { CommandParser } from '../core/command/CommandParser';
import { CommandExecutor } from '../core/command/CommandExecutor';
import config from '../config';
import { SystemEvents } from '../types';
import { v4 as uuidv4 } from 'uuid';

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

// Initialize command system
const commandParser = integrations.openai 
  ? new CommandParser(integrations.openai)
  : null;
const commandExecutor = new CommandExecutor();

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
  try {
    const { category, platform, minPrice, maxPrice, status } = req.query;
    
    // Query Convex for opportunities
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
    if (!convexUrl) {
      return res.json({ opportunities: [] });
    }

    const { ConvexHttpClient } = require('convex/browser');
    const client = new ConvexHttpClient(convexUrl);
    
    let api: any;
    try {
      api = require('../../convex/_generated/api');
    } catch {
      return res.json({ opportunities: [] });
    }

    const opportunities = await client.query(api.listings.getOpportunities, {
      category: category as string | undefined,
      platform: platform as string | undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      status: status as string | undefined,
      limit: 100
    });

    res.json({ opportunities: opportunities || [] });
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    res.json({ opportunities: [] });
  }
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

// Scraped listings endpoint
app.get('/api/listings/scraped', async (req: Request, res: Response) => {
  try {
    const { category, platform, minPrice, maxPrice } = req.query;
    
    // Query Convex for scraped listings
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
    if (!convexUrl) {
      return res.json({ listings: [] });
    }

    const { ConvexHttpClient } = require('convex/browser');
    const client = new ConvexHttpClient(convexUrl);
    
    let api: any;
    try {
      api = require('../../convex/_generated/api');
    } catch {
      return res.json({ listings: [] });
    }

    const listings = await client.query(api.listings.getScrapedListings, {
      category: category as string | undefined,
      platform: platform as string | undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      limit: 100
    });

    res.json({ listings: listings || [] });
  } catch (error: any) {
    console.error('Error fetching scraped listings:', error);
    res.json({ listings: [] });
  }
});

// Command endpoint
app.post('/api/command', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ 
        error: 'Command is required and must be a string' 
      });
    }

    if (!commandParser) {
      return res.status(503).json({ 
        error: 'Command parser not available. OpenAI integration required.' 
      });
    }

    // Parse command
    const parseResult = await commandParser.parseCommand(command);
    
    if (!parseResult.success || !parseResult.command) {
      return res.status(400).json({
        success: false,
        error: parseResult.error || 'Failed to parse command'
      });
    }

    // Generate command ID
    const commandId = uuidv4();

    // Execute command asynchronously
    const context = {
      commandId,
      parsedCommand: parseResult.command,
      orchestrator,
      queueManager,
      eventBus,
      agentRegistry: orchestrator.getAgentRegistry()
    };

    // Queue command execution
    await queueManager.addJob('execute-command', {
      commandId,
      parsedCommand: parseResult.command,
      originalCommand: command
    }, {
      priority: 'high'
    });

    // Return immediately with command ID
    res.json({
      success: true,
      commandId,
      status: 'pending',
      parsedCommand: parseResult.command,
      message: 'Command accepted and queued for execution'
    });
  } catch (error: any) {
    console.error('Command API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process command'
    });
  }
});

// Get command status
app.get('/api/command/:commandId', async (req: Request, res: Response) => {
  try {
    const { commandId } = req.params;
    const status = commandExecutor.getCommandStatus(commandId);
    
    if (!status) {
      return res.status(404).json({
        error: 'Command not found'
      });
    }

    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Command preview endpoint (for real-time LLM analysis)
app.post('/api/command/preview', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required' });
    }

    if (!commandParser) {
      return res.status(503).json({ error: 'Command parser not available' });
    }

    // Parse command for preview
    const parseResult = await commandParser.parseCommand(command);
    
    if (!parseResult.success || !parseResult.command) {
      return res.json({ parsed: null });
    }

    res.json({
      parsed: {
        budget: parseResult.command.budget,
        quantity: parseResult.command.quantity,
        category: parseResult.command.category,
        action: parseResult.command.action
      }
    });
  } catch (error: any) {
    // Preview errors shouldn't block the UI
    res.json({ parsed: null });
  }
});

// Command history endpoint
app.get('/api/commands/history', async (req: Request, res: Response) => {
  try {
    // TODO: Query Convex for command history
    // For now, return commands from executor's active commands
    const allCommands: any[] = [];
    
    // This would query Convex in production
    res.json({ commands: allCommands });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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

