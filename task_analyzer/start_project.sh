#!/bin/bash

echo "========================================="
echo "Smart Task Analyzer - Quick Start Script"
echo "========================================="
echo ""

echo "Step 1: Installing dependencies..."
pip install -r requirements.txt --quiet

echo "Step 2: Running migrations..."
python3 manage.py migrate

echo "Step 3: Running tests..."
python3 manage.py test tasks

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "To start the backend server, run:"
echo "  python3 manage.py runserver"
echo ""
echo "Then open frontend/index.html in your browser"
echo "or serve it with:"
echo "  cd frontend && python3 -m http.server 8080"
echo ""
echo "API will be available at: http://127.0.0.1:8000"
echo "Sample data available in: sample_tasks.json"
echo ""
