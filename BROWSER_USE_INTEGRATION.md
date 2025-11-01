# Browser-Use Integration Guide

This document explains how browser-use is integrated into the AgentMail/AutoBazaaar application.

## Architecture

The integration uses a **Python Bridge Service** that exposes browser-use functionality via a REST API:

```
┌─────────────────────┐
│  TypeScript App     │
│  (Node.js/Express)  │
└──────────┬──────────┘
           │ HTTP REST API
           │ (localhost:8001)
┌──────────▼──────────┐
│  Python Bridge      │
│  (FastAPI)          │
│  - browser-use SDK  │
│  - OpenAI LLM       │
└─────────────────────┘
```

## Components

### 1. Python Bridge Service
- **Location**: `python_bridge/browser_service.py`
- **Port**: 8001 (configurable via `BROWSER_BRIDGE_PORT`)
- **Technology**: FastAPI + browser-use Python SDK

### 2. TypeScript Integration
- **Location**: `src/integrations/BrowserUseIntegration.ts`
- **Purpose**: Provides TypeScript interface to Python bridge

### 3. Environment Configuration
- **File**: `.env`
- **Required Variables**:
  - `OPENAI_API_KEY`: Your OpenAI API key
  - `OPENAI_MODEL`: Model to use (default: gpt-4o)
  - `BROWSER_USE_API_KEY`: Browser-Use cloud API key (optional)
  - `BROWSER_BRIDGE_URL`: Python bridge URL (default: http://localhost:8001)
  - `BROWSER_BRIDGE_PORT`: Python bridge port (default: 8001)

## Installation

### 1. Install Python Dependencies

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Install Node.js Dependencies

```bash
npm install --legacy-peer-deps
```

## Usage

### Quick Start

Use the provided startup script:

```bash
./start_app.sh
```

This will:
1. Start the Python bridge service
2. Prompt you to choose which part of the app to run

### Manual Start

#### Start Python Bridge

```bash
./start_browser_bridge.sh
```

The bridge will run on http://localhost:8001

#### Start Main Application

Choose one of:

```bash
# Run orchestrator
npm run orchestrator

# Run server
npm run server

# Run UI dev server
npm run dev

# Run demo
npm run demo
```

## API Endpoints

### Python Bridge Endpoints

#### Health Check
```
GET /health
```

#### Create Browser Session
```
POST /sessions
Body: {
  "headless": true,
  "viewport": {"width": 1920, "height": 1080}
}
```

#### Run Agent Task
```
POST /agent/run
Body: {
  "task": "Go to example.com and extract the title",
  "max_steps": 100
}
```

#### Navigate
```
POST /sessions/{session_id}/navigate
Body: {"url": "https://example.com"}
```

#### Click Element
```
POST /sessions/{session_id}/click
Body: {"selector": "button.submit"}
```

#### Fill Input
```
POST /sessions/{session_id}/fill
Body: {"selector": "input[name='email']", "value": "test@example.com"}
```

#### Take Screenshot
```
GET /sessions/{session_id}/screenshot
```

#### Close Session
```
DELETE /sessions/{session_id}
```

## TypeScript Usage Examples

### Example 1: Run an Agent Task

```typescript
import { BrowserUseIntegration } from './src/integrations/BrowserUseIntegration';

const browserUse = new BrowserUseIntegration();

// Run a task
const result = await browserUse.runAgent(
  'Go to https://example.com and extract the page title',
  10 // max steps
);

console.log('Result:', result);
```

### Example 2: Manual Browser Control

```typescript
const browserUse = new BrowserUseIntegration();

// Create a session
const session = await browserUse.newSession({
  headless: false,
  viewport: { width: 1920, height: 1080 }
});

// Navigate
await session.navigate('https://github.com');

// Fill form
await session.fill('input[name="q"]', 'browser-use');

// Click search
await session.click('button[type="submit"]');

// Take screenshot
const screenshot = await session.screenshot();

// Close
await session.close();
```

## Testing

Run the test script to verify the integration:

```bash
npx tsx test_browser_use.ts
```

Expected output:
```
🧪 Testing Browser-Use Integration...

1. Checking health...
   Health: { healthy: true }

2. Running test agent task...
   Result: {...}

✅ Browser-Use integration test completed successfully!
```

## Troubleshooting

### Python Bridge Won't Start

**Error**: `ModuleNotFoundError: No module named 'langchain_openai'`

**Solution**:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Connection Refused

**Error**: `ECONNREFUSED 127.0.0.1:8001`

**Solution**: Make sure the Python bridge is running:
```bash
./start_browser_bridge.sh
```

### OpenAI API Errors

**Error**: `401 Unauthorized` or `Invalid API key`

**Solution**: Check your `.env` file has a valid `OPENAI_API_KEY`

### Browser Launch Failures

**Error**: Browser fails to launch in headless mode

**Solution**: Try running with `headless: false` or install required system dependencies

## Advanced Configuration

### Custom LLM Models

Edit `.env`:
```bash
OPENAI_MODEL=gpt-4-turbo-preview
```

### Custom Bridge Port

Edit `.env`:
```bash
BROWSER_BRIDGE_PORT=8002
BROWSER_BRIDGE_URL=http://localhost:8002
```

### Using Browser-Use Cloud

Set in `.env`:
```bash
BROWSER_USE_API_KEY=your_cloud_api_key
```

Then use cloud browser in Python bridge by modifying `browser_service.py`:
```python
browser = Browser(use_cloud=True)
```

## Integration with Existing Agents

The BrowserUseIntegration can be used by any agent in the system:

```typescript
// In your agent file
import { BrowserUseIntegration } from '../integrations/BrowserUseIntegration';

class MyAgent {
  private browserUse: BrowserUseIntegration;
  
  constructor() {
    this.browserUse = new BrowserUseIntegration();
  }
  
  async performWebTask(task: string) {
    const result = await this.browserUse.runAgent(task, 50);
    return result;
  }
}
```

## Performance Tips

1. **Reuse Sessions**: Create one session and reuse it for multiple operations
2. **Headless Mode**: Use `headless: true` for better performance
3. **Limit Steps**: Set reasonable `max_steps` to avoid long-running tasks
4. **Error Handling**: Always wrap calls in try-catch blocks

## Security Notes

- Never commit `.env` file with real API keys
- The Python bridge runs locally and doesn't expose sensitive data
- Use environment variables for all credentials
- Consider using Browser-Use cloud for production deployments

## Resources

- [Browser-Use Documentation](https://docs.browser-use.com/)
- [Browser-Use GitHub](https://github.com/browser-use/browser-use)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Support

For issues specific to this integration, check:
1. Python bridge logs (console output from `start_browser_bridge.sh`)
2. Node.js application logs
3. Test script output (`npx tsx test_browser_use.ts`)
