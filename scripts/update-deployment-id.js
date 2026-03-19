#!/usr/bin/env node

/**
 * Updates DEPLOYMENT_ID in .env.local before each build
 * This helps Next.js track deployment versions and handle chunk loading errors
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const timestamp = Date.now();
const newDeploymentId = `v${timestamp}`;

try {
  // Read existing .env.local
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add DEPLOYMENT_ID
  const deploymentIdRegex = /^DEPLOYMENT_ID=.*/m;
  
  if (deploymentIdRegex.test(envContent)) {
    // Update existing DEPLOYMENT_ID
    envContent = envContent.replace(deploymentIdRegex, `DEPLOYMENT_ID=${newDeploymentId}`);
    console.log(`✅ Updated DEPLOYMENT_ID to ${newDeploymentId}`);
  } else {
    // Add new DEPLOYMENT_ID
    envContent += `\n# Deployment version tracking\nDEPLOYMENT_ID=${newDeploymentId}\n`;
    console.log(`✅ Added DEPLOYMENT_ID=${newDeploymentId}`);
  }

  // Write back to .env.local
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ .env.local updated successfully');
} catch (error) {
  console.error('❌ Error updating .env.local:', error.message);
  // Don't fail the build, just warn
  process.exit(0);
}
