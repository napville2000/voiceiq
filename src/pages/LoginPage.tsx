import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { signIn, session, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setSubmitting(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-scp-navy flex flex-col">

      {/* Top accent bar */}
      <div className="h-1 bg-scp-green w-full" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-scp-green font-bold text-4xl tracking-tight">SCP</span>
              <span className="text-white font-light text-4xl mx-1">|</span>
              <span className="text-white font-bold text-3xl">
                Voice<span className="text-scp-green">IQ</span>
              </span>
            </div>
            <p className="text-white/60 text-sm font-light tracking-wide uppercase">
              BSA Communication Intelligence
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h1 className="text-scp-navy font-bold text-xl mb-1">Welcome back</h1>
            <p className="text-scp-gray text-sm mb-6">Sign in to your VoiceIQ account</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@scphealth.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full mt-2"
              >
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-scp-gray-mid text-xs mt-6">
              Access is invite-only. Contact your BSA Director to request access.
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-white/30 text-xs mt-8">
            © 2025 SCP Health · Internal use only · All meeting data is confidential
          </p>
        </div>
      </div>
    </div>
  )
}
