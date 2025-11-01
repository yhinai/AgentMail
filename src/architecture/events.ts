// Event system definitions for AutoBazaaar
import { SystemEvents, EventPayload } from '../types';

export { SystemEvents };

export interface EventPayload<T = any> {
  eventId: string;
  eventType: SystemEvents;
  timestamp: number;
  source: string;
  data: T;
  metadata?: Record<string, any>;
}

// Re-export types
export type { EventPayload };

