/**
 * Admin utility page for cart maintenance
 * /admin/cart-tools
 */

"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-context";

export default function CartToolsPage() {
  const { items, clearCart } = useCart();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const forceClearCart = async () => {
    setIsClearing(true);
    try {
      const response = await fetch("/api/admin/force-clear-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminPassword}`,
        },
      });

      if (response.ok) {
        clearCart();
        setValidationResult("✅ Корзина очищена успешно!");
      } else {
        setValidationResult("❌ Ошибка очистки корзины");
      }
    } catch (error) {
      setValidationResult(`❌ Ошибка: ${error}`);
    } finally {
      setIsClearing(false);
    }
  };

  const validateCart = async () => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch("/api/admin/clean-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminPassword}`,
        },
        body: JSON.stringify({
          cart: { items }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setValidationResult(
          `✅ Validation complete:\n` +
          `Valid items: ${result.validItems.length}\n` +
          `Removed items: ${result.removedItems.length}\n\n` +
          `Removed items:\n${result.removedItems.map((item: any) => `- ${item.name} (ID: ${item.id})`).join('\n')}`
        );
      } else {
        setValidationResult(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setValidationResult(`❌ Network error: ${error}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cart Administration Tools</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Cart Status</h2>
          <div className="space-y-2">
            <p>Total items: {items.length}</p>
            <p>Total value: {items.reduce((sum, item) => sum + (item.price * item.quantity), 0)} грн</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Admin Authentication</h2>
          <input
            type="password"
            placeholder="Enter admin password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cart Validation</h2>
          <button
            onClick={validateCart}
            disabled={isValidating || !adminPassword}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isValidating ? "Validating..." : "Validate & Clean Cart"}
          </button>

          {validationResult && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap text-sm">{validationResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <button
              onClick={clearCart}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Cart (Local)
            </button>
            
            <button
              onClick={forceClearCart}
              disabled={isClearing || !adminPassword}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isClearing ? "Очищаем..." : "Force Clear Cart (Remote)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
