import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'
import { useIsTablet, TABLET_MAX_W } from '../../lib/useTablet'

interface Shift {
  id: string
  area: string
  startTime: string
  endTime: string
  notes: string | null
}

interface Stats {
  pendingSOS: number
  checkInsToday: number
  pendingBookings: number
}

const AREA_LABELS: Record<string, string> = {
  reception: 'Lễ tân',
  beach: 'Bãi biển',
  kitchen: 'Bếp',
  housekeeping: 'Buồng phòng',
  all: 'Toàn resort',
}

const AREA_ICONS: Record<string, string> = {
  reception: '🏨', beach: '🏖️', kitchen: '👨‍🍳', housekeeping: '🧹', all: '🌿',
}

export default function StaffHome() {
  const router = useRouter()
  const staffUser = useStore((s) => s.staffUser)
  const token = useStore((s) => s.token)
  const logout = useStore((s) => s.logout)
  const isTablet = useIsTablet()

  const [shifts, setShifts] = useState<Shift[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [shiftsRes, statsRes] = await Promise.all([
        api.get<{ shifts: Shift[]; totalStaffOnDuty: number }>('/mobile/staff/shifts', token!),
        api.get<Stats>('/mobile/staff/stats', token!),
      ])
      setShifts(shiftsRes.data.shifts)
      setStats(statsRes.data)
    } catch {
      // fail silently
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  const now = new Date()
  const greeting =
    now.getHours() < 12 ? 'Chào buổi sáng' :
    now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  const isOnShift = shifts.some(
    (s) => new Date(s.startTime) <= now && new Date(s.endTime) >= now
  )

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#6EE7B7" />}
    >
      <View style={[styles.inner, isTablet && styles.innerTablet]}>
        {/* Header */}
        <LinearGradient colors={['#065F46', '#047857']} style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.greeting, isTablet && styles.greetingT]}>{greeting},</Text>
              <Text style={[styles.staffName, isTablet && styles.staffNameT]}>
                {staffUser?.name ?? 'Nhân viên'}
              </Text>
              <View style={[styles.statusBadge, isOnShift ? styles.statusOn : styles.statusOff]}>
                <View style={[styles.dot, { backgroundColor: isOnShift ? '#6EE7B7' : '#9CA3AF' }]} />
                <Text style={[styles.statusText, isTablet && styles.statusTextT]}>
                  {isOnShift ? 'Đang ca trực' : 'Ngoài ca'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => { logout(); router.replace('/login') }}
              style={styles.logoutBtn}
            >
              <Ionicons name="log-out-outline" size={isTablet ? 26 : 20} color="#86B59A" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(staff)/alerts')}>
              <Text style={[styles.statNum, isTablet && styles.statNumT, stats.pendingSOS > 0 && styles.statRed]}>
                {stats.pendingSOS}
              </Text>
              <Text style={[styles.statLabel, isTablet && styles.statLabelT]}>SOS mới</Text>
            </TouchableOpacity>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, isTablet && styles.statNumT, styles.statGold]}>
                {stats.checkInsToday}
              </Text>
              <Text style={[styles.statLabel, isTablet && styles.statLabelT]}>Check-in hôm nay</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, isTablet && styles.statNumT]}>{stats.pendingBookings}</Text>
              <Text style={[styles.statLabel, isTablet && styles.statLabelT]}>Đặt phòng chờ</Text>
            </View>
          </View>
        )}

        {/* Quick actions */}
        <Text style={[styles.section, isTablet && styles.sectionT]}>Thao tác nhanh</Text>
        <View style={[styles.actionsGrid, isTablet && styles.actionsGridT]}>
          <TouchableOpacity
            style={[styles.actionCard, isTablet && styles.actionCardT]}
            onPress={() => router.push('/(staff)/scanner')}
          >
            <Ionicons name="qr-code" size={isTablet ? 36 : 28} color="#065F46" />
            <Text style={[styles.actionLabel, isTablet && styles.actionLabelT]}>Quét check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, isTablet && styles.actionCardT]}
            onPress={() => router.push('/(staff)/alerts')}
          >
            <Ionicons name="alert-circle" size={isTablet ? 36 : 28} color="#DC2626" />
            <Text style={[styles.actionLabel, isTablet && styles.actionLabelT]}>SOS Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, isTablet && styles.actionCardT]}
            onPress={() => router.push('/(staff)/report')}
          >
            <Ionicons name="document-text" size={isTablet ? 36 : 28} color="#D97706" />
            <Text style={[styles.actionLabel, isTablet && styles.actionLabelT]}>Báo cáo sự cố</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, isTablet && styles.actionCardT]}
            onPress={() => router.push('/(staff)/chat')}
          >
            <Ionicons name="chatbubbles" size={isTablet ? 36 : 28} color="#065F46" />
            <Text style={[styles.actionLabel, isTablet && styles.actionLabelT]}>Nhắn nội bộ</Text>
          </TouchableOpacity>
        </View>

        {/* Today's shifts */}
        <Text style={[styles.section, isTablet && styles.sectionT]}>Ca trực hôm nay</Text>
        {loading ? (
          <ActivityIndicator color="#065F46" style={{ marginTop: 20 }} />
        ) : shifts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={isTablet ? 46 : 36} color="#D1D5DB" />
            <Text style={[styles.emptyText, isTablet && styles.emptyTextT]}>
              Không có ca trực hôm nay
            </Text>
          </View>
        ) : (
          <View style={[isTablet && styles.shiftsGrid]}>
            {shifts.map((shift) => {
              const active = new Date(shift.startTime) <= now && new Date(shift.endTime) >= now
              return (
                <View
                  key={shift.id}
                  style={[
                    styles.shiftCard,
                    active && styles.shiftActive,
                    isTablet && styles.shiftCardT,
                  ]}
                >
                  <Text style={{ fontSize: isTablet ? 28 : 24 }}>
                    {AREA_ICONS[shift.area] ?? '📋'}
                  </Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.shiftArea, isTablet && styles.shiftAreaT]}>
                      {AREA_LABELS[shift.area] ?? shift.area}
                    </Text>
                    <Text style={[styles.shiftTime, isTablet && styles.shiftTimeT]}>
                      {fmtTime(shift.startTime)} — {fmtTime(shift.endTime)}
                    </Text>
                    {shift.notes && (
                      <Text style={[styles.shiftNote, isTablet && styles.shiftNoteT]}>
                        {shift.notes}
                      </Text>
                    )}
                  </View>
                  {active && (
                    <View style={styles.activePill}>
                      <Text style={[styles.activePillText, isTablet && styles.activePillTextT]}>
                        Đang ca
                      </Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  content: { paddingBottom: 40 },
  inner: { width: '100%' },
  innerTablet: { maxWidth: TABLET_MAX_W, alignSelf: 'center' },
  headerCard: { padding: 24, paddingTop: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 14, color: '#86B59A' },
  greetingT: { fontSize: 17 },
  staffName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  staffNameT: { fontSize: 28, marginBottom: 10 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusOn: { backgroundColor: 'rgba(110,231,183,0.2)' },
  statusOff: { backgroundColor: 'rgba(156,163,175,0.2)' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  statusTextT: { fontSize: 15 },
  logoutBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', gap: 8, padding: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statNum: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  statNumT: { fontSize: 34 },
  statRed: { color: '#DC2626' },
  statGold: { color: '#C9A24B' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 3, textAlign: 'center' },
  statLabelT: { fontSize: 13 },
  section: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginHorizontal: 16, marginBottom: 10, marginTop: 4 },
  sectionT: { fontSize: 19 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  actionsGridT: { gap: 12 },
  actionCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  actionCardT: { width: '30.5%', padding: 20, gap: 10 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },
  actionLabelT: { fontSize: 15 },
  emptyCard: { alignItems: 'center', paddingVertical: 32, marginHorizontal: 16 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  emptyTextT: { fontSize: 17 },
  shiftsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  shiftCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  shiftCardT: { marginHorizontal: 0, width: '48%' },
  shiftActive: { borderWidth: 1.5, borderColor: '#6EE7B7', backgroundColor: '#F0FDF4' },
  shiftArea: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  shiftAreaT: { fontSize: 17 },
  shiftTime: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  shiftTimeT: { fontSize: 15 },
  shiftNote: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  shiftNoteT: { fontSize: 14 },
  activePill: { backgroundColor: '#D1FAE5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  activePillText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  activePillTextT: { fontSize: 13 },
})
