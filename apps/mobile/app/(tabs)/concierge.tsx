import { useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'
import { useIsTablet, TABLET_MAX_W } from '../../lib/useTablet'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  feedback?: 'good' | 'bad' | null
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

  // Feedback state
  const [feedbackTarget, setFeedbackTarget] = useState<Message | null>(null)
  const [correction, setCorrection] = useState('')
  const [sendingFeedback, setSendingFeedback] = useState(false)

  // Tìm câu hỏi của user trước tin nhắn AI này
  const findQuestion = (msgId: string): string => {
    const idx = messages.findIndex(m => m.id === msgId)
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i]!.role === 'user') return messages[i]!.content
    }
    return ''
  }

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
        const aiMsg: Message = {
          id: `a${Date.now()}`,
          role: 'assistant',
          content: res.data.reply,
          feedback: null,
        }
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

  const handleQuickFeedback = async (msg: Message, isGood: boolean) => {
    // Đánh dấu ngay trên UI
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, feedback: isGood ? 'good' : 'bad' } : m))

    if (isGood) {
      // Gửi thẳng không cần correction
      api.post('/ai/feedback', {
        question: findQuestion(msg.id),
        aiAnswer: msg.content,
        isGood: true,
      }, token!).catch(() => {})
    } else {
      // Mở bottom sheet để nhập correction
      setFeedbackTarget(msg)
      setCorrection('')
    }
  }

  const submitNegativeFeedback = async () => {
    if (!feedbackTarget) return
    setSendingFeedback(true)
    try {
      await api.post('/ai/feedback', {
        question: findQuestion(feedbackTarget.id),
        aiAnswer: feedbackTarget.content,
        isGood: false,
        correction: correction.trim() || undefined,
      }, token!)
    } catch { /* silent */ } finally {
      setSendingFeedback(false)
      setFeedbackTarget(null)
      setCorrection('')
    }
  }

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
            <View style={{ maxWidth: bubbleMaxWidth }}>
              <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                <Text style={[styles.bubbleText, isTablet && styles.bubbleTextT, item.role === 'user' && styles.bubbleTextUser]}>
                  {item.content}
                </Text>
              </View>
              {/* Feedback buttons chỉ hiện cho tin AI và không phải tin đầu tiên */}
              {item.role === 'assistant' && item.id !== '0' && (
                <View style={styles.feedbackRow}>
                  {item.feedback === null || item.feedback === undefined ? (
                    <>
                      <TouchableOpacity
                        style={styles.fbBtn}
                        onPress={() => handleQuickFeedback(item, true)}
                      >
                        <Text style={styles.fbIcon}>👍</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.fbBtn}
                        onPress={() => handleQuickFeedback(item, false)}
                      >
                        <Text style={styles.fbIcon}>👎</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.fbSent}>
                      {item.feedback === 'good' ? '👍 Cảm ơn!' : '👎 Đã ghi nhận'}
                    </Text>
                  )}
                </View>
              )}
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

      {/* Feedback bottom sheet (Modal) */}
      <Modal
        visible={!!feedbackTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setFeedbackTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFeedbackTarget(null)}>
          <Pressable style={[styles.sheet, isTablet && styles.sheetT]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, isTablet && styles.sheetTitleT]}>Câu trả lời chưa đúng?</Text>
            <Text style={[styles.sheetSub, isTablet && styles.sheetSubT]}>
              Nhập câu trả lời đúng hơn (không bắt buộc) — thông tin này giúp cải thiện AI Concierge.
            </Text>
            <TextInput
              style={[styles.correctionInput, isTablet && styles.correctionInputT]}
              placeholder="Câu trả lời nên là..."
              placeholderTextColor="#9CA3AF"
              value={correction}
              onChangeText={setCorrection}
              multiline
              maxLength={500}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.submitBtn, isTablet && styles.submitBtnT, sendingFeedback && styles.submitBtnOff]}
              onPress={submitNegativeFeedback}
              disabled={sendingFeedback}
            >
              <Text style={[styles.submitText, isTablet && styles.submitTextT]}>
                {sendingFeedback ? 'Đang gửi...' : 'Gửi phản hồi'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  feedbackRow: {
    flexDirection: 'row', gap: 4, marginTop: 4, paddingLeft: 4,
  },
  fbBtn: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, backgroundColor: '#F3F4F6',
  },
  fbIcon: { fontSize: 13 },
  fbSent: { fontSize: 11, color: '#9CA3AF', paddingVertical: 4 },
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
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36,
  },
  sheetT: { maxWidth: TABLET_MAX_W, alignSelf: 'center', width: '100%', borderRadius: 20, marginBottom: 40 },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 },
  sheetTitleT: { fontSize: 20 },
  sheetSub: { fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 18 },
  sheetSubT: { fontSize: 15, lineHeight: 22 },
  correctionInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, fontSize: 14, color: '#1A1A1A',
    minHeight: 80, textAlignVertical: 'top', marginBottom: 14,
  },
  correctionInputT: { fontSize: 16, minHeight: 100 },
  submitBtn: {
    backgroundColor: '#1B4332', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  submitBtnT: { paddingVertical: 18 },
  submitBtnOff: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitTextT: { fontSize: 17 },
})
