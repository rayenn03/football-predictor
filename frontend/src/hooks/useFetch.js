import { useState, useEffect } from 'react'

export default function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchFn()
      .then(res => {
        if (!cancelled) setData(res.data?.data ?? res.data)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'An error occurred')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, deps)

  return { data, loading, error }
}
