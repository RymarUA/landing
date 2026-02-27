#!/bin/bash

# AUTO-INSTALL MISSING DEPENDENCIES SCRIPT
# This runs when dependencies are missing in CodeSandbox

echo "📦 Auto-installing missing dependencies..."

# CRITICAL: Check if SWC Linux binary is installed (Next.js won't start without it)
# NOTE: The --force flag is REQUIRED because .npmrc has 'omit=optional' which
# prevents installation of optionalDependencies (where SWC is listed).
# --force bypasses this restriction and ensures SWC is installed.
if [ ! -f "node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node" ]; then
  echo "Installing @next/swc-linux-x64-gnu..."
  npm install @next/swc-linux-x64-gnu@16.1.1 --force --no-audit --no-fund || true
fi

# Check if react-wrap-balancer is installed
if ! npm list react-wrap-balancer >/dev/null 2>&1; then
  echo "Installing react-wrap-balancer..."
  npm install --save react-wrap-balancer@latest --legacy-peer-deps --no-audit --no-fund || true
fi

# Check if cobe is installed
if ! npm list cobe >/dev/null 2>&1; then
  echo "Installing cobe..."
  npm install --save cobe@latest --legacy-peer-deps --no-audit --no-fund || true
fi

# Check if sharp is installed
if ! npm list sharp >/dev/null 2>&1; then
  echo "Installing sharp..."
  npm install --save sharp@latest --legacy-peer-deps --no-audit --no-fund || true
fi

# Check if fast-glob is installed
if ! npm list fast-glob >/dev/null 2>&1; then
  echo "Installing fast-glob..."
  npm install --save fast-glob@latest --legacy-peer-deps --no-audit --no-fund || true
fi

# Check if reading-time is installed
if ! npm list reading-time >/dev/null 2>&1; then
  echo "Installing reading-time..."
  npm install --save reading-time@latest --legacy-peer-deps --no-audit --no-fund || true
fi

echo "✅ Dependencies check complete!"
exit 0