import { GoogleLogin } from '@react-oauth/google'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { School } from 'lucide-react'

export default function HomeScreen() {
  const { loginWithSpc, loginWithGoogle, errorMessage, clearError, status } =
    useAuth()
  const { showToast } = useToast()
  const [isSpc, setIsSpc] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (errorMessage) {
      showToast(errorMessage)
      clearError()
    }
  }, [errorMessage, clearError, showToast])

  const isBusy = status === 'loading'

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div
        className="absolute rounded-full blur-3xl opacity-40"
        style={{ width: 320, height: 320, top: -120, right: -80, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-30"
        style={{ width: 280, height: 280, bottom: -100, left: -60, background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 px-5 py-3 mb-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <School className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-white">RV College of Engineering</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Placement Portal</h1>
          <p className="mt-2 text-muted-foreground">Your gateway to career opportunities</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center gap-2 p-1 rounded-xl bg-white/5">
              <button
                type="button"
                onClick={() => setIsSpc(false)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isSpc 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setIsSpc(true)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSpc 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                SPC
              </button>
            </div>
            <CardDescription className="text-white/60">
              {isSpc 
                ? 'Sign in with your SPC credentials' 
                : 'Sign in with your RVCE Google account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSpc ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={(cred) => {
                    if (cred.credential) void loginWithGoogle(cred.credential)
                  }}
                  onError={() => showToast('Google sign-in failed.')}
                  useOneTap={false}
                  theme="filled_blue"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Username"
                    value={username}
                    disabled={isBusy}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    disabled={isBusy}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isBusy) {
                        void loginWithSpc(username.trim(), password)
                      }
                    }}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={isBusy}
                  onClick={() => void loginWithSpc(username.trim(), password)}
                >
                  {isBusy ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          RVCE MCA Placement Management System
        </p>
      </div>
    </div>
  )
}