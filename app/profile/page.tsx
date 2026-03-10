import type { Metadata } from "next/types";
import { ProfileClient } from "./profile-client";
import { getCatalogProducts } from "@/lib/instagram-catalog";

export const metadata: Metadata = {
  title: "Особистий кабінет",
  description: "Увійдіть через номер телефону, щоб переглянути свої замовлення.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const products = await getCatalogProducts();
  return <ProfileClient allProducts={products} />;
}

