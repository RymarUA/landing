#!/bin/bash

# BUILD WRAPPER - Show real errors, fail properly
# This script tries multiple build strategies but FAILS if none work

set -e  # Exit on any error

echo "🚀 Starting build..."

# Try normal build first
echo "Attempting build with all checks..."
npm run build:normal

echo "✅ Build succeeded!"
exit 0