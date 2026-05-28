import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth.store';
import type { ErrorResponse } from '@/lib/api.types';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject Firebase Bearer token on every request.
// getIdToken() auto-refreshes if the token is expired.
instance.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap the backend envelope { data: T } → T.
// On 401: sign out and hard-redirect.
// On any other error: show a toast with the backend message.
instance.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ErrorResponse>) => {
    if (error.response?.status === 401) {
      await signOut(auth);
      useAuthStore.getState().setUser(null);
      window.location.replace('/login');
      return Promise.reject(error);
    }

    const message = error.response?.data?.message ?? 'An unexpected error occurred.';
    toast.error(message);

    return Promise.reject(error);
  },
);

// Typed wrappers. The second generic <T, T> tells TypeScript the resolved
// return type is T (not AxiosResponse<T>), matching the response interceptor.
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    instance.get<T, T>(url, config),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.post<T, T>(url, data, config),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.patch<T, T>(url, data, config),

  delete: <T = void>(url: string, config?: AxiosRequestConfig) =>
    instance.delete<T, T>(url, config),
};
