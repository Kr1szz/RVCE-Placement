import { GoogleLogin } from '@react-oauth/google'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { AuthCardSkeleton } from '@/components/modern/Skeleton'
import { CollegeLogo } from '@/components/modern/CollegeLogo'

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
          </section>
        )}
      </main>
    </div>
  )
}
