import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Reference query: proves the client -> proxy -> Express -> DB path is wired.
 * Delete once real feature hooks exist.
 */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await api.get('/health')
      return data
    },
  })
}
