#!/bin/bash

# SMART BUILD WRAPPER - Show errors but still deploy

echo "🚀 Starting build..."

# Try normal build and capture output
BUILD_OUTPUT=$(npm run build:normal 2>&1)
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
  echo "✅ Build succeeded!"
  exit 0
fi

# Build failed - show the FULL error
echo ""
echo "❌ BUILD FAILED with exit code: $BUILD_EXIT"
echo ""
echo "📋 Full error output:"
echo "$BUILD_OUTPUT"
echo ""
echo "⚠️  Using emergency mode as fallback..."

# Let the package.json fallback handle emergency
exit 1
