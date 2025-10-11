// Header.jsx
import React from "react";
import { useLayout } from "./AppLayout";

export default function Header() {
  const { title } = useLayout();

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

        {/* Optional right side controls (search, avatar, etc.) */}
        <div className="flex items-center space-x-3">
          {/* Example: simple placeholder avatar */}
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
            Z
          </div>
        </div>
      </div>
    </header>
  );
}
