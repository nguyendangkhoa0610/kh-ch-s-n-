"use client";

import { useState, Suspense, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ROOM_TYPES, type RoomType } from "@/lib/room-data";
import { formatPrice, calcNights } from "@tram-huong/shared";
import { createGuestBooking } from "@/lib/api";
import { useCustomerAuth } from "@/lib/customer-auth";

// ─── Types ───────────────────────────────────────────────

type Step = 1 | 2 | 3 | "success";
type PaymentMethod = "VNPAY" | "MOMO" | "ZALOPAY" | "CASH";

type GuestInfo = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

// ─── Helpers ─────────────────────────────────────────────

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function formatDate(str: string) {
  const [y, m, d] = str.split("-").map(Number);
  // Dùng format cố định tránh hydration mismatch giữa server/client
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; logo: string; desc: string }[] = [
  { id: "VNPAY", label: "VNPay", logo: "🏦", desc: "QR code hoặc thẻ ATM/Visa" },
  { id: "MOMO", label: "MoMo", logo: "🟣", desc: "Ví điện tử MoMo" },
  { id: "ZALOPAY", label: "ZaloPay", logo: "🔵", desc: "Ví điện tử ZaloPay" },
  { id: "CASH", label: "Tiền mặt", logo: "💵", desc: "Thanh toán khi nhận phòng" },
];

