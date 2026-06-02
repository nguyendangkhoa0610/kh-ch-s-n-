import { create } from "zustand";
import { persist } from "zustand/middleware";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type CustomerUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

type AuthState = {
  token: string | null;
  user: CustomerUser | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  fetchMe: () => Promise<void>;
  getHeaders: () => Record<string, string>;
};

export const useCustomerAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,

      getHeaders: () => {
        const { token } = get();
        return {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
      },

      login: async (email, password) => {
        const res = await fetch(`${API}/auth/customer/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json() as { data?: { token: string; user: CustomerUser }; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Đăng nhập thất bại");
        set({ token: json.data!.token, user: json.data!.user });
      },

      register: async (data) => {
        const res = await fetch(`${API}/auth/customer/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json() as { data?: { token: string; user: CustomerUser }; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Đăng ký thất bại");
        set({ token: json.data!.token, user: json.data!.user });
      },

      logout: () => set({ token: null, user: null }),

      updateProfile: async (data) => {
        const { getHeaders } = get();
        const res = await fetch(`${API}/auth/customer/me`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        const json = await res.json() as { data?: CustomerUser; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Cập nhật thất bại");
        set({ user: json.data });
      },

      fetchMe: async () => {
        const { token, getHeaders } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API}/auth/customer/me`, { headers: getHeaders() });
          if (!res.ok) { set({ token: null, user: null }); return; }
          const json = await res.json() as { data: CustomerUser };
          set({ user: json.data });
        } catch {
          set({ token: null, user: null });
        }
      },
    }),
    {
      name: "tram-huong-customer-auth",
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);
