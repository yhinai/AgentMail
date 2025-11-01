"""
Browser-Use Python Bridge Service
Exposes browser-use functionality via FastAPI REST API
"""
import os
import asyncio
from typing import Dict, Optional, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from browser_use import Agent, Browser
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import uvicorn
import sys

# Load environment variables
load_dotenv()

app = FastAPI(title="Browser-Use Bridge Service")

# Store active browser sessions
sessions: Dict[str, Dict[str, Any]] = {}

# LLM Wrapper to add provider attribute
class LLMWrapper:
    """Wrapper to add provider attribute to LangChain LLMs for browser-use compatibility"""
    def __init__(self, llm, provider='openai', model=None):
        self._llm = llm
        self.provider = provider
        # Get model name from LLM or use provided
        if model:
            self.model = model
        elif hasattr(llm, 'model_name'):
            self.model = llm.model_name
        else:
            self.model = 'gpt-4o'
    
    def __getattr__(self, name):
        # Try to get from wrapper first, then from wrapped LLM
        try:
            return object.__getattribute__(self, name)
        except AttributeError:
            return getattr(self._llm, name)
    
    async def ainvoke(self, *args, **kwargs):
        return await self._llm.ainvoke(*args, **kwargs)
    
    def invoke(self, *args, **kwargs):
        return self._llm.invoke(*args, **kwargs)

class SessionCreateRequest(BaseModel):
    headless: bool = True
    viewport: Optional[Dict[str, int]] = None
    userAgent: Optional[str] = None
    proxy: Optional[str] = None

class NavigateRequest(BaseModel):
    url: str

class ClickRequest(BaseModel):
    selector: str

class FillRequest(BaseModel):
    selector: str
    value: str

class UploadRequest(BaseModel):
    selector: str
    file: str  # base64 encoded
    filename: str

class WaitRequest(BaseModel):
    selector: str
    timeout: int = 30000

class EvaluateRequest(BaseModel):
    script: str

class AgentTaskRequest(BaseModel):
    task: str
    max_steps: int = 100

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "browser-use-bridge"}

