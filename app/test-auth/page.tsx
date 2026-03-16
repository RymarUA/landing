"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function QuickAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testDevLogin = async () => {
    console.log("🔐 testDevLogin called!"); // Debug log
    setLoading(true);
    addLog("🔐 Testing dev login...");
    
    try {
      console.log("📡 Sending request to /api/auth/dev-login...");
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "dev@test.com",
          phone: "+380508888888" // Новый уникальный телефон
        }),
      });

      console.log("📡 Response received:", response.status);
      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Dev login successful: ${JSON.stringify(result)}`);
        
        // Test auth/me
        const meResponse = await fetch("/api/auth/me");
        if (meResponse.ok) {
          const meData = await meResponse.json();
          addLog(`✅ Auth/me successful: ${JSON.stringify(meData)}`);
        } else {
          addLog(`❌ Auth/me failed: ${meResponse.status}`);
        }
      } else {
        addLog(`❌ Dev login failed: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error in testDevLogin:", error);
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSimpleClick = () => {
    console.log("🖱️ Simple click test worked!");
    addLog("🖱️ Simple click test worked!");
  };

  const testWishlist = async () => {
    addLog("❤️ Testing wishlist sync...");
    
    try {
      const response = await fetch("/api/wishlist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [123, 456],
          products: [
            { id: 123, name: "Test Product 1", price: 1500, category: "Test" },
            { id: 456, name: "Test Product 2", price: 2500, category: "Test" }
          ]
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Wishlist sync successful: ${JSON.stringify(result)}`);
      } else {
        addLog(`❌ Wishlist sync failed: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const testExistingPhone = async () => {
    addLog("📞 Testing with existing phone...");
    
    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "existing@test.com",
          phone: "+380507877430" // Существующий телефон
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Login with existing phone successful: ${JSON.stringify(result)}`);
      } else {
        addLog(`❌ Login with existing phone failed: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const testNoPhone = async () => {
    addLog("📧 Testing without phone...");
    
    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nophone@test.com",
          phone: "" // Без телефона
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Login without phone successful: ${JSON.stringify(result)}`);
      } else {
        addLog(`❌ Login without phone failed: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🚀 Quick Auth Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Authentication</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={testSimpleClick} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              🖱️ Test Simple Click
            </Button>
            
            <Button 
              onClick={testDevLogin} 
              disabled={loading}
              className="w-full"
            >
              🔐 Test Dev Login (+380508888888)
            </Button>
            
            <Button 
              onClick={testExistingPhone} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              📞 Test Existing Phone
            </Button>
            
            <Button 
              onClick={testNoPhone} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              📧 Test Without Phone
            </Button>
            
            <Button 
              onClick={testWishlist} 
              variant="outline"
              className="w-full"
            >
              ❤️ Test Wishlist Sync
            </Button>
            
            <Button 
              onClick={clearLogs} 
              variant="ghost"
              className="w-full md:col-span-2"
            >
              🗑️ Clear Logs
            </Button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">📋 Logs</h2>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs yet. Click test buttons above.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-green-400">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">📖 Instructions</h2>
          
          <div className="space-y-4 text-blue-800">
            <div>
              <h3 className="font-semibold mb-2">Step 1: Test Dev Login</h3>
              <p className="text-sm">Click &quot;Test Dev Login&quot; to authenticate with test credentials.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Step 2: Check Server Console</h3>
              <p className="text-sm">Look for Sitniks API logs in your server console.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Step 3: Test Wishlist</h3>
              <p className="text-sm">Click &quot;Test Wishlist Sync&quot; to test API integration.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Step 4: Check Sitniks CRM</h3>
              <p className="text-sm">Go to <a href="https://crm.sitniks.com" target="_blank" className="underline">Sitniks CRM</a> to see the created client.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
