import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

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
        // Parse QR payload
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
        <Ionicons name="camera-outline" size={56} color="#9CA3AF" />
        <Text style={styles.permText}>App cần quyền truy cập camera</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <View style={styles.container}>
      {result ? (
        <ScrollView contentContainerStyle={styles.resultContent}>
          <LinearGradient colors={['#065F46', '#047857']} style={styles.resultHeader}>
            <Ionicons name="checkmark-circle" size={48} color="#6EE7B7" />
            <Text style={styles.resultTitle}>Tìm thấy booking</Text>
            <Text style={styles.resultCode}>{result.bookingCode}</Text>
          </LinearGradient>

          <View style={styles.resultCard}>
            <Row label="Khách" value={result.guestName} />
            <Row label="SĐT" value={result.guestPhone ?? '—'} />
            <Row label="Phòng" value={`${result.roomNumber ?? '—'} · ${result.roomName ?? ''}`} />
            <Row label="Check-in" value={fmt(result.checkIn)} />
            <Row label="Check-out" value={fmt(result.checkOut)} />
            <Row label="Số khách" value={`${result.guests} người`} />
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>Trạng thái</Text>
              <Text style={[styles.rowValue, { color: STATUS_COLORS[result.status] ?? '#374151', fontWeight: '700' }]}>
                {STATUS_LABELS[result.status] ?? result.status}
              </Text>
            </View>
          </View>

          {result.status === 'CONFIRMED' && (
            <TouchableOpacity
              style={[styles.checkinBtn, checkingIn && { opacity: 0.55 }]}
              onPress={handleCheckIn}
              disabled={checkingIn}
            >
              {checkingIn
                ? <ActivityIndicator color="#fff" />
                : <><Ionicons name="log-in" size={20} color="#fff" />
                   <Text style={styles.checkinText}>Xác nhận Check-in</Text></>
              }
            </TouchableOpacity>
          )}

          {result.status === 'CHECKED_IN' && (
            <View style={styles.alreadyBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.alreadyText}>Khách đã check-in</Text>
            </View>
          )}

          <TouchableOpacity style={styles.rescanBtn} onPress={() => { setResult(null); setScanning(true) }}>
            <Text style={styles.rescanText}>Quét mã khác</Text>
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
              <View style={styles.frame} />
              {loading ? (
                <ActivityIndicator color="#6EE7B7" size="large" style={{ marginTop: 24 }} />
              ) : (
                <Text style={styles.scanHint}>Hướng camera vào mã QR của khách</Text>
              )}
            </View>
          </CameraView>
        </View>
      )}
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  permText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  permBtn: { backgroundColor: '#065F46', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontWeight: '700' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  frame: {
    width: 240, height: 240, borderRadius: 12,
    borderWidth: 2.5, borderColor: '#6EE7B7',
    backgroundColor: 'transparent',
  },
  scanHint: { color: '#fff', marginTop: 20, fontSize: 14, fontWeight: '500' },
  resultContent: { paddingBottom: 40 },
  resultHeader: { padding: 32, alignItems: 'center', gap: 8 },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  resultCode: { fontSize: 22, fontWeight: '800', color: '#6EE7B7' },
  resultCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  rowItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  rowLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  checkinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#065F46', borderRadius: 12, marginHorizontal: 16,
    paddingVertical: 16, marginBottom: 10,
  },
  checkinText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  alreadyBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#DCFCE7', borderRadius: 10, marginHorizontal: 16,
    paddingVertical: 12, marginBottom: 10,
  },
  alreadyText: { fontSize: 15, fontWeight: '600', color: '#059669' },
  rescanBtn: { alignItems: 'center', paddingVertical: 12, marginHorizontal: 16 },
  rescanText: { fontSize: 14, color: '#065F46', fontWeight: '600' },
})
