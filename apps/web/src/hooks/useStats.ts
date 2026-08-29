import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import type { StatsResponse } from '../lib/types';

export function useStats(enabled: boolean) {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get<StatsResponse>('/api/stats'),
    enabled,
    staleTime: 30_000,
  });
}
