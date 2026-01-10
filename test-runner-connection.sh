#!/bin/bash

echo "Testing Runner Connection..."
echo ""

# Test if runner is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✓ Runner is responding at http://localhost:5001/health"
    curl -s http://localhost:5001/health | head -20
else
    echo "✗ Runner is NOT responding at http://localhost:5001/health"
fi

echo ""
echo "Testing Backend Connection..."
echo ""

# Test if backend is running
if curl -s http://localhost:3000/api > /dev/null; then
    echo "✓ Backend is responding at http://localhost:3000/api"
    curl -s http://localhost:3000/api | head -20
else
    echo "✗ Backend is NOT responding at http://localhost:3000/api"
fi

echo ""
echo "Testing Runner from Backend perspective..."
echo ""

# Simulate what backend does
curl -X POST http://localhost:5001/run \
  -H "Content-Type: application/json" \
  -d '{"submissionId": 999, "assignmentId": 1, "filename": "test.zip"}' \
  -v 2>&1 | head -30

echo ""
echo "Done."
