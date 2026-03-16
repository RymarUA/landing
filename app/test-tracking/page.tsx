"use client";

import { useState } from "react";
import { useProductTracking } from "@/hooks/use-product-tracking";
import { Button } from "@/components/ui/button";

export default function TestTrackingPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const { trackClick } = useProductTracking();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testTrackClick = async () => {
    addLog("Testing trackClick...");
    
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

  const testDirectAPI = async () => {
    addLog("Testing direct API call...");
    
    try {
      const response = await fetch("/api/analytics/track-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: 456,
          productName: "Direct API Test",
          category: "API Test",
          price: 2500,
          source: "test",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`✅ Direct API success: ${JSON.stringify(result)}`);
      } else {
        const error = await response.json();
        addLog(`❌ Direct API failed: ${response.status} - ${JSON.stringify(error)}`);
      }
    } catch (error) {
      addLog(`❌ Direct API error: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Analytics Tracking Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Functions</h2>
          
          <div className="space-y-4">
            <Button onClick={testTrackClick} className="w-full">
              🎯 Test trackClick Hook
            </Button>
            
            <Button onClick={testDirectAPI} variant="outline" className="w-full">
              🔌 Test Direct API Call
            </Button>
            
            <Button onClick={clearLogs} variant="ghost" className="w-full">
              🗑️ Clear Logs
            </Button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
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

        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">📖 How to Check</h2>
          
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Open browser DevTools (F12)</li>
            <li>Go to Network tab</li>
            <li>Filter by &quot;track-view&quot;</li>
            <li>Click test buttons above</li>
            <li>Check for POST requests to /api/analytics/track-view</li>
            <li>Check Console tab for logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
