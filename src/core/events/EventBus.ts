// Event Bus - Redis pub/sub event system with event storage
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { SystemEvents, EventPayload } from '../../types';

export class EventBus extends EventEmitter {
  private emitter: EventEmitter;
  private redis: Redis;
  private serviceName: string;
  private subscribers: Map<SystemEvents, Set<(payload: EventPayload) => void>>;
  private eventStore: Map<string, EventPayload>;
  
  constructor(redisConfig: {
    host: string;
    port: number;
    password?: string;
  }, serviceName: string = 'autobazaaar') {
    super();
    
    this.serviceName = serviceName;
    this.emitter = new EventEmitter();
    this.subscribers = new Map();
    this.eventStore = new Map();
    
    // Initialize Redis connection
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });
    
    // Setup Redis message handler
    this.redis.on('message', (channel: string, message: string) => {
      const eventName = channel.replace('events:', '') as SystemEvents;
      const payload: EventPayload = JSON.parse(message);
      
      // Call local handlers
      if (this.subscribers.has(eventName)) {
        this.subscribers.get(eventName)!.forEach(handler => {
          try {
            handler(payload);
          } catch (error) {
            console.error(`Error in event handler for ${eventName}:`, error);
          }
        });
      }
      
      // Emit locally
      this.emitter.emit(eventName, payload);
    });
    
    // Handle Redis errors
    this.redis.on('error', (error) => {
      console.error('Redis EventBus error:', error);
      this.emit('error', error);
    });
    
    // Handle connection
    this.redis.on('connect', () => {
      console.log('EventBus Redis connected');
    });
  }
  
  async publish<T>(event: SystemEvents, data: T, metadata?: Record<string, any>): Promise<void> {
    const eventPayload: EventPayload<T> = {
      eventId: uuidv4(),
      eventType: event,
      timestamp: Date.now(),
      source: this.serviceName,
      data,
      metadata
    };
    
    // Store event locally
    this.eventStore.set(eventPayload.eventId, eventPayload);
    
    // Limit event store size (keep last 1000 events)
    if (this.eventStore.size > 1000) {
      const firstKey = this.eventStore.keys().next().value;
      if (firstKey) {
        this.eventStore.delete(firstKey);
      }
    }
    
    // Local emission
    this.emitter.emit(event, eventPayload);
    
    // Distributed emission via Redis
    try {
      await this.redis.publish(`events:${event}`, JSON.stringify(eventPayload));
    } catch (error) {
      console.error(`Failed to publish event ${event} to Redis:`, error);
      // Still emit locally even if Redis fails
    }
    
    // Store in event stream (optional persistent storage)
    await this.storeEvent(eventPayload);
  }
  
  async subscribe(
    event: SystemEvents,
    handler: (payload: EventPayload) => void
  ): Promise<void> {
    // Register local handler
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(handler);
    
    // Local subscription
    this.emitter.on(event, handler);
    
    // Distributed subscription via Redis
    try {
      await this.redis.subscribe(`events:${event}`);
    } catch (error) {
      console.error(`Failed to subscribe to event ${event} on Redis:`, error);
    }
  }
  
  unsubscribe(event: SystemEvents, handler: (payload: EventPayload) => void): void {
    // Remove local handler
    if (this.subscribers.has(event)) {
      this.subscribers.get(event)!.delete(handler);
      if (this.subscribers.get(event)!.size === 0) {
        this.subscribers.delete(event);
      }
    }
    
    // Remove local listener
    this.emitter.removeListener(event, handler);
  }
  
  private async storeEvent(eventPayload: EventPayload): Promise<void> {
    // Store in local memory store
    // In production, this could write to a database or event log
    try {
      // Optional: Write to persistent storage
      // await this.persistEvent(eventPayload);
    } catch (error) {
      console.error('Failed to store event:', error);
    }
  }
  
  getEvent(eventId: string): EventPayload | undefined {
    return this.eventStore.get(eventId);
  }
  
  async close(): Promise<void> {
    await this.redis.quit();
    this.removeAllListeners();
  }
}

