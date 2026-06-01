import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useStore, type RoomControls } from '../../lib/store'

export default function RoomScreen() {
  const booking = useStore((s) => s.booking)
  const controls = useStore((s) => s.roomControls)
  const updateRoomControl = useStore((s) => s.updateRoomControl)

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

  const adjustTemp = (delta: number) => {
    tap()
    const t = Math.min(30, Math.max(16, controls.ac.temperature + delta))
    updateRoomControl('ac', { ...controls.ac, temperature: t })
  }

  const adjustBrightness = (delta: number) => {
    tap()
    const b = Math.min(100, Math.max(10, controls.lights.brightness + delta))
    updateRoomControl('lights', { ...controls.lights, brightness: b })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.roomTag}>
        <Text style={styles.roomTagText}>Phòng {booking?.roomNumber ?? '—'}</Text>
      </View>

      {/* Do Not Disturb */}
      <View style={[styles.card, controls.doNotDisturb && styles.cardHighlight]}>
        <View style={styles.row}>
          <View style={styles.iconBox}><Text style={styles.icon}>🚫</Text></View>
          <View style={styles.info}>
            <Text style={styles.cardTitle}>Không làm phiền</Text>
            <Text style={styles.cardSub}>Thông báo nhân viên không vào phòng</Text>
          </View>
          <Switch
            value={controls.doNotDisturb}
            onValueChange={(v) => { tap(); updateRoomControl('doNotDisturb', v) }}
            trackColor={{ false: '#E5E7EB', true: '#1B4332' }}
            thumbColor={controls.doNotDisturb ? '#C9A24B' : '#fff'}
          />
        </View>
      </View>

      {/* AC */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}><Text style={styles.icon}>❄️</Text></View>
          <View style={styles.info}>
            <Text style={styles.cardTitle}>Điều hòa</Text>
            <Text style={styles.cardSub}>{controls.ac.on ? 'Làm lạnh đang hoạt động' : 'Đang tắt'}</Text>
          </View>
          <Switch
            value={controls.ac.on}
            onValueChange={(v) => { tap(); updateRoomControl('ac', { ...controls.ac, on: v }) }}
            trackColor={{ false: '#E5E7EB', true: '#1B4332' }}
            thumbColor={controls.ac.on ? '#C9A24B' : '#fff'}
          />
        </View>
        {controls.ac.on && (
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustTemp(-1)}>
              <Ionicons name="remove" size={20} color="#1B4332" />
            </TouchableOpacity>
            <Text style={styles.stepValue}>{controls.ac.temperature}°C</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustTemp(1)}>
              <Ionicons name="add" size={20} color="#1B4332" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Lights */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}><Text style={styles.icon}>💡</Text></View>
          <Text style={[styles.cardTitle, { flex: 1 }]}>Đèn</Text>
        </View>
        <View style={styles.lightGrid}>
          {(['main', 'bedside', 'bathroom'] as const).map((key) => {
            const labels = { main: 'Chính', bedside: 'Đầu giường', bathroom: 'Nhà tắm' }
            return (
              <View key={key} style={styles.lightItem}>
                <Text style={styles.lightLabel}>{labels[key]}</Text>
                <Switch
                  value={controls.lights[key]}
                  onValueChange={(v) => { tap(); updateRoomControl('lights', { ...controls.lights, [key]: v }) }}
                  trackColor={{ false: '#E5E7EB', true: '#1B4332' }}
                  thumbColor={controls.lights[key] ? '#C9A24B' : '#fff'}
                />
              </View>
            )
          })}
        </View>
        <View style={styles.brightness}>
          <Ionicons name="sunny-outline" size={15} color="#6B7280" />
          <Text style={styles.brightnessLabel}>Độ sáng: {controls.lights.brightness}%</Text>
          <TouchableOpacity style={styles.smallBtn} onPress={() => adjustBrightness(-10)}>
            <Ionicons name="remove" size={13} color="#1B4332" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={() => adjustBrightness(10)}>
            <Ionicons name="add" size={13} color="#1B4332" />
          </TouchableOpacity>
        </View>
      </View>

      {/* TV */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}><Text style={styles.icon}>📺</Text></View>
          <View style={styles.info}>
            <Text style={styles.cardTitle}>TV</Text>
            {controls.tv.on && <Text style={styles.cardSub}>Kênh {controls.tv.channel}</Text>}
          </View>
          <Switch
            value={controls.tv.on}
            onValueChange={(v) => { tap(); updateRoomControl('tv', { ...controls.tv, on: v }) }}
            trackColor={{ false: '#E5E7EB', true: '#1B4332' }}
            thumbColor={controls.tv.on ? '#C9A24B' : '#fff'}
          />
        </View>
        {controls.tv.on && (
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => { tap(); updateRoomControl('tv', { ...controls.tv, channel: Math.max(1, controls.tv.channel - 1) }) }}
            >
              <Ionicons name="chevron-back" size={18} color="#1B4332" />
            </TouchableOpacity>
            <Text style={styles.stepValue}>CH {controls.tv.channel}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => { tap(); updateRoomControl('tv', { ...controls.tv, channel: controls.tv.channel + 1 }) }}
            >
              <Ionicons name="chevron-forward" size={18} color="#1B4332" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Curtains */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}><Text style={styles.icon}>🪟</Text></View>
          <View style={styles.info}>
            <Text style={styles.cardTitle}>Rèm cửa</Text>
            <Text style={styles.cardSub}>{controls.curtains.open ? 'Đang mở' : 'Đã đóng'}</Text>
          </View>
          <Switch
            value={controls.curtains.open}
            onValueChange={(v) => { tap(); updateRoomControl('curtains', { ...controls.curtains, open: v }) }}
            trackColor={{ false: '#E5E7EB', true: '#1B4332' }}
            thumbColor={controls.curtains.open ? '#C9A24B' : '#fff'}
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3E8' },
  content: { padding: 16, paddingBottom: 40 },
  roomTag: {
    backgroundColor: '#EBF5EE', borderRadius: 20, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16,
  },
  roomTagText: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHighlight: { borderWidth: 1.5, borderColor: '#C9A24B' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#F9F3E8', alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 24, marginTop: 14,
  },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EBF5EE', alignItems: 'center', justifyContent: 'center',
  },
  stepValue: { fontSize: 22, fontWeight: '700', color: '#1B4332', minWidth: 72, textAlign: 'center' },
  lightGrid: { flexDirection: 'row', marginTop: 12, gap: 6 },
  lightItem: { flex: 1, alignItems: 'center', gap: 5 },
  lightLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  brightness: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  brightnessLabel: { flex: 1, fontSize: 13, color: '#6B7280' },
  smallBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EBF5EE', alignItems: 'center', justifyContent: 'center',
  },
})
