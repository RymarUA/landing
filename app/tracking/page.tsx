import { ShopNovaPoshta } from "@/components/shop-novaposhta";

export const metadata = {
  title: "Відстеження посилки | Нова Пошта - Здоров'я Сходу",
  description: "Відстежте вашу посилку Новою Поштою за номером ТТН. Швидкий та зручний спосіб дізнатися статус доставки.",
  openGraph: {
    title: "Відстеження посилки | Нова Пошта - Здоров'я Сходу",
    description: "Відстежте вашу посилку Новою Поштою за номером ТТН. Швидкий та зручний спосіб дізнатися статус доставки.",
    type: "website",
  },
};

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">
            Відстеження посилки
          </h1>
          <p className="text-center text-emerald-100 text-lg">
            Дізнайтеся статус вашого замовлення Новою Поштою
          </p>
        </div>
      </div>
      
      <ShopNovaPoshta />
    </div>
  );
}
