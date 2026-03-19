#!/usr/bin/env node

/**
 * scripts/start-with-build.js
 *
 * Ensures `next build` runs before `next start` so production
 * servers (PM2, systemd, etc.) never start without a compiled app.
 */

const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const nextCli = require.resolve("next/dist/bin/next", { paths: [projectRoot] });

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

const startArgs = process.argv.slice(2);

console.log("[start-with-build] Running `next build`...");
runNext(["build"], "build");

console.log("[start-with-build] Starting Next.js server...\n");
runNext(["start", ...startArgs], "start");
