import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

const AREAS = ['Lễ tân', 'Bãi biển', 'Bếp / Nhà hàng', 'Buồng phòng', 'Hồ bơi', 'Khu vực chung', 'Rừng / Cây xanh']
const SEVERITIES = [
  { id: 'LOW',    label: 'Nhẹ',    color: '#059669', bg: '#D1FAE5' },
  { id: 'MEDIUM', label: 'Vừa',   color: '#D97706', bg: '#FEF3C7' },
  { id: 'HIGH',   label: 'Nghiêm trọng', color: '#DC2626', bg: '#FEE2E2' },
]

export default function ReportScreen() {
  const token = useStore((s) => s.token)
  const [area, setArea] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('LOW')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!area) { Alert.alert('Chưa chọn khu vực'); return }
    if (!description.trim()) { Alert.alert('Chưa mô tả sự cố'); return }

    setSending(true)
    try {
      await api.post('/mobile/staff/incidents', { area, description: description.trim(), severity }, token!)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSent(true)
    } catch (err: any) {
      Alert.alert('Lỗi', err.message ?? 'Không thể gửi báo cáo')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={72} color="#059669" />
        <Text style={styles.successTitle}>Báo cáo đã được gửi</Text>
        <Text style={styles.successSub}>Quản lý đã nhận được và sẽ xử lý sớm nhất</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => { setArea(''); setDescription(''); setSeverity('LOW'); setSent(false) }}
        >
          <Text style={styles.newBtnText}>Tạo báo cáo mới</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Khu vực */}
      <Text style={styles.label}>Khu vực xảy ra sự cố *</Text>
      <View style={styles.areaGrid}>
        {AREAS.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.areaChip, area === a && styles.areaChipActive]}
            onPress={() => setArea(a)}
          >
            <Text style={[styles.areaText, area === a && styles.areaTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mức độ */}
      <Text style={styles.label}>Mức độ nghiêm trọng *</Text>
      <View style={styles.severityRow}>
        {SEVERITIES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.severityBtn, severity === s.id && { backgroundColor: s.bg, borderColor: s.color }]}
            onPress={() => setSeverity(s.id)}
          >
            <Text style={[styles.severityText, severity === s.id && { color: s.color, fontWeight: '700' }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mô tả */}
      <Text style={styles.label}>Mô tả sự cố *</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Mô tả chi tiết sự cố: vị trí cụ thể, thời điểm, ảnh hưởng..."
        placeholderTextColor="#9CA3AF"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {/* Photo placeholder */}
      <Text style={styles.label}>Ảnh đính kèm (tùy chọn)</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={() => Alert.alert('Chụp ảnh', 'Tính năng chụp ảnh sẽ được tích hợp với expo-image-picker.')}>
        <Ionicons name="camera-outline" size={28} color="#9CA3AF" />
        <Text style={styles.photoBtnText}>Chụp ảnh hoặc chọn từ thư viện</Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (sending || !area || !description.trim()) && styles.submitBtnOff]}
        onPress={handleSubmit}
        disabled={sending || !area || !description.trim()}
        activeOpacity={0.85}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.submitText}>Gửi báo cáo</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff',
  },
  areaChipActive: { borderColor: '#065F46', backgroundColor: '#DCFCE7' },
  areaText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  areaTextActive: { color: '#065F46', fontWeight: '700' },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff',
  },
  severityText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  textarea: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#1A1A1A',
    backgroundColor: '#fff', height: 120,
  },
  photoBtn: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, borderStyle: 'dashed',
    padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 6,
  },
  photoBtnText: { fontSize: 13, color: '#9CA3AF' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#065F46', borderRadius: 12, paddingVertical: 16, marginTop: 20,
  },
  submitBtnOff: { opacity: 0.45 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  successContainer: {
    flex: 1, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#065F46' },
  successSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  newBtn: { backgroundColor: '#065F46', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, marginTop: 10 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
