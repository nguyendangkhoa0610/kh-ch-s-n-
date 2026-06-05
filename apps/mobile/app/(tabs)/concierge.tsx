import { useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'
import { useIsTablet, TABLET_MAX_W } from '../../lib/useTablet'

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
  const isTablet = useIsTablet()
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

  const bubbleMaxWidth = isTablet ? '65%' : '75%'

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
            <TouchableOpacity style={[styles.chip, isTablet && styles.chipT]} onPress={() => send(item.label)}>
              <Text style={[styles.chipText, isTablet && styles.chipTextT]}>{item.icon} {item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[
          styles.msgList,
          isTablet && { maxWidth: TABLET_MAX_W, alignSelf: 'center', width: '100%' },
        ]}
        onLayout={() => listRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.row, item.role === 'user' ? styles.rowUser : styles.rowAI]}>
            {item.role === 'assistant' && (
              <View style={[styles.avatar, isTablet && styles.avatarT]}><Text>🌿</Text></View>
            )}
            <View style={[styles.bubble, { maxWidth: bubbleMaxWidth }, item.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
              <Text style={[styles.bubbleText, isTablet && styles.bubbleTextT, item.role === 'user' && styles.bubbleTextUser]}>
                {item.content}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          loading ? (
            <View style={[styles.row, styles.rowAI]}>
              <View style={[styles.avatar, isTablet && styles.avatarT]}><Text>🌿</Text></View>
              <View style={[styles.bubble, styles.bubbleAI]}>
                <ActivityIndicator size="small" color="#1B4332" />
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={[styles.inputBar, isTablet && styles.inputBarT]}>
        <View style={[styles.inputRow, isTablet && { maxWidth: TABLET_MAX_W, alignSelf: 'center', width: '100%' }]}>
          <TextInput
            style={[styles.input, isTablet && styles.inputT]}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, isTablet && styles.sendBtnT, (!input.trim() || loading) && styles.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={isTablet ? 20 : 17} color="#fff" />
          </TouchableOpacity>
        </View>
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
  chipT: { paddingHorizontal: 16, paddingVertical: 9 },
  chipText: { fontSize: 12, color: '#1B4332', fontWeight: '500' },
  chipTextT: { fontSize: 14 },
  msgList: { padding: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  rowUser: { justifyContent: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#EBF5EE', alignItems: 'center',
    justifyContent: 'center', marginRight: 6,
  },
  avatarT: { width: 38, height: 38, borderRadius: 19, marginRight: 8 },
  bubble: { borderRadius: 16, padding: 12 },
  bubbleAI: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: '#1B4332', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: '#1A1A1A', lineHeight: 20 },
  bubbleTextT: { fontSize: 16, lineHeight: 24 },
  bubbleTextUser: { color: '#fff' },
  inputBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    padding: 12,
  },
  inputBarT: { padding: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    color: '#1A1A1A', maxHeight: 100, backgroundColor: '#F9FAFB',
  },
  inputT: { fontSize: 16, paddingVertical: 14, paddingHorizontal: 20 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1B4332', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnT: { width: 50, height: 50, borderRadius: 25 },
  sendBtnOff: { opacity: 0.35 },
})
