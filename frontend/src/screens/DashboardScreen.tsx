import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { AdminPanel } from '../panels/AdminPanel'
import { ChatPanel } from '../panels/ChatPanel'
import { CompaniesPanel } from '../panels/CompaniesPanel'
import { FormsPanel } from '../panels/FormsPanel'
import { ProfilePanel } from '../panels/ProfilePanel'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Building2, 
  ClipboardList, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Panel = {
  id: string
  label: string
  icon: React.ReactNode
  element: React.ReactNode
}

export default function DashboardScreen() {
  const { session, logout } = useAuth()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const fn = () => {}
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const panels: Panel[] = useMemo(
    () => {
      if (!session) return []
      return [
        {
          id: 'profile',
          label: 'Profile',
          icon: <User className="w-5 h-5" />,
          element: <ProfilePanel />,
        },
        {
          id: 'companies',
          label: 'Companies',
          icon: <Building2 className="w-5 h-5" />,
          element: <CompaniesPanel />,
        },
        {
          id: 'forms',
          label: 'Forms',
          icon: <ClipboardList className="w-5 h-5" />,
          element: <FormsPanel />,
        },
        {
          id: 'chat',
          label: 'Chat',
          icon: <MessageSquare className="w-5 h-5" />,
          element: <ChatPanel />,
        },
        ...(session.isSpc
          ? [
              {
                id: 'admin',
                label: 'SPC Admin',
                icon: <Settings className="w-5 h-5" />,
                element: <AdminPanel />,
              } as Panel,
            ]
          : []),
      ]
    },
    [session],
  )

  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, panels.length - 1)))
  }, [panels.length])

  if (!session) return null

  const safeIndex = Math.min(selectedIndex, panels.length - 1)
  const active = panels[safeIndex] ?? panels[0]

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300",
      )}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">Placement</span>
          </div>
          <p className="text-xs text-slate-500 font-medium px-1 uppercase tracking-wider">
            {session.isSpc ? 'SPC Administrator' : 'Student Portal'}
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {panels.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                i === safeIndex 
                  ? "bg-primary/10 text-primary" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50"
              )}
            >
              {p.icon}
              {p.label}
              {i === safeIndex && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 p-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">
              {session.user.name?.charAt(0) || 'S'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{session.user.name || 'Student'}</p>
              <p className="text-xs text-slate-500 truncate">{session.user.collegeEmailId}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-600 dark:text-slate-400 hover:text-destructive hover:bg-destructive/10" 
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
            <h2 className="text-lg font-semibold lg:text-xl">{active.label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              Help & Support
            </Button>
          </div>
        </header>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {active.element}
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary rounded-lg">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">Placement</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              {panels.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedIndex(i)
                    setIsMobileMenuOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                    i === safeIndex 
                      ? "bg-primary/10 text-primary" 
                      : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-destructive" 
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
