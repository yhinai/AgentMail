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
    if (integrationConfig?.agentMail?.apiKey || config.agentMail.apiKey) {
      this.agentMail = new AgentMailIntegration({
        apiKey: integrationConfig?.agentMail?.apiKey || config.agentMail.apiKey,
        webhookUrl: integrationConfig?.agentMail?.webhookUrl || config.agentMail.webhookUrl
      });
    }
    
    // Initialize Browser-Use
    if (integrationConfig?.browserUse?.apiKey || config.browserUse.apiKey) {
      this.browserUse = new BrowserUseIntegration(
        integrationConfig?.browserUse?.apiKey || config.browserUse.apiKey
      );
    }
    
    // Initialize Hyperspell
    if (integrationConfig?.hyperspell?.apiKey || config.hyperspell.apiKey) {
      this.hyperspell = new HyperspellIntegration(
        integrationConfig?.hyperspell?.apiKey || config.hyperspell.apiKey,
        integrationConfig?.hyperspell?.namespace
      );
    }
    
    // Initialize Perplexity
    if (integrationConfig?.perplexity?.apiKey || config.perplexity.apiKey) {
      this.perplexity = new PerplexityIntegration(
        integrationConfig?.perplexity?.apiKey || config.perplexity.apiKey
      );
    }
    
    // Initialize Composio
    if (integrationConfig?.composio?.apiKey || config.composio.apiKey) {
      this.composio = new ComposioIntegration(
        integrationConfig?.composio?.apiKey || config.composio.apiKey
      );
    }
    
    // Initialize OpenAI
    if (integrationConfig?.openai?.apiKey || config.openai.apiKey) {
      this.openai = new OpenAIIntegration(
        integrationConfig?.openai?.apiKey || config.openai.apiKey
      );
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

