import type { Metadata } from "next/types";
import { ShopFaq } from "@/components/shop-faq";

export const metadata: Metadata = {
  title: "Часті запитання | FAQ",
  description: "Відповіді на найпопулярніші питання про наші товари, доставку, оплату та повернення.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ShopFaq />
    </div>
  );
}
