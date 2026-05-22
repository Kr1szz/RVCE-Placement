import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import DashboardScreen from './screens/DashboardScreen'
import HomeScreen from './screens/HomeScreen'
import { LoadingRegion, Skeleton } from '@/components/modern/Skeleton'
import { CollegeLogo } from '@/components/modern/CollegeLogo'

function Splash() {
  return (
    <LoadingRegion
      label="Initialising placement portal"
      className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-bounce dark:border-slate-800">
          <CollegeLogo imageClassName="w-48" />
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="h-1 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <Skeleton tone="blue" className="h-full w-full rounded-full" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Initialising Portal</p>
      </div>
    </LoadingRegion>
  )
}

function AppContent() {
  const status = useAuthStore((state) => state.status)
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  if (status === 'checking' || status === 'loading') {
    return <Splash />
  }

  if (status === 'authenticated') {
    return <DashboardScreen />
  }

  return <HomeScreen />
}

export default function App() {
  return (
    <AppContent />
  )
}
