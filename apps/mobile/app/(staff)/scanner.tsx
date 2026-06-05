import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, useWindowDimensions,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'
import { useIsTablet, TABLET_MAX_W } from '../../lib/useTablet'

interface ScanResult {
  bookingId: string
  bookingCode: string
  guestName: string
  guestPhone: string | null
  roomNumber: string | null
  roomName: string | null
  checkIn: string
  checkOut: string
  guests: number
  status: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã check-in',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B', CONFIRMED: '#3B82F6',
  CHECKED_IN: '#059669', COMPLETED: '#6B7280', CANCELLED: '#DC2626',
}

export default function ScannerScreen() {
  const token = useStore((s) => s.token)
  const isTablet = useIsTablet()
  const { width } = useWindowDimensions()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)

  const handleScan = useCallback(
    async ({ data }: { data: string }) => {
      if (!scanning || loading) return
      setScanning(false)
      setLoading(true)

      try {
        const payload = JSON.parse(data) as { token?: string }
        if (!payload.token) throw new Error('QR không hợp lệ')

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

        const res = await api.get<ScanResult>(
          `/mobile/staff/bookings/by-qr?token=${encodeURIComponent(payload.token)}`,
          token!
        )
        setResult(res.data)
      } catch (err: any) {
        Alert.alert(
          'QR không hợp lệ',
          err.message ?? 'Không nhận ra mã QR này',
          [{ text: 'Quét lại', onPress: () => { setScanning(true); setResult(null) } }]
        )
      } finally {
        setLoading(false)
      }
    },
    [scanning, loading, token]
  )

  const handleCheckIn = async () => {
    if (!result) return
    setCheckingIn(true)
    try {
      const res = await api.patch<{ success: boolean; alreadyCheckedIn?: boolean }>(
        `/mobile/staff/bookings/${result.bookingId}/checkin`,
        {},
        token!
      )
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      const msg = res.data.alreadyCheckedIn
        ? 'Khách đã được check-in trước đó.'
        : `Check-in thành công!\nChào mừng ${result.guestName} đến Trầm Hương.`
      Alert.alert('✅ Check-in', msg, [
        { text: 'Quét tiếp', onPress: () => { setResult(null); setScanning(true) } },
      ])
    } catch (err: any) {
      Alert.alert('Lỗi', err.message)
    } finally {
      setCheckingIn(false)
    }
  }

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#065F46" /></View>
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={isTablet ? 72 : 56} color="#9CA3AF" />
        <Text style={[styles.permText, isTablet && styles.permTextT]}>App cần quyền truy cập camera</Text>
        <TouchableOpacity style={[styles.permBtn, isTablet && styles.permBtnT]} onPress={requestPermission}>
          <Text style={[styles.permBtnText, isTablet && styles.permBtnTextT]}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // On tablet: QR frame bigger (320 vs 240)
  const frameSize = isTablet ? 320 : 240

  return (
    <View style={styles.container}>
      {result ? (
        <ScrollView contentContainerStyle={styles.resultContent}>
          <LinearGradient colors={['#065F46', '#047857']} style={styles.resultHeader}>
            <Ionicons name="checkmark-circle" size={isTablet ? 64 : 48} color="#6EE7B7" />
            <Text style={[styles.resultTitle, isTablet && styles.resultTitleT]}>Tìm thấy booking</Text>
            <Text style={[styles.resultCode, isTablet && styles.resultCodeT]}>{result.bookingCode}</Text>
          </LinearGradient>

          <View style={[styles.resultCard, isTablet && styles.resultCardT]}>
            <Row label="Khách" value={result.guestName} isTablet={isTablet} />
            <Row label="SĐT" value={result.guestPhone ?? '—'} isTablet={isTablet} />
            <Row label="Phòng" value={`${result.roomNumber ?? '—'} · ${result.roomName ?? ''}`} isTablet={isTablet} />
            <Row label="Check-in" value={fmt(result.checkIn)} isTablet={isTablet} />
            <Row label="Check-out" value={fmt(result.checkOut)} isTablet={isTablet} />
            <Row label="Số khách" value={`${result.guests} người`} isTablet={isTablet} />
            <View style={styles.rowItem}>
              <Text style={[styles.rowLabel, isTablet && styles.rowLabelT]}>Trạng thái</Text>
              <Text style={[styles.rowValue, isTablet && styles.rowValueT, { color: STATUS_COLORS[result.status] ?? '#374151', fontWeight: '700' }]}>
                {STATUS_LABELS[result.status] ?? result.status}
              </Text>
            </View>
          </View>

          {result.status === 'CONFIRMED' && (
            <TouchableOpacity
              style={[styles.checkinBtn, isTablet && styles.checkinBtnT, checkingIn && { opacity: 0.55 }]}
              onPress={handleCheckIn}
              disabled={checkingIn}
            >
              {checkingIn
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="log-in" size={isTablet ? 26 : 20} color="#fff" />
                    <Text style={[styles.checkinText, isTablet && styles.checkinTextT]}>
                      Xác nhận Check-in
                    </Text>
                  </>
              }
            </TouchableOpacity>
          )}

          {result.status === 'CHECKED_IN' && (
            <View style={[styles.alreadyBadge, isTablet && styles.alreadyBadgeT]}>
              <Ionicons name="checkmark-circle" size={isTablet ? 24 : 18} color="#059669" />
              <Text style={[styles.alreadyText, isTablet && styles.alreadyTextT]}>Khách đã check-in</Text>
            </View>
          )}

          <TouchableOpacity style={styles.rescanBtn} onPress={() => { setResult(null); setScanning(true) }}>
            <Text style={[styles.rescanText, isTablet && styles.rescanTextT]}>Quét mã khác</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleScan}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            <View style={styles.overlay}>
              <View style={[styles.frame, { width: frameSize, height: frameSize }]} />
              {loading ? (
                <ActivityIndicator color="#6EE7B7" size="large" style={{ marginTop: 24 }} />
              ) : (
                <Text style={[styles.scanHint, isTablet && styles.scanHintT]}>
                  Hướng camera vào mã QR của khách
                </Text>
              )}
            </View>
          </CameraView>
        </View>
      )}
    </View>
  )
}

