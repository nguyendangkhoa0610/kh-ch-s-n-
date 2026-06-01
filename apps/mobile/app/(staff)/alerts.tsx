import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

interface SOSAlert {
  id: string
  type: string
  location: string
  message: string | null
  status: string
  createdAt: string
  user: { name: string; phone: string | null }
}

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  SOS:         { icon: '🆘', color: '#DC2626', label: 'SOS khẩn cấp' },
  MEDICAL:     { icon: '🏥', color: '#DC2626', label: 'Cấp cứu y tế' },
  FIRE:        { icon: '🔥', color: '#EA580C', label: 'Cháy nổ' },
  SECURITY:    { icon: '🚨', color: '#7C3AED', label: 'An ninh' },
  MAINTENANCE: { icon: '🔧', color: '#059669', label: 'Hỏng hóc' },
  REQUEST:     { icon: '📋', color: '#6B7280', label: 'Yêu cầu' },
  INCIDENT:    { icon: '⚠️', color: '#D97706', label: 'Sự cố' },
}

const fmtTime = (d: string) =>
  new Date(d).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit',
  })

export default function AlertsScreen() {
  const token = useStore((s) => s.token)
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get<SOSAlert[]>('/mobile/staff/sos-alerts', token!)
      setAlerts(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000) // poll 30s
    return () => clearInterval(interval)
  }, [load])

  const updateStatus = async (alert: SOSAlert, newStatus: string) => {
    const label = newStatus === 'RESPONDING' ? 'đang xử lý' : 'đã giải quyết'
    Alert.alert(
      'Cập nhật trạng thái',
      `Xác nhận đánh dấu cảnh báo này là "${label}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await api.patch(`/mobile/staff/sos-alerts/${alert.id}`, { status: newStatus }, token!)
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              setAlerts((prev) =>
                prev.map((a) => (a.id === alert.id ? { ...a, status: newStatus } : a))
              )
            } catch (err: any) {
              Alert.alert('Lỗi', err.message)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#065F46" /></View>
  }

  const newAlerts = alerts.filter((a) => a.status === 'NEW')
  const respondingAlerts = alerts.filter((a) => a.status === 'RESPONDING')

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={[...newAlerts, ...respondingAlerts]}
      keyExtractor={(a) => a.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#065F46" />
      }
      ListHeaderComponent={
        alerts.length === 0 ? null : (
          <View style={styles.summary}>
            <Text style={styles.summaryNew}>{newAlerts.length} mới</Text>
            <Text style={styles.summarySep}>·</Text>
            <Text style={styles.summaryResponding}>{respondingAlerts.length} đang xử lý</Text>
          </View>
        )
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="shield-checkmark-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Không có cảnh báo nào</Text>
          <Text style={styles.emptyHint}>Tự động cập nhật mỗi 30 giây</Text>
        </View>
      }
      renderItem={({ item }) => {
        const meta = TYPE_META[item.type] ?? { icon: '⚠️', color: '#6B7280', label: item.type }
        const location = (() => { try { return JSON.parse(item.location) } catch { return {} } })()
        const isNew = item.status === 'NEW'

        return (
          <View style={[styles.alertCard, isNew && styles.alertCardNew]}>
            <View style={styles.alertHeader}>
              <Text style={{ fontSize: 28 }}>{meta.icon}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.alertType, { color: meta.color }]}>{meta.label}</Text>
                <Text style={styles.alertGuest}>{item.user.name}</Text>
                {item.user.phone && <Text style={styles.alertPhone}>{item.user.phone}</Text>}
              </View>
              <View style={[styles.statusPill, { backgroundColor: isNew ? '#FEE2E2' : '#DBEAFE' }]}>
                <Text style={[styles.statusText, { color: isNew ? '#DC2626' : '#1D4ED8' }]}>
                  {isNew ? 'Mới' : 'Đang xử lý'}
                </Text>
              </View>
            </View>

            {item.message && (
              <Text style={styles.alertMsg}>"{item.message}"</Text>
            )}

            <View style={styles.alertMeta}>
              <Ionicons name="location-outline" size={12} color="#9CA3AF" />
              <Text style={styles.alertMetaText}>
                {location.area ?? 'Không xác định'}
              </Text>
              <Ionicons name="time-outline" size={12} color="#9CA3AF" style={{ marginLeft: 8 }} />
              <Text style={styles.alertMetaText}>{fmtTime(item.createdAt)}</Text>
            </View>

            <View style={styles.alertActions}>
              {isNew && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => updateStatus(item, 'RESPONDING')}
                >
                  <Text style={styles.actionBtnText}>Nhận xử lý</Text>
                </TouchableOpacity>
              )}
              {item.status === 'RESPONDING' && (
                <TouchableOpacity
                  style={styles.actionBtnSuccess}
                  onPress={() => updateStatus(item, 'RESOLVED')}
                >
                  <Text style={styles.actionBtnText}>Đã giải quyết</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  summaryNew: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  summarySep: { color: '#9CA3AF' },
  summaryResponding: { fontSize: 14, fontWeight: '600', color: '#1D4ED8' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  emptyHint: { fontSize: 12, color: '#9CA3AF' },
  alertCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  alertCardNew: { borderLeftWidth: 3, borderLeftColor: '#DC2626' },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  alertType: { fontSize: 14, fontWeight: '700' },
  alertGuest: { fontSize: 13, color: '#374151', fontWeight: '500', marginTop: 2 },
  alertPhone: { fontSize: 12, color: '#6B7280' },
  statusPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  alertMsg: { fontSize: 13, color: '#374151', fontStyle: 'italic', marginBottom: 8, paddingLeft: 2 },
  alertMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  alertMetaText: { fontSize: 12, color: '#9CA3AF' },
  alertActions: { flexDirection: 'row', gap: 8 },
  actionBtnPrimary: {
    flex: 1, backgroundColor: '#065F46', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  actionBtnSuccess: {
    flex: 1, backgroundColor: '#059669', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
})
