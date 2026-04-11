// src/lib/api/auth.ts
//
// Toutes les fonctions d'appel HTTP liées à l'authentification.
// Aucune logique métier ici : uniquement les appels Axios + typage des réponses.

import apiClient from './axios';
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RefreshResponse,
  RegisterPayload,
} from '@/types/auth.types';

export const authApi = {
  /**
   * POST /auth/register
   * Crée un nouveau compte.
   * Le refresh_token est posé en cookie httpOnly par le serveur (invisible ici).
   */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/register',
      payload,
    );
    return data;
  },

  /**
   * POST /auth/login
   * Authentifie un utilisateur existant.
   * Le refresh_token est posé en cookie httpOnly par le serveur.
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/login',
      payload,
    );
    return data;
  },

  /**
   * POST /auth/refresh
   * Émet un nouveau access_token + renouvelle le cookie refresh_token.
   * Le cookie est envoyé automatiquement (withCredentials: true).
   * Appelé automatiquement par l'intercepteur Axios sur 401.
   */
  refresh: async (): Promise<RefreshResponse> => {
    const { data } = await apiClient.post<RefreshResponse>('/auth/refresh');
    return data;
  },

  /**
   * POST /auth/logout
   * Blackliste le refresh token côté serveur et efface le cookie.
   * L'access token est effacé côté client via clearAuth().
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * GET /auth/me
   * Retourne le profil de l'utilisateur connecté (nécessite un access token valide).
   */
  me: async (): Promise<{ user: AuthUser }> => {
    const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
    return data;
  },
};