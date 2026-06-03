import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import type { BookingInfo, StaffUser } from '../lib/store'

type Tab = 'guest' | 'staff'

export default function Login() {
  const [tab, setTab] = useState<Tab>('guest')

  // Guest fields
  const [bookingCode, setBookingCode] = useState('')
  const [guestName, setGuestName] = useState('')

  // Staff fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setGuestAuth = useStore((s) => s.setGuestAuth)
  const setStaffAuth = useStore((s) => s.setStaffAuth)

  const handleGuestLogin = async () => {
    const code = bookingCode.trim().toUpperCase()
    const name = guestName.trim()
    if (!code || !name) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã đặt phòng và họ tên')
      return
    }
    if (!code.startsWith('TH') || code.length < 8) {
      Alert.alert('Mã không hợp lệ', 'Mã đặt phòng có dạng TH + ngày + số (VD: TH20260603819)')
      return
    }
    setLoading(true)
    try {
      const res = await api.post<{ token: string; booking: BookingInfo }>(
        '/mobile/auth/login',
        { bookingCode: code, guestName: name }
      )
      setGuestAuth(res.data.token, res.data.booking)
      router.replace('/(tabs)/key')
    } catch (err: any) {
      const msg: string = err.message ?? ''
      if (msg.includes('Network') || msg.includes('fetch') || msg.includes('network')) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server. Kiểm tra WiFi và thử lại.')
      } else if (msg.includes('không tồn tại') || msg.includes('not found')) {
        Alert.alert('Mã không tìm thấy', `Mã "${code}" không tồn tại.\nKiểm tra lại mã đặt phòng trong email xác nhận.`)
      } else if (msg.includes('Tên') || msg.includes('name') || msg.includes('khớp')) {
        Alert.alert('Tên không khớp', `Tên "${name}" không trùng với tên đặt phòng.\nNhập đúng tên như lúc đặt phòng.`)
      } else if (msg.includes('hủy') || msg.includes('cancelled')) {
        Alert.alert('Booking đã hủy', 'Đặt phòng này đã bị hủy. Liên hệ lễ tân để được hỗ trợ.')
      } else {
        Alert.alert('Đăng nhập thất bại', msg || 'Kiểm tra lại mã đặt phòng và họ tên')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStaffLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu')
      return
    }
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: StaffUser }>(
        '/mobile/staff/auth/login',
        { email: email.trim().toLowerCase(), password }
      )
      setStaffAuth(res.data.token, res.data.user)
      router.replace('/(staff)/home')
    } catch (err: any) {
      Alert.alert('Đăng nhập thất bại', err.message ?? 'Email hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🌿</Text>
          <Text style={styles.resortName}>TRẦM HƯƠNG</Text>
          <Text style={styles.resortSub}>ECO RESORT · BÌNH ĐỊNH</Text>
        </View>

        <View style={styles.card}>
          {/* Tab switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'guest' && styles.tabBtnActive]}
              onPress={() => setTab('guest')}
            >
              <Text style={[styles.tabText, tab === 'guest' && styles.tabTextActive]}>
                Khách hàng
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'staff' && styles.tabBtnActive]}
              onPress={() => setTab('staff')}
            >
              <Text style={[styles.tabText, tab === 'staff' && styles.tabTextActive]}>
                Nhân viên
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'guest' ? (
            <>
              <Text style={styles.title}>Chào mừng quý khách</Text>
              <Text style={styles.subtitle}>Nhập mã đặt phòng để truy cập app</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Mã đặt phòng</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: TH20260001"
                  placeholderTextColor="#9CA3AF"
                  value={bookingCode}
                  onChangeText={setBookingCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Họ tên khách</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên của bạn"
                  placeholderTextColor="#9CA3AF"
                  value={guestName}
                  onChangeText={setGuestName}
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnOff]}
                onPress={handleGuestLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Đăng nhập</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Cổng nhân viên</Text>
              <Text style={styles.subtitle}>Đăng nhập bằng tài khoản resort</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ten@tramhuong.vn"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={[styles.btn, styles.btnStaff, loading && styles.btnOff]}
                onPress={handleStaffLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Đăng nhập</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footer}>
          Cần hỗ trợ? Lễ tân 24/7: 0256 XXX XXXX
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B4332' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 60, marginBottom: 12 },
  resortName: { fontSize: 28, fontWeight: '800', color: '#C9A24B', letterSpacing: 4 },
  resortSub: { fontSize: 11, color: '#86B59A', letterSpacing: 3, marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 10,
  },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#F3F4F6',
    borderRadius: 10, padding: 3, marginBottom: 20,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
  tabTextActive: { color: '#1A1A1A', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#1B4332', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 5 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: '#1A1A1A', backgroundColor: '#F9FAFB',
  },
  btn: {
    backgroundColor: '#1B4332', borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 4,
  },
  btnStaff: { backgroundColor: '#065F46' },
  btnOff: { opacity: 0.55 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer: { textAlign: 'center', color: '#86B59A', fontSize: 12, marginTop: 24 },
})
