import { create } from 'zustand';
import type { MeResponseDto } from '@/lib/api.types';
import type { Permission } from '@/lib/permissions';

export type UserProfile = MeResponseDto;

type AuthState = {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  can: (permission: Permission) => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  can: (permission) => get().user?.permissions?.includes(permission) ?? false,
}));
