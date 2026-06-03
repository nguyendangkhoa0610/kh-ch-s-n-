import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../../lib/auth'

type Message = { id: string; content: string; createdAt: string; sender: { name: string; id: string } | null }
type Team = 'all' | 'reception' | 'beach' | 'kitchen' | 'housekeeping'

const TEAMS: { id: Team; label: string; icon: string }[] = [
  { id: 'all', label: 'Tất cả', icon: '🌿' },
  { id: 'reception', label: 'Lễ tân', icon: '🏨' },
  { id: 'beach', label: 'Bãi biển', icon: '🏖' },
  { id: 'kitchen', label: 'Bếp', icon: '🍳' },
  { id: 'housekeeping', label: 'Buồng phòng', icon: '🛏' },
]

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function StaffChatPage() {
  const { user, getHeaders } = useAuth()
  const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
  const [team, setTeam] = useState<Team>('all')
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    fetch(`${BASE}/mobile/staff/messages/${team}`, { headers: getHeaders() })
      .then(r => r.json())
      .then((j: { data: Message[] }) => setMessages(j.data ?? []))
      .catch(() => { /* silent fail — retry on next interval */ })
  }, [team])

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [load])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await fetch(`${BASE}/mobile/staff/messages`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ team, content: text.trim() }),
      })
      setText('')
      load()
    } catch { alert('Gửi thất bại.') }
    finally { setSending(false) }
  }

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 120px)' }}>
      <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Lora, serif' }}>Chat nội bộ</h2>

      {/* Team tabs */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {TEAMS.map(t => (
          <button key={t.id} onClick={() => setTeam(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              team === t.id ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-400'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">Chưa có tin nhắn nào trong kênh này.</p>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender?.id === user?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!isMe && <p className="text-xs text-slate-400 px-1">{msg.sender?.name ?? '?'}</p>}
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                    isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-slate-400 px-1">{timeStr(msg.createdAt)}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Nhắn vào ${TEAMS.find(t => t.id === team)?.label}...`}
          className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
        <button onClick={send} disabled={!text.trim() || sending}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors">
          Gửi
        </button>
      </div>
    </div>
  )
}
