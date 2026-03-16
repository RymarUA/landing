"use client";

import { useState } from "react";
import { useProductTracking, useWishlistSync, useProductNotifications } from "@/hooks/use-product-tracking";
import { useWishlist } from "@/components/wishlist-context";
import { Button } from "@/components/ui/button";

export default function TestAllIntegrationsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const { trackClick } = useProductTracking();
  const { syncWishlist, getAlerts: getWishlistAlerts } = useWishlistSync();
  const { subscribeToPriceDrop, subscribeToBackInStock, getAlerts } = useProductNotifications();
  const { toggle } = useWishlist();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Test 1: Track Click
  const testTrackClick = async () => {
    addLog("🎯 Testing trackClick...");
    
    try {
      await trackClick({
        id: 123,
        name: "Test Product",
        category: "Test Category",
        price: 1500,
      });
      addLog("✅ trackClick completed");
    } catch (error) {
      addLog(`❌ trackClick failed: ${error}`);
    }
  };

  // Test 2: Wishlist Sync
  const testWishlistSync = async () => {
    addLog("❤️ Testing wishlist sync...");
    
    try {
      // Toggle item 123 in wishlist
      toggle(123);
      addLog("🔄 Toggled item 123 in wishlist");
      
      // Sync after 3 seconds
      setTimeout(async () => {
        await syncWishlist([123, 456], [
          { id: 123, name: "Test Product 1", price: 1500, category: "Test" },
          { id: 456, name: "Test Product 2", price: 2500, category: "Test" }
        ]);
        addLog("✅ Wishlist sync completed");
      }, 3000);
    } catch (error) {
      addLog(`❌ Wishlist sync failed: ${error}`);
    }
  };

  // Test 3: Notifications Subscribe
  const testNotificationsSubscribe = async () => {
    addLog("🔔 Testing notifications subscribe...");
    
    try {
      const result1 = await subscribeToPriceDrop(123, 1500);
      addLog(result1 ? "✅ Subscribed to price drops" : "❌ Failed to subscribe to price drops");
      
      const result2 = await subscribeToBackInStock(456);
      addLog(result2 ? "✅ Subscribed to back in stock" : "❌ Failed to subscribe to back in stock");
    } catch (error) {
      addLog(`❌ Notifications subscribe failed: ${error}`);
    }
  };

  // Test 4: Get Alerts
  const testGetAlerts = async () => {
    addLog("📬 Testing get alerts...");
    
    try {
      const notifications = await getAlerts();
      addLog(`✅ Notifications received: ${JSON.stringify(notifications)}`);
      
      const wishlistAlerts = await getWishlistAlerts();
      addLog(`✅ Wishlist alerts received: ${JSON.stringify(wishlistAlerts)}`);
    } catch (error) {
      addLog(`❌ Get alerts failed: ${error}`);
    }
  };

  // Test 5: Direct API Calls
  const testDirectAPI = async () => {
    addLog("🔌 Testing direct API calls...");
    
    try {
      // Test track-view
      const response1 = await fetch("/api/analytics/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: 789,
          productName: "Direct API Test",
          category: "API Test",
          price: 3500,
          source: "test",
        }),
      });
      
      if (response1.ok) {
        addLog("✅ Direct track-view API success");
      } else {
        addLog(`❌ Direct track-view API failed: ${response1.status}`);
      }

      // Test wishlist sync
      const response2 = await fetch("/api/wishlist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [111, 222],
          products: [
            { id: 111, name: "API Test 1", price: 1100, category: "Test" },
            { id: 222, name: "API Test 2", price: 2200, category: "Test" }
          ]
        }),
      });
      
      if (response2.ok) {
        const result = await response2.json();
        addLog(`✅ Direct wishlist sync success: ${result.synced} items`);
      } else {
        addLog(`❌ Direct wishlist sync failed: ${response2.status}`);
      }

      // Test notifications
      const response3 = await fetch("/api/notifications/alerts");
      if (response3.ok) {
        const alerts = await response3.json();
        addLog(`✅ Direct notifications success: ${alerts.total} total`);
      } else {
        addLog(`❌ Direct notifications failed: ${response3.status}`);
      }
    } catch (error) {
      addLog(`❌ Direct API failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Complete Integration Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test All Functions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={testTrackClick} className="w-full">
              🎯 Test Track Click
            </Button>
            
            <Button onClick={testWishlistSync} variant="outline" className="w-full">
              ❤️ Test Wishlist Sync
            </Button>
            
            <Button onClick={testNotificationsSubscribe} variant="outline" className="w-full">
              🔔 Test Notifications Subscribe
            </Button>
            
            <Button onClick={testGetAlerts} variant="outline" className="w-full">
              📬 Test Get Alerts
            </Button>
            
            <Button onClick={testDirectAPI} variant="secondary" className="w-full md:col-span-2">
              🔌 Test Direct API Calls
            </Button>
            
            <Button onClick={clearLogs} variant="ghost" className="w-full md:col-span-2">
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
          <h2 className="text-xl font-semibold text-blue-900 mb-4">📖 What to Check</h2>
          
          <div className="space-y-4 text-blue-800">
            <div>
              <h3 className="font-semibold mb-2">🎯 Track Click:</h3>
              <ul className="list-disc list-inside text-sm">
                <li>Console: [useProductTracking] Tracking click</li>
                <li>Console: [customer-analytics] Product view tracked</li>
                <li>Network: POST /api/analytics/track-view (200)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">❤️ Wishlist Sync:</h3>
              <ul className="list-disc list-inside text-sm">
                <li>Console: [wishlist-context] Syncing wishlist</li>
                <li>Console: [useWishlistSync] Starting sync</li>
                <li>Console: [wishlist-sync] Syncing wishlist for customer</li>
                <li>Network: POST /api/wishlist/sync (200)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">🔔 Notifications:</h3>
              <ul className="list-disc list-inside text-sm">
                <li>Console: [ProductNotificationsWidget] Loading alerts</li>
                <li>Console: [useProductNotifications] Getting alerts</li>
                <li>Network: GET /api/notifications/alerts (200)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">🔌 Direct API:</h3>
              <ul className="list-disc list-inside text-sm">
                <li>Network tab: All API calls should return 200</li>
                <li>Console: Detailed logging for each call</li>
                <li>Response: Check JSON responses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
