// src/lib/api/axios.ts
//
// ⚠️  Ce fichier est CLIENT-SIDE UNIQUEMENT.
//     Pour le SSR dans les Server Components, utiliser fetch() natif.
//
// Intercepteur requête  → injecte l'access token dans Authorization
// Intercepteur réponse  → sur 401, tente un refresh silencieux puis rejoue la requête
// withCredentials: true → le navigateur envoie automatiquement le cookie refresh_token

import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

// ─── Référence circulaire évitée : on importe le store directement ────────────
// Ne PAS appeler useAuthStore() ici (hooks React = contexte composant).
// On accède au store via son getter statique .getState().
import { useAuthStore } from '@/lib/store/auth.store';

// ─── Instance principale ──────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:2006',
  withCredentials: true, // cookie refresh_token envoyé automatiquement
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── État interne du refresh ──────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

// ─── Intercepteur REQUEST : injecte le Bearer token ──────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Intercepteur RESPONSE : refresh silencieux sur 401 ──────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // On ne tente le refresh que sur 401 et uniquement une fois par requête
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Évite de re-tenter le refresh sur la route /auth/refresh elle-même
    if (originalRequest.url?.includes('/auth/refresh')) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Si un refresh est déjà en cours, on met la requête en file d'attente
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>)[
              'Authorization'
            ] = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      // POST /auth/refresh — le cookie est envoyé automatiquement (withCredentials)
      const { data } = await apiClient.post<{
        user: import('@/types/auth.types').AuthUser;
        access_token: string;
      }>('/auth/refresh');

      const newToken = data.access_token;
      useAuthStore.getState().setAuth(data.user, newToken);

      // Rejoue toutes les requêtes en attente avec le nouveau token
      processQueue(null, newToken);

      // Rejoue la requête originale
      if (originalRequest.headers) {
        (originalRequest.headers as Record<string, string>)[
          'Authorization'
        ] = `Bearer ${newToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh token expiré ou révoqué → déconnexion complète
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;