/**
 * Kleap AI Tools API
 *
 * Provides access to all Kleap AI tools from sandbox TypeScript scripts.
 * Each function corresponds to a tool in the Kleap AI system.
 *
 * Auto-generated - do not modify manually.
 */

import { callTool } from './client';

// ===== FILE OPERATIONS =====

/**
 * Read a file with smart filtering (head/tail/grep/section/jq)
 * Always prefer filtering to reduce token usage (90-99% savings)
 */
export async function readFile(params: {
  path: string;
  head?: number;
  tail?: number;
  grep?: string;
  grepInvert?: boolean;
  section?: { start: number; end: number };
  jq?: string;
  maxLines?: number;
}): Promise<any> {
  return callTool('readFile', params);
}

/**
 * Read multiple files with smart filtering
 * Use summaryOnly: true for discovery (metadata only, 99% token savings)
 */
export async function readMultiple(params: {
  paths: string[];
  head?: number;
  grep?: string;
  summaryOnly?: boolean;
  maxLinesPerFile?: number;
}): Promise<any> {
  return callTool('readMultiple', params);
}

/**
 * Write a new file
 */
export async function write(params: {
  path: string;
  content: string;
}): Promise<any> {
  return callTool('write', params);
}

/**
 * Edit an existing file (find/replace)
 */
export async function edit(params: {
  path: string;
  oldContent: string;
  newContent: string;
}): Promise<any> {
  return callTool('edit', params);
}

/**
 * Edit multiple files in batch
 */
export async function multiEdit(params: {
  edits: Array<{
    path: string;
    oldContent: string;
    newContent: string;
  }>;
}): Promise<any> {
  return callTool('multiEdit', params);
}

/**
 * Delete a file or directory
 */
export async function deleteFile(params: {
  path: string;
}): Promise<any> {
  return callTool('deleteFile', params);
}

/**
 * Rename or move a file
 */
export async function renameFile(params: {
  from: string;
  to: string;
}): Promise<any> {
  return callTool('renameFile', params);
}

// ===== DISCOVERY OPERATIONS =====

/**
 * Search for files by name or content
 */
export async function searchFiles(params: {
  query: string;
  fileType?: 'filename' | 'content';
  maxResults?: number;
}): Promise<any> {
  return callTool('searchFiles', params);
}

/**
 * Match files by glob pattern
 */
export async function glob(params: {
  pattern: string;
  maxResults?: number;
}): Promise<any> {
  return callTool('glob', params);
}

/**
 * List directory contents
 */
export async function ls(params: {
  path: string;
}): Promise<any> {
  return callTool('ls', params);
}

// ===== BASH OPERATIONS =====

/**
 * Run bash command in sandbox
 * Prefer for discovery operations (find, grep, wc) - saves 99% tokens vs reading files
 */
export async function bash(params: {
  command: string;
  description: string;
  timeoutMs?: number;
}): Promise<any> {
  return callTool('bash', params);
}

// ===== UI/UX OPERATIONS =====

/**
 * Refresh the app preview
 */
export async function refreshApp(): Promise<any> {
  return callTool('refreshApp', {});
}

/**
 * Set the app name
 */
export async function setAppName(params: {
  name: string;
}): Promise<any> {
  return callTool('setAppName', params);
}

// ===== TODO MANAGEMENT =====

/**
 * Write or update the todo list
 */
export async function todoWrite(params: {
  todos: Array<{
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    activeForm: string;
  }>;
}): Promise<any> {
  return callTool('todoWrite', params);
}

// ===== SPECIALIZED TOOLS =====
// For specialized tools (deployment, debug, patterns, media, web),
// use listAvailableTools() to see full descriptions

/**
 * List available specialized tools by category
 */
export async function listAvailableTools(params?: {
  category?: 'deployment' | 'debug' | 'environment' | 'patterns' | 'media' | 'web' | 'all';
}): Promise<any> {
  return callTool('listAvailableTools', params || {});
}

/**
 * Get Vercel deployment logs
 */
export async function getDeploymentLogs(): Promise<any> {
  return callTool('getDeploymentLogs', {});
}

/**
 * Check Vercel deployment status
 */
export async function checkDeploymentStatus(): Promise<any> {
  return callTool('checkDeploymentStatus', {});
}

/**
 * Check CodeSandbox health
 */
export async function checkSandboxStatus(): Promise<any> {
  return callTool('checkSandboxStatus', {});
}

/**
 * Get sandbox terminal logs
 */
export async function getSandboxLogs(params?: {
  lines?: number;
}): Promise<any> {
  return callTool('getSandboxLogs', params || {});
}

/**
 * Restart the development server
 */
export async function restartApp(): Promise<any> {
  return callTool('restartApp', {});
}

/**
 * Get environment variables
 */
export async function getEnvVars(): Promise<any> {
  return callTool('getEnvVars', {});
}

/**
 * Set environment variables
 */
export async function setEnvVars(params: {
  envVars: Record<string, string>;
}): Promise<any> {
  return callTool('setEnvVars', params);
}

/**
 * Get UI pattern from library
 */
export async function getPattern(params: {
  category: string;
  slug: string;
}): Promise<any> {
  return callTool('getPattern', params);
}

/**
 * Search available UI patterns
 */
export async function searchPatterns(params: {
  query: string;
}): Promise<any> {
  return callTool('searchPatterns', params);
}

/**
 * List all UI patterns
 */
export async function listAllPatterns(): Promise<any> {
  return callTool('listAllPatterns', {});
}

/**
 * Generate AI image
 */
export async function generateImage(params: {
  prompt: string;
  size?: string;
}): Promise<any> {
  return callTool('generateImage', params);
}

/**
 * Search Unsplash for free stock photos
 */
export async function searchUnsplashImage(params: {
  query: string;
}): Promise<any> {
  return callTool('searchUnsplashImage', params);
}

/**
 * Crawl website for data
 */
export async function webSearch(params: {
  url: string;
  selector?: string;
}): Promise<any> {
  return callTool('webSearch', params);
}
