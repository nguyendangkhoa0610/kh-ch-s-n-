import { Tabs, useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function TabsLayout() {
  const router = useRouter()

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1B4332' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        tabBarStyle: {
          backgroundColor: '#1B4332',
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#C9A24B',
        tabBarInactiveTintColor: '#86B59A',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="key"
        options={{
          title: 'Chìa Khóa',
          tabBarIcon: ({ color, size }) => <Ionicons name="key" size={size} color={color} />,
          headerTitle: 'Digital Key',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/sos')} style={{ marginRight: 16 }}>
              <Ionicons name="alert-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="concierge"
        options={{
          title: 'Trợ Lý AI',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
          headerTitle: 'AI Concierge',
        }}
      />
      <Tabs.Screen
        name="room"
        options={{
          title: 'Phòng',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          headerTitle: 'Điều Khiển Phòng',
        }}
      />
      <Tabs.Screen
        name="bill"
        options={{
          title: 'Hóa Đơn',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
          headerTitle: 'Hóa Đơn',
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Nhà Hàng',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} />,
          headerTitle: 'Nhà Hàng & Đặt Món',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Khám Phá',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
          headerTitle: 'Khám Phá',
        }}
      />
    </Tabs>
  )
}
