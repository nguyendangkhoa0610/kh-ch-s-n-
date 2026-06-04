"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const SESSION_KEY = "tram_huong_chat_session";
const POLL_MS = 3000;

type ChatMessage = {
  id: string; sender: "visitor" | "staff"; senderName: string;
  content: string; createdAt: string;
};

type Session = { id: string; visitorName: string };

export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const lastMsgTime = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore session từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved) as Session;
        setSession(s);
        fetchMessages(s.id);
      } catch { localStorage.removeItem(SESSION_KEY); }
    }
  }, []);

  // Polling khi có session và chat đang mở
  const fetchMessages = useCallback(async (sessionId: string, isPolling = false) => {
    const params = lastMsgTime.current ? `?since=${encodeURIComponent(lastMsgTime.current)}` : "";
    const res = await fetch(`${API}/chat/sessions/${sessionId}/messages${params}`).catch(() => null);
    if (!res?.ok) return;
    const json = await res.json() as { data: ChatMessage[] };
    if (json.data.length > 0) {
      if (isPolling) setMessages(prev => [...prev, ...json.data]);
      else setMessages(json.data);
      lastMsgTime.current = json.data[json.data.length - 1].createdAt;
      // count unread staff messages when chat is closed
      if (!open && isPolling) {
        const staffNew = json.data.filter(m => m.sender === "staff").length;
        if (staffNew > 0) setUnread(u => u + staffNew);
      }
    }
  }, [open]);

  useEffect(() => {
    if (session) {
      pollRef.current = setInterval(() => fetchMessages(session.id, true), POLL_MS);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [session, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear unread when opened
  useEffect(() => { if (open) setUnread(0); }, [open]);

  const startChat = async () => {
    if (!name.trim()) return;
    setStarting(true);
    const res = await fetch(`${API}/chat/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorName: name.trim(), visitorEmail: email.trim() || undefined }),
    });
    const json = await res.json() as { data: Session };
    const s = { id: json.data.id, visitorName: json.data.visitorName };
    setSession(s);
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setStarting(false);
    // Welcome message
    setMessages([{
      id: "welcome",
      sender: "staff",
      senderName: "Trầm Hương",
      content: `Xin chào ${s.visitorName}! Chúng tôi sẵn lòng hỗ trợ bạn. Hãy đặt câu hỏi nhé 🌿`,
      createdAt: new Date().toISOString(),
    }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !session || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    // Optimistic update
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`, sender: "visitor",
      senderName: session.visitorName, content, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    await fetch(`${API}/chat/sessions/${session.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "visitor", senderName: session.visitorName, content }),
    }).catch(() => {});
    setSending(false);
    lastMsgTime.current = optimistic.createdAt;
  };

  const endChat = () => {
    if (session) {
      fetch(`${API}/chat/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      }).catch(() => {});
    }
    setSession(null); setMessages([]); setName(""); setEmail("");
    lastMsgTime.current = null;
    localStorage.removeItem(SESSION_KEY);
    setOpen(false);
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#1B4332] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#2D6A4F] transition-colors"
        aria-label="Chat với lễ tân"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          style={{ maxHeight: "min(520px, calc(100vh - 120px))" }}>
          {/* Header */}
          <div className="bg-[#1B4332] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-sm">🌿</div>
              <div>
                <p className="text-white text-sm font-semibold">Lễ tân Trầm Hương</p>
                <p className="text-emerald-300 text-xs">Trả lời trong vài phút</p>
              </div>
            </div>
            {session && (
              <button onClick={endChat} className="text-emerald-300 hover:text-white text-xs transition-colors">
                Kết thúc
              </button>
            )}
          </div>

          {/* Body */}
          {!session ? (
            /* Start form */
            <div className="p-5 flex flex-col gap-3">
              <p className="text-slate-600 text-sm">Xin chào! Nhập thông tin để bắt đầu chat với lễ tân.</p>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Họ tên của bạn *"
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                onKeyDown={e => e.key === "Enter" && startChat()}
              />
              <input
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email (không bắt buộc)"
                type="email"
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                onClick={startChat} disabled={!name.trim() || starting}
                className="bg-[#1B4332] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-50"
              >
                {starting ? "Đang kết nối..." : "Bắt đầu chat 💬"}
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === "visitor"
                        ? "bg-[#1B4332] text-white rounded-br-md"
                        : "bg-white text-slate-800 shadow-sm rounded-bl-md"
                    }`}>
                      {msg.sender === "staff" && (
                        <p className="text-xs text-emerald-600 font-semibold mb-0.5">{msg.senderName}</p>
                      )}
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "visitor" ? "text-emerald-200" : "text-slate-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-slate-100 flex gap-2 items-end shrink-0">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  style={{ maxHeight: 80 }}
                />
                <button
                  onClick={sendMessage} disabled={!input.trim() || sending}
                  className="w-9 h-9 bg-[#1B4332] text-white rounded-xl flex items-center justify-center hover:bg-[#2D6A4F] disabled:opacity-40 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
