import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

type MenuItem = {
  id: string; name: string; nameEn: string | null; description: string | null
  category: string; price: number; image: string | null; isVeg: boolean
}

type CartItem = MenuItem & { qty: number; notes: string }

type Order = {
  id: string; status: string; totalAmount: number; createdAt: string
  items: { quantity: number; unitPrice: number; menuItem: { name: string } }[]
}

const CAT_LABEL: Record<string, string> = {
  BREAKFAST: 'Bữa sáng', LUNCH: 'Bữa trưa', DINNER: 'Bữa tối', DRINKS: 'Đồ uống', SNACKS: 'Ăn vặt',
}
const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Đang xử lý', color: '#F59E0B' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#3B82F6' },
  PREPARING: { label: 'Đang làm', color: '#8B5CF6' },
  DELIVERED: { label: 'Đã giao', color: '#10B981' },
  CANCELLED: { label: 'Đã huỷ', color: '#EF4444' },
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function FoodScreen() {
  const token = useStore(s => s.token)
  const booking = useStore(s => s.booking)
  const [tab, setTab] = useState<'menu' | 'orders'>('menu')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')
  const [placing, setPlacing] = useState(false)
  const [catFilter, setCatFilter] = useState('ALL')

  useEffect(() => {
    api.get<MenuItem[]>('/menu').then(r => { setMenuItems(r.data); setLoading(false) })
    if (token) {
      api.get<Order[]>('/menu/orders/my', token).then(r => setOrders(r.data)).catch(() => {})
    }
  }, [token])

  const addToCart = (item: MenuItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1, notes: '' }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === id)
      if (!ex) return prev
      if (ex.qty === 1) return prev.filter(c => c.id !== id)
      return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0)
  const cartCount = cart.reduce((s, c) => s + c.qty, 0)

  const placeOrder = async () => {
    if (!booking || !token || !cart.length) return
    setPlacing(true)
    try {
      const order = await api.post<Order>('/menu/orders', {
        bookingId: booking.id,
        notes: orderNotes,
        items: cart.map(c => ({ menuItemId: c.id, quantity: c.qty, notes: c.notes })),
      }, token)
      setOrders(prev => [order.data, ...prev])
      setCart([])
      setOrderNotes('')
      setShowCart(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Đặt món thành công!', 'Nhà hàng sẽ giao trong 15-20 phút.\nTheo dõi trạng thái trong tab "Đơn của tôi".')
    } catch (e: any) {
      Alert.alert('Lỗi', e.message ?? 'Không thể đặt món lúc này')
    } finally {
      setPlacing(false)
    }
  }

  const cats = ['ALL', ...Object.keys(CAT_LABEL)]
  const displayItems = catFilter === 'ALL' ? menuItems : menuItems.filter(m => m.category === catFilter)

  if (!token) {
    return (
      <View style={styles.center}>
        <Text style={styles.loginText}>Đăng nhập để đặt món</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9F3E8' }}>
      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'menu' && styles.tabBtnActive]} onPress={() => setTab('menu')}>
          <Text style={[styles.tabText, tab === 'menu' && styles.tabTextActive]}>Thực đơn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'orders' && styles.tabBtnActive]} onPress={() => setTab('orders')}>
          <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>Đơn của tôi</Text>
        </TouchableOpacity>
      </View>

      {tab === 'menu' ? (
        <>
          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ padding: 12 }}>
            {cats.map(cat => (
              <TouchableOpacity key={cat} onPress={() => setCatFilter(cat)}
                style={[styles.catChip, catFilter === cat && styles.catChipActive]}>
                <Text style={[styles.catChipText, catFilter === cat && styles.catChipTextActive]}>
                  {cat === 'ALL' ? 'Tất cả' : CAT_LABEL[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {loading ? (
              <View style={styles.center}><Text style={{ color: '#9CA3AF' }}>Đang tải thực đơn...</Text></View>
            ) : displayItems.length === 0 ? (
              <View style={styles.center}><Text style={{ color: '#9CA3AF' }}>Không có món trong danh mục này</Text></View>
            ) : displayItems.map(item => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <View key={item.id} style={styles.menuCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.menuName}>{item.name}</Text>
                      {item.isVeg && <Text style={styles.vegBadge}>🌿</Text>}
                    </View>
                    {item.description ? <Text style={styles.menuDesc}>{item.description}</Text> : null}
                    <Text style={styles.menuPrice}>{formatPrice(item.price)}</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    {inCart ? (
                      <>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                          <Ionicons name="remove" size={16} color="#1B4332" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{inCart.qty}</Text>
                        <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(item)}>
                          <Ionicons name="add" size={16} color="#fff" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(item)}>
                        <Ionicons name="add" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            })}
          </ScrollView>

          {/* Cart FAB */}
          {cartCount > 0 && (
            <TouchableOpacity style={styles.cartFab} onPress={() => setShowCart(true)} activeOpacity={0.85}>
              <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.cartFabGrad}>
                <Ionicons name="cart" size={20} color="#fff" />
                <Text style={styles.cartFabText}>{cartCount} món · {formatPrice(cartTotal)}</Text>
                <Text style={styles.cartFabCta}>Xem giỏ →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {orders.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🍽️</Text>
              <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>Chưa có đơn đặt món nào</Text>
            </View>
          ) : orders.map(order => {
            const statusInfo = ORDER_STATUS[order.status] ?? { label: order.status, color: '#9CA3AF' }
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleString('vi-VN')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>
                {order.items.map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                    <Text style={styles.orderItem}>×{item.quantity} {item.menuItem.name}</Text>
                    <Text style={styles.orderItemPrice}>{formatPrice(item.unitPrice * item.quantity)}</Text>
                  </View>
                ))}
                <View style={styles.orderTotal}>
                  <Text style={styles.orderTotalLabel}>Tổng</Text>
                  <Text style={styles.orderTotalValue}>{formatPrice(order.totalAmount)}</Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" transparent onRequestClose={() => setShowCart(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Giỏ hàng ({cartCount} món)</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {cart.map(item => (
                <View key={item.id} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>{formatPrice(item.price)}</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                      <Ionicons name="remove" size={14} color="#1B4332" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(item)}>
                      <Ionicons name="add" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TextInput
              style={styles.notesInput}
              placeholder="Ghi chú cho đơn hàng (dị ứng, yêu cầu đặc biệt...)"
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline numberOfLines={2}
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.cartFooter}>
              <View>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalValue}>{formatPrice(cartTotal)}</Text>
              </View>
              <TouchableOpacity style={styles.orderBtn} onPress={placeOrder} disabled={placing} activeOpacity={0.85}>
                <Text style={styles.orderBtnText}>{placing ? 'Đang đặt...' : 'Đặt món ngay'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loginText: { color: '#9CA3AF', fontSize: 15 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#1B4332' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#1B4332' },
  catScroll: { backgroundColor: '#fff', maxHeight: 56 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#F3F4F6', borderRadius: 20, marginRight: 8 },
  catChipActive: { backgroundColor: '#1B4332' },
  catChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  catChipTextActive: { color: '#fff' },
  menuCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  menuName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  vegBadge: { fontSize: 14 },
  menuDesc: { fontSize: 12, color: '#6B7280', marginTop: 3, lineHeight: 17 },
  menuPrice: { fontSize: 14, fontWeight: '700', color: '#059669', marginTop: 6 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#1B4332', alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  qtyText: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', minWidth: 20, textAlign: 'center' },
  cartFab: { position: 'absolute', bottom: 20, left: 16, right: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  cartFabGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  cartFabText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14 },
  cartFabCta: { color: '#C9A24B', fontWeight: '700', fontSize: 13 },
  orderCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  orderDate: { fontSize: 12, color: '#9CA3AF' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderItem: { flex: 1, fontSize: 13, color: '#4B5563' },
  orderItemPrice: { fontSize: 13, color: '#9CA3AF' },
  orderTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  orderTotalLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  orderTotalValue: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9F9F9' },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  cartItemPrice: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  notesInput: { marginTop: 14, backgroundColor: '#F9F3E8', borderRadius: 12, padding: 12, fontSize: 13, color: '#1A1A1A', minHeight: 60 },
  cartFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  totalLabel: { fontSize: 12, color: '#9CA3AF' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  orderBtn: { backgroundColor: '#1B4332', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  orderBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
