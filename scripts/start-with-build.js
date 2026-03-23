#!/usr/bin/env node

/**
 * scripts/start-with-build.js
 *
 * Ensures `next build` runs before `next start` so production
 * servers (PM2, systemd, etc.) never start without a compiled app.
 * 
 * Smart build detection:
 * - Checks if .next directory exists
 * - Checks if BUILD_ID exists (indicates successful build)
 * - Only rebuilds if necessary or forced
 */

const path = require("path");
const fs = require("fs");
const { spawnSync, spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const nextCli = require.resolve("next/dist/bin/next", { paths: [projectRoot] });
const nextDir = path.join(projectRoot, ".next");
const buildIdPath = path.join(nextDir, "BUILD_ID");

function runNext(args, label) {
  const result = spawnSync(process.execPath, [nextCli, ...args], {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    console.error(`\n[start-with-build] Failed during ${label}.`);
    process.exit(result.status ?? 1);
  }
}

function runNextLive(args) {
  const child = spawn(process.execPath, [nextCli, ...args], {
    cwd: projectRoot,
    stdio: ["inherit", "inherit", "inherit"],
    env: process.env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

function needsBuild() {
  // Force rebuild if FORCE_BUILD env var is set
  if (process.env.FORCE_BUILD === "1" || process.env.FORCE_BUILD === "true") {
    console.log("[start-with-build] FORCE_BUILD detected - rebuilding...");
    return true;
  }

  // Check if .next directory exists
  if (!fs.existsSync(nextDir)) {
    console.log("[start-with-build] No .next directory found - build required");
    return true;
  }

  // Check if BUILD_ID exists (indicates successful build)
  if (!fs.existsSync(buildIdPath)) {
    console.log("[start-with-build] No BUILD_ID found - build required");
    return true;
  }

  console.log("[start-with-build] Valid build found - skipping rebuild");
  return false;
}

const startArgs = process.argv.slice(2);

// Only build if necessary
if (needsBuild()) {
  console.log("[start-with-build] Running `next build`...");
  runNext(["build"], "build");
} else {
  console.log("[start-with-build] Using existing build");
}

console.log("[start-with-build] Starting Next.js server...\n");
runNextLive(["start", ...startArgs]);
