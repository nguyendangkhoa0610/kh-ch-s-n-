"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useCustomerAuth } from "@/lib/customer-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const CRITERIA = [
  { key: "cleanlinessRating", label: "Sạch sẽ", icon: "✨" },
  { key: "serviceRating", label: "Dịch vụ", icon: "🛎" },
  { key: "locationRating", label: "Vị trí & Thiên nhiên", icon: "🌿" },
] as const;

function StarRow({
  label, icon, value, onChange,
}: {
  label: string; icon: string; value: number; onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-slate-600 text-sm flex items-center gap-2">
        <span>{icon}</span> {label}
      </span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="text-2xl transition-transform hover:scale-110"
          >
            <span className={(hovered || value) >= n ? "text-amber-400" : "text-slate-200"}>★</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const STAR_LABELS: Record<number, string> = {
  1: "Tệ", 2: "Không tốt", 3: "Bình thường", 4: "Tốt", 5: "Xuất sắc",
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const code = typeof params.code === "string" ? params.code : "";
  const { token } = useCustomerAuth();

  const [existing, setExisting] = useState<null | { overallRating: number }>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [overall, setOverall] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [ratings, setRatings] = useState({ cleanlinessRating: 5, serviceRating: 5, locationRating: 5 });
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!code) return;
    fetch(`${API_BASE}/booking-reviews/${code}`)
      .then(r => r.json())
      .then((j: { data: { overallRating: number } | null }) => {
        if (j.data) setExisting(j.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  const submit = async () => {
    if (!token) { setError("Vui lòng đăng nhập để gửi đánh giá."); return; }
    if (!overall) { setError("Vui lòng chọn số sao tổng thể."); return; }
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${API_BASE}/booking-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingCode: code, overallRating: overall, ...ratings, comment }),
      });
      if (r.ok) { setSubmitted(true); }
      else {
        const j = await r.json() as { error?: string };
        setError(j.error ?? "Gửi đánh giá thất bại.");
      }
    } catch { setError("Lỗi kết nối. Vui lòng thử lại."); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <>
        <SiteNav />
        <div className="min-h-screen bg-slate-50 pt-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-gradient-to-b from-emerald-950 to-slate-900 pt-[72px] pb-20">
        <div className="max-w-xl mx-auto px-6 pt-12">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
              ⭐
            </div>
            <h1 className="font-serif text-3xl text-white mb-3">Đánh giá kỳ nghỉ</h1>
            <p className="text-white/60 text-sm">Mã booking: <span className="font-mono text-emerald-400 font-semibold">{code}</span></p>
          </div>

          {existing ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
              <p className="text-4xl mb-4">✅</p>
              <h2 className="font-semibold text-slate-800 text-xl mb-2">Bạn đã gửi đánh giá!</h2>
              <p className="text-slate-500 text-sm mb-6">Cảm ơn bạn đã dành thời gian chia sẻ. Phản hồi của bạn giúp chúng tôi cải thiện dịch vụ.</p>
              <div className="flex justify-center gap-1 text-3xl mb-2">
                {[1,2,3,4,5].map(n => (
                  <span key={n} className={n <= existing.overallRating ? "text-amber-400" : "text-slate-200"}>★</span>
                ))}
              </div>
              <p className="text-slate-400 text-sm">{existing.overallRating}/5 sao</p>
              <Link href="/" className="mt-6 inline-block px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700 transition-colors">
                Về trang chủ
              </Link>
            </div>
          ) : submitted ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
              <p className="text-5xl mb-5">🎉</p>
              <h2 className="font-serif text-2xl text-slate-800 mb-3">Cảm ơn bạn!</h2>
              <p className="text-slate-500 mb-2">Đánh giá của bạn đã được ghi nhận.</p>
              <p className="text-slate-400 text-sm mb-8">Hẹn gặp lại bạn tại Trầm Hương Eco-Resort! 🌿</p>
              <Link href="/dat-phong"
                className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-colors">
                Đặt phòng lần tiếp
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Overall rating */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-center">
                <p className="text-white/80 text-sm mb-3">Đánh giá tổng thể</p>
                <div className="flex justify-center gap-2 mb-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setOverall(n)}
                      className="text-4xl transition-all hover:scale-125"
                    >
                      <span className={(hovered || overall) >= n ? "text-amber-300" : "text-white/30"}>★</span>
                    </button>
                  ))}
                </div>
                {(hovered || overall) > 0 && (
                  <p className="text-white font-semibold text-sm">{STAR_LABELS[hovered || overall]}</p>
                )}
              </div>

              <div className="p-6">
                {/* Criteria ratings */}
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Đánh giá chi tiết</p>
                <div className="mb-5">
                  {CRITERIA.map(c => (
                    <StarRow key={c.key} label={c.label} icon={c.icon}
                      value={ratings[c.key]}
                      onChange={v => setRatings(prev => ({ ...prev, [c.key]: v }))}
                    />
                  ))}
                </div>

                {/* Comment */}
                <div className="mb-5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">
                    Nhận xét của bạn
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn... (điều bạn thích, điều cần cải thiện)"
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                {!token && (
                  <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-700 text-sm px-4 py-3 rounded-xl">
                    <Link href={`/tai-khoan/dang-nhap?redirect=/dat-phong/danh-gia/${code}`} className="font-semibold underline">
                      Đăng nhập
                    </Link>{" "}
                    để gửi đánh giá.
                  </div>
                )}

                <button onClick={submit} disabled={submitting || !overall}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
                  {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