@app.post("/sessions")
async def create_session(request: SessionCreateRequest):
    """Create a new browser session"""
    try:
        session_id = f"session_{len(sessions) + 1}"
        
        # Initialize browser with configuration
        browser = Browser(
            headless=request.headless,
            window_size=request.viewport or {'width': 1920, 'height': 1080}
        )
        
        # Start the browser
        await browser.start()
        
        # Store session
        sessions[session_id] = {
            'browser': browser,
            'current_page': None,
            'current_url': ''
        }
        
        return {"sessionId": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@app.post("/sessions/{session_id}/navigate")
async def navigate(session_id: str, request: NavigateRequest):
    """Navigate to a URL"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        browser = sessions[session_id]['browser']
        page = await browser.new_page(request.url)
        sessions[session_id]['current_page'] = page
        sessions[session_id]['current_url'] = request.url
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Navigation failed: {str(e)}")

@app.post("/sessions/{session_id}/click")
async def click(session_id: str, request: ClickRequest):
    """Click an element"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        page = sessions[session_id]['current_page']
        if not page:
            raise HTTPException(status_code=400, detail="No active page")
        
        # Get element by CSS selector
        elements = await page.get_elements_by_css_selector(request.selector)
        if elements:
            await elements[0].click()
        else:
            raise HTTPException(status_code=404, detail=f"Element not found: {request.selector}")
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Click failed: {str(e)}")

@app.post("/sessions/{session_id}/fill")
async def fill(session_id: str, request: FillRequest):
    """Fill an input field"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        page = sessions[session_id]['current_page']
        if not page:
            raise HTTPException(status_code=400, detail="No active page")
        
        elements = await page.get_elements_by_css_selector(request.selector)
        if elements:
            await elements[0].fill(request.value)
        else:
            raise HTTPException(status_code=404, detail=f"Element not found: {request.selector}")
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fill failed: {str(e)}")

@app.post("/sessions/{session_id}/upload")
async def upload_file(session_id: str, request: UploadRequest):
    """Upload a file"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        import base64
        import tempfile
        
        # Decode base64 file
        file_data = base64.b64decode(request.file)
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=request.filename) as tmp:
            tmp.write(file_data)
            tmp_path = tmp.name
        
        page = sessions[session_id]['current_page']
        if not page:
            raise HTTPException(status_code=400, detail="No active page")
        
        # Upload file using selector
        elements = await page.get_elements_by_css_selector(request.selector)
        if elements:
            # Note: Browser-use may need specific upload handling
            await page.evaluate(f'() => document.querySelector("{request.selector}").value = "{tmp_path}"')
        else:
            raise HTTPException(status_code=404, detail=f"Element not found: {request.selector}")
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/sessions/{session_id}/url")
async def get_url(session_id: str):
    """Get current URL"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        page = sessions[session_id]['current_page']
        if not page:
            return {"url": ""}
        
        url = await page.get_url()
        sessions[session_id]['current_url'] = url
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Get URL failed: {str(e)}")

@app.post("/sessions/{session_id}/wait")
async def wait_for(session_id: str, request: WaitRequest):
    """Wait for an element"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        page = sessions[session_id]['current_page']
        if not page:
            raise HTTPException(status_code=400, detail="No active page")
        
        # Wait for element with timeout
        timeout_seconds = request.timeout / 1000
        start_time = asyncio.get_event_loop().time()
        
        while True:
            elements = await page.get_elements_by_css_selector(request.selector)
            if elements:
                return {"success": True}
            
            if asyncio.get_event_loop().time() - start_time > timeout_seconds:
                raise HTTPException(status_code=408, detail="Wait timeout")
            
            await asyncio.sleep(0.5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Wait failed: {str(e)}")

@app.get("/sessions/{session_id}/screenshot")
async def screenshot(session_id: str):
    """Take a screenshot"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        page = sessions[session_id]['current_page']
        if not page:
            raise HTTPException(status_code=400, detail="No active page")
        
        screenshot_data = await page.screenshot(format='jpeg')
        return {"screenshot": screenshot_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Screenshot failed: {str(e)}")

@app.post("/sessions/{session_id}/evaluate")
async def evaluate(session_id: str, request: EvaluateRequest):
    """Evaluate JavaScript"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        page = sessions[session_id]['current_page']
        if not page:
            raise HTTPException(status_code=400, detail="No active page")
        
        result = await page.evaluate(request.script)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluate failed: {str(e)}")

@app.delete("/sessions/{session_id}")
async def close_session(session_id: str):
    """Close a browser session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        browser = sessions[session_id]['browser']
        await browser.stop()
        del sessions[session_id]
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Close session failed: {str(e)}")

@app.post("/agent/run")
async def run_agent(request: AgentTaskRequest):
    """Run a browser-use agent with a task"""
    browser = None
    try:
        # Initialize LLM with wrapper for browser-use compatibility
        model_name = os.getenv('OPENAI_MODEL', 'gpt-4o')
        base_llm = ChatOpenAI(
            model=model_name,
            api_key=os.getenv('OPENAI_API_KEY')
        )
        llm = LLMWrapper(base_llm, provider='openai', model=model_name)
        
        # Initialize browser
        browser = Browser(headless=True)
        await browser.start()
        
        # Create and run agent
        agent = Agent(
            task=request.task,
            llm=llm,
            browser=browser
        )
        
        history = await agent.run(max_steps=request.max_steps)
        
        # Extract results
        result = {
            "success": history.is_done(),
            "final_result": history.final_result(),
            "urls": history.urls(),
            "action_names": history.action_names(),
            "errors": [str(e) for e in history.errors() if e is not None]
        }
        
        return result
    except Exception as e:
        import traceback
        error_detail = f"Agent run failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console
        raise HTTPException(status_code=500, detail=error_detail)
    finally:
        # Clean up browser
        if browser:
            try:
                await browser.stop()
            except:
                pass

if __name__ == "__main__":
    port = int(os.getenv('BROWSER_BRIDGE_PORT', 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
