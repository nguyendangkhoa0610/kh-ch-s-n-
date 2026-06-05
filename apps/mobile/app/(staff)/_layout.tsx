import { useWindowDimensions } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function StaffTabsLayout() {
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const iconSize = isTablet ? 28 : 22

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#065F46' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: isTablet ? 18 : 16 },
        tabBarStyle: {
          backgroundColor: '#065F46',
          borderTopWidth: 0,
          height: isTablet ? 80 : 64,
          paddingBottom: isTablet ? 12 : 8,
          paddingTop: isTablet ? 6 : 0,
        },
        tabBarActiveTintColor: '#6EE7B7',
        tabBarInactiveTintColor: '#6B9E84',
        tabBarLabelStyle: { fontSize: isTablet ? 12 : 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={iconSize} color={color} />,
          headerTitle: 'Ca trực hôm nay',
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Quét QR',
          tabBarIcon: ({ color }) => <Ionicons name="qr-code" size={iconSize} color={color} />,
          headerTitle: 'Quét Check-in',
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'SOS Alerts',
          tabBarIcon: ({ color }) => <Ionicons name="alert-circle" size={iconSize} color={color} />,
          headerTitle: 'SOS & Cảnh báo',
        }}
      />
      <Tabs.Screen
        name="housekeeping"
        options={{
          title: 'Dọn phòng',
          tabBarIcon: ({ color }) => <Ionicons name="brush" size={iconSize} color={color} />,
          headerTitle: 'Housekeeping',
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Báo cáo',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={iconSize} color={color} />,
          headerTitle: 'Báo cáo sự cố',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Nội bộ',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={iconSize} color={color} />,
          headerTitle: 'Tin nhắn nội bộ',
        }}
      />
    </Tabs>
  )
}
