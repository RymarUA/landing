import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ttn = searchParams.get('ttn');

  if (!ttn) {
    return NextResponse.json({ error: 'Введіть номер ТТН' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: "", // для публічного трекінгу ключ НЕ потрібен
        modelName: "Tracking",
        calledMethod: "getStatusDocuments",
        methodProperties: {
          Documents: [{ DocumentNumber: ttn.trim() }],
        },
      }),
    });

    if (!res.ok) {
      throw new Error('Помилка API Нової Пошти');
    }

    const data = await res.json();

    if (data.success && data.data?.length > 0) {
      const info = data.data[0];
      return NextResponse.json({
        status: info.Status || 'Статус невідомий',
        details: info.StatusDescription || '',
        history: info.TrackingHistory?.map((h: any) => ({
          date: h.DateTime,
          event: h.StatusDescription,
        })) || [],
      });
    } else {
      return NextResponse.json({ error: data.errors?.[0] || 'ТТН не знайдено' }, { status: 404 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Не вдалося отримати статус' }, { status: 500 });
  }
}