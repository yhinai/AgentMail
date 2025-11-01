// Agent Registry - Agent registration and lifecycle management
export interface Agent {
  name: string;
  status: 'idle' | 'active' | 'error' | 'stopped';
  start(): Promise<void>;
  stop(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export class AgentRegistry {
  private agents: Map<string, Agent>;
  private agentStatus: Map<string, 'idle' | 'active' | 'error' | 'stopped'>;
  
  constructor() {
    this.agents = new Map();
    this.agentStatus = new Map();
  }
  
  async register(name: string, agent: Agent): Promise<void> {
    if (this.agents.has(name)) {
      throw new Error(`Agent ${name} is already registered`);
    }
    
    this.agents.set(name, agent);
    this.agentStatus.set(name, 'idle');
    
    console.log(`Agent ${name} registered`);
  }
  
  get(name: string): Agent | undefined {
    return this.agents.get(name);
  }
  
  async start(name: string): Promise<void> {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }
    
    try {
      await agent.start();
      this.agentStatus.set(name, 'active');
      console.log(`Agent ${name} started`);
    } catch (error) {
      this.agentStatus.set(name, 'error');
      console.error(`Failed to start agent ${name}:`, error);
      throw error;
    }
  }
  
  async stop(name: string): Promise<void> {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }
    
    try {
      await agent.stop();
      this.agentStatus.set(name, 'stopped');
      console.log(`Agent ${name} stopped`);
    } catch (error) {
      console.error(`Failed to stop agent ${name}:`, error);
      throw error;
    }
  }
  
  async startAll(): Promise<void> {
    const startPromises = Array.from(this.agents.keys()).map(name => 
      this.start(name).catch(error => {
        console.error(`Failed to start agent ${name}:`, error);
      })
    );
    
    await Promise.allSettled(startPromises);
  }
  
  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.agents.keys()).map(name => 
      this.stop(name).catch(error => {
        console.error(`Failed to stop agent ${name}:`, error);
      })
    );
    
    await Promise.allSettled(stopPromises);
  }
  
  getStatus(name: string): 'idle' | 'active' | 'error' | 'stopped' | undefined {
    return this.agentStatus.get(name);
  }
  
  getAllStatus(): Map<string, 'idle' | 'active' | 'error' | 'stopped'> {
    return new Map(this.agentStatus);
  }
  
  list(): string[] {
    return Array.from(this.agents.keys());
  }
  
  async healthCheck(name: string): Promise<boolean> {
    const agent = this.agents.get(name);
    if (!agent) {
      return false;
    }
    
    try {
      return await agent.healthCheck();
    } catch (error) {
      console.error(`Health check failed for agent ${name}:`, error);
      return false;
    }
  }
  
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const name of this.agents.keys()) {
      results.set(name, await this.healthCheck(name));
    }
    
    return results;
  }
}

