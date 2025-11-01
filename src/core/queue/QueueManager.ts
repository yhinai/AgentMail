// Queue Management System - Bull queue management with retry logic and priority support
import Queue, { Job } from 'bull';
import Redis from 'ioredis';
import { JobOptions, JobContext, QueueStatus } from '../../types';

type ProcessorFunction<T = any> = (data: T, context: JobContext) => Promise<any>;

interface ProcessorOptions {
  concurrency?: number;
  retries?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

interface QueueOptions {
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  attempts?: number;
  backoff?: {
    type: 'exponential';
    delay: number;
  };
}

interface QueueProcessor {
  processor: ProcessorFunction;
  options?: ProcessorOptions;
}

interface QueueMetrics {
  successes: number;
  failures: number;
  totalTime: number;
  avgTime: number;
}

class QueueMetricsCollector {
  private metrics: Map<string, QueueMetrics> = new Map();
  
  recordSuccess(queueName: string, duration: number): void {
    const metric = this.metrics.get(queueName) || {
      successes: 0,
      failures: 0,
      totalTime: 0,
      avgTime: 0
    };
    
    metric.successes++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.successes;
    this.metrics.set(queueName, metric);
  }
  
  recordFailure(queueName: string, error: any): void {
    const metric = this.metrics.get(queueName) || {
      successes: 0,
      failures: 0,
      totalTime: 0,
      avgTime: 0
    };
    
    metric.failures++;
    this.metrics.set(queueName, metric);
  }
  
  recordCompletion(queueName: string): void {
    // Additional completion tracking if needed
  }
  
  recordStalled(queueName: string): void {
    // Track stalled jobs
  }
  
  recordJobAdded(queueName: string): void {
    // Track job additions
  }
  
  getQueueMetrics(queueName: string): QueueMetrics | undefined {
    return this.metrics.get(queueName);
  }
}

export class QueueManager {
  private queues: Map<string, any>;
  private processors: Map<string, QueueProcessor>;
  private redis: Redis;
  private metrics: QueueMetricsCollector;
  
  constructor(redisConfig: {
    host: string;
    port: number;
    password?: string;
  }) {
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
    
    this.queues = new Map();
    this.processors = new Map();
    this.metrics = new QueueMetricsCollector();
    
    // Handle Redis errors
    this.redis.on('error', (error) => {
      console.error('QueueManager Redis error:', error);
    });
  }
  
  async createQueue(name: string, options?: QueueOptions): Promise<any> {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }
    
    const queue = new Queue(name, {
      redis: {
        host: this.redis.options.host as string,
        port: this.redis.options.port as number,
        password: this.redis.options.password
      },
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
  
  async registerProcessor<T = any>(
    queueName: string,
    processor: ProcessorFunction<T>,
    options?: ProcessorOptions
  ): Promise<void> {
    const queue = await this.createQueue(queueName);
    
    queue.process(options?.concurrency ?? 1, async (job: Job<T>) => {
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
  ): Promise<Job<T>> {
    const queue = await this.createQueue(queueName);
    
    const job = await queue.add(data, {
      priority: options?.priority === 'high' ? 1 : options?.priority === 'low' ? 3 : 2,
      delay: options?.delay,
      attempts: options?.attempts,
      backoff: options?.backoff as any,
      removeOnComplete: options?.removeOnComplete,
      removeOnFail: options?.removeOnFail
    });
    
    this.metrics.recordJobAdded(queueName);
    return job;
  }
  
  async addBulkJobs<T>(
    queueName: string,
    jobs: Array<{ data: T; options?: JobOptions }>
  ): Promise<Job<T>[]> {
    const queue = await this.createQueue(queueName);
    
    const bulkJobs = jobs.map(job => ({
      name: undefined,
      data: job.data,
      opts: {
        priority: job.options?.priority === 'high' ? 1 : 2,
        delay: job.options?.delay,
        attempts: job.options?.attempts,
        backoff: job.options?.backoff as any
      }
    }));
    
    return await queue.addBulk(bulkJobs);
  }
  
  private setupQueueListeners(queue: any): void {
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
  
  private createJobContext(job: Job): JobContext {
    return {
      jobId: job.id?.toString() || 'unknown',
      attemptNumber: (job.attemptsMade || 0) + 1,
      maxAttempts: (job.opts.attempts as number) || 3,
      queue: job.queue.name,
      timestamp: Date.now(),
      updateProgress: (progress: number) => job.progress(progress),
      log: (message: string) => {
        // Bull doesn't have a built-in log method, but we can store logs
        console.log(`[${job.queue.name}:${job.id}] ${message}`);
      }
    };
  }
  
  private shouldRetry(error: any, job: Job): boolean {
    // Don't retry if max attempts reached
    const maxAttempts = (job.opts.attempts as number) || 3;
    if ((job.attemptsMade || 0) >= maxAttempts) {
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
  
  private async handleFailedJob(job: Job, error: any): Promise<void> {
    // Log failed job details
    console.error(`Permanently failed job ${job.id}:`, {
      queue: job.queue.name,
      data: job.data,
      error: error.message || error
    });
    
    // Could emit event or store in dead letter queue
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
  
  async close(): Promise<void> {
    // Close all queues
    await Promise.all(Array.from(this.queues.values()).map(queue => queue.close()));
    await this.redis.quit();
  }
}

