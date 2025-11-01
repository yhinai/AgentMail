// Metrics Collector - Performance metrics collection
export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export class MetricsCollector {
  private metrics: Map<string, MetricData[]>;
  private counters: Map<string, number>;
  private histograms: Map<string, number[]>;
  
  constructor() {
    this.metrics = new Map();
    this.counters = new Map();
    this.histograms = new Map();
  }
  
  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricList = this.metrics.get(name)!;
    metricList.push(metric);
    
    // Keep last 1000 metrics per name
    if (metricList.length > 1000) {
      metricList.shift();
    }
  }
  
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    
    this.record(name, value, tags);
  }
  
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    
    this.histograms.get(key)!.push(value);
    
    // Keep last 1000 values per histogram
    if (this.histograms.get(key)!.length > 1000) {
      this.histograms.get(key)!.shift();
    }
    
    this.record(name, value, tags);
  }
  
  recordError(error: any, context?: any): void {
    this.record('error', 1, {
      error_type: error.constructor?.name || 'Unknown',
      error_message: error.message || String(error),
      ...context
    });
  }
  
  recordSuccess(name: string, duration: number, tags?: Record<string, string>): void {
    this.record(name + '.success', 1, tags);
    this.recordHistogram(name + '.duration', duration, tags);
  }
  
  recordFailure(name: string, error: any, tags?: Record<string, string>): void {
    this.record(name + '.failure', 1, tags);
    this.recordError(error, { ...tags, operation: name });
  }
  
  getCounter(name: string, tags?: Record<string, string>): number {
    const key = this.getMetricKey(name, tags);
    return this.counters.get(key) || 0;
  }
  
  getHistogram(name: string, tags?: Record<string, string>): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const key = this.getMetricKey(name, tags);
    const values = this.histograms.get(key) || [];
    
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99)
    };
  }
  
  getMetrics(name: string, limit?: number): MetricData[] {
    const metrics = this.metrics.get(name) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }
  
  getAllMetrics(): Map<string, MetricData[]> {
    return new Map(this.metrics);
  }
  
  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    
    return `${name}{${tagString}}`;
  }
  
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }
  
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
      this.counters.delete(name);
      this.histograms.delete(name);
    } else {
      this.metrics.clear();
      this.counters.clear();
      this.histograms.clear();
    }
  }
}

