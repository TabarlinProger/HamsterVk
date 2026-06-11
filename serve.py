#!/usr/bin/env python3
"""Simple HTTP server to run the game locally."""
import http.server, socketserver, os, sys

PORT = 8080
DIR = os.path.dirname(os.path.abspath(__file__))

os.chdir(DIR)
handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(('', PORT), handler) as httpd:
    print(f'Game server running at: http://localhost:{PORT}')
    print(f'Open in your browser: http://localhost:{PORT}/')
    print('Press Ctrl+C to stop')
    httpd.serve_forever()
