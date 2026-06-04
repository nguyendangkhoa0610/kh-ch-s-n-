"use client";

export function TicketActions({ code }: { code: string }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:border-emerald-400 transition-colors"
      >
        🖨️ In vé
      </button>
      <button
        onClick={() =>
          navigator.share?.({ title: `Booking ${code}`, url: window.location.href }).catch(() => {})
        }
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
      >
        📤 Chia sẻ
      </button>
    </div>
  );
}
