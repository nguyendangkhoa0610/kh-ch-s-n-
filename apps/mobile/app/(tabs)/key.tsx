import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, Image, ActivityIndicator,
  TouchableOpacity, Animated, Alert, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

interface KeyData {
  qrCode: string
  roomNumber: string
  validFrom: string
  validUntil: string
}

export default function KeyScreen() {
  const booking = useStore((s) => s.booking)
  const token = useStore((s) => s.token)
  const [keyData, setKeyData] = useState<KeyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => { loadKey() }, [])

  const loadKey = async () => {
    try {
      const res = await api.get<KeyData>('/mobile/key', token!)
      setKeyData(res.data)
    } catch (err: any) {
      Alert.alert('Lỗi tải chìa khóa', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (unlocking) return
    setUnlocking(true)
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start()

    setTimeout(() => {
      setUnlocking(false)
      Alert.alert('✅ Mở khóa thành công', `Chào mừng về phòng ${booking?.roomNumber ?? ''}!`)
    }, 1200)
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Room card */}
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.roomCard}>
        <Text style={styles.roomLabel}>PHÒNG CỦA BẠN</Text>
        <Text style={styles.roomNumber}>{booking?.roomNumber ?? '—'}</Text>
        <Text style={styles.roomName}>{booking?.roomName ?? ''}</Text>
        <View style={styles.dateRow}>
          <Ionicons name="log-in-outline" size={13} color="#86B59A" />
          <Text style={styles.dateText}>
            {booking?.checkIn ? fmt(booking.checkIn) : '—'}
          </Text>
          <Ionicons name="arrow-forward" size={12} color="#86B59A" />
          <Ionicons name="log-out-outline" size={13} color="#86B59A" />
          <Text style={styles.dateText}>
            {booking?.checkOut ? fmt(booking.checkOut) : '—'}
          </Text>
        </View>
        <View style={styles.guestRow}>
          <Ionicons name="person-outline" size={13} color="#86B59A" />
          <Text style={styles.guestText}>{booking?.guestName}</Text>
          <Text style={styles.guestSep}>·</Text>
          <Ionicons name="people-outline" size={13} color="#86B59A" />
          <Text style={styles.guestText}>{booking?.guests} khách</Text>
        </View>
      </LinearGradient>

      {/* QR Code */}
      <View style={styles.qrCard}>
        {keyData ? (
          <>
            <Text style={styles.qrLabel}>Quét để mở phòng</Text>
            <Image source={{ uri: keyData.qrCode }} style={styles.qr} resizeMode="contain" />
            <View style={styles.qrNote}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#1B4332" />
              <Text style={styles.qrNoteText}>
                Hết hạn lúc 12:00 ngày {fmt(keyData.validUntil)}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.qrEmpty}>
            <Ionicons name="alert-circle-outline" size={44} color="#D1D5DB" />
            <Text style={styles.qrEmptyText}>Phòng chưa được phân công</Text>
            <Text style={styles.qrEmptyHint}>Liên hệ lễ tân để được hỗ trợ</Text>
          </View>
        )}
      </View>

      {/* NFC tap to unlock */}
      <TouchableOpacity onPress={handleUnlock} disabled={unlocking} activeOpacity={0.88}>
        <Animated.View style={[styles.unlockBtn, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient colors={['#C9A24B', '#B8891A']} style={styles.unlockGrad}>
            {unlocking ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.unlockText}>Đang mở khóa...</Text>
              </>
            ) : (
              <>
                <Ionicons name="radio-outline" size={26} color="#fff" />
                <Text style={styles.unlockText}>Chạm để mở khóa (NFC)</Text>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Giữ điện thoại sát ổ khóa hoặc quét mã QR bên trên
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3E8' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  roomCard: { borderRadius: 16, padding: 24, marginBottom: 16 },
  roomLabel: { fontSize: 10, color: '#86B59A', letterSpacing: 2.5, fontWeight: '700', marginBottom: 6 },
  roomNumber: { fontSize: 52, fontWeight: '800', color: '#C9A24B', lineHeight: 58 },
  roomName: { fontSize: 15, color: '#fff', marginBottom: 14, opacity: 0.9 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dateText: { fontSize: 13, color: '#fff' },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  guestSep: { color: '#86B59A', marginHorizontal: 2 },
  guestText: { fontSize: 13, color: '#fff' },
  qrCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center',
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  qrLabel: { fontSize: 14, color: '#6B7280', marginBottom: 16, fontWeight: '500' },
  qr: { width: 224, height: 224 },
  qrNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  qrNoteText: { fontSize: 12, color: '#6B7280', flex: 1 },
  qrEmpty: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  qrEmptyText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  qrEmptyHint: { fontSize: 12, color: '#9CA3AF' },
  unlockBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  unlockGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 20,
  },
  unlockText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  hint: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', lineHeight: 18 },
})
