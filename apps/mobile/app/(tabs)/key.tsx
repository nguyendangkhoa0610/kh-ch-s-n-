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
import { useIsTablet, TABLET_MAX_W } from '../../lib/useTablet'

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
  const isTablet = useIsTablet()

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

  const qrSize = isTablet ? 300 : 224

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.inner, isTablet && styles.innerTablet]}>
        {/* Room card */}
        <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.roomCard}>
          <Text style={[styles.roomLabel, isTablet && styles.roomLabelT]}>PHÒNG CỦA BẠN</Text>
          <Text style={[styles.roomNumber, isTablet && styles.roomNumberT]}>
            {booking?.roomNumber ?? '—'}
          </Text>
          <Text style={[styles.roomName, isTablet && styles.roomNameT]}>
            {booking?.roomName ?? ''}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="log-in-outline" size={isTablet ? 16 : 13} color="#86B59A" />
            <Text style={[styles.dateText, isTablet && styles.dateTextT]}>
              {booking?.checkIn ? fmt(booking.checkIn) : '—'}
            </Text>
            <Ionicons name="arrow-forward" size={isTablet ? 15 : 12} color="#86B59A" />
            <Ionicons name="log-out-outline" size={isTablet ? 16 : 13} color="#86B59A" />
            <Text style={[styles.dateText, isTablet && styles.dateTextT]}>
              {booking?.checkOut ? fmt(booking.checkOut) : '—'}
            </Text>
          </View>
          <View style={styles.guestRow}>
            <Ionicons name="person-outline" size={isTablet ? 16 : 13} color="#86B59A" />
            <Text style={[styles.guestText, isTablet && styles.guestTextT]}>{booking?.guestName}</Text>
            <Text style={styles.guestSep}>·</Text>
            <Ionicons name="people-outline" size={isTablet ? 16 : 13} color="#86B59A" />
            <Text style={[styles.guestText, isTablet && styles.guestTextT]}>{booking?.guests} khách</Text>
          </View>
        </LinearGradient>

        {/* QR Code */}
        <View style={styles.qrCard}>
          {keyData ? (
            <>
              <Text style={[styles.qrLabel, isTablet && styles.qrLabelT]}>Quét để mở phòng</Text>
              <Image
                source={{ uri: keyData.qrCode }}
                style={{ width: qrSize, height: qrSize }}
                resizeMode="contain"
              />
              <View style={styles.qrNote}>
                <Ionicons name="shield-checkmark-outline" size={isTablet ? 16 : 13} color="#1B4332" />
                <Text style={[styles.qrNoteText, isTablet && styles.qrNoteTextT]}>
                  Hết hạn lúc 12:00 ngày {fmt(keyData.validUntil)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.qrEmpty}>
              <Ionicons name="alert-circle-outline" size={isTablet ? 56 : 44} color="#D1D5DB" />
              <Text style={[styles.qrEmptyText, isTablet && styles.qrEmptyTextT]}>
                Phòng chưa được phân công
              </Text>
              <Text style={styles.qrEmptyHint}>Liên hệ lễ tân để được hỗ trợ</Text>
            </View>
          )}
        </View>

        {/* NFC tap to unlock */}
        <TouchableOpacity onPress={handleUnlock} disabled={unlocking} activeOpacity={0.88}>
          <Animated.View style={[styles.unlockBtn, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#C9A24B', '#B8891A']}
              style={[styles.unlockGrad, isTablet && styles.unlockGradT]}
            >
              {unlocking ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.unlockText, isTablet && styles.unlockTextT]}>Đang mở khóa...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="radio-outline" size={isTablet ? 32 : 26} color="#fff" />
                  <Text style={[styles.unlockText, isTablet && styles.unlockTextT]}>
                    Chạm để mở khóa (NFC)
                  </Text>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        <Text style={[styles.hint, isTablet && styles.hintT]}>
          Giữ điện thoại sát ổ khóa hoặc quét mã QR bên trên
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3E8' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { width: '100%' },
  innerTablet: { maxWidth: TABLET_MAX_W, alignSelf: 'center' },
  roomCard: { borderRadius: 16, padding: 24, marginBottom: 16 },
  roomLabel: { fontSize: 10, color: '#86B59A', letterSpacing: 2.5, fontWeight: '700', marginBottom: 6 },
  roomLabelT: { fontSize: 12, letterSpacing: 3 },
  roomNumber: { fontSize: 52, fontWeight: '800', color: '#C9A24B', lineHeight: 58 },
  roomNumberT: { fontSize: 68, lineHeight: 76 },
  roomName: { fontSize: 15, color: '#fff', marginBottom: 14, opacity: 0.9 },
  roomNameT: { fontSize: 18, marginBottom: 18 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  dateText: { fontSize: 13, color: '#fff' },
  dateTextT: { fontSize: 16 },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  guestSep: { color: '#86B59A', marginHorizontal: 2 },
  guestText: { fontSize: 13, color: '#fff' },
  guestTextT: { fontSize: 16 },
  qrCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center',
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  qrLabel: { fontSize: 14, color: '#6B7280', marginBottom: 16, fontWeight: '500' },
  qrLabelT: { fontSize: 17, marginBottom: 20 },
  qrNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  qrNoteText: { fontSize: 12, color: '#6B7280', flex: 1 },
  qrNoteTextT: { fontSize: 14 },
  qrEmpty: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  qrEmptyText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  qrEmptyTextT: { fontSize: 18 },
  qrEmptyHint: { fontSize: 12, color: '#9CA3AF' },
  unlockBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  unlockGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 20,
  },
  unlockGradT: { paddingVertical: 28 },
  unlockText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  unlockTextT: { fontSize: 20 },
  hint: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', lineHeight: 18 },
  hintT: { fontSize: 15, lineHeight: 22 },
})
