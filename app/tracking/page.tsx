import { ShopNovaPoshta } from "@/components/shop-novaposhta";
import { ShopFooter } from "@/components/shop-footer";

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="text-white bg-emerald-900/95 backdrop-blur-md">
        <div className="border-b border-emerald-900/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-1">
              Відстеження посилки
            </h1>
            <p className="text-center text-emerald-100 text-sm">
              Дізнайтеся статус вашого замовлення Новою Поштою
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <ShopNovaPoshta />
      </div>
      
      <ShopFooter />
    </div>
  );
}
