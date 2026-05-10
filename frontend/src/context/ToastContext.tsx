import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

type ToastCtx = {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const [type, setType] = useState<'success' | 'error'>('error')

  const showToast = useCallback((msg: string, toastType: 'success' | 'error' = 'error') => {
    setType(toastType)
    setMessage(msg)
    window.setTimeout(() => setMessage(null), 4000)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && (
        <div 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white shadow-2xl animate-in slide-in-from-bottom-2"
          role="status"
        >
          {type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm">{message}</span>
          <button 
            onClick={() => setMessage(null)}
            className="ml-1 p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast requires ToastProvider')
  return ctx
}