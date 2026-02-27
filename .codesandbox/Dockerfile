# Use CodeSandbox's TypeScript-Node image for full editor support
FROM ghcr.io/codesandbox/devcontainers/typescript-node:latest

# Install zsh and additional tools (required by CodeSandbox)
RUN apt-get update && apt-get install -y \
    zsh \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm/yarn support
RUN corepack enable

# Set workspace directory
WORKDIR /workspace

# Environment variables for Next.js
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Set zsh as default shell (required by CodeSandbox)
SHELL ["/bin/zsh", "-c"]