import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/api-client';
import type { MatchesResponse } from '@/types/api';

export function useMatches(filters?: { type?: string; page?: number; limit?: number }) {
  const [matches, setMatches] = useState<MatchesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.type)  params.set('type', filters.type);
      if (filters?.page)  params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));

      const res = await apiClient.get<MatchesResponse>(`/matches?${params.toString()}`);
      setMatches(res.data);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.type, filters?.page, filters?.limit]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, error, isLoading, mutate: fetchMatches };
}
