import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { useStore } from '../lib/store'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useStore((s) => s.token)
  const authRole = useStore((s) => s.authRole)
  const segments = useSegments()
  const router = useRouter()

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
