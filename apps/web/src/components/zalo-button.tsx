"use client";

import { useState } from "react";

const ZALO_NUMBER = "0256xxxxxxx"; // Thay bằng số Zalo thật của resort

export function ZaloButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`https://zalo.me/${ZALO_NUMBER.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group"
      aria-label="Chat Zalo với Trầm Hương Resort"
    >
      {/* Tooltip */}
      <span
        className={`bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 ${
          hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        }`}
      >
        Chat với chúng tôi
      </span>

      {/* Button */}
      <div className="relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-[#0068FF] hover:bg-[#0057CC] transition-colors">
        {/* Ping animation */}
        <span className="absolute inset-0 rounded-full bg-[#0068FF] animate-ping opacity-25" />

        {/* Zalo icon */}
        <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
          <rect width="48" height="48" rx="24" fill="#0068FF" />
          <text
            x="24" y="32"
            textAnchor="middle"
            fill="white"
            fontFamily="Arial, sans-serif"
            fontWeight="800"
            fontSize="16"
          >
            Za
          </text>
        </svg>
      </div>
    </a>
  );
}
