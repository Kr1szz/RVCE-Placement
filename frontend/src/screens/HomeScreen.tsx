import { GoogleLogin } from '@react-oauth/google'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { School, Download, Bell } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { useAuth } from '../context/AuthContext'
import { AuthCardSkeleton } from '@/components/modern/Skeleton'
import { CollegeLogo } from '@/components/modern/CollegeLogo'

export default function HomeScreen() {
  const { loginWithGoogle, loginWithSpc, errorMessage, clearError, status } = useAuth()
  const isBusy = status === 'loading'
  const { isInstallable, promptInstall } = usePWAInstall()
  const [isSpc, setIsSpc] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showNotifDialog, setShowNotifDialog] = useState(false)
  const [notificationPerm, setNotificationPerm] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission()
      setNotificationPerm(perm)
      if (perm === 'granted') {
        toast.success('Notifications enabled successfully!')
      } else {
        toast.error('Notifications permission was denied.')
      }
    }
  }

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage)
      clearError()
    }
  }, [errorMessage, clearError])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8fbff] px-5 py-10 text-slate-950">
      <div className="pointer-events-none absolute inset-x-[-35%] top-[-8rem] h-[25rem] rounded-b-[55%] bg-[#dff0ff]" />
      <div className="pointer-events-none absolute inset-x-[-25%] top-[-2rem] h-[20rem] rounded-b-[55%] bg-white" />

      <main className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="mb-20 flex flex-col items-center sm:mb-16">
          <CollegeLogo imageClassName="w-48" />
          <h1 className="mt-3 text-xl font-medium tracking-tight">Placement</h1>
        </div>

        {isBusy ? (
          <AuthCardSkeleton />
        ) : (
          <section
            aria-label="Placement portal sign in"
            className="w-full rounded-[2rem] border border-white/10 bg-[#444444] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.28)] animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <p className="mb-6 text-center text-sm font-medium text-white/80">
              Sign in with your RVCE Google account
            </p>
            <div className="flex justify-center rounded-2xl bg-[#0d72d9] px-3 py-3 hover:bg-blue-600 transition-colors">
              <GoogleLogin
                onSuccess={(cred) => {
                  if (cred.credential) void loginWithGoogle(cred.credential)
                }}
                onError={() => toast.error('Google sign-in failed.')}
                useOneTap={false}
                theme="filled_blue"
                size="large"
                text="continue_with"
                shape="pill"
                width="300"
              />
            </div>
          </CardContent>
        </Card>


        <p className="mt-6 text-center text-sm text-muted-foreground">
          RVCE MCA Placement Management System
        </p>
      </div>

      <Dialog open={showNotifDialog} onOpenChange={setShowNotifDialog}>
        <DialogContent className="glass-panel border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Notifications</DialogTitle>
            <DialogDescription className="text-text-muted">
              Notification permissions are managed by your browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-sm text-white/80">
            <p>
              Your current notification status is: <strong className="text-white uppercase">{notificationPerm}</strong>.
            </p>
            <p>
              Because web browsers restrict apps from changing this permission directly after it's set, you'll need to update it via your browser settings:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Click the <strong>Lock icon</strong> or <strong>Site Settings icon</strong> next to the URL in your browser's address bar.</li>
              <li>Find <strong>Notifications</strong> in the dropdown.</li>
              <li>Change the setting to <strong>Ask</strong>, <strong>Allow</strong>, or <strong>Block</strong>.</li>
              <li>Refresh the page to apply your changes.</li>
            </ol>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNotifDialog(false)} className="text-white hover:bg-white/5">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </section>
        )}
      </main>
    </div>
  )
}
