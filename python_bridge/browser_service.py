"""
Browser-Use Python Bridge Service
FastAPI service that wraps browser-use Agent API for TypeScript integration
"""
import os
import asyncio
from typing import Optional, Dict, Any, List, Type
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, create_model
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import browser-use
try:
    from browser_use import Agent, Browser, ChatOpenAI, ChatBrowserUse
except ImportError:
    print("ERROR: browser-use not installed. Run: pip install browser-use")
    raise

app = FastAPI(title="Browser-Use Bridge Service", version="1.0.0")

# CORS middleware to allow TypeScript app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AgentRunRequest(BaseModel):
    task: str = Field(..., description="The task description for the agent")
    max_steps: int = Field(default=50, ge=1, le=200, description="Maximum steps for the agent")
    extract_schema: Optional[Dict[str, Any]] = Field(default=None, description="Pydantic-like schema for structured extraction")
    headless: bool = Field(default=True, description="Run browser in headless mode")
    use_vision: Optional[str] = Field(default="auto", description="Vision mode: 'auto', 'true', 'false'")
    browser_options: Optional[Dict[str, Any]] = Field(default=None, description="Additional browser configuration options")


class AgentRunResponse(BaseModel):
    success: bool
    final_result: Optional[Any] = None
    extracted_content: Optional[Any] = None
    error: Optional[str] = None
    history: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    healthy: bool
    error: Optional[str] = None


def get_llm():
    """Get the appropriate LLM based on environment variables"""
    # Try ChatBrowserUse first (optimized for browser automation)
    browser_use_key = os.getenv("BROWSER_USE_API_KEY")
    if browser_use_key:
        try:
            return ChatBrowserUse()
        except Exception as e:
            print(f"Warning: Could not initialize ChatBrowserUse: {e}")
    
    # Fallback to OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise ValueError("Either BROWSER_USE_API_KEY or OPENAI_API_KEY must be set")
    
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    return ChatOpenAI(model=model, api_key=openai_key)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Quick check if we can initialize LLM
        llm = get_llm()
        return HealthResponse(healthy=True)
    except Exception as e:
        return HealthResponse(healthy=False, error=str(e))


@app.post("/agent/run", response_model=AgentRunResponse)
async def run_agent(request: AgentRunRequest):
    """
    Run a browser-use Agent task
    
    This endpoint wraps the browser-use Agent API and executes an AI-driven
    browser automation task. The agent will navigate, interact, and extract
    data based on the task description.
    """
    try:
        # Get LLM
        llm = get_llm()
        
        # Configure browser options
        browser_options = request.browser_options or {}
        if request.headless:
            browser_options["headless"] = True
        
        # Create browser instance
        browser = Browser(**browser_options)
        
        # Configure agent options
        agent_options = {
            "task": request.task,
            "llm": llm,
            "browser": browser,
            "max_steps": request.max_steps,
        }
        
        # Handle vision setting
        if request.use_vision == "true":
            agent_options["use_vision"] = True
        elif request.use_vision == "false":
            agent_options["use_vision"] = False
        else:
            agent_options["use_vision"] = "auto"
        
        # Handle structured output schema if provided
        if request.extract_schema:
            # Convert TypeScript schema to Pydantic model
            # This is a simplified approach - for complex schemas, you'd need proper conversion
            try:
                from pydantic import create_model, BaseModel
                
                # Recursively build model from schema
                def build_field_type(schema_item: Any) -> Type:
                    if isinstance(schema_item, dict):
                        if "type" in schema_item:
                            field_type = schema_item["type"]
                            if field_type == "string":
                                return str
                            elif field_type == "number":
                                return float
                            elif field_type == "boolean":
                                return bool
                            elif field_type == "array" and "items" in schema_item:
                                item_type = build_field_type(schema_item["items"])
                                if item_type != Any:
                                    return List[item_type]  # type: ignore
                                return List[Any]  # type: ignore
                            elif field_type == "object" and "properties" in schema_item:
                                # Nested object - create sub-model
                                sub_fields = {}
                                for prop_key, prop_val in schema_item["properties"].items():
                                    sub_fields[prop_key] = (build_field_type(prop_val), ...)
                                SubModel = create_model(f"SubModel_{prop_key}", **sub_fields)
                                return SubModel
                        elif "properties" in schema_item:
                            # Object type
                            model_fields = {}
                            for prop_key, prop_val in schema_item["properties"].items():
                                model_fields[prop_key] = (build_field_type(prop_val), ...)
                            return create_model("NestedModel", **model_fields)  # type: ignore
                    return Any
                
                # Build root model from schema
                root_fields = {}
                for key, value in request.extract_schema.items():
                    root_fields[key] = (build_field_type(value), ...)
                
                if root_fields:
                    OutputModel = create_model("ExtractedData", **root_fields)
                    agent_options["output_model_schema"] = OutputModel
            except Exception as e:
                print(f"Warning: Could not create Pydantic model from schema: {e}")
                # Continue without structured output
        
        # Create and run agent
        agent = Agent(**agent_options)
        
        # Run the agent
        history = await agent.run()
        
        # Extract results from history
        final_result = None
        extracted_content = None
        
        if history:
            # Get final extracted content
            extracted_content = history.final_result()
            
            # Get last action result if available
            last_action = history.last_action()
            if last_action:
                final_result = last_action.result
            
            # Build history summary
            history_summary = {
                "steps": history.number_of_steps(),
                "urls": history.urls(),
                "actions": history.action_names(),
                "duration_seconds": history.total_duration_seconds()
            }
        else:
            history_summary = None
        
        # Clean up browser
        try:
            await browser.stop()
        except:
            pass
        
        return AgentRunResponse(
            success=True,
            final_result=final_result,
            extracted_content=extracted_content,
            history=history_summary
        )
    
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Agent run error: {error_msg}")
        return AgentRunResponse(
            success=False,
            error=error_msg
        )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("BROWSER_BRIDGE_PORT", "8001"))
    host = os.getenv("BROWSER_BRIDGE_HOST", "0.0.0.0")
    
    print(f"Starting Browser-Use Bridge Service on {host}:{port}")
    print(f"OpenAPI docs available at http://{host}:{port}/docs")
    
    uvicorn.run(
        "browser_service:app",
        host=host,
        port=port,
        reload=os.getenv("NODE_ENV") == "development"
    )

