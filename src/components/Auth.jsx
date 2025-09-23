import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
    } catch (e) {
      setMessage('Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const signInWithMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
      if (error) throw error
      setMessage('Check your email for the magic link')
      setEmail('')
    } catch (e) {
      setMessage('Magic link sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="glass w-full max-w-md p-6 space-y-5">
        <div className="text-center">
          <div className="text-2xl font-semibold">Welcome to PrioGlass</div>
          <div className="text-slate-400 text-sm mt-1">Sign in to continue</div>
        </div>

        <button className="btn w-full" onClick={signInWithGoogle} disabled={loading}>Sign in with Google</button>

        <div className="h-px bg-white/10" />

        <form className="space-y-3" onSubmit={signInWithMagicLink}>
          <div>
            <div className="label">Email</div>
            <input className="input mt-2" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>Send Magic Link</button>
        </form>

        {message && (
          <div className="text-center text-sm text-slate-300">{message}</div>
        )}
      </div>
    </div>
  )
}


