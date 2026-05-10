import { GoogleLogin } from '@react-oauth/google'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { School } from 'lucide-react'

export default function HomeScreen() {
  const { loginWithGoogle, errorMessage, clearError, status } = useAuth()
  const isBusy = status === 'loading'

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage)
      clearError()
    }
  }, [errorMessage, clearError])

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
          <CardHeader className="text-center">
            <CardDescription className="text-white/60">
              Sign in with your RVCE Google account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(cred) => {
                  if (cred.credential) void loginWithGoogle(cred.credential)
                }}
                onError={() => toast.error('Google sign-in failed.')}
                useOneTap={false}
                theme="filled_blue"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            </div>
          </CardContent>
        </Card>


        <p className="mt-6 text-center text-sm text-muted-foreground">
          RVCE MCA Placement Management System
        </p>
      </div>
    </div>
  )
}