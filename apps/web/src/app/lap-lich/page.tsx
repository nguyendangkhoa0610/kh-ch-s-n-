"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ROOM_TYPES } from "@/lib/room-data";
import { ACTIVITIES } from "@/lib/activity-data";
import { formatPrice } from "@tram-huong/shared";
import type { ItineraryRequest, ItineraryResult, ItinerarySlot } from "@/app/api/lap-lich/route";

// ─── Form options ─────────────────────────────────────────

const NIGHTS_OPTIONS = [1, 2, 3, 4, 5, 7];

const GROUP_OPTIONS = [
  { id: "solo", label: "Du lịch một mình", emoji: "🧍" },
  { id: "couple", label: "Cặp đôi", emoji: "💑" },
  { id: "family", label: "Gia đình có trẻ em", emoji: "👨‍👩‍👧‍👦" },
  { id: "friends", label: "Nhóm bạn bè", emoji: "👫" },
];

const INTEREST_OPTIONS = [
  { id: "nature", label: "Thiên nhiên & rừng", emoji: "🌿" },
  { id: "water", label: "Biển & thể thao nước", emoji: "🌊" },
  { id: "food", label: "Ẩm thực địa phương", emoji: "🥘" },
  { id: "wellness", label: "Thư giãn & spa", emoji: "🧘" },
  { id: "adventure", label: "Mạo hiểm & khám phá", emoji: "🧗" },
  { id: "romance", label: "Lãng mạn & riêng tư", emoji: "🌹" },
];

const BUDGET_OPTIONS = [
  { id: "budget", label: "Tiết kiệm", desc: "Ưu tiên trải nghiệm miễn phí" },
  { id: "standard", label: "Thoải mái", desc: "Cân bằng giữa chi phí & trải nghiệm" },
  { id: "premium", label: "Cao cấp", desc: "Trải nghiệm tốt nhất, không giới hạn" },
];

// ─── Slot type styling ────────────────────────────────────

const SLOT_STYLE: Record<ItinerarySlot["type"], { dot: string; border: string }> = {
  activity: { dot: "bg-emerald-500", border: "border-emerald-100" },
  meal:     { dot: "bg-amber-400",   border: "border-amber-100" },
  rest:     { dot: "bg-violet-400",  border: "border-violet-100" },
  travel:   { dot: "bg-sky-400",     border: "border-sky-100" },
};

// ─── Sub-components ───────────────────────────────────────

function SelectChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-all ${
        active
          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"
      }`}
    >
      {children}
    </button>
  );
}

function ItineraryCard({ result }: { result: ItineraryResult }) {
  const room = ROOM_TYPES.find((r) => r.slug === result.roomSlug);
  const total = result.estimateRoom + result.estimateActivities + result.estimateFood;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-700 rounded-3xl p-7 text-white">
        <p className="text-emerald-300 text-xs font-semibold tracking-widest uppercase mb-2">
          Kế hoạch của bạn
        </p>
        <h2 className="font-serif text-3xl font-semibold mb-3">{result.headline}</h2>
        <p className="text-white/70 text-[15px] leading-relaxed">{result.summary}</p>
      </div>

      {/* Room recommendation */}
      {room && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex gap-0">
          <div className={`w-2 bg-gradient-to-b ${room.gradient} shrink-0`} />
          <div className="p-5 flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Phòng đề xuất
            </p>
            <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1">
              {room.name}
            </h3>
            <p className="text-sm text-slate-500 mb-3">{result.roomReason}</p>
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 font-bold">{formatPrice(room.price)}/đêm</span>
              <Link
                href={`/phong/${room.slug}`}
                className="text-sm text-emerald-600 font-semibold hover:underline"
              >
                Xem phòng →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Day-by-day */}
      <div className="space-y-4">
        {result.days.map((day) => (
          <div key={day.day} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">
                <span className="text-emerald-600 mr-2">Ngày {day.day}</span>
                {day.title}
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {day.slots.map((slot, i) => {
                const style = SLOT_STYLE[slot.type];
                const activity = slot.activitySlug
                  ? ACTIVITIES.find((a) => a.slug === slot.activitySlug)
                  : null;
                return (
                  <div key={i} className={`flex gap-4 p-3 rounded-xl border ${style.border} bg-white`}>
                    {/* Time + dot */}
                    <div className="flex flex-col items-center gap-1 shrink-0 w-12">
                      <span className="text-xs font-bold text-slate-500">{slot.time}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800 text-sm">{slot.title}</p>
                        {activity && (
                          <Link
                            href={`/hoat-dong/${activity.slug}`}
                            className="text-[11px] text-emerald-600 font-semibold shrink-0 hover:underline"
                          >
                            {activity.price === 0 ? "Miễn phí" : formatPrice(activity.price)}
                          </Link>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed mt-0.5">{slot.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      {result.tips.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
            💡 Mẹo từ AI concierge
          </p>
          <ul className="space-y-2">
            {result.tips.map((tip, i) => (
              <li key={i} className="text-sm text-slate-700 flex gap-2">
                <span className="text-amber-500 shrink-0">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cost estimate */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Ước tính chi phí
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Phòng</span>
            <span>{formatPrice(result.estimateRoom)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Hoạt động</span>
            <span>{formatPrice(result.estimateActivities)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Ăn uống</span>
            <span>{formatPrice(result.estimateFood)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-100">
            <span>Tổng ước tính</span>
            <span className="text-emerald-700">{formatPrice(total)}</span>
          </div>
        </div>
        <Link
          href={`/dat-phong`}
          className="mt-5 block w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center text-sm transition-colors"
        >
          Đặt phòng theo kế hoạch này →
        </Link>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────

export default function LapLichPage() {
  const [nights, setNights] = useState(3);
  const [groupType, setGroupType] = useState("couple");
  const [interests, setInterests] = useState<string[]>(["nature", "wellness"]);
  const [budget, setBudget] = useState("standard");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ItineraryResult | null>(null);
  const [error, setError] = useState("");

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (interests.length === 0) {
      setError("Vui lòng chọn ít nhất một sở thích.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    const payload: ItineraryRequest = { nights, groupType, interests, budget, notes };

    try {
      const res = await fetch("/api/lap-lich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { data?: ItineraryResult; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Có lỗi xảy ra");
      setResult(json.data!);
      setTimeout(() => {
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo lịch trình thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SiteNav />

      {/* Hero */}
      <section className="pt-[72px] bg-gradient-to-br from-violet-950 via-emerald-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            AI Concierge
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl text-white mb-4">
            Lập lịch trình thông minh
          </h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Điền thông tin chuyến đi, AI sẽ tạo kế hoạch nghỉ dưỡng tối ưu
            ngày theo ngày — từ phòng phù hợp đến từng hoạt động cụ thể.
          </p>
        </div>
      </section>

      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-[420px_1fr] gap-10 items-start">

            {/* Form */}
            <div data-testid="planner-form" className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm sticky top-[88px]">
              <h2 className="font-serif text-xl text-slate-900 mb-6">Thông tin chuyến đi</h2>

              {/* Nights */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
                  Số đêm lưu trú
                </label>
                <div className="flex flex-wrap gap-2">
                  {NIGHTS_OPTIONS.map((n) => (
                    <SelectChip key={n} active={nights === n} onClick={() => setNights(n)}>
                      {n} đêm
                    </SelectChip>
                  ))}
                </div>
              </div>

              {/* Group type */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
                  Loại khách
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GROUP_OPTIONS.map((g) => (
                    <SelectChip key={g.id} active={groupType === g.id} onClick={() => setGroupType(g.id)}>
                      <span>{g.emoji}</span>
                      <span className="text-left leading-tight">{g.label}</span>
                    </SelectChip>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
                  Sở thích <span className="text-slate-400 font-normal">(chọn nhiều)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((opt) => (
                    <SelectChip
                      key={opt.id}
                      active={interests.includes(opt.id)}
                      onClick={() => toggleInterest(opt.id)}
                    >
                      <span>{opt.emoji}</span>
                      {opt.label}
                    </SelectChip>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
                  Ngân sách
                </label>
                <div className="space-y-2">
                  {BUDGET_OPTIONS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudget(b.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        budget === b.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="font-semibold text-sm text-slate-800">{b.label}</span>
                      <span className="text-xs text-slate-400">{b.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                  Ghi chú thêm <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Dị ứng thực phẩm, kỷ niệm đặc biệt, yêu cầu riêng..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-slate-50"
                />
              </div>

              {error && (
                <p className="text-sm text-rose-500 bg-rose-50 rounded-xl px-4 py-3 mb-4">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI đang lên kế hoạch...
                  </>
                ) : (
                  "✨ Tạo lịch trình"
                )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-3">
                Mất khoảng 10–20 giây
              </p>
            </div>

            {/* Result */}
            <div id="result">
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
                  <div className="text-6xl mb-4">🗓</div>
                  <p className="text-lg font-medium text-slate-500 mb-2">
                    Lịch trình của bạn sẽ hiện ở đây
                  </p>
                  <p className="text-sm max-w-sm">
                    Điền thông tin bên trái và nhấn "Tạo lịch trình" để AI
                    concierge chuẩn bị kế hoạch riêng cho bạn.
                  </p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-pulse">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-700 mb-2">
                    AI đang lên kế hoạch cho bạn...
                  </p>
                  <p className="text-sm text-slate-400">
                    Đang phân tích sở thích và tối ưu lịch trình
                  </p>
                </div>
              )}

              {result && <ItineraryCard result={result} />}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
