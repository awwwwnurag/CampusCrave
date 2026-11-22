#!/usr/bin/env bash
# =============================================================================
# Campus Crave — Unified Service Launcher
# =============================================================================
# Usage:
#   ./start.sh              # Start all services (Frontend, Backend, Face Detection)
#   ./start.sh frontend     # Start only the React Frontend (Vite)
#   ./start.sh backend      # Start only the FastAPI Backend
#   ./start.sh detection    # Start only the Face & Crowd Detection Engine
# =============================================================================

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION="${1:-all}"

# Find Python with required dependencies
PYTHON_CMD="python3"
if [ -f "/opt/anaconda3/bin/python" ]; then
    PYTHON_CMD="/opt/anaconda3/bin/python"
fi

start_frontend() {
    echo "🌐 Starting Frontend (Vite) on http://localhost:5173..."
    cd "$PROJECT_ROOT/frontend"
    npm run dev
}

start_backend() {
    echo "🚀 Starting Backend (FastAPI) on http://localhost:8000..."
    cd "$PROJECT_ROOT/backend"
    $PYTHON_CMD main.py
}

start_detection() {
    echo "📹 Starting Face & Crowd Detection Engine (YOLOv8)..."
    cd "$PROJECT_ROOT/face_detection"
    $PYTHON_CMD detector.py --source 0 --device auto --api-url http://localhost:8000
}

case "$ACTION" in
    frontend)
        start_frontend
        ;;
    backend)
        start_backend
        ;;
    detection|vision)
        start_detection
        ;;
    all)
        echo "=========================================================="
        echo " 🍕 CAMPUS CRAVE — LAUNCHING ALL SERVICES"
        echo "=========================================================="
        echo " • Frontend:        http://localhost:5173"
        echo " • Admin Analytics: http://localhost:5173/admin"
        echo " • Backend API:     http://localhost:8000"
        echo " • Admin Portal:    http://localhost:8000/admin"
        echo " • Kitchen Portal:  http://localhost:8000/kitchen"
        echo " • API Docs:        http://localhost:8000/docs"
        echo " • Stream:          http://localhost:8000/api/stream"
        echo "=========================================================="
        
        # Start backend in background
        cd "$PROJECT_ROOT/backend"
        $PYTHON_CMD main.py &
        BACKEND_PID=$!
        sleep 1

        # Start detection in background
        cd "$PROJECT_ROOT/face_detection"
        $PYTHON_CMD detector.py --source 0 --device auto --api-url http://localhost:8000 &
        DETECTION_PID=$!
        sleep 1

        # Start frontend in foreground
        cd "$PROJECT_ROOT/frontend"
        trap "echo 'Shutting down services...'; kill $BACKEND_PID $DETECTION_PID 2>/dev/null; exit 0" INT TERM
        npm run dev
        ;;
    *)
        echo "Unknown option: $ACTION"
        echo "Usage: ./start.sh [all|frontend|backend|detection]"
        exit 1
        ;;
esac
