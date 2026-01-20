import { useEffect, useMemo, useState } from "react"

export function useQuery({ queryKey, queryFn }) {
  const [data, setData] = useState(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const stableKey = useMemo(() => JSON.stringify(queryKey || []), [queryKey])

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    Promise.resolve()
      .then(() => queryFn())
      .then(result => {
        if (mounted) {
          setData(result)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setIsLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [stableKey])

  return { data, isLoading }
}

export function useMutation({ mutationFn, onSuccess, onError }) {
  const mutate = async variables => {
    try {
      const result = await mutationFn(variables)
      if (onSuccess) {
        onSuccess(result, variables)
      }
      return result
    } catch (error) {
      if (onError) {
        onError(error)
      }
      throw error
    }
  }

  return { mutate, isPending: false }
}

export function useQueryClient() {
  return {
    invalidateQueries: () => {}
  }
}
