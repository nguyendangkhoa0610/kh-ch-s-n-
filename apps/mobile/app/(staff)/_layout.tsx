import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function StaffTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#065F46' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        tabBarStyle: {
          backgroundColor: '#065F46',
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#6EE7B7',
        tabBarInactiveTintColor: '#6B9E84',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          headerTitle: 'Ca trực hôm nay',
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Quét QR',
          tabBarIcon: ({ color, size }) => <Ionicons name="qr-code" size={size} color={color} />,
          headerTitle: 'Quét Check-in',
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'SOS Alerts',
          tabBarIcon: ({ color, size }) => <Ionicons name="alert-circle" size={size} color={color} />,
          headerTitle: 'SOS & Cảnh báo',
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Báo cáo',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
          headerTitle: 'Báo cáo sự cố',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Nội bộ',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
          headerTitle: 'Tin nhắn nội bộ',
        }}
      />
    </Tabs>
  )
}
