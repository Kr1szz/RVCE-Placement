import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { toast } from 'sonner'

type ToastCtx = {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((message: string) => {
    toast(message)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast requires ToastProvider')
  return ctx
}
