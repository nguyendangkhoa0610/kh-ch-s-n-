import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'
import { useIsTablet, TABLET_MAX_W } from '../../lib/useTablet'

interface BillItem {
  id: string
  category: string
  description: string
  amount: number
  date: string
}

interface BillData {
  bookingCode: string
  items: BillItem[]
  total: number
  paid: number
  balance: number
  paymentStatus: string
}

const ICONS: Record<string, string> = {
  room: '🏠', activity: '🎯', restaurant: '🍜', spa: '💆', minibar: '🥤',
}
const CATS: Record<string, string> = {
  room: 'Phòng', activity: 'Hoạt động', restaurant: 'Nhà hàng', spa: 'Spa', minibar: 'Minibar',
}

const fmtVND = (n: number) => n.toLocaleString('vi-VN') + '₫'
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })

export default function BillScreen() {
  const token = useStore((s) => s.token)
  const booking = useStore((s) => s.booking)
  const isTablet = useIsTablet()
  const [bill, setBill] = useState<BillData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [requestingCheckout, setRequestingCheckout] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await api.get<BillData>('/mobile/bill', token!)
      setBill(res.data)
    } catch {
      // show empty state
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1B4332" /></View>
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load() }}
          tintColor="#1B4332"
        />
      }
    >
      <View style={[styles.inner, isTablet && styles.innerTablet]}>
        {/* Summary */}
        <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.summary}>
          <Text style={[styles.code, isTablet && styles.codeT]}>Mã: {bill?.bookingCode ?? '—'}</Text>
          <Text style={[styles.totalLabel, isTablet && styles.totalLabelT]}>Tổng chi tiêu</Text>
          <Text style={[styles.totalAmt, isTablet && styles.totalAmtT]}>
            {bill ? fmtVND(bill.total) : '—'}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceLabel, isTablet && styles.balanceLabelT]}>Đã thanh toán</Text>
              <Text style={[styles.balancePaid, isTablet && styles.balanceNumT]}>
                {bill ? fmtVND(bill.paid) : '—'}
              </Text>
            </View>
            <View style={styles.sep} />
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceLabel, isTablet && styles.balanceLabelT]}>Còn lại</Text>
              <Text style={[(bill?.balance ?? 0) > 0 ? styles.balanceDue : styles.balanceOk, isTablet && styles.balanceNumT]}>
                {bill ? fmtVND(bill.balance) : '—'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Items */}
        <Text style={[styles.section, isTablet && styles.sectionT]}>Chi tiết</Text>

        {(bill?.items ?? []).length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={isTablet ? 60 : 44} color="#D1D5DB" />
            <Text style={[styles.emptyText, isTablet && styles.emptyTextT]}>Chưa có chi tiêu nào</Text>
          </View>
        ) : (
          bill!.items.map((item) => (
            <View key={item.id} style={[styles.item, isTablet && styles.itemT]}>
              <View style={[styles.itemIcon, isTablet && styles.itemIconT]}>
                <Text style={{ fontSize: isTablet ? 24 : 20 }}>{ICONS[item.category] ?? '📋'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemDesc, isTablet && styles.itemDescT]}>{item.description}</Text>
                <Text style={[styles.itemMeta, isTablet && styles.itemMetaT]}>
                  {CATS[item.category] ?? item.category} · {fmtDate(item.date)}
                </Text>
              </View>
              <Text style={[styles.itemAmt, isTablet && styles.itemAmtT]}>{fmtVND(item.amount)}</Text>
            </View>
          ))
        )}

        {/* Checkout request */}
        {booking && (
          <TouchableOpacity
            style={[styles.checkoutBtn, requestingCheckout && { opacity: 0.6 }]}
            activeOpacity={0.8}
            disabled={requestingCheckout}
            onPress={async () => {
              setRequestingCheckout(true)
              try {
                await api.post('/mobile/service-request', {
                  type: 'OTHER',
                  details: 'Khách yêu cầu hỗ trợ check-out',
                }, token!)
                Alert.alert('Đã gửi yêu cầu', 'Lễ tân sẽ đến hỗ trợ bạn trong vài phút.')
              } catch {
                Alert.alert('Lỗi', 'Không thể gửi yêu cầu, vui lòng gặp trực tiếp lễ tân.')
              } finally { setRequestingCheckout(false) }
            }}
          >
            <Ionicons name="exit-outline" size={18} color="#fff" />
            <Text style={styles.checkoutBtnText}>
              {requestingCheckout ? 'Đang gửi…' : 'Yêu cầu Check-out'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.note, isTablet && styles.noteT]}>
          Kéo xuống để làm mới · Thanh toán tại lễ tân khi check-out
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3E8' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { width: '100%' },
  innerTablet: { maxWidth: TABLET_MAX_W, alignSelf: 'center' },
  summary: { borderRadius: 16, padding: 24, marginBottom: 20 },
  code: { fontSize: 10, color: '#86B59A', letterSpacing: 2, marginBottom: 8 },
  codeT: { fontSize: 12 },
  totalLabel: { fontSize: 13, color: '#86B59A', marginBottom: 4 },
  totalLabelT: { fontSize: 16 },
  totalAmt: { fontSize: 36, fontWeight: '800', color: '#C9A24B', marginBottom: 16 },
  totalAmtT: { fontSize: 48 },
  balanceRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, padding: 12,
  },
  balanceCol: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: '#86B59A', marginBottom: 4 },
  balanceLabelT: { fontSize: 14 },
  balancePaid: { fontSize: 16, fontWeight: '700', color: '#6EE7B7' },
  balanceDue: { fontSize: 16, fontWeight: '700', color: '#FCD34D' },
  balanceOk: { fontSize: 16, fontWeight: '700', color: '#6EE7B7' },
  balanceNumT: { fontSize: 20 },
  sep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  section: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  sectionT: { fontSize: 19 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  itemT: { padding: 18, gap: 16 },
  itemIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F9F3E8', alignItems: 'center', justifyContent: 'center',
  },
  itemIconT: { width: 46, height: 46, borderRadius: 12 },
  itemDesc: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  itemDescT: { fontSize: 16 },
  itemMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemMetaT: { fontSize: 14 },
  itemAmt: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  itemAmtT: { fontSize: 18 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  emptyTextT: { fontSize: 17 },
  note: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 16, lineHeight: 18 },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1B4332', borderRadius: 14, paddingVertical: 14, marginTop: 20,
  },
  checkoutBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  noteT: { fontSize: 13, lineHeight: 22 },
})
