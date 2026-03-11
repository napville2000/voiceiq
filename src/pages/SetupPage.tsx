import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function SetupPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !fullName.trim()) return

    setLoading(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)

    if (dbError) {
      setError('Could not save your name. Please try again.')
      setLoading(false)
      return
    }

    // Refresh the auth context by reloading — profile will re-fetch
    navigate('/dashboard', { replace: true })
    window.location.reload()
  }

  const emailPrefix = profile?.email?.split('@')[0] ?? ''

  return (
    <div className="min-h-screen bg-scp-navy flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-card-hover w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-scp-navy px-8 py-7 text-center">
          <div className="flex items-center justify-center gap-1 mb-3">
            <span className="text-scp-green font-bold text-2xl">SCP</span>
            <span className="text-white font-light text-2xl mx-1">|</span>
            <span className="text-white font-bold text-xl">Voice<span className="text-scp-green">IQ</span></span>
          </div>
          <h1 className="text-white font-bold text-xl">Welcome to VoiceIQ</h1>
          <p className="text-white/60 text-sm mt-1">One quick step before we get started</p>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <p className="text-scp-gray text-sm leading-relaxed mb-6">
            VoiceIQ uses your name to identify you in meeting transcripts and track your personal communication scores over time.
            <span className="block mt-2 text-scp-gray-mid text-xs">
              This should match how you appear in transcripts — e.g. "Zach Roberts" or "Sarah M".
            </span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Your full name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="input-field"
                placeholder={`e.g. ${emailPrefix.replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase())}`}
                required
                autoFocus
              />
              <p className="text-xs text-scp-gray-mid mt-1.5">
                Use the name that appears on your meeting transcripts.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Continue to VoiceIQ →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
