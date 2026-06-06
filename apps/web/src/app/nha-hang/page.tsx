"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCustomerAuth } from "@/lib/customer-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type MenuItem = {
  id: string; name: string; nameEn: string | null; description: string | null;
  category: string; price: number; image: string | null; isVeg: boolean;
};

type CartItem = MenuItem & { qty: number; notes: string };

type Order = {
  id: string; status: string; totalAmount: number; createdAt: string;
  items: { quantity: number; unitPrice: number; menuItem: { name: string } }[];
};

const CAT = [
  { id: "ALL", label: "Tất cả", emoji: "🍽" },
  { id: "BREAKFAST", label: "Bữa sáng", emoji: "🌅" },
  { id: "LUNCH", label: "Bữa trưa", emoji: "☀️" },
  { id: "DINNER", label: "Bữa tối", emoji: "🌙" },
  { id: "DRINKS", label: "Đồ uống", emoji: "🥤" },
  { id: "SNACKS", label: "Ăn vặt", emoji: "🥗" },
];

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Đang xử lý", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "Đang làm", color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Đã giao", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Đã huỷ", color: "bg-red-100 text-red-500" },
};

function fmtPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function fmtTime(s: string) {
  return new Date(s).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

export default function NhaHangPage() {
  const { user, token } = useCustomerAuth();
  const [tab, setTab] = useState<"menu" | "orders">("menu");
  const [catFilter, setCatFilter] = useState("ALL");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/menu`)
      .then(r => r.json())
      .then((j: { data: MenuItem[] }) => setItems(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    const r = await fetch(`${API_BASE}/menu/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      const j = await r.json() as { data: Order[] };
      setOrders(j.data ?? []);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "orders") loadOrders();
  }, [tab, loadOrders]);

  // Lấy booking đang active (CHECKED_IN) của user
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((j: { data: { id: string; status: string }[] }) => {
        const active = (j.data ?? []).find(b => b.status === "CHECKED_IN");
        setBookingId(active?.id ?? null);
      })
      .catch(() => {});
  }, [token]);

  const shown = catFilter === "ALL" ? items : items.filter(i => i.category === catFilter);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1, notes: "" }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c).filter(c => c.qty > 0));
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const placeOrder = async () => {
    if (!token || !bookingId || !cart.length) return;
    setPlacing(true);
    try {
      const r = await fetch(`${API_BASE}/menu/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingId,
          notes: orderNotes,
          items: cart.map(c => ({ menuItemId: c.id, quantity: c.qty, notes: c.notes })),
        }),
      });
      if (r.ok) {
        setCart([]);
        setShowCart(false);
        setOrderNotes("");
        setOrderSuccess(true);
        setTimeout(() => setOrderSuccess(false), 4000);
        loadOrders();
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <SiteNav />

      {/* Hero */}
      <section className="pt-[72px] bg-gradient-to-br from-emerald-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Nhà hàng & Ẩm thực
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-5">
            Nhà hàng Trầm Hương
          </h1>
          <p className="text-white/60 text-lg max-w-xl leading-relaxed">
            Ẩm thực Bình Định đặc sắc và các món quốc tế — phục vụ 3 bữa/ngày,
            giao đến tận phòng hoặc thưởng thức tại nhà hàng.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <span className="text-emerald-400">⏰</span>
              Bữa sáng: 6:30 – 9:30
            </div>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <span className="text-emerald-400">⏰</span>
              Bữa trưa: 11:30 – 14:00
            </div>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <span className="text-emerald-400">⏰</span>
              Bữa tối: 17:30 – 21:30
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Tab */}
        <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-xl w-fit">
          <button onClick={() => setTab("menu")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "menu" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            Thực đơn
          </button>
          {user && (
            <button onClick={() => setTab("orders")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "orders" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              Đơn của tôi
            </button>
          )}
        </div>

        {tab === "menu" && (
          <>
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
              {CAT.map(c => (
                <button key={c.id} onClick={() => setCatFilter(c.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${
                    catFilter === c.id
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                  }`}>
                  <span>{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : shown.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <p className="text-4xl mb-3">🍽</p>
                <p className="font-medium">Chưa có món trong danh mục này</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {shown.map(item => {
                  const inCart = cart.find(c => c.id === item.id);
                  return (
                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                      {/* Image */}
                      <div className="relative h-44 bg-gradient-to-br from-emerald-50 to-slate-100 overflow-hidden">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="300px" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-5xl opacity-40">🍽</div>
                        )}
                        {item.isVeg && (
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            🌱 Chay
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-0.5">{item.name}</h3>
                        {item.nameEn && <p className="text-slate-400 text-xs mb-2">{item.nameEn}</p>}
                        {item.description && (
                          <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-emerald-700 font-bold text-sm">{fmtPrice(item.price)}</span>
                          {token && bookingId ? (
                            inCart ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-lg leading-none">−</button>
                                <span className="text-sm font-bold text-slate-800 w-4 text-center">{inCart.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 text-lg leading-none">+</button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(item)}
                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 transition-colors">
                                Thêm
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-slate-400">
                              {!token ? "Đăng nhập để đặt" : "Cần check-in"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No booking / no auth notice */}
            {!token && (
              <div className="mt-10 bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex gap-4 items-start">
                <span className="text-2xl">🔐</span>
                <div>
                  <p className="font-semibold text-emerald-800 mb-1">Đăng nhập để đặt món</p>
                  <p className="text-emerald-700 text-sm">Khách đang lưu trú có thể gọi món giao đến phòng. <a href="/tai-khoan/dang-nhap" className="underline font-semibold">Đăng nhập ngay</a></p>
                </div>
              </div>
            )}
            {token && !bookingId && (
              <div className="mt-10 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4 items-start">
                <span className="text-2xl">🏨</span>
                <div>
                  <p className="font-semibold text-amber-800 mb-1">Bạn chưa check-in</p>
                  <p className="text-amber-700 text-sm">Tính năng gọi món chỉ khả dụng khi bạn đang lưu trú tại resort. Bạn vẫn có thể xem thực đơn để tham khảo.</p>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "orders" && user && (
          <div className="max-w-2xl">
            {orders.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <p className="text-4xl mb-3">🛎</p>
                <p className="font-medium">Chưa có đơn nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const st = ORDER_STATUS[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600" };
                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-400">{fmtTime(order.createdAt)}</span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {order.items.map((it, i) => (
                          <div key={i} className="flex justify-between text-sm text-slate-600">
                            <span>{it.menuItem.name} × {it.quantity}</span>
                            <span>{fmtPrice(it.unitPrice * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 pt-3 flex justify-between">
                        <span className="text-sm text-slate-500">Tổng cộng</span>
                        <span className="font-bold text-emerald-700">{fmtPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <button onClick={() => setShowCart(true)}
          className="fixed bottom-8 right-8 z-50 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-full shadow-xl font-semibold flex items-center gap-3 transition-all">
          <span className="w-6 h-6 bg-white text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">{cartCount}</span>
          Giỏ hàng · {fmtPrice(cartTotal)}
        </button>
      )}

      {/* Order success toast */}
      {orderSuccess && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-xl font-semibold flex items-center gap-2 animate-bounce">
          ✓ Đặt món thành công! Nhà hàng sẽ giao trong 20–30 phút.
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-serif text-xl text-slate-900">Giỏ hàng</h2>
              <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 items-start bg-slate-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
                    <p className="text-emerald-600 text-sm font-medium">{fmtPrice(item.price)}</p>
                    <input
                      placeholder="Ghi chú (không hành, ít cay...)"
                      value={item.notes}
                      onChange={e => setCart(prev => prev.map(c => c.id === item.id ? { ...c, notes: e.target.value } : c))}
                      className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 bg-white focus:outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300 text-base leading-none">−</button>
                    <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 text-base leading-none">+</button>
                    <button onClick={() => removeFromCart(item.id)} className="ml-1 text-slate-300 hover:text-red-400 text-base leading-none">🗑</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-slate-100 space-y-3">
              <textarea
                placeholder="Ghi chú cho đơn hàng (phòng số, dị ứng thức ăn...)"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-emerald-300 resize-none"
              />
              <div className="flex justify-between text-base font-bold text-slate-800 mb-1">
                <span>Tổng cộng</span>
                <span className="text-emerald-700">{fmtPrice(cartTotal)}</span>
              </div>
              <p className="text-xs text-slate-400">Giao đến phòng trong 20–30 phút. Thanh toán khi check-out.</p>
              <button onClick={placeOrder} disabled={placing}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors">
                {placing ? "Đang đặt..." : "Xác nhận đặt món"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </>
  );
}
