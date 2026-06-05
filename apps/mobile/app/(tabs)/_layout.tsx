import { useWindowDimensions } from 'react-native'
import { Tabs, useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function TabsLayout() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const iconSize = isTablet ? 28 : 22

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1B4332' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: isTablet ? 18 : 16 },
        tabBarStyle: {
          backgroundColor: '#1B4332',
          borderTopWidth: 0,
          height: isTablet ? 80 : 64,
          paddingBottom: isTablet ? 12 : 8,
          paddingTop: isTablet ? 6 : 0,
        },
        tabBarActiveTintColor: '#C9A24B',
        tabBarInactiveTintColor: '#86B59A',
        tabBarLabelStyle: { fontSize: isTablet ? 12 : 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="key"
        options={{
          title: 'Chìa Khóa',
          tabBarIcon: ({ color }) => <Ionicons name="key" size={iconSize} color={color} />,
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
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={iconSize} color={color} />,
          headerTitle: 'AI Concierge',
        }}
      />
      <Tabs.Screen
        name="room"
        options={{
          title: 'Phòng',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={iconSize} color={color} />,
          headerTitle: 'Điều Khiển Phòng',
        }}
      />
      <Tabs.Screen
        name="bill"
        options={{
          title: 'Hóa Đơn',
          tabBarIcon: ({ color }) => <Ionicons name="receipt" size={iconSize} color={color} />,
          headerTitle: 'Hóa Đơn',
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Đặt Phòng',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={iconSize} color={color} />,
          headerTitle: 'Lịch Sử Đặt Phòng',
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Nhà Hàng',
          tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={iconSize} color={color} />,
          headerTitle: 'Nhà Hàng & Đặt Món',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Khám Phá',
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={iconSize} color={color} />,
          headerTitle: 'Khám Phá',
        }}
      />
    </Tabs>
  )
}
