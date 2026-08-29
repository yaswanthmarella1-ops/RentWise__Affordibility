import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import type { SaveScenarioPayload, SavedScenario } from '../lib/types';

const KEY = ['scenarios'] as const;

export function useScenarios(enabled: boolean) {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<SavedScenario[]>('/api/scenarios'),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateScenario() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveScenarioPayload) =>
      api.post<SavedScenario>('/api/scenarios', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateScenario() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<SaveScenarioPayload> & { id: string }) =>
      api.patch<SavedScenario>(`/api/scenarios/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteScenario() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/scenarios/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
