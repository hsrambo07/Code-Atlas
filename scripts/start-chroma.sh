#!/bin/bash

echo "🚀 Starting Chroma vector database..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required to run Chroma"
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required to install Chroma"
    exit 1
fi

# Install chromadb if not already installed
echo "📦 Installing/updating chromadb..."
pip3 install chromadb

# Find the chroma executable
CHROMA_PATH="/Users/harshsinghal/Library/Python/3.9/bin/chroma"

if [ ! -f "$CHROMA_PATH" ]; then
    # Try alternative paths
    if command -v chroma &> /dev/null; then
        CHROMA_PATH="chroma"
    else
        echo "❌ Chroma CLI not found at expected location: $CHROMA_PATH"
        echo "💡 Try: pip3 install --user chromadb"
        echo "💡 Or add ~/.local/bin to your PATH"
        exit 1
    fi
fi

# Start Chroma server directly using CLI
echo "📍 Starting server at: http://localhost:8000"
echo "🛑 Press Ctrl+C to stop"

"$CHROMA_PATH" run --host localhost --port 8000 --path ./chroma_data 