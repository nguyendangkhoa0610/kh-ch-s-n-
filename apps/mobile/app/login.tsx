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

type Tab = 'guest' | 'account' | 'staff'

export default function Login() {
  const [tab, setTab] = useState<Tab>('guest')

  // Guest (mã đặt phòng)
  const [bookingCode, setBookingCode] = useState('')
  const [guestName, setGuestName] = useState('')

  // Account web (email + password)
  const [acEmail, setAcEmail] = useState('')
  const [acPassword, setAcPassword] = useState('')

  // Staff
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setGuestAuth = useStore((s) => s.setGuestAuth)
  const setStaffAuth = useStore((s) => s.setStaffAuth)

  // ── Đăng nhập bằng mã đặt phòng ──────────────────────────────
  const handleGuestLogin = async () => {
    const code = bookingCode.trim().toUpperCase()
    const name = guestName.trim()
    if (!code || !name) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã đặt phòng và họ tên')
      return
    }
    if (!code.startsWith('TH') || code.length < 8) {
      Alert.alert('Mã không hợp lệ', 'Mã đặt phòng có dạng TH + ngày + số\nVD: TH20260603819')
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
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server.\nKiểm tra WiFi và thử lại.')
      } else if (msg.includes('không tồn tại') || msg.includes('not found')) {
        Alert.alert('Mã không tìm thấy', `Mã "${code}" không tồn tại.\nKiểm tra trong email xác nhận đặt phòng.`)
      } else if (msg.includes('Tên') || msg.includes('khớp')) {
        Alert.alert('Tên không khớp', `Tên "${name}" không trùng với tên đặt phòng.\nNhập đúng tên như lúc đặt phòng.`)
      } else if (msg.includes('hủy') || msg.includes('cancelled')) {
        Alert.alert('Booking đã hủy', 'Đặt phòng này đã bị hủy.\nLiên hệ lễ tân để được hỗ trợ.')
      } else {
        Alert.alert('Đăng nhập thất bại', msg || 'Kiểm tra lại mã và họ tên')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Đăng nhập bằng tài khoản web ─────────────────────────────
  const handleAccountLogin = async () => {
    if (!acEmail.trim() || !acPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu')
      return
    }
    setLoading(true)
    try {
      const res = await api.post<{ token: string; booking: BookingInfo }>(
        '/mobile/auth/account-login',
        { email: acEmail.trim().toLowerCase(), password: acPassword }
      )
      setGuestAuth(res.data.token, res.data.booking)
      router.replace('/(tabs)/key')
    } catch (err: any) {
      const msg: string = err.message ?? ''
      if (msg.includes('Network') || msg.includes('fetch')) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối server. Kiểm tra WiFi.')
      } else if (msg.includes('chưa có đặt phòng') || msg.includes('404')) {
        Alert.alert('Chưa có đặt phòng', 'Tài khoản này chưa có đặt phòng đang hoạt động.\nVui lòng đặt phòng trên website tramhuong-resort.vn trước.')
      } else {
        Alert.alert('Đăng nhập thất bại', msg || 'Email hoặc mật khẩu không đúng')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Đăng nhập nhân viên ────────────────────────────────────────
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
          {/* Tab switcher — 3 tabs */}
          <View style={styles.tabBar}>
            {([
              { key: 'guest', label: 'Mã phòng' },
              { key: 'account', label: 'Tài khoản' },
              { key: 'staff', label: 'Nhân viên' },
            ] as { key: Tab; label: string }[]).map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Tab: Mã đặt phòng ── */}
          {tab === 'guest' && (
            <>
              <Text style={styles.title}>Chào mừng quý khách</Text>
              <Text style={styles.subtitle}>Nhập mã đặt phòng từ email xác nhận</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Mã đặt phòng</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: TH20260603819"
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
                  placeholder="Nguyễn Văn A"
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
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng nhập</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Tab: Tài khoản web ── */}
          {tab === 'account' && (
            <>
              <Text style={styles.title}>Đăng nhập tài khoản</Text>
              <Text style={styles.subtitle}>Dùng email đã đăng ký trên website</Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 Đăng nhập bằng tài khoản web để tự động lấy thông tin đặt phòng của bạn
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={acEmail}
                  onChangeText={setAcEmail}
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
                  value={acPassword}
                  onChangeText={setAcPassword}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={[styles.btn, styles.btnAccount, loading && styles.btnOff]}
                onPress={handleAccountLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng nhập</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Tab: Nhân viên ── */}
          {tab === 'staff' && (
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
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng nhập</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footer}>
          Cần hỗ trợ? Lễ tân 24/7: 0932 183 605
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
  tabText: { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },
  tabTextActive: { color: '#1A1A1A', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#1B4332', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  infoBox: {
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#10B981',
  },
  infoText: { fontSize: 12, color: '#065F46', lineHeight: 18 },
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
  btnAccount: { backgroundColor: '#047857' },
  btnStaff: { backgroundColor: '#065F46' },
  btnOff: { opacity: 0.55 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer: { textAlign: 'center', color: '#86B59A', fontSize: 12, marginTop: 24 },
})
