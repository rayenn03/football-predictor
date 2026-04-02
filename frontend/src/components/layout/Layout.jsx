import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import AnoAI from '../ui/animated-shader-background'

export default function Layout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/compare', label: 'Compare' },
    { to: '/champions-league', label: 'UCL' },
    { to: '/trophies', label: 'Trophies' },
  ]

  return (
    <div className="app-layout">
      {/* Global animated background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: 0.35,
        pointerEvents: 'none',
      }}>
        <AnoAI />
      </div>

      {/* Dark overlay to keep content readable */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        background: 'radial-gradient(ellipse at 50% 0%, transparent 0%, rgba(10,14,23,0.7) 70%, rgba(10,14,23,0.92) 100%)',
        pointerEvents: 'none',
      }} />

      <header className={`app-header ${menuOpen ? 'nav-open' : ''}`} style={{ position: 'sticky', zIndex: 100 }}>
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          ⚽ <span>Football</span>Predictor
        </Link>
        <nav className={menuOpen ? 'nav-open' : ''}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={pathname === link.to ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>
      <main className="app-main" style={{ position: 'relative', zIndex: 2 }}>
        <Outlet />
      </main>
      <footer className="app-footer" style={{ position: 'relative', zIndex: 2 }}>
        Football Predictor &copy; 2026 — ML-Powered Predictions for Europe's Top 5 Leagues
      </footer>
    </div>
  )
}
