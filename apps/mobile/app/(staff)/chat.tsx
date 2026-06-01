import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

interface Message {
  id: string
  content: string
  team: string
  createdAt: string
  sender: { name: string; role: string }
}

const TEAMS = [
  { id: 'all', label: 'Tất cả', icon: '🌿' },
  { id: 'reception', label: 'Lễ tân', icon: '🏨' },
  { id: 'beach', label: 'Bãi biển', icon: '🏖️' },
  { id: 'kitchen', label: 'Bếp', icon: '👨‍🍳' },
  { id: 'housekeeping', label: 'Buồng phòng', icon: '🧹' },
]

const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

export default function ChatScreen() {
  const token = useStore((s) => s.token)
  const staffUser = useStore((s) => s.staffUser)
  const [team, setTeam] = useState('all')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get<Message[]>(`/mobile/staff/messages/${team}`, token!)
      setMessages(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [team, token])

  useEffect(() => {
    setLoading(true)
    load()
    const interval = setInterval(load, 15_000) // poll 15s
    return () => clearInterval(interval)
  }, [load])

  const send = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return
    setSending(true)
    setInput('')
    try {
      const res = await api.post<Message>('/mobile/staff/messages', { team, content: trimmed }, token!)
      setMessages((prev) => [...prev, res.data])
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80)
    } catch {
      setInput(trimmed) // restore on failure
    } finally {
      setSending(false)
    }
  }

  const activeTeam = TEAMS.find((t) => t.id === team)

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={96}
    >
      {/* Team selector */}
      <View style={styles.teamBar}>
        <FlatList
          horizontal
          data={TEAMS}
          keyExtractor={(t) => t.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.teamChip, team === item.id && styles.teamChipActive]}
              onPress={() => setTeam(item.id)}
            >
              <Text style={styles.teamIcon}>{item.icon}</Text>
              <Text style={[styles.teamLabel, team === item.id && styles.teamLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#065F46" /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.msgList}
          onLayout={() => listRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Chưa có tin nhắn trong kênh {activeTeam?.label}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.sender.name === staffUser?.name
            return (
              <View style={[styles.row, isMine ? styles.rowMe : styles.rowOther]}>
                {!isMine && (
                  <View style={styles.avatar}>
                    <Text style={{ fontSize: 12 }}>
                      {item.sender.name.split(' ').pop()?.[0] ?? '?'}
                    </Text>
                  </View>
                )}
                <View style={[styles.bubble, isMine ? styles.bubbleMe : styles.bubbleOther]}>
                  {!isMine && (
                    <Text style={styles.senderName}>{item.sender.name}</Text>
                  )}
                  <Text style={[styles.msgText, isMine && styles.msgTextMe]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.msgTime, isMine && { color: 'rgba(255,255,255,0.65)' }]}>
                    {fmtTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            )
          }}
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={`Nhắn cho kênh ${activeTeam?.label}...`}
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnOff]}
          onPress={send}
          disabled={!input.trim() || sending}
        >
          <Ionicons name="send" size={17} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  teamBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  teamChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  teamChipActive: { backgroundColor: '#DCFCE7' },
  teamIcon: { fontSize: 14 },
  teamLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  teamLabelActive: { color: '#065F46', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  msgList: { padding: 14, paddingBottom: 8 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  row: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  rowMe: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#D1FAE5', alignItems: 'center',
    justifyContent: 'center', marginRight: 6,
  },
  bubble: { maxWidth: '75%', borderRadius: 14, padding: 10 },
  bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 3 },
  bubbleMe: { backgroundColor: '#065F46', borderBottomRightRadius: 3 },
  senderName: { fontSize: 11, fontWeight: '700', color: '#065F46', marginBottom: 3 },
  msgText: { fontSize: 14, color: '#1A1A1A', lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 9, fontSize: 14,
    color: '#1A1A1A', maxHeight: 100, backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#065F46', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.35 },
})
