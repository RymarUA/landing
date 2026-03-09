"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export function TemuSearchBar() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Use proper URL structure with query parameter and hash
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}#catalog`;
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 py-2.5">
        {/* Search Input - Full Width */}
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="плаття принцеси для дівчинки"
              className="w-full h-11 pl-11 pr-4 rounded-full bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </form>
      </div>
    </div>
  );
}
