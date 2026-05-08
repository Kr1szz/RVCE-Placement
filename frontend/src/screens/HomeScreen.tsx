import { GoogleLogin } from '@react-oauth/google'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, Lock, Mail } from 'lucide-react'

export default function HomeScreen() {
  const { loginWithSpc, loginWithGoogle, errorMessage, clearError, status } = useAuth()
  const { showToast } = useToast()
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            RVCE Placement
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            MCA Placement Management System
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Choose your role to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="spc">SPC</TabsTrigger>
              </TabsList>
              
              <TabsContent value="student" className="space-y-4">
                <div className="space-y-4">
                  <div className="text-center py-4 px-2">
                    <p className="text-sm text-slate-500 mb-6">
                      Sign in using your institutional Google account to access your placement dashboard.
                    </p>
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={(cred) => {
                          if (cred.credential) void loginWithGoogle(cred.credential)
                        }}
                        onError={() => showToast('Google sign-in failed.')}
                        useOneTap={false}
                        theme="outline"
                        size="large"
                        shape="pill"
                        width="100%"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="spc" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        className="pl-10"
                        placeholder="Username"
                        value={username}
                        disabled={isBusy}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        autoComplete="username"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        className="pl-10"
                        type="password"
                        placeholder="Password"
                        value={password}
                        disabled={isBusy}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter' && !isBusy) {
                            void loginWithSpc(username.trim(), password)
                          }
                        }}
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full font-semibold" 
                    onClick={() => void loginWithSpc(username.trim(), password)}
                    disabled={isBusy}
                  >
                    {isBusy ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-xs text-center text-slate-400 dark:text-slate-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
