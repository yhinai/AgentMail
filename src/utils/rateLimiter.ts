export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(key: string = 'default'): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove requests outside the time window
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );
    
    this.requests.set(key, validRequests);
    
    return validRequests.length < this.maxRequests;
  }

  recordRequest(key: string = 'default'): void {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    requests.push(now);
    this.requests.set(key, requests);
  }

  async waitIfNeeded(key: string = 'default'): Promise<void> {
    if (!this.canMakeRequest(key)) {
      const requests = this.requests.get(key) || [];
      const oldestRequest = Math.min(...requests);
      const waitTime = this.windowMs - (Date.now() - oldestRequest);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    this.recordRequest(key);
  }
}

