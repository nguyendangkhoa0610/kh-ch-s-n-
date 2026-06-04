import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { useStore } from '../lib/store'
import { api } from '../lib/api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

async function registerPushToken(token: string) {
  if (Platform.OS === 'web') return
  const { status: existing } = await Notifications.getPermissionsAsync()
  const final = existing === 'granted' ? existing : (await Notifications.requestPermissionsAsync()).status
  if (final !== 'granted') return
  const expoPushToken = (await Notifications.getExpoPushTokenAsync({
    projectId: '86f54656-3a13-4d4a-94cb-46c7c880493c',
  })).data
  await api.post('/notifications/register', { pushToken: expoPushToken }, token)
    .catch(() => {/* silent */})
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useStore((s) => s.token)
  const authRole = useStore((s) => s.authRole)
  const segments = useSegments()
  const router = useRouter()
  const notifListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null)

  useEffect(() => {
    if (token) registerPushToken(token)
    notifListener.current = Notifications.addNotificationReceivedListener(() => {})
    return () => { notifListener.current?.remove() }
  }, [token])

  useEffect(() => {
    const inGuestTabs = segments[0] === '(tabs)'
    const inStaffTabs = segments[0] === '(staff)'
    const inSos = segments[0] === 'sos'

    if (!token) {
      if (inGuestTabs || inStaffTabs) router.replace('/login')
    } else if (authRole === 'GUEST') {
      if (!inGuestTabs && !inSos && segments[0] !== 'login') {
        router.replace('/(tabs)/key')
      }
    } else if (authRole && ['STAFF', 'MANAGER', 'ADMIN'].includes(authRole)) {
      if (!inStaffTabs && segments[0] !== 'login') {
        router.replace('/(staff)/home')
      }
    }
  }, [token, authRole, segments])

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(staff)" />
          <Stack.Screen name="sos" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthGuard>
    </GestureHandlerRootView>
  )
}
