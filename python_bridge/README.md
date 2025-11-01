# Browser-Use Python Bridge Service

This service provides a FastAPI REST API that wraps the browser-use Python SDK, allowing TypeScript applications to use browser-use Agent API for intelligent browser automation.

## Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set environment variables:**
```bash
# Required: Either BROWSER_USE_API_KEY or OPENAI_API_KEY
export BROWSER_USE_API_KEY="your-key-here"  # Recommended
# OR
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o-mini"  # Optional, defaults to gpt-4o-mini

# Optional: Service configuration
export BROWSER_BRIDGE_PORT=8001  # Default: 8001
export BROWSER_BRIDGE_HOST="0.0.0.0"  # Default: 0.0.0.0
```

3. **Run the service:**
```bash
cd python_bridge
python browser_service.py
```

Or using uvicorn directly:
```bash
uvicorn browser_service:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "healthy": true,
  "error": null
}
```

### `POST /agent/run`
Execute a browser-use Agent task.

**Request:**
```json
{
  "task": "Go to example.com and extract the page title",
  "max_steps": 50,
  "headless": true,
  "use_vision": "auto",
  "extract_schema": {
    "title": {"type": "string"},
    "price": {"type": "number"}
  }
}
```

**Response:**
```json
{
  "success": true,
  "final_result": "...",
  "extracted_content": {...},
  "history": {
    "steps": 5,
    "urls": ["https://example.com"],
    "actions": ["navigate", "extract"],
    "duration_seconds": 12.5
  }
}
```

## Integration with TypeScript

The TypeScript `BrowserUseIntegration` class automatically connects to this service at `http://localhost:8001` by default. Configure via `BROWSER_BRIDGE_URL` environment variable.

## Notes

- The service requires either `BROWSER_USE_API_KEY` (recommended) or `OPENAI_API_KEY`
- Browser sessions are automatically cleaned up after each task
- Structured output extraction is supported via `extract_schema` parameter
- Default timeout is 5 minutes for Agent tasks

