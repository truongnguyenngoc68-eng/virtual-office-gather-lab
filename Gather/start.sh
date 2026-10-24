#!/bin/bash
# Gather Clone - Start both servers
# Usage: open Terminal, then run:  bash start.sh

echo ""
echo "  ╔══════════════════════════════════╗"
echo "  ║       GATHER CLONE MVP           ║"
echo "  ╚══════════════════════════════════╝"
echo ""

# Kill any existing processes on our ports
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

DIR="$(cd "$(dirname "$0")" && pwd)"

# Start backend
echo "  Starting backend server..."
cd "$DIR/server" && node server.js &
SERVER_PID=$!

# Start frontend
echo "  Starting frontend..."
cd "$DIR/client" && npx vite --host &
VITE_PID=$!

sleep 3
echo ""
echo "  ✓ Backend:  http://localhost:3001"
echo "  ✓ Frontend: http://localhost:5173  ← Open this in your browser"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Wait and cleanup on Ctrl+C
trap "kill $SERVER_PID $VITE_PID 2>/dev/null; echo '  Servers stopped.'; exit 0" SIGINT SIGTERM
wait
