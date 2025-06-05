#!/bin/bash

echo "Running specific failing tests..."
echo "================================="

cd /Users/nick/IdeaProjects/zenithkernel

echo "Running island tests..."
bunx vitest run tests/modules/Rendering/islands.test.tsx --reporter=verbose

echo ""
echo "Test execution completed."
