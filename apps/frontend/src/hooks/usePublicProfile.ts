import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/axios';

export function usePublicProfile(id: string | null) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    apiClient.get(`/users/${id}`)
      .then(res => setProfile(res.data))
      .catch(err => setError(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { profile, isLoading, error };
}
