import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import DashboardScreen from './screens/DashboardScreen'
import HomeScreen from './screens/HomeScreen'
import { GraduationCap } from 'lucide-react'

function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-bounce">
          <GraduationCap className="w-16 h-16 text-primary" />
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="h-1 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-1/3 animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Initialising Portal</p>
      </div>
    </div>
  )
}

function AppContent() {
  const { status, restoreSession } = useAuth()

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