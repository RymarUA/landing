import { NextRequest, NextResponse } from "next/server";

const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVAPOSHTA_API_KEY;

function validateBody(body: unknown): body is { modelName: string; calledMethod: string; methodProperties?: Record<string, unknown> } {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.modelName === "string" && b.modelName.length > 0 &&
    typeof b.calledMethod === "string" && b.calledMethod.length > 0 &&
    (b.methodProperties === undefined || (typeof b.methodProperties === "object" && b.methodProperties !== null))
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!validateBody(body)) {
      return NextResponse.json({ success: false, error: "Невірні параметри запиту" }, { status: 400 });
    }

    const { modelName, calledMethod, methodProperties } = body;

    const response = await fetch(NP_API_URL, {
      method: "POST",
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName,
        calledMethod,
        methodProperties,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Ошибка API Новой Почты" }, { status: 500 });
  }
}