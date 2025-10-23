import React, { useEffect, useState } from 'react'

// Simple event-based toaster so we don't need to wire context through the tree
const listeners = new Set()

function genId() {
  // Browser crypto if available, else fallback
  const c = typeof crypto !== 'undefined' && crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return String(Date.now() + Math.random())
}

export function toast(message, options = {}) {
  const t = {
    id: genId(),
    message,
    type: options.type || 'info', // 'success' | 'error' | 'info'
    duration: options.duration ?? 3000,
  }
  listeners.forEach((fn) => fn(t))
}

toast.success = (message, options = {}) => toast(message, { ...options, type: 'success' })
toast.error = (message, options = {}) => toast(message, { ...options, type: 'error' })
toast.info = (message, options = {}) => toast(message, { ...options, type: 'info' })

export default function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const onToast = (t) => {
      setItems((prev) => [...prev, t])
      const timeout = setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id))
      }, t.duration)
      // If unmounted before timeout
      t._timeout = timeout
    }
    listeners.add(onToast)
    return () => {
      listeners.delete(onToast)
      // Best effort: clear timeouts for currently queued items
      items.forEach((t) => t._timeout && clearTimeout(t._timeout))
    }
  }, [])

  const stylesByType = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-slate-800 text-white',
  }

  const iconByType = {
    success: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 19a7 7 0 110-14 7 7 0 010 14z" />
      </svg>
    ),
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`min-w-[220px] max-w-[360px] px-3 py-2 rounded-lg shadow-lg flex items-start gap-2 ${
            stylesByType[t.type] || stylesByType.info
          }`}
        >
          <div className="mt-0.5">{iconByType[t.type] || iconByType.info}</div>
          <div className="text-sm leading-snug">{t.message}</div>
        </div>
      ))}
    </div>
  )
}
