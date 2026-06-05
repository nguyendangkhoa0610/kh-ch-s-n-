import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useStore, type RoomControls } from '../../lib/store'
import { useIsTablet, TABLET_MAX_W } from '../../lib/useTablet'

export default function RoomScreen() {
  const booking = useStore((s) => s.booking)
  const controls = useStore((s) => s.roomControls)
  const updateRoomControl = useStore((s) => s.updateRoomControl)
  const isTablet = useIsTablet()

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
      <View style={[styles.inner, isTablet && styles.innerTablet]}>
        <View style={styles.roomTag}>
          <Text style={[styles.roomTagText, isTablet && styles.roomTagTextT]}>
            Phòng {booking?.roomNumber ?? '—'}
          </Text>
        </View>

        {/* On tablet: 2-column grid for cards */}
        <View style={[styles.grid, isTablet && styles.gridTablet]}>
          {/* Do Not Disturb */}
          <View style={[styles.card, controls.doNotDisturb && styles.cardHighlight, isTablet && styles.cardTablet]}>
            <View style={styles.row}>
              <View style={styles.iconBox}><Text style={styles.icon}>🚫</Text></View>
              <View style={styles.info}>
                <Text style={[styles.cardTitle, isTablet && styles.cardTitleT]}>Không làm phiền</Text>
                <Text style={[styles.cardSub, isTablet && styles.cardSubT]}>Thông báo nhân viên không vào phòng</Text>
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
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <View style={styles.row}>
              <View style={styles.iconBox}><Text style={styles.icon}>❄️</Text></View>
              <View style={styles.info}>
                <Text style={[styles.cardTitle, isTablet && styles.cardTitleT]}>Điều hòa</Text>
                <Text style={[styles.cardSub, isTablet && styles.cardSubT]}>
                  {controls.ac.on ? 'Làm lạnh đang hoạt động' : 'Đang tắt'}
                </Text>
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
                <TouchableOpacity style={[styles.stepBtn, isTablet && styles.stepBtnT]} onPress={() => adjustTemp(-1)}>
                  <Ionicons name="remove" size={isTablet ? 24 : 20} color="#1B4332" />
                </TouchableOpacity>
                <Text style={[styles.stepValue, isTablet && styles.stepValueT]}>{controls.ac.temperature}°C</Text>
                <TouchableOpacity style={[styles.stepBtn, isTablet && styles.stepBtnT]} onPress={() => adjustTemp(1)}>
                  <Ionicons name="add" size={isTablet ? 24 : 20} color="#1B4332" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Lights */}
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <View style={styles.row}>
              <View style={styles.iconBox}><Text style={styles.icon}>💡</Text></View>
              <Text style={[styles.cardTitle, { flex: 1 }, isTablet && styles.cardTitleT]}>Đèn</Text>
            </View>
            <View style={styles.lightGrid}>
              {(['main', 'bedside', 'bathroom'] as const).map((key) => {
                const labels = { main: 'Chính', bedside: 'Đầu giường', bathroom: 'Nhà tắm' }
                return (
                  <View key={key} style={styles.lightItem}>
                    <Text style={[styles.lightLabel, isTablet && styles.lightLabelT]}>{labels[key]}</Text>
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
              <Ionicons name="sunny-outline" size={isTablet ? 18 : 15} color="#6B7280" />
              <Text style={[styles.brightnessLabel, isTablet && styles.brightnessLabelT]}>
                Độ sáng: {controls.lights.brightness}%
              </Text>
              <TouchableOpacity style={[styles.smallBtn, isTablet && styles.smallBtnT]} onPress={() => adjustBrightness(-10)}>
                <Ionicons name="remove" size={isTablet ? 16 : 13} color="#1B4332" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, isTablet && styles.smallBtnT]} onPress={() => adjustBrightness(10)}>
                <Ionicons name="add" size={isTablet ? 16 : 13} color="#1B4332" />
              </TouchableOpacity>
            </View>
          </View>

          {/* TV */}
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <View style={styles.row}>
              <View style={styles.iconBox}><Text style={styles.icon}>📺</Text></View>
              <View style={styles.info}>
                <Text style={[styles.cardTitle, isTablet && styles.cardTitleT]}>TV</Text>
                {controls.tv.on && (
                  <Text style={[styles.cardSub, isTablet && styles.cardSubT]}>Kênh {controls.tv.channel}</Text>
                )}
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
                  style={[styles.stepBtn, isTablet && styles.stepBtnT]}
                  onPress={() => { tap(); updateRoomControl('tv', { ...controls.tv, channel: Math.max(1, controls.tv.channel - 1) }) }}
                >
                  <Ionicons name="chevron-back" size={isTablet ? 22 : 18} color="#1B4332" />
                </TouchableOpacity>
                <Text style={[styles.stepValue, isTablet && styles.stepValueT]}>CH {controls.tv.channel}</Text>
                <TouchableOpacity
                  style={[styles.stepBtn, isTablet && styles.stepBtnT]}
                  onPress={() => { tap(); updateRoomControl('tv', { ...controls.tv, channel: controls.tv.channel + 1 }) }}
                >
                  <Ionicons name="chevron-forward" size={isTablet ? 22 : 18} color="#1B4332" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Curtains */}
          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <View style={styles.row}>
              <View style={styles.iconBox}><Text style={styles.icon}>🪟</Text></View>
              <View style={styles.info}>
                <Text style={[styles.cardTitle, isTablet && styles.cardTitleT]}>Rèm cửa</Text>
                <Text style={[styles.cardSub, isTablet && styles.cardSubT]}>
                  {controls.curtains.open ? 'Đang mở' : 'Đã đóng'}
                </Text>
              </View>
              <Switch
                value={controls.curtains.open}
                onValueChange={(v) => { tap(); updateRoomControl('curtains', { ...controls.curtains, open: v }) }}
                trackColor={{ false: '#E5E7EB', true: '#1B4332' }}
                thumbColor={controls.curtains.open ? '#C9A24B' : '#fff'}
              />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3E8' },
  content: { padding: 16, paddingBottom: 40 },
  inner: { width: '100%' },
  innerTablet: { maxWidth: TABLET_MAX_W, alignSelf: 'center' },
  roomTag: {
    backgroundColor: '#EBF5EE', borderRadius: 20, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16,
  },
  roomTagText: { fontSize: 13, fontWeight: '600', color: '#1B4332' },
  roomTagTextT: { fontSize: 16 },
  grid: { gap: 12 },
  gridTablet: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTablet: { width: '48.5%' },
  cardHighlight: { borderWidth: 1.5, borderColor: '#C9A24B' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#F9F3E8', alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  cardTitleT: { fontSize: 17 },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardSubT: { fontSize: 14 },
  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 24, marginTop: 14,
  },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EBF5EE', alignItems: 'center', justifyContent: 'center',
  },
  stepBtnT: { width: 46, height: 46, borderRadius: 23 },
  stepValue: { fontSize: 22, fontWeight: '700', color: '#1B4332', minWidth: 72, textAlign: 'center' },
  stepValueT: { fontSize: 28, minWidth: 90 },
  lightGrid: { flexDirection: 'row', marginTop: 12, gap: 6 },
  lightItem: { flex: 1, alignItems: 'center', gap: 5 },
  lightLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  lightLabelT: { fontSize: 13 },
  brightness: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  brightnessLabel: { flex: 1, fontSize: 13, color: '#6B7280' },
  brightnessLabelT: { fontSize: 15 },
  smallBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EBF5EE', alignItems: 'center', justifyContent: 'center',
  },
  smallBtnT: { width: 36, height: 36, borderRadius: 18 },
})
