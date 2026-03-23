/**
 * GET /api/debug/np-integration
 * Перевіряє NP інтеграції та реєструє NP ключ в Sitniks якщо потрібно
 */

import { NextResponse } from "next/server";

const SITNIKS_API_URL = process.env.SITNIKS_API_URL?.trim().replace(/\/$/, "");
const SITNIKS_API_KEY = process.env.SITNIKS_API_KEY;
const NP_API_KEY = process.env.NOVAPOSHTA_API_KEY;

async function sitniksRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${SITNIKS_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SITNIKS_API_KEY}`,
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch {
    return { status: res.status, ok: res.ok, data: text };
  }
}

export async function GET() {
  if (!SITNIKS_API_URL || !SITNIKS_API_KEY) {
    return NextResponse.json({ error: "Sitniks config missing" }, { status: 500 });
  }

  // 1. Отримати список зареєстрованих NP ключів
  const keysResult = await sitniksRequest("GET", "/open-api/integrations/nova-poshta/api-keys");

  return NextResponse.json({
    npIntegrationId: process.env.SITNIKS_NP_INTEGRATION_ID,
    npApiKey: NP_API_KEY ? `${NP_API_KEY.slice(0, 8)}...` : "missing",
    sitniksUrl: SITNIKS_API_URL,
    registeredKeys: keysResult,
  });
}

export async function POST() {
  if (!SITNIKS_API_URL || !SITNIKS_API_KEY || !NP_API_KEY) {
    return NextResponse.json({ error: "Config missing" }, { status: 500 });
  }

  // Зареєструвати NP ключ в Sitniks
  const result = await sitniksRequest("POST", "/open-api/integrations/nova-poshta/api-keys", {
    apiKeyName: "FamilyHub NP",
    apiKey: NP_API_KEY,
  });

  return NextResponse.json({ result });
}
