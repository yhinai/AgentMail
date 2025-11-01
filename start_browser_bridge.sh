#!/bin/bash

# Start Browser-Use Python Bridge Service

echo "🚀 Starting Browser-Use Python Bridge Service..."

# Activate virtual environment
source venv/bin/activate

# Set port
export BROWSER_BRIDGE_PORT=8001

# Start the service
python3 python_bridge/browser_service.py
