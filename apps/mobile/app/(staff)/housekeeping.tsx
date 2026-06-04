import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useStore } from '../../lib/store'
import { api } from '../../lib/api'

type HKTask = {
  id: string
  type: string; status: string; priority: string; notes: string | null
  scheduledFor: string; startedAt: string | null; completedAt: string | null
  room: { number: string; floor: number; roomType: { name: string } }
  assignedTo: { id: string; name: string } | null
}

const TYPE_LABEL: Record<string, string> = {
  CHECKOUT: 'Check-out', STAYOVER: 'Đang lưu trú', INSPECTION: 'Kiểm tra', DEEP_CLEAN: 'Vệ sinh sâu',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: '#F59E0B', IN_PROGRESS: '#3B82F6', DONE: '#10B981', SKIPPED: '#9CA3AF',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ', IN_PROGRESS: 'Đang làm', DONE: 'Xong', SKIPPED: 'Bỏ qua',
}
const PRIORITY_ICON: Record<string, string> = {
  LOW: '↓', NORMAL: '→', HIGH: '↑', URGENT: '⚡',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function HousekeepingScreen() {
  const token = useStore(s => s.token)
  const staffUser = useStore(s => s.staffUser)
  const [tasks, setTasks] = useState<HKTask[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('mine') // mine | all | pending

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true) else setLoading(true)
    try {
      const res = await api.get<HKTask[]>(`/housekeeping?date=${today()}`, token ?? undefined)
      setTasks(res.data)
    } catch { /* silent */ } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const updateStatus = async (task: HKTask, newStatus: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      await api.patch<HKTask>(`/housekeeping/${task.id}`, { status: newStatus }, token ?? undefined)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    } catch { Alert.alert('Lỗi', 'Không thể cập nhật') }
  }

  const displayTasks = tasks.filter(t => {
    if (filter === 'mine') return t.assignedTo?.id === staffUser?.id
    if (filter === 'pending') return t.status === 'PENDING' || t.status === 'IN_PROGRESS'
    return true
  })

  const done = tasks.filter(t => t.status === 'DONE').length
  const total = tasks.length

  return (
    <View style={{ flex: 1, backgroundColor: '#F0FDF4' }}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{done}</Text>
          <Text style={styles.statLabel}>Xong</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{total - done}</Text>
          <Text style={styles.statLabel}>Còn lại</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#10B981' }]}>
            {total > 0 ? `${Math.round(done / total * 100)}%` : '—'}
          </Text>
          <Text style={styles.statLabel}>Hoàn thành</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterBar}>
        {(['mine', 'all', 'pending'] as const).map((f, i) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'mine' ? 'Của tôi' : f === 'all' ? 'Tất cả' : 'Chưa xong'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><Text style={{ color: '#9CA3AF' }}>Đang tải...</Text></View>
      ) : displayTasks.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🧹</Text>
          <Text style={{ color: '#9CA3AF', textAlign: 'center' }}>Không có task nào{filter === 'mine' ? ' được giao cho bạn' : ''}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#065F46" />}
        >
          {displayTasks.map(task => (
            <View key={task.id} style={[styles.taskCard, task.status === 'DONE' && styles.taskCardDone]}>
              <View style={styles.taskHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={styles.roomNum}>Phòng {task.room.number}</Text>
                    <Text style={styles.floorTag}>Tầng {task.room.floor}</Text>
                    <Text style={styles.typeTag}>{TYPE_LABEL[task.type] ?? task.type}</Text>
                    <Text style={[styles.priorityTag, { color: task.priority === 'URGENT' ? '#EF4444' : task.priority === 'HIGH' ? '#F59E0B' : '#6B7280' }]}>
                      {PRIORITY_ICON[task.priority]} {task.priority === 'URGENT' ? 'Khẩn' : task.priority === 'HIGH' ? 'Cao' : ''}
                    </Text>
                  </View>
                  <Text style={styles.roomType}>{task.room.roomType.name}</Text>
                  {task.notes ? <Text style={styles.notes}>{task.notes}</Text> : null}
                </View>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[task.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[task.status] }]}>
                    {STATUS_LABEL[task.status]}
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              {task.status !== 'DONE' && task.status !== 'SKIPPED' && (
                <View style={styles.actionRow}>
                  {task.status === 'PENDING' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3B82F620' }]}
                      onPress={() => updateStatus(task, 'IN_PROGRESS')} activeOpacity={0.75}>
                      <Ionicons name="play" size={14} color="#3B82F6" />
                      <Text style={[styles.actionText, { color: '#3B82F6' }]}>Bắt đầu</Text>
                    </TouchableOpacity>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B98120' }]}
                      onPress={() => updateStatus(task, 'DONE')} activeOpacity={0.75}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={[styles.actionText, { color: '#10B981' }]}>Hoàn thành</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F3F4F6' }]}
                    onPress={() => updateStatus(task, 'SKIPPED')} activeOpacity={0.75}>
                    <Text style={[styles.actionText, { color: '#9CA3AF' }]}>Bỏ qua</Text>
                  </TouchableOpacity>
                </View>
              )}
              {task.status === 'DONE' && task.completedAt && (
                <Text style={styles.doneTime}>
                  ✓ Hoàn thành lúc {new Date(task.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  statsBar: { flexDirection: 'row', backgroundColor: '#065F46', paddingVertical: 16, paddingHorizontal: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#6EE7B7', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#ffffff20', marginVertical: 4 },
  filterBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  filterBtnActive: { borderBottomWidth: 2, borderBottomColor: '#065F46' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  filterTextActive: { color: '#065F46' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  taskCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  taskCardDone: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#6EE7B7' },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  roomNum: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  floorTag: { fontSize: 11, color: '#9CA3AF', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeTag: { fontSize: 11, color: '#065F46', backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  priorityTag: { fontSize: 11, fontWeight: '700' },
  roomType: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  notes: { fontSize: 12, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
  statusDot: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionText: { fontSize: 13, fontWeight: '600' },
  doneTime: { fontSize: 11, color: '#10B981', marginTop: 8, fontWeight: '600' },
})
