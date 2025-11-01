// Browser-Use Integration - Full SDK wrapper
import axios, { AxiosInstance } from 'axios';
import config from '../config';

export interface BrowserSession {
  sessionId: string;
  navigate(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  uploadFile(selector: string, filePath: string): Promise<void>;
  getCurrentUrl(): Promise<string>;
  waitFor(selector: string, timeout?: number): Promise<void>;
  screenshot(path?: string): Promise<string>;
  close(): Promise<void>;
  evaluate<T>(script: string): Promise<T>;
  page: any; // For compatibility with puppeteer-like APIs
}

export interface BrowserSessionOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  userAgent?: string;
  proxy?: string;
}

export interface AgentTaskOptions {
  task: string;
  maxSteps?: number;
  extractSchema?: Record<string, any>; // TypeScript equivalent of Pydantic schema
  headless?: boolean;
  useVision?: boolean | 'auto';
  browserOptions?: BrowserSessionOptions;
}

export interface AgentRunResult {
  success: boolean;
  final_result?: any;
  extracted_content?: any;
  error?: string;
  history?: {
    steps: number;
    urls: string[];
    actions: string[];
  };
}

export class BrowserUseIntegration {
  private client: AxiosInstance;
  private bridgeClient: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private bridgeUrl: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = config.browserUse.apiUrl;
    this.bridgeUrl = config.browserUse.bridgeUrl;
    
    // Client for direct browser-use API (if using cloud)
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
    
    // Client for Python bridge service (for Agent API)
    this.bridgeClient = axios.create({
      baseURL: this.bridgeUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5 minutes for Agent tasks
    });
  }
  
  async newSession(options?: BrowserSessionOptions): Promise<BrowserSession> {
    try {
      const response = await this.client.post('/sessions', {
        headless: options?.headless ?? true,
        viewport: options?.viewport || { width: 1920, height: 1080 },
        userAgent: options?.userAgent,
        proxy: options?.proxy
      });
      
      const sessionId = response.data.sessionId;
      return new BrowserUseSession(sessionId, this.apiKey, this.baseUrl);
    } catch (error: any) {
      throw new Error(`Failed to create browser session: ${error.message}`);
    }
  }
  
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Check bridge service health
      try {
        const bridgeHealth = await this.bridgeClient.get('/health');
        if (bridgeHealth.data?.healthy) {
          return { healthy: true };
        }
      } catch (bridgeError: any) {
        // Bridge not available, check direct API
        if (this.apiKey && this.apiKey !== 'your_browser_use_api_key_here') {
          return { 
            healthy: true,
            error: 'Bridge service unavailable, using direct API'
          };
        }
      }
      
      return {
        healthy: false,
        error: 'API key not configured and bridge service unavailable'
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message || 'Health check failed'
      };
    }
  }

  /**
   * Run a browser-use Agent task with AI-driven automation
   * Uses the Python bridge service to execute browser-use Agent API
   */
  async runAgent(options: AgentTaskOptions): Promise<AgentRunResult> {
    try {
      const response = await this.bridgeClient.post('/agent/run', {
        task: options.task,
        max_steps: options.maxSteps || 50,
        extract_schema: options.extractSchema,
        headless: options.headless ?? true,
        use_vision: options.useVision ?? 'auto',
        browser_options: options.browserOptions
      });

      return {
        success: response.data.success ?? true,
        final_result: response.data.final_result,
        extracted_content: response.data.extracted_content,
        history: response.data.history,
        error: response.data.error
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      return {
        success: false,
        error: `Agent task failed: ${errorMessage}`
      };
    }
  }

  /**
   * Extract structured content from a webpage using browser-use Agent
   * This is a convenience method that wraps runAgent with extraction focus
   */
  async extractContent<T = any>(
    url: string,
    extractionPrompt: string,
    schema?: Record<string, any>,
    options?: Omit<AgentTaskOptions, 'task' | 'extractSchema'>
  ): Promise<T | null> {
    const task = `Navigate to ${url} and ${extractionPrompt}`;
    
    const result = await this.runAgent({
      task,
      extractSchema: schema,
      ...options
    });

    if (result.success && result.extracted_content) {
      return result.extracted_content as T;
    }

    return null;
  }
}

class BrowserUseSession implements BrowserSession {
  private sessionId: string;
  private apiKey: string;
  private baseUrl: string;
  private client: AxiosInstance;
  private currentUrl: string = '';
  
  constructor(sessionId: string, apiKey: string, baseUrl: string) {
    this.sessionId = sessionId;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
  }
  
  async navigate(url: string): Promise<void> {
    const response = await this.client.post(`/sessions/${this.sessionId}/navigate`, { url });
    this.currentUrl = url;
  }
  
  async click(selector: string): Promise<void> {
    await this.client.post(`/sessions/${this.sessionId}/click`, { selector });
  }
  
  async fill(selector: string, value: string): Promise<void> {
    await this.client.post(`/sessions/${this.sessionId}/fill`, { selector, value });
  }
  
  async uploadFile(selector: string, filePath: string): Promise<void> {
    // Read file and send as base64
    const fs = await import('fs');
    const fileContent = fs.readFileSync(filePath);
    const base64 = fileContent.toString('base64');
    
    await this.client.post(`/sessions/${this.sessionId}/upload`, {
      selector,
      file: base64,
      filename: filePath.split('/').pop()
    });
  }
  
  async getCurrentUrl(): Promise<string> {
    const response = await this.client.get(`/sessions/${this.sessionId}/url`);
    this.currentUrl = response.data.url;
    return this.currentUrl;
  }
  
  async waitFor(selector: string, timeout: number = 30000): Promise<void> {
    await this.client.post(`/sessions/${this.sessionId}/wait`, {
      selector,
      timeout
    });
  }
  
  async screenshot(path?: string): Promise<string> {
    const response = await this.client.get(`/sessions/${this.sessionId}/screenshot`);
    const screenshotData = response.data.screenshot; // base64
    
    if (path) {
      const fs = await import('fs');
      const buffer = Buffer.from(screenshotData, 'base64');
      fs.writeFileSync(path, buffer);
    }
    
    return screenshotData;
  }
  
  async close(): Promise<void> {
    await this.client.delete(`/sessions/${this.sessionId}`);
  }
  
  async evaluate<T>(script: string): Promise<T> {
    const response = await this.client.post(`/sessions/${this.sessionId}/evaluate`, {
      script
    });
    return response.data.result;
  }
  
  get page(): any {
    // Compatibility wrapper for puppeteer-like APIs
    return {
      goto: (url: string) => this.navigate(url),
      click: (selector: string) => this.click(selector),
      type: (selector: string, text: string) => this.fill(selector, text),
      evaluate: (script: string) => this.evaluate(script),
      screenshot: (options?: { path?: string }) => this.screenshot(options?.path),
      url: () => this.getCurrentUrl(),
      close: () => this.close()
    };
  }
}

