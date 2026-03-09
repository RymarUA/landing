#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

if (!VERCEL_TOKEN) {
  console.error("❌ Missing VERCEL_TOKEN environment variable");
  process.exit(1);
}

if (!TEAM_ID) {
  console.error("❌ Missing VERCEL_TEAM_ID environment variable");
  process.exit(1);
}

// Files to exclude
const EXCLUDE_PATTERNS = [
  "node_modules",
  ".next",
  ".git",
  ".DS_Store",
  "test-vercel-deploy.mjs",
  ".env.local",
  "tsconfig.tsbuildinfo",
];

function shouldExclude(path) {
  return EXCLUDE_PATTERNS.some((pattern) => path.includes(pattern));
}

function getAllFiles(dir, baseDir = dir) {
  const files = [];

  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const relativePath = relative(baseDir, fullPath);

    if (shouldExclude(relativePath)) continue;

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else if (stat.isFile()) {
      files.push({
        path: relativePath,
        fullPath: fullPath,
      });
    }
  }

  return files;
}

function encodeFile(filePath) {
  const content = readFileSync(filePath);
  return content.toString("base64");
}

async function deployToVercel() {
  console.log("📦 Collecting template files...");

  const allFiles = getAllFiles(__dirname);
  console.log(`📁 Found ${allFiles.length} files`);

  // Prepare files for Vercel
  const vercelFiles = allFiles.map(({ path, fullPath }) => {
    const data = encodeFile(fullPath);
    return {
      file: path,
      data: data,
      encoding: "base64",
    };
  });

  // Log key files
  console.log("📄 Key files:");
  [
    "package.json",
    "next.config.mjs",
    "vercel.json",
    "postcss.config.mjs",
  ].forEach((file) => {
    if (vercelFiles.find((f) => f.file === file)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} MISSING!`);
    }
  });

  // Create deployment payload
  const payload = {
    name: "kleap-template-test",
    files: vercelFiles,
    projectSettings: {
      framework: "nextjs",
      buildCommand: "npm run build",
      outputDirectory: ".next",
      installCommand:
        "npm ci --no-audit --no-fund && npm install --platform=linux --arch=x64 tailwindcss@4.1.10 @tailwindcss/postcss@4.1.10 postcss@latest lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu",
    },
    target: "production",
    meta: {
      test: "true",
      description: "Testing Next.js 16 + React 19 deployment",
    },
  };

  console.log("\n🚀 Deploying to Vercel...");
  console.log(`   Team: ${TEAM_ID}`);
  console.log(`   Files: ${vercelFiles.length}`);

  const deployUrl = `https://api.vercel.com/v13/deployments?teamId=${TEAM_ID}`;

  const response = await fetch(deployUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }

  const deployment = await response.json();
  console.log("\n✅ Deployment created!");
  console.log(`   ID: ${deployment.id}`);
  console.log(`   URL: https://${deployment.url}`);
  console.log(
    `   Status: ${deployment.readyState || deployment.state || "QUEUED"}`,
  );

  // Monitor deployment status
  console.log("\n⏳ Monitoring deployment...");
  await monitorDeployment(deployment.id);
}

async function monitorDeployment(deploymentId) {
  const maxAttempts = 120; // 10 minutes (5 seconds * 120)
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;

    const statusUrl = `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${TEAM_ID}`;

    try {
      const response = await fetch(statusUrl, {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      const status = data.readyState || data.state || data.status;

      console.log(`[${attempts}/${maxAttempts}] Status: ${status}`);

      if (status === "READY") {
        console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
        console.log(`   URL: https://${data.url}`);
        console.log(`   Status: READY`);

        // Fetch build logs
        await fetchBuildLogs(deploymentId);
        return;
      }

      if (status === "ERROR" || status === "FAILED" || status === "CANCELED") {
        console.log("\n❌ DEPLOYMENT FAILED!");
        console.log(`   Status: ${status}`);
        await fetchBuildLogs(deploymentId);
        process.exit(1);
      }
    } catch (error) {
      console.error("Error checking status:", error.message);
    }
  }

  console.log("\n⏱️  Timeout - deployment took too long");
}

async function fetchBuildLogs(deploymentId) {
  console.log("\n📋 Fetching build logs...");

  const logsUrl = `https://api.vercel.com/v3/deployments/${deploymentId}/events?teamId=${TEAM_ID}&builds=1&limit=100&direction=backward`;

  try {
    const response = await fetch(logsUrl, {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch logs");
      return;
    }

    const logs = await response.json();

    console.log("\n--- BUILD LOGS ---");
    logs.forEach((log) => {
      const text = log.text || log.payload?.text || "";
      if (text) {
        console.log(text);
      }
    });
    console.log("--- END LOGS ---\n");
  } catch (error) {
    console.error("Error fetching logs:", error.message);
  }
}

// Run deployment
deployToVercel().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
