#!/usr/bin/env python3
"""
Simple HTTP server with CORS enabled for local development.
Run this to serve the translation app and avoid CORS issues.

Usage:
    python server.py

Then open: http://localhost:8000
"""

import http.server
import socketserver
from pathlib import Path

PORT = 8000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for all requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    handler = CORSRequestHandler

    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"=" * 60)
        print(f"Server running at http://localhost:{PORT}/")
        print(f"=" * 60)
        print(f"\n📂 Serving files from: {Path.cwd()}")
        print(f"\n🌐 Open this URL in your browser:")
        print(f"   http://localhost:{PORT}/index.html")
        print(f"\n⚠️  Keep this window open while using the app")
        print(f"   Press Ctrl+C to stop the server\n")
        print(f"=" * 60)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ Server stopped")
