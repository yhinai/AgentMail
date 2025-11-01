// Centralized configuration management
import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  logLevel: string;
  
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  
  convex: {
    deployment: string;
    url?: string;
    apiKey?: string;
  };
  
  openai: {
    apiKey: string;
    model: string;
  };
  
  agentMail: {
    apiKey: string;
    apiUrl: string;
    fromEmail: string;
    fromName: string;
    webhookUrl?: string;
  };
  
  browserUse: {
    apiKey: string;
    apiUrl: string;
  };
  
  hyperspell: {
    apiKey: string;
    apiUrl: string;
    namespace: string;
  };
  
  perplexity: {
    apiKey: string;
    apiUrl: string;
  };
  
  composio: {
    apiKey: string;
    apiUrl: string;
  };
  
  security: {
    jwtSecret?: string;
    encryptionKey?: string;
  };
  
  proxies?: Array<{
    host: string;
    port: number;
    username?: string;
    password?: string;
  }>;
  
  monitoring: {
    sentryDsn?: string;
    prometheusPort: number;
  };
  
  orchestrator: {
    scanInterval: number;
    priceUpdateInterval: number;
    negotiationCheckInterval: number;
    listingOptimizeInterval: number;
    maxBudget: number;
    minProfitMargin: number;
    targetCategories: string[];
    targetPlatforms: string[];
  };
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvArray(key: string, defaultValue: string[]): string[] {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.split(',').map(s => s.trim());
}

function buildProxies(): Array<{ host: string; port: number; username?: string; password?: string }> | undefined {
  const proxies: Array<{ host: string; port: number; username?: string; password?: string }> = [];
  
  for (let i = 0; i < 5; i++) {
    const host = process.env[`PROXY_HOST_${i}`];
    if (host) {
      proxies.push({
        host,
        port: 8080,
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD
      });
    }
  }
  
  return proxies.length > 0 ? proxies : undefined;
}

export const config: Config = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3000),
  logLevel: getEnv('LOG_LEVEL', 'info'),
  
  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD
  },
  
  convex: {
    deployment: getEnv('CONVEX_DEPLOYMENT', 'dev'),
    url: process.env.NEXT_PUBLIC_CONVEX_URL,
    apiKey: process.env.CONVEX_API_KEY
  },
  
  openai: {
    apiKey: getEnv('OPENAI_API_KEY'),
    model: getEnv('OPENAI_MODEL', 'gpt-4-turbo-preview')
  },
  
  agentMail: {
    apiKey: getEnv('AGENTMAIL_API_KEY'),
    apiUrl: getEnv('AGENTMAIL_API_URL', 'https://api.agentmail.com/v1'),
    fromEmail: getEnv('AGENTMAIL_FROM_EMAIL', 'deals@autobazaaar.com'),
    fromName: getEnv('AGENTMAIL_FROM_NAME', 'Alex from AutoBazaaar'),
    webhookUrl: process.env.AGENTMAIL_WEBHOOK_URL
  },
  
  browserUse: {
    apiKey: getEnv('BROWSER_USE_API_KEY'),
    apiUrl: getEnv('BROWSER_USE_API_URL', 'https://api.browser-use.com/v1')
  },
  
  hyperspell: {
    apiKey: getEnv('HYPERSPELL_API_KEY'),
    apiUrl: getEnv('HYPERSPELL_API_URL', 'https://api.hyperspell.com'),
    namespace: getEnv('HYPERSPELL_NAMESPACE', 'nihal')
  },
  
  perplexity: {
    apiKey: getEnv('PERPLEXITY_API_KEY'),
    apiUrl: getEnv('PERPLEXITY_API_URL', 'https://api.perplexity.ai')
  },
  
  composio: {
    apiKey: getEnv('COMPOSIO_API_KEY'),
    apiUrl: getEnv('COMPOSIO_API_URL', 'https://api.composio.dev')
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY
  },
  
  proxies: buildProxies(),
  
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    prometheusPort: getEnvNumber('PROMETHEUS_PORT', 9090)
  },
  
  orchestrator: {
    scanInterval: getEnvNumber('SCAN_INTERVAL', 60000),
    priceUpdateInterval: getEnvNumber('PRICE_UPDATE_INTERVAL', 300000),
    negotiationCheckInterval: getEnvNumber('NEGOTIATION_CHECK_INTERVAL', 30000),
    listingOptimizeInterval: getEnvNumber('LISTING_OPTIMIZE_INTERVAL', 3600000),
    maxBudget: getEnvNumber('MAX_BUDGET', 10000),
    minProfitMargin: getEnvNumber('MIN_PROFIT_MARGIN', 20),
    targetCategories: getEnvArray('TARGET_CATEGORIES', ['electronics', 'furniture', 'vehicles', 'collectibles']),
    targetPlatforms: getEnvArray('TARGET_PLATFORMS', ['facebook', 'craigslist', 'ebay', 'mercari', 'offerup'])
  }
};

export default config;

