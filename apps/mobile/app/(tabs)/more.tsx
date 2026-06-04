import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal,
  Image, TextInput,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD}/image/upload`
const CLOUDINARY_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PRESET ?? 'tram_huong'

type LeaderEntry = { rank: number; name: string; ecoPoints: number }

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

type ReviewForm = {
  overallRating: number; cleanlinessRating: number; serviceRating: number; locationRating: number; comment: string
}

export default function MoreScreen() {
  const router = useRouter()
  const token = useStore((s) => s.token)
  const booking = useStore((s) => s.booking)
  const completedChallenges = useStore((s) => s.completedChallenges)
  const ecoPoints = useStore((s) => s.ecoPoints)
  const completeChallenge = useStore((s) => s.completeChallenge)
  const setEco = useStore((s) => s.setEco)
  const logout = useStore((s) => s.logout)

  const [showBoard, setShowBoard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([])
  const [gallery, setGallery] = useState<string[]>([])
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    overallRating: 5, cleanlinessRating: 5, serviceRating: 5, locationRating: 5, comment: '',
  })
  const [submittingReview, setSubmittingReview] = useState(false)

  const level =
    [...ECO_LEVELS].reverse().find((l) => ecoPoints >= l.min) ?? ECO_LEVELS[0]
  const nextLevel = ECO_LEVELS.find((l) => l.min > ecoPoints)

  // Sync điểm từ server khi mount
  useEffect(() => {
    if (!token) return
    api.get<{ ecoPoints: number; completedChallenges: string[] }>('/mobile/eco', token)
      .then(res => { if (setEco) setEco(res.data.ecoPoints, res.data.completedChallenges) })
      .catch(() => { /* dùng local */ })
  }, [token])

  const loadLeaderboard = useCallback(async () => {
    if (!token) return
    try {
      const res = await api.get<LeaderEntry[]>('/mobile/eco/leaderboard', token)
      setLeaderboard(res.data)
    } catch { /* silent */ }
  }, [token])

  const pickAndUploadImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Cần quyền truy cập thư viện ảnh'); return }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.8, allowsEditing: true,
    })
    if (result.canceled || !result.assets[0]) return

    setUploadingGallery(true)
    try {
      const formData = new FormData()
      formData.append('file', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'photo.jpg' } as any)
      formData.append('upload_preset', CLOUDINARY_PRESET)
      const r = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData })
      const data = await r.json()
      if (data.secure_url) setGallery(prev => [data.secure_url, ...prev])
    } catch { Alert.alert('Lỗi', 'Không thể tải ảnh lên') } finally { setUploadingGallery(false) }
  }

  const submitReview = async () => {
    if (!booking || !token) return
    setSubmittingReview(true)
    try {
      await api.post('/mobile/review', { bookingId: booking.id, ...reviewForm }, token)
      setShowReview(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Cảm ơn!', 'Đánh giá của bạn đã được gửi thành công.')
    } catch (e: any) {
      Alert.alert('Lỗi', e.message ?? 'Không thể gửi đánh giá')
    } finally { setSubmittingReview(false) }
  }

  const handleComplete = async (c: (typeof ECO_CHALLENGES)[0]) => {
    if (completedChallenges.includes(c.id)) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    completeChallenge(c.id, c.points) // optimistic local update
    // Sync lên server
    if (token) {
      api.post<{ ecoPoints: number; completedChallenges: string[] }>('/mobile/eco/complete', { challengeId: c.id, points: c.points }, token)
        .then(res => { if (setEco) setEco(res.data.ecoPoints, res.data.completedChallenges) })
        .catch(() => { /* local đã update */ })
    }
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
        <TouchableOpacity
          style={styles.boardBtn}
          onPress={() => { loadLeaderboard(); setShowBoard(true) }}
          activeOpacity={0.8}
        >
          <Ionicons name="trophy" size={15} color="#C9A24B" />
          <Text style={styles.boardBtnText}>Bảng xếp hạng khách xanh</Text>
        </TouchableOpacity>
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
        {gallery.map((uri, i) => (
          <TouchableOpacity key={i} style={styles.galleryItem} activeOpacity={0.85}>
            <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.galleryItem, styles.galleryAdd]}
          onPress={pickAndUploadImage}
          disabled={uploadingGallery}
          activeOpacity={0.75}
        >
          {uploadingGallery
            ? <Text style={{ color: '#9CA3AF', fontSize: 11 }}>Đang tải...</Text>
            : <>
                <Ionicons name="camera-outline" size={26} color="#9CA3AF" />
                <Text style={styles.galleryAddText}>Thêm ảnh</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* Rating sau check-out */}
      {booking?.status === 'COMPLETED' && (
        <TouchableOpacity style={styles.ratingCard} onPress={() => setShowReview(true)} activeOpacity={0.85}>
          <LinearGradient colors={['#C9A24B', '#B8862E']} style={styles.ratingGrad}>
            <Ionicons name="star" size={24} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.ratingTitle}>Đánh giá kỳ nghỉ của bạn</Text>
              <Text style={styles.ratingSub}>Chia sẻ trải nghiệm tại Trầm Hương</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

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

      {/* Review Modal */}
      <Modal visible={showReview} animationType="slide" transparent onRequestClose={() => setShowReview(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { paddingBottom: 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⭐ Đánh giá kỳ nghỉ</Text>
              <TouchableOpacity onPress={() => setShowReview(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {([
              ['overallRating', 'Tổng thể'],
              ['cleanlinessRating', 'Vệ sinh'],
              ['serviceRating', 'Dịch vụ'],
              ['locationRating', 'Vị trí'],
            ] as const).map(([key, label]) => (
              <View key={key} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>{label}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => setReviewForm(f => ({ ...f, [key]: star }))}>
                      <Ionicons
                        name={reviewForm[key] >= star ? 'star' : 'star-outline'}
                        size={28}
                        color={reviewForm[key] >= star ? '#C9A24B' : '#D1D5DB'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <TextInput
              style={styles.reviewInput}
              placeholder="Chia sẻ cảm nhận của bạn..."
              value={reviewForm.comment}
              onChangeText={t => setReviewForm(f => ({ ...f, comment: t }))}
              multiline numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={[styles.boardBtn, { backgroundColor: '#C9A24B', marginTop: 16 }]}
              onPress={submitReview}
              disabled={submittingReview}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Leaderboard Modal */}
      <Modal visible={showBoard} animationType="slide" transparent onRequestClose={() => setShowBoard(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏆 Khách Xanh Hàng Đầu</Text>
              <TouchableOpacity onPress={() => setShowBoard(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {leaderboard.length === 0 ? (
              <Text style={styles.boardEmpty}>Chưa có dữ liệu xếp hạng.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {leaderboard.map((entry) => (
                  <View key={entry.rank} style={styles.boardRow}>
                    <Text style={[styles.boardRank, entry.rank <= 3 && styles.boardRankTop]}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </Text>
                    <Text style={styles.boardName}>{entry.name}</Text>
                    <Text style={styles.boardPoints}>{entry.ecoPoints} điểm</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <Text style={styles.boardNote}>Tích điểm xanh để leo hạng và nhận ưu đãi!</Text>
          </View>
        </View>
      </Modal>
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
  boardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 9, marginTop: 12,
  },
  boardBtnText: { color: '#C9A24B', fontSize: 13, fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  boardEmpty: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 32 },
  boardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  boardRank: { width: 44, fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  boardRankTop: { fontSize: 20 },
  boardName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  boardPoints: { fontSize: 14, fontWeight: '700', color: '#059669' },
  boardNote: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 16 },
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
  ratingCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  ratingGrad: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  ratingTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  ratingSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  reviewInput: {
    backgroundColor: '#F9F3E8', borderRadius: 12, padding: 12,
    fontSize: 14, color: '#1A1A1A', minHeight: 100, textAlignVertical: 'top',
  },
})
