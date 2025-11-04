#!/bin/bash

# Vercel Build Script for SpendSense
echo "Building SpendSense..."

# Build React frontend
echo "Building React app..."
cd ui-react
npm install
npm run build
cd ..

# Initialize data directory if it doesn't exist
echo "Setting up data directory..."
mkdir -p data

echo "Build complete!"
