import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Analyze', path: '/analyze' },
  { label: 'My History', path: '/history' },
]

export function NavBar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="bg-scp-navy text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo / Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex items-center gap-1">
              {/* SCP arrow motif */}
              <span className="text-scp-green font-bold text-2xl tracking-tight">SCP</span>
              <span className="text-white font-light text-2xl tracking-tight mx-1">|</span>
              <span className="text-white font-bold text-xl tracking-tight">Voice<span className="text-scp-green">IQ</span></span>
            </div>
          </Link>

          {/* Nav Links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all duration-150 ${
                  location.pathname === item.path
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {profile?.role === 'director' && (
              <Link
                to="/team"
                className={`px-4 py-2 rounded text-sm font-semibold transition-all duration-150 ${
                  location.pathname === '/team'
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Team Pulse
              </Link>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold leading-none">{profile?.full_name ?? 'BSA Team'}</p>
              <p className="text-xs text-white/60 mt-0.5 capitalize">{profile?.role ?? 'analyst'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-scp-green text-scp-navy flex items-center justify-center font-bold text-sm">
              {(profile?.full_name ?? 'U').charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleSignOut}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors ml-2"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                location.pathname === item.path
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
