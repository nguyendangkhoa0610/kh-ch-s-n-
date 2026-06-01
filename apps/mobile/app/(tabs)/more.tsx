import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../../lib/store'

const ECO_CHALLENGES = [
  { id: 'c1', title: 'Không dùng đồ nhựa hôm nay', points: 50, icon: '🚫', desc: 'Dùng bình nước, túi vải có sẵn trong phòng' },
  { id: 'c2', title: 'Tắt điện khi ra ngoài', points: 30, icon: '💡', desc: 'Tiết kiệm 0.5 kWh mỗi giờ' },
  { id: 'c3', title: 'Không thay khăn hôm nay', points: 40, icon: '🛁', desc: 'Tiết kiệm 30L nước & hóa chất' },
  { id: 'c4', title: 'Đi bộ thay vì xe điện', points: 60, icon: '🚶', desc: 'Khám phá resort bằng đôi chân' },
  { id: 'c5', title: 'Nhặt 1 mảnh rác trong resort', points: 100, icon: '♻️', desc: 'Chụp ảnh bằng AI Discovery để xác nhận' },
  { id: 'c6', title: 'Trồng 1 cây xanh ký tên', points: 200, icon: '🌱', desc: 'Đăng ký tại reception — lưu mãi mãi' },
]

const ECO_LEVELS = [
  { name: 'Mầm Xanh', min: 0 },
  { name: 'Lá Non', min: 150 },
  { name: 'Cành Trầm', min: 350 },
  { name: 'Hương Rừng', min: 600 },
]

const GALLERY_PLACEHOLDERS = [
  { color: '#1B4332', emoji: '🌿' },
  { color: '#2D6A4F', emoji: '🏊' },
  { color: '#C9A24B', emoji: '🌅' },
  { color: '#065F46', emoji: '🌳' },
]

