import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface BookingInfo {
  id: string
  code: string
  status: string
  checkIn: string
  checkOut: string
  guests: number
  roomNumber: string | null
  roomName: string | null
  guestName: string
}

export interface StaffUser {
  id: string
  name: string
  email: string | null
  role: string
}

export interface RoomControls {
  ac: { on: boolean; temperature: number; mode: string }
  lights: { main: boolean; bedside: boolean; bathroom: boolean; brightness: number }
  tv: { on: boolean; channel: number }
  curtains: { open: boolean; percentage: number }
  doNotDisturb: boolean
}

const DEFAULT_ROOM_CONTROLS: RoomControls = {
  ac: { on: true, temperature: 24, mode: 'cool' },
  lights: { main: true, bedside: false, bathroom: true, brightness: 80 },
  tv: { on: false, channel: 1 },
  curtains: { open: true, percentage: 100 },
  doNotDisturb: false,
}

interface AppStore {
  // Shared auth
  token: string | null
  authRole: 'GUEST' | 'STAFF' | 'MANAGER' | 'ADMIN' | null

  // Guest
  booking: BookingInfo | null
  roomControls: RoomControls
  completedChallenges: string[]
  ecoPoints: number

  // Staff
  staffUser: StaffUser | null

  // Actions
  setGuestAuth: (token: string, booking: BookingInfo) => void
  setStaffAuth: (token: string, user: StaffUser) => void
  logout: () => void
  updateRoomControl: <K extends keyof RoomControls>(key: K, value: RoomControls[K]) => void
  completeChallenge: (id: string, points: number) => void
  setEco: (ecoPoints: number, completedChallenges: string[]) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      token: null,
      authRole: null,
      booking: null,
      staffUser: null,
      roomControls: DEFAULT_ROOM_CONTROLS,
      completedChallenges: [],
      ecoPoints: 0,

      setGuestAuth: (token, booking) => set({ token, booking, authRole: 'GUEST' }),
      setStaffAuth: (token, user) =>
        set({ token, staffUser: user, authRole: user.role as any }),
      logout: () =>
        set({
          token: null,
          authRole: null,
          booking: null,
          staffUser: null,
          completedChallenges: [],
          ecoPoints: 0,
        }),

      updateRoomControl: (key, value) =>
        set((s) => ({ roomControls: { ...s.roomControls, [key]: value } })),

      completeChallenge: (id, points) => {
        if (get().completedChallenges.includes(id)) return
        set((s) => ({
          completedChallenges: [...s.completedChallenges, id],
          ecoPoints: s.ecoPoints + points,
        }))
      },

      setEco: (ecoPoints, completedChallenges) => set({ ecoPoints, completedChallenges }),
    }),
    {
      name: 'tram-huong-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
