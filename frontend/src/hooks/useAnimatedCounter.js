import { useEffect, useRef, useState } from 'react'

export const useAnimatedCounter = (end, duration = 1500, decimals = 0) => {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const rafRef = useRef()

  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true)
      const startTime = performance.now()

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = eased * end
        setCount(current)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [end, duration, hasStarted])

  return decimals > 0 ? count.toFixed(decimals) : Math.round(count)
}
