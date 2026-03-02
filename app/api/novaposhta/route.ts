import { NextRequest, NextResponse } from "next/server";

const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";
const API_KEY = process.env.NOVAPOSHTA_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { modelName, calledMethod, methodProperties } = await req.json();

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