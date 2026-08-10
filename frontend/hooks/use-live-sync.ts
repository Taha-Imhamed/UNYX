import { useEffect } from 'react'

// Lightweight client-side SSE connector. Server endpoint optional; if absent, hook is a no-op.
export default function useLiveSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    let es: EventSource | null = null
    try {
      // Prefer proxied API route
      const endpoints = ['/api/events', '/api/stream', '/events', '/stream']
      for (const ep of endpoints) {
        try {
          es = new EventSource(ep)
          break
        } catch (err) {
          es = null
        }
      }
    } catch (err) {
      es = null
    }

    if (!es) return

    const onMessage = (ev: MessageEvent) => {
      try {
        const payload = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data
        window.dispatchEvent(new CustomEvent('unyt:live-update', { detail: payload }))
      } catch (err) {
        console.warn('Malformed live event', err)
      }
    }

    es.addEventListener('message', onMessage)
    es.addEventListener('open', () => console.debug('Live sync opened'))
    es.addEventListener('error', (e) => {
      console.warn('Live sync error', e)
      // if server closed, close EventSource
      if (es && (es.readyState === EventSource.CLOSED || es.readyState === EventSource.CLOSED)) {
        es.close()
      }
    })

    return () => {
      if (es) {
        es.removeEventListener('message', onMessage)
        es.close()
      }
    }
  }, [])
}
