/**
 * GET /api/track-np?ttn=20400123456789
 *
 * Nova Poshta tracking. Validates ttn (digits only, 10–20 chars),
 * calls getStatusDocuments, returns status, details, history.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const TTN_REGEX = /^\d{10,20}$/;

export async function GET(req: NextRequest) {
  const ttn = req.nextUrl.searchParams.get("ttn")?.trim() ?? "";

  if (!TTN_REGEX.test(ttn)) {
    return NextResponse.json(
      { error: "Невірний номер ТТН. Тільки цифри, 10–20 символів." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch("https://api.novaposhta.ua/v2.0/json/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: "",
        modelName: "TrackingDocument",
        calledMethod: "getStatusDocuments",
        methodProperties: {
          Documents: [{ DocumentNumber: ttn, Phone: "" }],
        },
      }),
    });

    if (!res.ok) {
      console.error("[track-np] NP API HTTP", res.status);
      return NextResponse.json(
        { error: "Помилка API Нової Пошти" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      success?: boolean;
      data?: Array<{
        Status?: string;
        StatusDescription?: string;
        WarehouseRecipient?: string;
        RecipientDateTime?: string;
        TrackingHistory?: Array<{ DateTime?: string; StatusDescription?: string }>;
      }>;
      errors?: string[];
    };

    if (!data.success || !data.data?.length) {
      const errMsg = data.errors?.[0] ?? "ТТН не знайдено";
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    const info = data.data[0];
    const status = info.StatusDescription ?? info.Status ?? "Статус невідомий";
    const details = [info.WarehouseRecipient, info.RecipientDateTime].filter(Boolean).join(" · ");
    const history = (info.TrackingHistory ?? []).map((h) => ({
      date: h.DateTime ?? "",
      event: h.StatusDescription ?? "",
    }));

    return NextResponse.json({
      status,
      details,
      history,
    });
  } catch (err) {
    console.error("[track-np]", err);
    return NextResponse.json(
      { error: "Не вдалося отримати статус відправлення" },
      { status: 502 }
    );
  }
}