export default function MoreScreen() {
  const router = useRouter()
  const completedChallenges = useStore((s) => s.completedChallenges)
  const ecoPoints = useStore((s) => s.ecoPoints)
  const completeChallenge = useStore((s) => s.completeChallenge)
  const logout = useStore((s) => s.logout)

  const level =
    [...ECO_LEVELS].reverse().find((l) => ecoPoints >= l.min) ?? ECO_LEVELS[0]
  const nextLevel = ECO_LEVELS.find((l) => l.min > ecoPoints)

  const handleComplete = (c: (typeof ECO_CHALLENGES)[0]) => {
    if (completedChallenges.includes(c.id)) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    completeChallenge(c.id, c.points)
    Alert.alert(
      '🎉 Hoàn thành thử thách!',
      `+${c.points} điểm xanh\nTổng điểm: ${ecoPoints + c.points}`
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Eco Header */}
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.ecoHeader}>
        <View style={styles.ecoTop}>
          <Text style={{ fontSize: 36 }}>🌿</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.ecoLevel}>{level.name}</Text>
            <Text style={styles.ecoPoints}>{ecoPoints} điểm xanh</Text>
          </View>
          <Text style={styles.ecoCount}>
            {completedChallenges.length}/{ECO_CHALLENGES.length}
          </Text>
        </View>
        {nextLevel && (
          <Text style={styles.ecoNext}>
            Cần thêm {nextLevel.min - ecoPoints} điểm để đạt "{nextLevel.name}"
          </Text>
        )}
      </LinearGradient>

      {/* Eco Challenges */}
      <Text style={styles.section}>Thử Thách Xanh</Text>
      {ECO_CHALLENGES.map((c) => {
        const done = completedChallenges.includes(c.id)
        return (
          <TouchableOpacity
            key={c.id}
            style={[styles.challenge, done && styles.challengeDone]}
            onPress={() => handleComplete(c)}
            disabled={done}
            activeOpacity={0.75}
          >
            <Text style={styles.challengeIcon}>{c.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.challengeTitle, done && styles.textDone]}>
                {c.title}
              </Text>
              <Text style={styles.challengeDesc}>{c.desc}</Text>
            </View>
            <View style={[styles.badge, done && styles.badgeDone]}>
              {done
                ? <Ionicons name="checkmark" size={13} color="#fff" />
                : <Text style={styles.badgeText}>+{c.points}</Text>
              }
            </View>
          </TouchableOpacity>
        )
      })}

      {/* AR Discovery */}
      <Text style={styles.section}>AR Discovery</Text>
      <TouchableOpacity
        style={styles.arCard}
        activeOpacity={0.85}
        onPress={() =>
          Alert.alert(
            'AR Discovery',
            'Hướng camera vào biển thông tin trên cây để xem lịch sử, giá trị sinh thái và câu chuyện của loài cây đó.'
          )
        }
      >
        <LinearGradient colors={['#065F46', '#047857']} style={styles.arGrad}>
          <Text style={{ fontSize: 40 }}>🌳</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.arTitle}>Quét cây & khám phá</Text>
            <Text style={styles.arDesc}>
              Dùng camera quét biển QR trên cây để xem thông tin sinh thái
            </Text>
          </View>
          <Ionicons name="camera" size={26} color="#6EE7B7" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Sen Vàng Memory */}
      <Text style={styles.section}>Sen Vàng Memory</Text>
      <View style={styles.gallery}>
        {GALLERY_PLACEHOLDERS.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.galleryItem, { backgroundColor: p.color }]}
            onPress={() => Alert.alert('Sen Vàng Memory', 'Tính năng gallery sẽ cho phép lưu và chia sẻ ký ức tại resort.')}
          >
            <Text style={{ fontSize: 32 }}>{p.emoji}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.galleryItem, styles.galleryAdd]}
          onPress={() => Alert.alert('Thêm ảnh', 'Chọn ảnh từ thư viện hoặc chụp mới.')}
        >
          <Ionicons name="camera-outline" size={26} color="#9CA3AF" />
          <Text style={styles.galleryAddText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* SOS */}
      <TouchableOpacity
        style={styles.sos}
        onPress={() => router.push('/sos')}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.sosGrad}>
          <Ionicons name="alert-circle" size={26} color="#fff" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.sosTitle}>Nút Khẩn Cấp SOS</Text>
            <Text style={styles.sosSub}>Nhấn để gọi hỗ trợ ngay lập tức</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logout}
        onPress={() => {
          logout()
          router.replace('/login')
        }}
      >
        <Ionicons name="log-out-outline" size={17} color="#9CA3AF" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3E8' },
  content: { padding: 16, paddingBottom: 60 },
  ecoHeader: { borderRadius: 16, padding: 20, marginBottom: 20 },
  ecoTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ecoLevel: { fontSize: 18, fontWeight: '700', color: '#C9A24B' },
  ecoPoints: { fontSize: 13, color: '#86B59A', marginTop: 2 },
  ecoCount: { fontSize: 24, fontWeight: '800', color: '#6EE7B7' },
  ecoNext: { fontSize: 12, color: '#86B59A' },
  section: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', marginBottom: 10, marginTop: 4 },
  challenge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  challengeDone: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#6EE7B7' },
  challengeIcon: { fontSize: 26, marginRight: 12 },
  challengeTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  textDone: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  challengeDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: {
    backgroundColor: '#1B4332', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4, minWidth: 42, alignItems: 'center',
  },
  badgeDone: { backgroundColor: '#6EE7B7' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  arCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  arGrad: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  arTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  arDesc: { fontSize: 12, color: '#6EE7B7', lineHeight: 17 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  galleryItem: {
    width: '47%', aspectRatio: 1, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  galleryAdd: { backgroundColor: '#F3F4F6' },
  galleryAddText: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  sos: { borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  sosGrad: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  sosTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sosSub: { fontSize: 12, color: '#FCA5A5', marginTop: 2 },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  logoutText: { fontSize: 14, color: '#9CA3AF' },
})