// ─── Step indicator ───────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps = ["Chọn phòng", "Thông tin", "Xác nhận"];
  const current = step === "success" ? 4 : (step as number);

  return (
    <div className="flex items-center justify-center gap-0 mb-12">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  active ? "text-emerald-700" : done ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mb-5 mx-2 transition-colors ${
                  current > n ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Select room ─────────────────────────────────

function Step1Room({
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  guests,
  setGuests,
  onSelect,
}: {
  checkIn: string;
  setCheckIn: (v: string) => void;
  checkOut: string;
  setCheckOut: (v: string) => void;
  guests: number;
  setGuests: (v: number) => void;
  onSelect: (room: RoomType) => void;
}) {
  const nights = calcNights(checkIn, checkOut);
  const available = ROOM_TYPES.filter((r) => r.capacity >= guests);

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    if (val >= checkOut) {
      const next = new Date(val + "T00:00:00");
      next.setDate(next.getDate() + 1);
      setCheckOut(next.toISOString().split("T")[0]);
    }
  }

  return (
    <div>
      {/* Date + guest selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 grid sm:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nhận phòng</span>
          <input
            type="date"
            value={checkIn}
            min={getTodayStr()}
            onChange={(e) => handleCheckInChange(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trả phòng</span>
          <input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Số khách</span>
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-10 h-[42px] flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >−</button>
            <span className="flex-1 text-center text-slate-800 text-sm font-semibold">{guests}</span>
            <button
              type="button"
              onClick={() => setGuests(Math.min(12, guests + 1))}
              className="w-10 h-[42px] flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >+</button>
          </div>
        </label>
      </div>

      {nights > 0 && (
        <p className="text-sm text-slate-500 mb-6">
          <span className="font-semibold text-slate-700">{nights} đêm</span>
          {" "}·{" "}
          {formatDate(checkIn)} → {formatDate(checkOut)}
          {" "}·{" "}
          <span className="text-emerald-600 font-medium">{available.length} phòng phù hợp</span>
        </p>
      )}

      {/* Room cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {ROOM_TYPES.map((room) => {
          const fits = room.capacity >= guests;
          return (
            <div
              key={room.slug}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                fits
                  ? "border-slate-200 hover:border-emerald-400 hover:shadow-lg cursor-pointer group"
                  : "border-slate-100 opacity-50"
              }`}
              onClick={() => fits && onSelect(room)}
            >
              <div className="h-36 relative overflow-hidden">
                <Image src={room.images[0]} alt={room.name} fill sizes="400px" className="object-cover" />
                {!fits && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold bg-slate-800/80 px-3 py-1 rounded-full">
                      Không đủ chỗ cho {guests} khách
                    </span>
                  </div>
                )}
                {room.badge && (
                  <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {room.badge}
                  </span>
                )}
              </div>
              <div className="p-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-[15px] mb-1">{room.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>👥 {room.capacity} khách</span>
                    <span>📐 {room.size} m²</span>
                    <span>🛏 {room.bedType}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {nights > 0 ? (
                    <>
                      <p className="font-bold text-emerald-700 text-base">{formatPrice(room.price * nights)}</p>
                      <p className="text-xs text-slate-400">{nights} đêm</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-emerald-700 text-base">{formatPrice(room.price)}</p>
                      <p className="text-xs text-slate-400">/đêm</p>
                    </>
                  )}
                </div>
              </div>
              {fits && (
                <div className="px-4 pb-4">
                  <button className="w-full py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition-colors">
                    Chọn phòng này
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Field component (phải để NGOÀI Step2Guest, không được định nghĩa bên trong) ───
function GuestField({
  label, value, onChange, type = "text", placeholder, required = true, error,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder: string; required?: boolean; error?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
          error ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"
        }`}
      />
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  )
}

// ─── Step 2: Guest info ───────────────────────────────────

function Step2Guest({
  info,
  onChange,
  onBack,
  onNext,
  loginRedirect,
}: {
  info: GuestInfo;
  onChange: (f: Partial<GuestInfo>) => void;
  onBack: () => void;
  onNext: () => void;
  loginRedirect: string;
}) {
  const { user } = useCustomerAuth();
  const [errors, setErrors] = useState<Partial<GuestInfo>>({});
  const [showForm, setShowForm] = useState(!!user); // nếu đã đăng nhập thì hiện form luôn

  function validate() {
    const e: Partial<GuestInfo> = {};
    if (!info.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!info.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email))
      e.email = "Email không hợp lệ";
    if (!info.phone.trim() || !/^(0|\+84)[0-9]{8,10}$/.test(info.phone.replace(/\s/g, "")))
      e.phone = "Số điện thoại không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <div className="max-w-lg mx-auto">

      {/* ── Auth panel ─────────────────────────────────── */}
      {user ? (
        /* Đã đăng nhập — show badge */
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3.5 mb-5">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800 truncate">{user.name}</p>
            <p className="text-xs text-emerald-600 truncate">{user.email}</p>
          </div>
          <span className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-full font-medium shrink-0">
            Đã đăng nhập
          </span>
        </div>
      ) : !showForm ? (
        /* Chưa đăng nhập — auth gate */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5 shadow-sm">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              </svg>
            </div>
            <h3 className="font-serif text-lg text-slate-900 mb-1">Đăng nhập để đặt phòng</h3>
            <p className="text-sm text-slate-500">
              Thông tin tự động điền · Xem lại booking dễ dàng · Nhận ưu đãi thành viên
            </p>
          </div>

          <div className="space-y-2.5">
            <Link
              href={`/tai-khoan/dang-nhap?redirect=${encodeURIComponent(loginRedirect)}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Đăng nhập
            </Link>
            <Link
              href={`/tai-khoan/dang-ky?redirect=${encodeURIComponent(loginRedirect)}`}
              className="flex items-center justify-center w-full py-3 border-2 border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Tạo tài khoản mới
            </Link>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-slate-400">hoặc</span>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            Tiếp tục không đăng nhập →
          </button>
        </div>
      ) : (
        /* Chọn không đăng nhập — badge nhỏ */
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-5">
          <span className="text-xs text-slate-500">Đặt phòng không cần tài khoản</span>
          <Link href={`/tai-khoan/dang-nhap?redirect=${encodeURIComponent(loginRedirect)}`}
            className="text-xs font-semibold text-emerald-600 hover:underline">
            Đăng nhập
          </Link>
        </div>
      )}

      {/* ── Form ─────────────────────────────────────────── */}
      {(user || showForm) && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-7 space-y-5">
            <GuestField label="Họ và tên" value={info.name} onChange={v => onChange({ name: v })} placeholder="Nguyễn Văn A" error={errors.name} />
            <GuestField label="Email" value={info.email} onChange={v => onChange({ email: v })} type="email" placeholder="email@example.com" error={errors.email} />
            <GuestField label="Số điện thoại" value={info.phone} onChange={v => onChange({ phone: v })} type="tel" placeholder="0901 234 567" error={errors.phone} />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Yêu cầu đặc biệt</span>
              <textarea
                value={info.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                placeholder="Phòng yên tĩnh, tầng cao, dị ứng thực phẩm..."
                rows={3}
                className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 resize-none"
              />
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onBack}
              className="flex-1 py-3.5 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:border-slate-300 transition-colors text-sm"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleNext}
              className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Tiếp tục →
            </button>
          </div>
        </>
      )}

      {/* Back khi đang ở auth gate */}
      {!user && !showForm && (
        <button
          onClick={onBack}
          className="mt-3 w-full py-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Quay lại chọn phòng
        </button>
      )}
    </div>
  );
}

// ─── Step 3: Confirm ─────────────────────────────────────

function PromoInput({
  subtotal,
  promo,
  setPromo,
}: {
  subtotal: number;
  promo: { code: string; discount: number } | null;
  setPromo: (p: { code: string; discount: number } | null) => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
      const res = await fetch(`${API}/promo/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), amount: subtotal }),
      });
      const json = await res.json() as { data?: { code: string; discount: number }; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Mã không hợp lệ");
      setPromo({ code: json.data!.code, discount: json.data!.discount });
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã không hợp lệ");
    } finally {
      setLoading(false);
    }
  }

  if (promo) {
    return (
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
        <span className="text-xs text-emerald-700 font-semibold">🎟️ {promo.code} đã áp dụng</span>
        <button onClick={() => setPromo(null)} className="text-xs text-slate-400 hover:text-red-500">Bỏ</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
          onKeyDown={e => e.key === "Enter" && apply()}
          placeholder="Mã giảm giá"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
        />
        <button
          onClick={apply}
          disabled={loading || !code.trim()}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
        >
          {loading ? "..." : "Áp dụng"}
        </button>
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

function Step3Confirm({
  room,
  checkIn,
  checkOut,
  guests,
  info,
  paymentMethod,
  setPaymentMethod,
  onBack,
  onConfirm,
  loading,
  error,
  promo,
  setPromo,
}: {
  room: RoomType;
  checkIn: string;
  checkOut: string;
  guests: number;
  info: GuestInfo;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  onBack: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  error: string;
  promo: { code: string; discount: number } | null;
  setPromo: (p: { code: string; discount: number } | null) => void;
}) {
  const nights = calcNights(checkIn, checkOut);
  const subtotal = room.price * nights;
  const total = subtotal - (promo?.discount ?? 0);
  const deposit = Math.round(total * 0.3);
  const remaining = total - deposit;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid sm:grid-cols-[1fr_300px] gap-5">
        {/* Left: summary */}
        <div className="space-y-4">
          {/* Room summary */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-28 relative overflow-hidden"><Image src={room.images[0]} alt={room.name} fill sizes="600px" className="object-cover" /></div>
            <div className="p-5">
              <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1">{room.name}</h3>
              <div className="text-sm text-slate-500 space-y-1">
                <p>📅 {formatDate(checkIn)} → {formatDate(checkOut)} <span className="font-medium text-slate-700">({nights} đêm)</span></p>
                <p>👥 {guests} khách · 🛏 {room.bedType}</p>
              </div>
            </div>
          </div>

          {/* Guest info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thông tin khách</p>
            <p className="text-sm text-slate-700"><span className="font-medium">Tên:</span> {info.name}</p>
            <p className="text-sm text-slate-700"><span className="font-medium">Email:</span> {info.email}</p>
            <p className="text-sm text-slate-700"><span className="font-medium">ĐT:</span> {info.phone}</p>
            {info.notes && (
              <p className="text-sm text-slate-500 italic">"{info.notes}"</p>
            )}
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Phương thức thanh toán đặt cọc</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    paymentMethod === opt.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">{opt.logo}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                    <p className="text-[11px] text-slate-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: price breakdown */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-[88px]">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Chi tiết thanh toán</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{formatPrice(room.price)} × {nights} đêm</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Promo code input */}
              <PromoInput subtotal={subtotal} promo={promo} setPromo={setPromo} />

              {promo && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Giảm giá ({promo.code})</span>
                  <span>−{formatPrice(promo.discount)}</span>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between font-bold text-slate-900 text-base mb-1">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-slate-400">Đã bao gồm thuế VAT 8%</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Đặt cọc ngay (30%)</span>
                  <span>{formatPrice(deposit)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Còn lại khi check-in</span>
                  <span>{formatPrice(remaining)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
                {error}
              </div>
            )}
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-colors text-sm mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận đặt phòng"
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">
              Hủy miễn phí trước 48h nhận phòng
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onBack}
        className="mt-5 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        ← Quay lại chỉnh sửa thông tin
      </button>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────

function SuccessState({
  code,
  bookingId,
  room,
  checkIn,
  checkOut,
  guests,
  info,
  paymentMethod,
}: {
  code: string;
  bookingId: string;
  room: RoomType;
  checkIn: string;
  checkOut: string;
  guests: number;
  info: GuestInfo;
  paymentMethod: PaymentMethod;
}) {
  const nights = calcNights(checkIn, checkOut);
  const total = room.price * nights;
  const deposit = Math.round(total * 0.3);
  const [vnpayLoading, setVnpayLoading] = useState(false);
  const [vnpayError, setVnpayError] = useState("");

  async function handleVNPay() {
    setVnpayLoading(true);
    setVnpayError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/payments/vnpay/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        }
      );
      const json = await res.json() as { data?: { paymentUrl: string }; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Lỗi tạo thanh toán");
      window.location.href = json.data!.paymentUrl;
    } catch (err) {
      setVnpayError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setVnpayLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="font-serif text-3xl text-slate-900 mb-2">Đặt phòng thành công!</h2>
      <p className="text-slate-500 mb-8">
        Cảm ơn <span className="font-semibold text-slate-700">{info.name}</span>!
        Vui lòng đặt cọc trong 24h để giữ phòng.
      </p>

      {/* Booking card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6 text-left">
        <div className="h-20 relative overflow-hidden"><Image src={room.images[0]} alt={room.name} fill sizes="600px" className="object-cover" /></div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mã đặt phòng</span>
            <span className="font-mono font-bold text-emerald-700 text-lg bg-emerald-50 px-3 py-1 rounded-lg">
              {code}
            </span>
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-2 text-sm text-slate-600">
            <p><span className="font-medium">Phòng:</span> {room.name}</p>
            <p><span className="font-medium">Nhận phòng:</span> {formatDate(checkIn)}</p>
            <p><span className="font-medium">Trả phòng:</span> {formatDate(checkOut)} ({nights} đêm)</p>
            <p><span className="font-medium">Khách:</span> {guests} người</p>
          </div>
        </div>
      </div>

      {/* Deposit CTA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 text-left">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Đặt cọc để xác nhận phòng
        </p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-600 text-sm">30% tổng tiền</span>
          <span className="text-emerald-700 font-bold text-xl">{formatPrice(deposit)}</span>
        </div>

        {vnpayError && (
          <p className="text-sm text-rose-500 bg-rose-50 rounded-lg px-3 py-2 mb-3">{vnpayError}</p>
        )}

        {paymentMethod === "VNPAY" || paymentMethod === "MOMO" || paymentMethod === "ZALOPAY" ? (
          <div className="space-y-2">
            {/* Thông báo nếu user chọn MoMo/ZaloPay (chưa tích hợp, dùng VNPay gateway) */}
            {(paymentMethod === "MOMO" || paymentMethod === "ZALOPAY") && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                {paymentMethod === "MOMO" ? "🟣 MoMo" : "🔵 ZaloPay"} chưa tích hợp trực tiếp — đặt cọc qua cổng VNPay, sau đó gửi bill chuyển khoản nếu cần.
              </div>
            )}
            <button
              onClick={handleVNPay}
              disabled={vnpayLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {vnpayLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang chuyển đến cổng thanh toán...
                </>
              ) : (
                <>🏦 Đặt cọc qua VNPay — {formatPrice(deposit)}</>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-sm text-amber-800 font-semibold">
              💵 Thanh toán tiền mặt khi nhận phòng
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Vui lòng mang đủ {formatPrice(deposit)} (đặt cọc) khi check-in.
            </p>
          </div>
        )}
      </div>

      {/* Auth upsell nếu chưa đăng nhập */}
      <AuthUpsell code={code} email={info.email} />

      <div className="space-y-3">
        <Link href={`/dat-phong/xac-nhan/${code}`}
          className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm text-center transition-colors">
          🎫 Xem & in vé xác nhận
        </Link>
        <div className="flex gap-3">
          <Link href="/" className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-semibold rounded-xl text-sm text-center hover:border-slate-300 transition-colors">
            Về trang chủ
          </Link>
          <Link href="/hoat-dong" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm text-center transition-colors">
            Xem hoạt động
          </Link>
        </div>
      </div>
    </div>
  );
}

function AuthUpsell({ code, email }: { code: string; email: string }) {
  const { user } = useCustomerAuth();
  if (user) {
    return (
      <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 text-left">
        <p className="font-semibold mb-1">✅ Booking đã lưu vào tài khoản</p>
        <Link href="/tai-khoan/dat-phong-cua-toi" className="text-emerald-600 font-semibold hover:underline text-xs">
          Xem tất cả đặt phòng của tôi →
        </Link>
      </div>
    );
  }
  return (
    <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 text-left">
      <p className="font-semibold mb-1">💡 Lưu booking vào tài khoản</p>
      <p className="text-xs text-blue-600 mb-2">Tạo tài khoản để xem lại booking, nhận ưu đãi và check-in nhanh hơn.</p>
      <Link
        href={`/tai-khoan/dang-ky?email=${encodeURIComponent(email)}`}
        className="inline-block text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full transition-colors"
      >
        Tạo tài khoản với email này →
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

function BookingContent() {
  const params = useSearchParams();

  // Pre-select room nếu có param ?room=<slug> (từ trang phòng chi tiết)
  const preRoom = ROOM_TYPES.find((r) => r.slug === (params.get("room") ?? "")) ?? null;

  const [step, setStep] = useState<Step>(preRoom ? 2 : 1);
  const [checkIn, setCheckIn] = useState(params.get("checkIn") ?? getTodayStr());
  const [checkOut, setCheckOut] = useState(params.get("checkOut") ?? getTomorrowStr());
  const [guests, setGuests] = useState(Number(params.get("guests") ?? 2));
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(preRoom);
  const { user } = useCustomerAuth();
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({ name: "", email: "", phone: "", notes: "" });

  // Auto-fill từ tài khoản đã đăng nhập
  useEffect(() => {
    if (user) {
      setGuestInfo(prev => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email,
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("VNPAY");
  const [bookingCode, setBookingCode] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);

  function handleRoomSelect(room: RoomType) {
    setSelectedRoom(room);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleConfirm() {
    if (!selectedRoom) return;
    setConfirming(true);
    setConfirmError("");
    try {
      const result = await createGuestBooking({
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        roomSlug: selectedRoom.slug,
        checkIn,
        checkOut,
        guests,
        paymentMethod,
        notes: guestInfo.notes,
        userId: user?.id, // link booking với account nếu đã đăng nhập
        promoCode: promo?.code,
      });
      setBookingCode(result.code);
      setBookingId(result.id);
      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setConfirming(false);
    }
  }

  const stepNum = step === "success" ? 4 : (step as number);

  return (
    <>
      <SiteNav />

      {/* Page header */}
      <div className="pt-[72px] bg-emerald-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <h1 className="font-serif text-3xl lg:text-4xl text-white mb-2">
            {step === "success" ? "Đặt phòng hoàn tất" : "Đặt phòng"}
          </h1>
          <p className="text-white/60 text-sm">
            {step === 1 && "Chọn phòng và ngày lưu trú phù hợp"}
            {step === 2 && "Điền thông tin để chúng tôi liên hệ xác nhận"}
            {step === 3 && "Kiểm tra lại trước khi xác nhận"}
            {step === "success" && "Xem thông tin đặt phòng của bạn bên dưới"}
          </p>
        </div>
      </div>

      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
          {step !== "success" && <StepIndicator step={step} />}

          {step === 1 && (
            <Step1Room
              checkIn={checkIn}
              setCheckIn={setCheckIn}
              checkOut={checkOut}
              setCheckOut={setCheckOut}
              guests={guests}
              setGuests={setGuests}
              onSelect={handleRoomSelect}
            />
          )}

          {step === 2 && (
            <Step2Guest
              info={guestInfo}
              onChange={(f) => setGuestInfo((prev) => ({ ...prev, ...f }))}
              onBack={() => setStep(1)}
              onNext={() => { setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              loginRedirect={`/dat-phong?${new URLSearchParams({
                ...(selectedRoom ? { room: selectedRoom.slug } : {}),
                checkIn,
                checkOut,
                guests: String(guests),
              }).toString()}`}
            />
          )}

          {step === 3 && selectedRoom && (
            <Step3Confirm
              room={selectedRoom}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              info={guestInfo}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onBack={() => setStep(2)}
              onConfirm={handleConfirm}
              loading={confirming}
              error={confirmError}
              promo={promo}
              setPromo={setPromo}
            />
          )}

          {step === "success" && selectedRoom && (
            <SuccessState
              code={bookingCode}
              bookingId={bookingId}
              room={selectedRoom}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              info={guestInfo}
              paymentMethod={paymentMethod}
            />
          )}
        </div>
      </main>

      {step !== "success" && <SiteFooter />}
    </>
  );
}

export default function DatPhongPage() {
  return (
    <Suspense>
      <BookingContent />
    </Suspense>
  );
}
