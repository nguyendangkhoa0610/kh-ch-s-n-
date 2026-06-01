import { Redirect } from 'expo-router'
import { useStore } from '../lib/store'

export default function Index() {
  const token = useStore((s) => s.token)
  const authRole = useStore((s) => s.authRole)

  if (!token) return <Redirect href="/login" />
  if (authRole === 'GUEST') return <Redirect href="/(tabs)/key" />
  return <Redirect href="/(staff)/home" />
}
