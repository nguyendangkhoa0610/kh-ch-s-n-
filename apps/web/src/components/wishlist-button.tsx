"use client";

import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Props = {
  roomTypeId: string;
  className?: string;
  size?: "sm" | "md";
};

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function WishlistButton({ roomTypeId, className = "", size = "md" }: Props) {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const check = useCallback(async () => {
    const token = await getToken();
    if (!token) { setChecked(true); return; }
    try {
      const res = await fetch(`${API}/wishlist/check/${roomTypeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setInWishlist(json.data?.inWishlist ?? false);
    } catch { /* silent */ } finally { setChecked(true); }
  }, [roomTypeId]);

  useEffect(() => { check(); }, [check]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = await getToken();
    if (!token) {
      window.location.href = `/tai-khoan/dang-nhap?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setLoading(true);
    try {
      if (inWishlist) {
        await fetch(`${API}/wishlist/${roomTypeId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setInWishlist(false);
      } else {
        await fetch(`${API}/wishlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ roomTypeId }),
        });
        setInWishlist(true);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  if (!checked) return null;

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={inWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
      className={`${btnSize} rounded-full transition-all ${
        inWishlist
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-white/80 text-slate-400 hover:text-red-400 hover:bg-white"
      } shadow-sm backdrop-blur-sm ${loading ? "opacity-50" : ""} ${className}`}
    >
      <svg className={iconSize} fill={inWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
