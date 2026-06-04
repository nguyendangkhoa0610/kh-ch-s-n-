import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

type Booking = {
  id: string
  code: string
  status: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  notes: string | null
  createdAt: string
  room: { number: string; roomType: { name: string; slug: string } } | null
  payment: { status: string; amount: number; method: string } | null
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:    { label: 'Chờ xác nhận', color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline' },
  CONFIRMED:  { label: 'Đã xác nhận',  color: '#3B82F6', bg: '#DBEAFE', icon: 'checkmark-circle-outline' },
  CHECKED_IN: { label: 'Đang lưu trú', color: '#10B981', bg: '#D1FAE5', icon: 'home-outline' },
  COMPLETED:  { label: 'Hoàn thành',   color: '#6B7280', bg: '#F3F4F6', icon: 'checkmark-done-outline' },
  CANCELLED:  { label: 'Đã huỷ',       color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' },
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function calcNights(checkIn: string, checkOut: string) {
  return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000)
}

export default function BookingsScreen() {
  const token = useStore(s => s.token)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [detail, setDetail] = useState<Booking | null>(null)
  const [filter, setFilter] = useState('ALL')

  const load = useCallback(async (isRefresh = false) => {
    if (!token) { setLoading(false); return }
    if (isRefresh) setRefreshing(true) else setLoading(true)
    try {
      const res = await api.get<Booking[]>('/bookings/my', token)
      setBookings(res.data)
    } catch { /* silent */ } finally { setLoading(false); setRefreshing(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const displayBookings = filter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === filter)

  const activeBooking = bookings.find(b => b.status === 'CHECKED_IN' || b.status === 'CONFIRMED')

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
        <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
        <Text style={styles.emptyDesc}>Vui lòng đăng nhập để xem lịch sử đặt phòng</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F3E8' }}>
      {/* Active booking banner */}
      {activeBooking && (
        <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.activeBanner}>
          <View style={styles.activeBannerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeLabel}>
                {activeBooking.status === 'CHECKED_IN' ? '🏡 Đang lưu trú' : '✅ Sắp check-in'}
              </Text>
              <Text style={styles.activeCode}>{activeBooking.code}</Text>
              <Text style={styles.activeRoom}>
                {activeBooking.room ? `Phòng ${activeBooking.room.number} · ${activeBooking.room.roomType.name}` : 'Chưa có phòng'}
              </Text>
            </View>
            <View style={styles.activeDates}>
              <Text style={styles.activeDateLabel}>Check-in</Text>
              <Text style={styles.activeDateValue}>{formatDate(activeBooking.checkIn)}</Text>
              <Text style={[styles.activeDateLabel, { marginTop: 8 }]}>Check-out</Text>
              <Text style={styles.activeDateValue}>{formatDate(activeBooking.checkOut)}</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Filter bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterScroll} contentContainerStyle={{ padding: 12, gap: 8 }}>
        {[
          { v: 'ALL', l: 'Tất cả' },
          { v: 'CHECKED_IN', l: '🏡 Đang ở' },
          { v: 'CONFIRMED', l: '✅ Sắp tới' },
          { v: 'COMPLETED', l: 'Hoàn thành' },
          { v: 'CANCELLED', l: 'Đã huỷ' },
        ].map(({ v, l }) => (
          <TouchableOpacity key={v} onPress={() => setFilter(v)}
            style={[styles.filterChip, filter === v && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter === v && styles.filterChipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><Text style={{ color: '#9CA3AF' }}>Đang tải...</Text></View>
      ) : displayBookings.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
          <Text style={styles.emptyTitle}>Không có đặt phòng nào</Text>
          <Text style={styles.emptyDesc}>
            {filter === 'ALL' ? 'Bạn chưa có lịch đặt phòng nào' : 'Không có booking ở trạng thái này'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#1B4332" />}
        >
          {displayBookings.map(b => {
            const meta = STATUS_META[b.status] ?? { label: b.status, color: '#9CA3AF', bg: '#F3F4F6', icon: 'ellipse-outline' }
            const nights = calcNights(b.checkIn, b.checkOut)
            return (
              <TouchableOpacity key={b.id} style={styles.card} onPress={() => setDetail(b)} activeOpacity={0.75}>
                {/* Top row */}
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  <Text style={styles.cardCode}>{b.code}</Text>
                </View>

                {/* Room info */}
                <Text style={styles.cardRoom}>
                  {b.room ? `${b.room.roomType.name} · Phòng ${b.room.number}` : 'Chưa có phòng'}
                </Text>

                {/* Dates */}
                <View style={styles.cardDates}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dateLabel}>Check-in</Text>
                    <Text style={styles.dateValue}>{formatDate(b.checkIn)}</Text>
                  </View>
                  <View style={styles.nightsBox}>
                    <Text style={styles.nightsNum}>{nights}</Text>
                    <Text style={styles.nightsLabel}>đêm</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.dateLabel}>Check-out</Text>
                    <Text style={styles.dateValue}>{formatDate(b.checkOut)}</Text>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardGuests}>{b.guests} khách</Text>
                  <Text style={styles.cardPrice}>{formatPrice(b.totalAmount)}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}

      {/* Detail modal */}
      <Modal visible={!!detail} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            {detail && (() => {
              const meta = STATUS_META[detail.status] ?? { label: detail.status, color: '#9CA3AF', bg: '#F3F4F6', icon: 'ellipse-outline' }
              const nights = calcNights(detail.checkIn, detail.checkOut)
              return (
                <>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalCode}>{detail.code}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg, marginTop: 4 }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setDetail(null)}>
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 480 }}>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Phòng</Text>
                      <Text style={styles.detailValue}>
                        {detail.room ? `${detail.room.roomType.name} · Phòng ${detail.room.number}` : 'Chưa có phòng'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>Check-in</Text>
                        <Text style={styles.detailValue}>{formatDate(detail.checkIn)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>Check-out</Text>
                        <Text style={styles.detailValue}>{formatDate(detail.checkOut)}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>Số đêm</Text>
                        <Text style={styles.detailValue}>{nights} đêm</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>Số khách</Text>
                        <Text style={styles.detailValue}>{detail.guests} người</Text>
                      </View>
                    </View>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Tổng tiền</Text>
                      <Text style={[styles.detailValue, { color: '#059669', fontSize: 20, fontWeight: '800' }]}>
                        {formatPrice(detail.totalAmount)}
                      </Text>
                    </View>
                    {detail.payment && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Thanh toán</Text>
                        <Text style={styles.detailValue}>{detail.payment.method} · {detail.payment.status === 'SUCCESS' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}</Text>
                      </View>
                    )}
                    {detail.notes && (
                      <View style={[styles.detailSection, { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12 }]}>
                        <Text style={styles.detailLabel}>Ghi chú</Text>
                        <Text style={styles.detailValue}>{detail.notes}</Text>
                      </View>
                    )}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Ngày đặt</Text>
                      <Text style={styles.detailValue}>{new Date(detail.createdAt).toLocaleString('vi-VN')}</Text>
                    </View>
                  </ScrollView>
                </>
              )
            })()}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginBottom: 6, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  activeBanner: { padding: 20 },
  activeBannerContent: { flexDirection: 'row' },
  activeLabel: { fontSize: 12, color: '#6EE7B7', fontWeight: '600', marginBottom: 4 },
  activeCode: { fontSize: 20, fontWeight: '800', color: '#fff', fontFamily: 'monospace' },
  activeRoom: { fontSize: 13, color: '#86B59A', marginTop: 2 },
  activeDates: { alignItems: 'flex-end' },
  activeDateLabel: { fontSize: 10, color: '#6EE7B7', fontWeight: '600' },
  activeDateValue: { fontSize: 13, color: '#fff', fontWeight: '700' },
  filterScroll: { backgroundColor: '#fff', maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#F3F4F6', borderRadius: 20 },
  filterChipActive: { backgroundColor: '#1B4332' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardCode: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: '#059669' },
  cardRoom: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  cardDates: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F3E8', borderRadius: 12, padding: 12, marginBottom: 10 },
  dateLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '700', color: '#374151' },
  nightsBox: { flex: 0, alignItems: 'center', paddingHorizontal: 16 },
  nightsNum: { fontSize: 20, fontWeight: '800', color: '#1B4332' },
  nightsLabel: { fontSize: 10, color: '#9CA3AF' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardGuests: { fontSize: 12, color: '#9CA3AF' },
  cardPrice: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  modalCode: { fontFamily: 'monospace', fontSize: 22, fontWeight: '800', color: '#059669' },
  detailSection: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', marginBottom: 16, gap: 16 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
})
