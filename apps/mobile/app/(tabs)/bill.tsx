import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

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
  const [bill, setBill] = useState<BillData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
      {/* Summary */}
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.summary}>
        <Text style={styles.code}>Mã: {bill?.bookingCode ?? '—'}</Text>
        <Text style={styles.totalLabel}>Tổng chi tiêu</Text>
        <Text style={styles.totalAmt}>{bill ? fmtVND(bill.total) : '—'}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>Đã thanh toán</Text>
            <Text style={styles.balancePaid}>{bill ? fmtVND(bill.paid) : '—'}</Text>
          </View>
          <View style={styles.sep} />
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>Còn lại</Text>
            <Text style={[(bill?.balance ?? 0) > 0 ? styles.balanceDue : styles.balanceOk]}>
              {bill ? fmtVND(bill.balance) : '—'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Items */}
      <Text style={styles.section}>Chi tiết</Text>

      {(bill?.items ?? []).length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={44} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chưa có chi tiêu nào</Text>
        </View>
      ) : (
        bill!.items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemIcon}>
              <Text style={{ fontSize: 20 }}>{ICONS[item.category] ?? '📋'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemDesc}>{item.description}</Text>
              <Text style={styles.itemMeta}>
                {CATS[item.category] ?? item.category} · {fmtDate(item.date)}
              </Text>
            </View>
            <Text style={styles.itemAmt}>{fmtVND(item.amount)}</Text>
          </View>
        ))
      )}

      <Text style={styles.note}>
        Kéo xuống để làm mới · Thanh toán tại lễ tân khi check-out
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3E8' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { borderRadius: 16, padding: 24, marginBottom: 20 },
  code: { fontSize: 10, color: '#86B59A', letterSpacing: 2, marginBottom: 8 },
  totalLabel: { fontSize: 13, color: '#86B59A', marginBottom: 4 },
  totalAmt: { fontSize: 36, fontWeight: '800', color: '#C9A24B', marginBottom: 16 },
  balanceRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, padding: 12,
  },
  balanceCol: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: '#86B59A', marginBottom: 4 },
  balancePaid: { fontSize: 16, fontWeight: '700', color: '#6EE7B7' },
  balanceDue: { fontSize: 16, fontWeight: '700', color: '#FCD34D' },
  balanceOk: { fontSize: 16, fontWeight: '700', color: '#6EE7B7' },
  sep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  section: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  itemIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F9F3E8', alignItems: 'center', justifyContent: 'center',
  },
  itemDesc: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  itemMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemAmt: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  note: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 16, lineHeight: 18 },
})
