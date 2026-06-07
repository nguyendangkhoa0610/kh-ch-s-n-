import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../lib/auth'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

type ChatMessage = {
  id: string; sender: 'visitor' | 'staff'; senderName: string
  content: string; createdAt: string
}
type ChatSession = {
  id: string; visitorName: string; visitorEmail: string | null
  status: string; lastMessageAt: string; createdAt: string
  messages: ChatMessage[]
  _count: { messages: number }
}

function timeAgo(s: string) {
  const ms = Date.now() - new Date(s).getTime()
  const m = Math.floor(ms / 60_000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

export function LiveChatPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [selected, setSelected] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [statusFilter, setStatusFilter] = useState('OPEN')
  const lastTime = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSessions = useCallback(() => {
    fetch(`${BASE}/chat/sessions?status=${statusFilter}`)
      .then(r => r.json())
      .then(j => setSessions(j.data ?? []))
      .catch(() => {})
  }, [statusFilter])

  useEffect(() => { fetchSessions() }, [fetchSessions])
  useEffect(() => {
    const t = setInterval(fetchSessions, 5000)
    return () => clearInterval(t)
  }, [fetchSessions])

  const loadMessages = useCallback(async (sessionId: string, polling = false) => {
    const params = polling && lastTime.current ? `?since=${encodeURIComponent(lastTime.current)}` : ''
    const r = await fetch(`${BASE}/chat/sessions/${sessionId}/messages${params}`).catch(() => null)
    if (!r?.ok) return
    const j = await r.json() as { data: ChatMessage[] }
    if (j.data.length > 0) {
      if (polling) setMessages(prev => [...prev, ...j.data])
      else setMessages(j.data)
      lastTime.current = j.data[j.data.length - 1].createdAt
    }
  }, [])

  const selectSession = (s: ChatSession) => {
    setSelected(s); setMessages([]); lastTime.current = null
    loadMessages(s.id)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => loadMessages(s.id, true), 3000)
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || !selected || sending) return
    const content = input.trim(); setInput(''); setSending(true)
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`, sender: 'staff',
      senderName: user?.name ?? 'Lễ tân',
      content, createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    await fetch(`${BASE}/chat/sessions/${selected.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'staff', senderName: user?.name ?? 'Lễ tân', content }),
    }).catch(() => {})
    setSending(false)
    lastTime.current = optimistic.createdAt
    fetchSessions()
  }

  const closeSession = async (sessionId: string) => {
    await fetch(`${BASE}/chat/sessions/${sessionId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED' }),
    })
    if (selected?.id === sessionId) { setSelected(null); setMessages([]) }
    fetchSessions()
  }

  return (
    <div className="flex h-full gap-0 -m-6" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Sessions list */}
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 mb-3" style={{ fontFamily: 'Lora, serif' }}>Live Chat</h2>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            {[{ v: 'OPEN', l: 'Đang mở' }, { v: 'CLOSED', l: 'Đóng' }].map(({ v, l }) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-12">Không có cuộc chat nào</div>
          ) : sessions.map(s => (
            <button key={s.id} onClick={() => selectSession(s)}
              className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.id === s.id ? 'bg-emerald-50 border-l-2 border-l-emerald-600' : ''}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm text-slate-800 truncate">{s.visitorName}</span>
                <span className="text-xs text-slate-400 shrink-0 ml-1">{timeAgo(s.lastMessageAt)}</span>
              </div>
              {s.messages[0] && (
                <p className="text-xs text-slate-500 truncate">{s.messages[0].content}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">{s._count.messages} tin nhắn</span>
                {s.visitorEmail && <span className="text-xs text-slate-300 truncate">· {s.visitorEmail}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-slate-50">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
            <div>
              <p className="font-semibold text-slate-800">{selected.visitorName}</p>
              {selected.visitorEmail && <p className="text-xs text-slate-400">{selected.visitorEmail}</p>}
            </div>
            {selected.status === 'OPEN' && (
              <button onClick={() => closeSession(selected.id)}
                className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                Đóng chat
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender === 'staff'
                    ? 'bg-[#1B4332] text-white rounded-br-md'
                    : 'bg-white text-slate-800 shadow-sm rounded-bl-md'
                }`}>
                  {msg.sender === 'visitor' && (
                    <p className="text-xs text-emerald-600 font-semibold mb-0.5">{msg.senderName}</p>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender === 'staff' ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {selected.status === 'OPEN' && (
            <div className="bg-white border-t border-slate-200 px-4 py-3 flex gap-2 items-end shrink-0">
              <textarea
                value={input} onChange={e => setInput(e.target.value)} rows={1}
                placeholder="Nhập phản hồi..."
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                style={{ maxHeight: 100 }}
              />
              <button onClick={send} disabled={!input.trim() || sending}
                className="px-4 py-2.5 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors">
                Gửi
              </button>
            </div>
          )}
          {selected.status === 'CLOSED' && (
            <div className="bg-slate-100 px-5 py-3 text-center text-sm text-slate-500 border-t">
              Cuộc trò chuyện đã đóng
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <div className="text-5xl mb-3">💬</div>
            <p>Chọn một cuộc trò chuyện để trả lời</p>
          </div>
        </div>
      )}
    </div>
  )
}
