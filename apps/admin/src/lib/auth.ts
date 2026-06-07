import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

type AdminUser = { id: string; name: string; email: string | null; role: string }

type AuthStore = {
  token: string | null
  user: AdminUser | null
  login: (email: string, password: string) => Promise<AdminUser>
  logout: () => void
  getHeaders: () => Record<string, string>
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (email, password) => {
        const res = await fetch(`${BASE}/auth/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const json = await res.json() as { data?: { token: string; user: AdminUser }; error?: string }
        if (!res.ok) throw new Error(json.error ?? 'Đăng nhập thất bại')
        set({ token: json.data!.token, user: json.data!.user })
        return json.data!.user
      },

      logout: () => set({ token: null, user: null }),

      getHeaders: (): Record<string, string> => {
        const token = get().token
        return token
          ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
          : { 'Content-Type': 'application/json' }
      },
    }),
    { name: 'tram-huong-admin-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
