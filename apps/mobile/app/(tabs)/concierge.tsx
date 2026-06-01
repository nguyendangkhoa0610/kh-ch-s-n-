import { useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const QUICK_ACTIONS = [
  { label: 'Gọi room service', icon: '🍽️' },
  { label: 'Yêu cầu dọn phòng', icon: '🧹' },
  { label: 'Thông tin spa & hồ bơi', icon: '💆' },
  { label: 'Giờ ăn sáng ở đâu?', icon: '☕' },
  { label: 'Mật khẩu WiFi', icon: '📶' },
  { label: 'Đặt xe đưa đón', icon: '🚗' },
]

export default function ConciergeScreen() {
  const token = useStore((s) => s.token)
  const booking = useStore((s) => s.booking)
  const firstName = booking?.guestName?.split(' ').slice(-1)[0] ?? 'quý khách'

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Xin chào ${firstName}! 🌿\nTôi là trợ lý AI của Trầm Hương Eco-Resort. Tôi có thể giúp gì cho bạn hôm nay?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<FlatList>(null)

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: Message = { id: `u${Date.now()}`, role: 'user', content: trimmed }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setLoading(true)

      try {
        const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }))
        const res = await api.post<{ reply: string }>(
          '/mobile/concierge',
          { message: trimmed, history },
          token!
        )
        const aiMsg: Message = { id: `a${Date.now()}`, role: 'assistant', content: res.data.reply }
        setMessages((prev) => [...prev, aiMsg])
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: `e${Date.now()}`, role: 'assistant', content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại.' },
        ])
      } finally {
        setLoading(false)
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80)
      }
    },
    [messages, loading, token]
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={96}
    >
      {/* Quick actions */}
      <View style={styles.quickBar}>
        <FlatList
          horizontal
          data={QUICK_ACTIONS}
          keyExtractor={(i) => i.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chip} onPress={() => send(item.label)}>
              <Text style={styles.chipText}>{item.icon} {item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.msgList}
        onLayout={() => listRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.row, item.role === 'user' ? styles.rowUser : styles.rowAI]}>
            {item.role === 'assistant' && (
              <View style={styles.avatar}><Text>🌿</Text></View>
            )}
            <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
              <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>
                {item.content}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          loading ? (
            <View style={[styles.row, styles.rowAI]}>
              <View style={styles.avatar}><Text>🌿</Text></View>
              <View style={[styles.bubble, styles.bubbleAI]}>
                <ActivityIndicator size="small" color="#1B4332" />
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={17} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3E8' },
  quickBar: {
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  chip: {
    backgroundColor: '#EBF5EE', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontSize: 12, color: '#1B4332', fontWeight: '500' },
  msgList: { padding: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  rowUser: { justifyContent: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#EBF5EE', alignItems: 'center',
    justifyContent: 'center', marginRight: 6,
  },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 12 },
  bubbleAI: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: '#1B4332', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: '#1A1A1A', lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    color: '#1A1A1A', maxHeight: 100, backgroundColor: '#F9FAFB',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.35 },
})
