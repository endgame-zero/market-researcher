#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Installing backend dependencies..."
cd "$ROOT/backend"
pip install -r requirements.txt -q

echo "==> Starting FastAPI backend on http://localhost:8000..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

echo "==> Installing frontend dependencies..."
cd "$ROOT/frontend"
npm install --silent

echo "==> Starting React frontend on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Market Research Assistant running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo ""
echo "  Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
