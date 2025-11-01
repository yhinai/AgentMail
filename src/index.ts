import dotenv from 'dotenv';
import express from 'express';
import { WebSocketServer } from 'ws';
import { ProfitPilotOrchestrator } from './workflows/orchestrator';
import { EmailAgent } from './agents/emailAgent';
import { BrowserAgent } from './agents/browserAgent';
import { MarketAgent } from './agents/marketAgent';
import { ContextStore } from './memory/contextStore';
import { DatabaseClient } from './database/client';
import { AgentMailClient } from './agents/agentMailClient';
import { BrowserUseClient } from './agents/browserUseClient';
import { HyperspellClient } from './memory/hyperspellClient';
import OpenAI from 'openai';
import { Logger } from './utils/logger';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize components
const agentMailClient = new AgentMailClient({
  apiKey: process.env.AGENTMAIL_API_KEY || '',
});

const browserClient = new BrowserUseClient({
  apiKey: process.env.BROWSER_USE_API_KEY || '',
});

const hyperspellClient = new HyperspellClient({
  apiKey: process.env.HYPERSPELL_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const marketAgent = new MarketAgent(process.env.PERPLEXITY_API_KEY || '');
const contextStore = new ContextStore(hyperspellClient);
const emailAgent = new EmailAgent(agentMailClient, openai, contextStore);
const browserAgent = new BrowserAgent(browserClient);
const db = new DatabaseClient();

const orchestrator = new ProfitPilotOrchestrator(
  emailAgent,
  browserAgent,
  marketAgent,
  contextStore,
  db
);

// API Routes
app.get('/api/status', async (req, res) => {
  try {
    const status = await orchestrator.getStatus();
    res.json(status);
  } catch (error) {
    Logger.error('Error getting status', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await db.getMetrics();
    res.json(metrics);
  } catch (error) {
    Logger.error('Error getting metrics', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await db.getTransactions({
      limit: parseInt(req.query.limit as string) || 50,
    });
    res.json(transactions);
  } catch (error) {
    Logger.error('Error getting transactions', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/activity', async (req, res) => {
  try {
    const logs = await db.getActivityLogs(
      parseInt(req.query.limit as string) || 50
    );
    res.json(logs);
  } catch (error) {
    Logger.error('Error getting activity logs', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json(products);
  } catch (error) {
    Logger.error('Error getting products', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket server for real-time updates
const server = app.listen(PORT, () => {
  Logger.info(`ProfitPilot API server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  Logger.info('WebSocket client connected');

  // Send initial metrics
  db.getMetrics().then((metrics) => {
    ws.send(JSON.stringify({ type: 'metrics', data: metrics }));
  });

  // Send periodic updates
  const interval = setInterval(async () => {
    try {
      const metrics = await db.getMetrics();
      const activity = await db.getActivityLogs(5);
      
      ws.send(
        JSON.stringify({
          type: 'update',
          data: { metrics, recentActivity: activity },
        })
      );
    } catch (error) {
      Logger.error('Error sending WebSocket update', error);
    }
  }, 5000); // Update every 5 seconds

  ws.on('close', () => {
    Logger.info('WebSocket client disconnected');
    clearInterval(interval);
  });
});

// Start orchestrator
orchestrator
  .start()
  .then(() => {
    Logger.info('ProfitPilot started successfully');
  })
  .catch((error) => {
    Logger.error('Failed to start ProfitPilot', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  Logger.info('SIGTERM received, shutting down gracefully...');
  await orchestrator.stop();
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  Logger.info('SIGINT received, shutting down gracefully...');
  await orchestrator.stop();
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

