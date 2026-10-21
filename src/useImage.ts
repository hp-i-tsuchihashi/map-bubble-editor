import { useEffect, useState } from 'react'

export function useImage(src: string | null): HTMLImageElement | null {
  const [state, setState] = useState<{ src: string; img: HTMLImageElement } | null>(null)
  useEffect(() => {
    if (!src) return
    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (!cancelled) setState({ src, img })
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])
  return src && state?.src === src ? state.img : null
}
