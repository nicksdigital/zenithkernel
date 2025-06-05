#!/bin/bash
set -e

CONTAINER_NAME="quantum-zkp"
LOCAL_DIR=$(pwd)
DOCKER_IMAGE="quantum-zkp"
TARGET_DIR="/app"

echo "📦 Rebuilding Docker image..."
docker build -t $DOCKER_IMAGE .

echo "🔄 Updating container files..."
docker run -it --rm \
  --name $CONTAINER_NAME \
  -v "$LOCAL_DIR":"$TARGET_DIR" \
  $DOCKER_IMAGE bash

