import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../lib/store'
import { api } from '../lib/api'

const SOS_TYPES = [
  { id: 'MEDICAL', label: 'Cấp cứu y tế', icon: '🏥', color: '#DC2626' },
  { id: 'FIRE', label: 'Cháy nổ', icon: '🔥', color: '#EA580C' },
  { id: 'SECURITY', label: 'An ninh', icon: '🚨', color: '#7C3AED' },
  { id: 'SOS', label: 'Cần giúp đỡ', icon: '🆘', color: '#1D4ED8' },
  { id: 'MAINTENANCE', label: 'Hỏng hóc phòng', icon: '🔧', color: '#059669' },
  { id: 'REQUEST', label: 'Yêu cầu khác', icon: '📋', color: '#6B7280' },
]

export default function SosScreen() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!selected) {
      Alert.alert('Chưa chọn loại sự cố')
      return
    }
    setSending(true)
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    try {
      await api.post('/mobile/sos', { type: selected, message }, token!)
      Alert.alert(
        '✅ Tín hiệu đã được gửi',
        'Nhân viên đang trên đường đến hỗ trợ bạn. Vui lòng ở nguyên vị trí.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch {
      Alert.alert(
        'Lỗi gửi tín hiệu',
        'Gọi trực tiếp lễ tân: 0256 XXX XXXX (24/7)',
        [{ text: 'OK' }]
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 44 }}>🆘</Text>
        <Text style={styles.headerTitle}>Nút Khẩn Cấp SOS</Text>
        <Text style={styles.headerSub}>Nhân viên phản hồi trong vòng 3 phút</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Loại sự cố</Text>
        <View style={styles.typeGrid}>
          {SOS_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeCard, selected === t.id && { borderColor: t.color, borderWidth: 2 }]}
              onPress={() => {
                setSelected(t.id)
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              }}
            >
              <Text style={{ fontSize: 28 }}>{t.icon}</Text>
              <Text style={[styles.typeLabel, selected === t.id && { color: t.color, fontWeight: '700' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Mô tả thêm (tùy chọn)</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Nhập thêm thông tin về tình huống..."
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!selected || sending) && styles.sendBtnOff]}
          onPress={handleSend}
          disabled={!selected || sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="alert-circle" size={20} color="#fff" />
              <Text style={styles.sendText}>Gửi tín hiệu SOS</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.phoneCard}>
          <Ionicons name="call-outline" size={18} color="#1B4332" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.phoneLabel}>Hoặc gọi trực tiếp</Text>
            <Text style={styles.phoneNum}>Lễ tân: 0256 XXX XXXX (24/7)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3E8' },
  header: { padding: 28, paddingTop: 64, alignItems: 'center', gap: 6 },
  closeBtn: { position: 'absolute', top: 60, right: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#FCA5A5' },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  typeLabel: { fontSize: 12, color: '#374151', textAlign: 'center' },
  textarea: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1A1A1A', backgroundColor: '#fff',
    height: 80, textAlignVertical: 'top',
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#DC2626', borderRadius: 12,
    paddingVertical: 16, marginTop: 16,
  },
  sendBtnOff: { opacity: 0.45 },
  sendText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  phoneCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EBF5EE', borderRadius: 12, padding: 14, marginTop: 12,
  },
  phoneLabel: { fontSize: 12, color: '#6B7280' },
  phoneNum: { fontSize: 14, fontWeight: '600', color: '#1B4332' },
})
