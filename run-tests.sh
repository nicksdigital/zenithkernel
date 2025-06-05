#!/bin/bash

echo "Running ZenithKernel tests..."
echo "==============================="

# Change to project directory
cd /Users/nick/IdeaProjects/zenithkernel

# Run vitest
echo "Running vitest..."
bunx vitest run --reporter=verbose

echo ""
echo "Test execution completed."
echo ""
echo "If you see any remaining failures, please share the output so I can help fix them."
