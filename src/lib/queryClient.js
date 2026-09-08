import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry client errors - they won't get better.
        if (error?.status >= 400 && error?.status < 500) return false
        return failureCount < 2
      },
    },
  },
})
