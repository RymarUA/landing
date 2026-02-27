/**
 * Tool Proxy Client
 *
 * Communicates with Kleap tool proxy server to execute AI tools from sandbox scripts.
 * Auto-generated - do not modify manually.
 */

const TOOL_PROXY_URL = "http://localhost:3000/api/tool-proxy";
const APP_ID = 9586;
const USER_ID = "9afc64ac-beeb-4a29-acc8-73aeed41e7af";

interface ToolCallResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime?: number;
}

/**
 * Call a Kleap AI tool from sandbox code
 * @param toolName - Name of the tool to execute
 * @param params - Parameters for the tool
 * @returns Tool execution result
 */
export async function callTool(toolName: string, params: any): Promise<any> {
  try {
    const response = await fetch(TOOL_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: toolName,
        params,
        appId: APP_ID,
        userId: USER_ID,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tool ${toolName} failed: ${error}`);
    }

    const data: ToolCallResult = await response.json();

    if (!data.success) {
      throw new Error(data.error || `Tool ${toolName} failed`);
    }

    return data.result;
  } catch (error: any) {
    console.error(`[TOOL-CLIENT] Error calling ${toolName}:`, error.message);
    throw error;
  }
}
