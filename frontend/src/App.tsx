import { useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import DashboardScreen from './screens/DashboardScreen'
import HomeScreen from './screens/HomeScreen'

function Splash() {
  return (
    <div className="plc-splash">
      <div className="plc-splash-spinner" />
    </div>
  )
}

function AppContent() {
  const { status } = useAuth()

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
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}