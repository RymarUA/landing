import type { Metadata } from "next/types";
import { ShopFaq } from "@/components/shop-faq";
import { ShopFooter } from "@/components/shop-footer";

export const metadata: Metadata = {
  title: "Часті запитання | FAQ",
  description: "Відповіді на найпопулярніші питання про наші товари, доставку, оплату та повернення.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <ShopFaq />
      </div>
      <ShopFooter />
    </div>
  );
}
