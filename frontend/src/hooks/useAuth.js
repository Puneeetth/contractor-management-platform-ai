import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),

      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        // Redirect to login
        window.location.href = '/login'
      },

      setAuthData: (data) => set(data),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Custom hook for easy access
export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout, setToken } = useAuthStore()

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    setToken,
  }
}