function Row({ label, value, isTablet }: { label: string; value: string; isTablet: boolean }) {
  return (
    <View style={styles.rowItem}>
      <Text style={[styles.rowLabel, isTablet && styles.rowLabelT]}>{label}</Text>
      <Text style={[styles.rowValue, isTablet && styles.rowValueT]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  permText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  permTextT: { fontSize: 19 },
  permBtn: { backgroundColor: '#065F46', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnT: { paddingHorizontal: 32, paddingVertical: 16 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  permBtnTextT: { fontSize: 18 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  frame: {
    borderRadius: 12,
    borderWidth: 2.5, borderColor: '#6EE7B7',
    backgroundColor: 'transparent',
  },
  scanHint: { color: '#fff', marginTop: 20, fontSize: 14, fontWeight: '500' },
  scanHintT: { fontSize: 18, marginTop: 28 },
  resultContent: { paddingBottom: 40 },
  resultHeader: { padding: 32, alignItems: 'center', gap: 8 },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  resultTitleT: { fontSize: 22 },
  resultCode: { fontSize: 22, fontWeight: '800', color: '#6EE7B7' },
  resultCodeT: { fontSize: 28 },
  resultCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  resultCardT: { maxWidth: TABLET_MAX_W, alignSelf: 'center', width: '100%', marginHorizontal: 'auto' },
  rowItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  rowLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  rowLabelT: { fontSize: 16 },
  rowValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  rowValueT: { fontSize: 17 },
  checkinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#065F46', borderRadius: 12, marginHorizontal: 16,
    paddingVertical: 16, marginBottom: 10,
  },
  checkinBtnT: { paddingVertical: 22, maxWidth: TABLET_MAX_W, alignSelf: 'center', width: '90%', marginHorizontal: 'auto' },
  checkinText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  checkinTextT: { fontSize: 20 },
  alreadyBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#DCFCE7', borderRadius: 10, marginHorizontal: 16,
    paddingVertical: 12, marginBottom: 10,
  },
  alreadyBadgeT: { paddingVertical: 18 },
  alreadyText: { fontSize: 15, fontWeight: '600', color: '#059669' },
  alreadyTextT: { fontSize: 19 },
  rescanBtn: { alignItems: 'center', paddingVertical: 12, marginHorizontal: 16 },
  rescanText: { fontSize: 14, color: '#065F46', fontWeight: '600' },
  rescanTextT: { fontSize: 18 },
})
