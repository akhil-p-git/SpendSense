/**
 * User Store
 * Manages selected user and consent status
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  currentUserId: string | null;
  currentUser: any | null;
  consent: boolean | null;
  setCurrentUserId: (userId: string | null) => void;
  setCurrentUser: (user: any | null) => void;
  setConsent: (consent: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUserId: null,
      currentUser: null,
      consent: null,
      setCurrentUserId: (userId) => set({ currentUserId: userId }),
      setCurrentUser: (user) => set({ currentUser: user, consent: user?.consent ?? null }),
      setConsent: (consent) => set({ consent }),
      clearUser: () => set({ currentUserId: null, currentUser: null, consent: null }),
    }),
    {
      name: 'spendsense-user-store',
    }
  )
);

