// @ts-nocheck - TODO: Fix AutoBazaaar types after merge
// Integration Manager - Manages all external service integrations
import { AgentMailIntegration } from './AgentMailIntegration';
import { BrowserUseIntegration } from './BrowserUseIntegration';
import { HyperspellIntegration } from './HyperspellIntegration';
import { PerplexityIntegration } from './PerplexityIntegration';
import { ComposioIntegration } from './ComposioIntegration';
import { OpenAIIntegration } from './OpenAIIntegration';
import config from '../config';

export interface IntegrationConfig {
  agentMail?: {
    apiKey: string;
    webhookUrl?: string;
  };
  browserUse?: {
    apiKey: string;
  };
  hyperspell?: {
    apiKey: string;
    namespace?: string;
  };
  perplexity?: {
    apiKey: string;
  };
  composio?: {
    apiKey: string;
  };
  openai?: {
    apiKey: string;
  };
}

export interface HealthStatus {
  healthy: string[];
  unhealthy: Array<{
    service: string;
    error: string;
  }>;
}

export class IntegrationManager {
  public agentMail?: AgentMailIntegration;
  public browserUse?: BrowserUseIntegration;
  public hyperspell?: HyperspellIntegration;
  public perplexity?: PerplexityIntegration;
  public composio?: ComposioIntegration;
  public openai?: OpenAIIntegration;
  
  constructor(integrationConfig?: IntegrationConfig) {
    this.initializeIntegrations(integrationConfig);
    this.setupHealthChecks();
  }
  
  private initializeIntegrations(integrationConfig?: IntegrationConfig): void {
    // Initialize AgentMail
    const agentMailKey = integrationConfig?.agentMail?.apiKey || config.agentMail.apiKey;
    if (agentMailKey) {
      this.agentMail = new AgentMailIntegration({
        apiKey: agentMailKey,
        webhookUrl: integrationConfig?.agentMail?.webhookUrl || config.agentMail.webhookUrl || ''
      });
    }
    
    // Initialize Browser-Use
    const browserUseKey = integrationConfig?.browserUse?.apiKey || config.browserUse.apiKey;
    if (browserUseKey) {
      this.browserUse = new BrowserUseIntegration(browserUseKey);
    }
    
    // Initialize Hyperspell
    const hyperspellKey = integrationConfig?.hyperspell?.apiKey || config.hyperspell.apiKey;
    if (hyperspellKey) {
      this.hyperspell = new HyperspellIntegration(
        hyperspellKey,
        integrationConfig?.hyperspell?.namespace || ''
      );
    }
    
    // Initialize Perplexity
    const perplexityKey = integrationConfig?.perplexity?.apiKey || config.perplexity.apiKey;
    if (perplexityKey) {
      this.perplexity = new PerplexityIntegration(perplexityKey);
    }
    
    // Initialize Composio
    const composioKey = integrationConfig?.composio?.apiKey || config.composio.apiKey;
    if (composioKey) {
      this.composio = new ComposioIntegration(composioKey);
    }
    
    // Initialize OpenAI
    const openaiKey = integrationConfig?.openai?.apiKey || config.openai.apiKey;
    if (openaiKey) {
      this.openai = new OpenAIIntegration(openaiKey);
    }
  }
  
  private setupHealthChecks(): void {
    // Run health checks every minute
    setInterval(async () => {
      const health = await this.checkHealth();
      if (health.unhealthy.length > 0) {
        console.warn('Unhealthy integrations:', health.unhealthy);
      }
    }, 60000);
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.agentMail?.healthCheck() || Promise.resolve({ healthy: false, error: 'Not initialized' }),
      this.browserUse?.healthCheck() || Promise.resolve({ healthy: false, error: 'Not initialized' }),
      this.hyperspell?.healthCheck() || Promise.resolve({ healthy: false, error: 'Not initialized' }),
      this.perplexity?.healthCheck() || Promise.resolve({ healthy: false, error: 'Not initialized' }),
      this.composio?.healthCheck() || Promise.resolve({ healthy: false, error: 'Not initialized' }),
      this.openai?.healthCheck() || Promise.resolve({ healthy: false, error: 'Not initialized' })
    ]);
    
    const services = ['agentMail', 'browserUse', 'hyperspell', 'perplexity', 'composio', 'openai'];
    const healthy: string[] = [];
    const unhealthy: Array<{ service: string; error: string }> = [];
    
    checks.forEach((check, index) => {
      const service = services[index];
      
      if (check.status === 'fulfilled' && check.value.healthy) {
        healthy.push(service);
      } else {
        const error = check.status === 'rejected'
          ? check.reason.message
          : check.value.error || 'Unknown error';
        unhealthy.push({ service, error });
      }
    });
    
    return { healthy, unhealthy };
  }
}

// Export all integrations
export {
  AgentMailIntegration,
  BrowserUseIntegration,
  HyperspellIntegration,
  PerplexityIntegration,
  ComposioIntegration,
  OpenAIIntegration
};

