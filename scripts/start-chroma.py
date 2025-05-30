#!/usr/bin/env python3

import subprocess
import sys
import os

def start_chroma_server():
    """Start Chroma vector database server on port 8000"""
    try:
        print("🚀 Starting Chroma vector database...")
        print("📍 Server will be available at: http://localhost:8000")
        print("🛑 Press Ctrl+C to stop")
        
        # Use the chroma CLI command to start the server
        subprocess.run([
            "chroma", "run", 
            "--host", "localhost", 
            "--port", "8000",
            "--path", "./chroma_data"
        ])
        
    except KeyboardInterrupt:
        print("\n🛑 Chroma server stopped by user")
    except Exception as e:
        print(f"❌ Error starting Chroma server: {e}")
        print("💡 Make sure chromadb is installed: pip3 install chromadb")
        sys.exit(1)

if __name__ == "__main__":
    start_chroma_server() 