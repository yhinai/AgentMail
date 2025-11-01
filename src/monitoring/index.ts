// Monitoring Service - Prometheus metrics and Sentry error tracking
import * as Sentry from '@sentry/node';
import type { Express } from 'express';

export interface MonitoringConfig {
  sentryDsn?: string;
  environment?: string;
  prometheusPort?: number;
}

export class MonitoringService {
  private metrics: Map<string, any>;
  private errorTracker: typeof Sentry;
  private prometheusPort: number;
  
  constructor(config?: MonitoringConfig) {
    this.metrics = new Map();
    this.prometheusPort = config?.prometheusPort || 9090;
    
    // Initialize Sentry if DSN provided
    if (config?.sentryDsn) {
      Sentry.init({
        dsn: config.sentryDsn,
        environment: config.environment || process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
        integrations: []
      });
      this.errorTracker = Sentry;
    }
    
    this.setupCustomMetrics();
    this.startMetricsServer();
  }
  
  private setupCustomMetrics(): void {
    // Business metrics
    this.metrics.set('profit_total', {
      type: 'counter',
      value: 0,
      description: 'Total profit generated'
    });
    
    this.metrics.set('deals_completed', {
      type: 'counter',
      value: 0,
      description: 'Number of completed deals'
    });
    
    this.metrics.set('negotiation_response_time', {
      type: 'histogram',
      values: [],
      description: 'Time to respond to negotiations',
      boundaries: [100, 500, 1000, 5000, 10000, 30000]
    });
    
    // System metrics
    this.metrics.set('api_latency', {
      type: 'histogram',
      values: [],
      description: 'API response latency',
      boundaries: [10, 50, 100, 500, 1000, 5000]
    });
    
    this.metrics.set('queue_depth', {
      type: 'gauge',
      value: 0,
      description: 'Number of items in queue'
    });
  }
  
  recordProfit(amount: number, deal: any): void {
    const metric = this.metrics.get('profit_total');
    if (metric) {
      metric.value += amount;
    }
  }
  
  recordDeal(deal: any): void {
    const metric = this.metrics.get('deals_completed');
    if (metric) {
      metric.value += 1;
    }
  }
  
  recordResponseTime(time: number): void {
    const metric = this.metrics.get('negotiation_response_time');
    if (metric && metric.values) {
      metric.values.push(time);
      // Keep last 1000 values
      if (metric.values.length > 1000) {
        metric.values.shift();
      }
    }
  }
  
  recordAPILatency(time: number): void {
    const metric = this.metrics.get('api_latency');
    if (metric && metric.values) {
      metric.values.push(time);
      if (metric.values.length > 1000) {
        metric.values.shift();
      }
    }
  }
  
  recordQueueDepth(depth: number): void {
    const metric = this.metrics.get('queue_depth');
    if (metric) {
      metric.value = depth;
    }
  }
  
  recordError(error: Error, context?: any): void {
    if (this.errorTracker) {
      this.errorTracker.captureException(error, {
        extra: context
      });
    } else {
      console.error('Error:', error, context);
    }
  }
  
  async getMetrics(): Promise<any> {
    const profit = this.metrics.get('profit_total');
    const deals = this.metrics.get('deals_completed');
    const responseTime = this.metrics.get('negotiation_response_time');
    const apiLatency = this.metrics.get('api_latency');
    const queueDepth = this.metrics.get('queue_depth');
    
    return {
      profit: profit ? { total: profit.value } : null,
      deals: deals ? { completed: deals.value } : null,
      responseTime: responseTime ? {
        count: responseTime.values.length,
        avg: responseTime.values.length > 0 
          ? responseTime.values.reduce((a, b) => a + b, 0) / responseTime.values.length 
          : 0
      } : null,
      apiLatency: apiLatency ? {
        count: apiLatency.values.length,
        avg: apiLatency.values.length > 0
          ? apiLatency.values.reduce((a, b) => a + b, 0) / apiLatency.values.length
          : 0
      } : null,
      queueDepth: queueDepth ? { depth: queueDepth.value } : null
    };
  }
  
  private startMetricsServer(): void {
    // Start Prometheus metrics server
    // In production, this would use @opentelemetry/exporter-prometheus
    console.log(`Metrics server would start on port ${this.prometheusPort}`);
  }
  
  // Prometheus format endpoint
  getPrometheusFormat(): string {
    let output = '';
    
    for (const [name, metric] of this.metrics.entries()) {
      if (metric.type === 'counter' || metric.type === 'gauge') {
        output += `# HELP ${name} ${metric.description || ''}\n`;
        output += `# TYPE ${name} ${metric.type}\n`;
        output += `${name} ${metric.value}\n`;
      } else if (metric.type === 'histogram' && metric.values) {
        const avg = metric.values.length > 0
          ? metric.values.reduce((a, b) => a + b, 0) / metric.values.length
          : 0;
        output += `# HELP ${name} ${metric.description || ''}\n`;
        output += `# TYPE ${name} histogram\n`;
        output += `${name}_avg ${avg}\n`;
        output += `${name}_count ${metric.values.length}\n`;
      }
    }
    
    return output;
  }
}

