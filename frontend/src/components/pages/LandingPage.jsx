import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import useFetch from '../../hooks/useFetch'
import { getLeagues } from '../../services/api'
import { ChevronDown, Database, Brain, Sparkles, Trophy, TrendingUp, Zap, BarChart3, Shield } from 'lucide-react'

const leagueFlags = {
  'premier-league': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'la-liga': '🇪🇸',
  'serie-a': '🇮🇹',
  'bundesliga': '🇩🇪',
  'ligue-1': '🇫🇷',
}

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const startTime = Date.now()
        const tick = () => {
          const progress = Math.min((Date.now() - startTime) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * end))
          if (progress < 1) requestAnimationFrame(tick)
        }
        tick()
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

export default function LandingPage() {
  const { data: leagues, loading } = useFetch(getLeagues)

  return (
    <div>
      {/* Hero — uses global shader background */}
      <div style={{ position: 'relative', width: 'calc(100% + 4rem)', marginLeft: '-2rem', minHeight: '90vh' }}>
        <div style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '90vh',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '820px', padding: '0 2rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1.1rem', borderRadius: '999px',
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
              fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '1.5rem',
              animation: 'float 3s ease-in-out infinite',
            }}>
              <Zap size={13} /> Powered by Machine Learning &amp; Gemini AI
            </div>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '1.25rem',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #22c55e 60%, #4ade80 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Predict the Beautiful Game
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
              23 trophy predictions across Europe's top 5 leagues — powered by 10 seasons of real match data,
              ensemble ML models, and Google Gemini AI.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', fontWeight: 600, boxShadow: '0 0 30px rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} /> View Predictions
              </Link>
              <Link to="/analytics" className="btn btn-outline" style={{ padding: '0.875rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} /> Analytics
              </Link>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '2rem', color: 'var(--text-muted)', animation: 'float 2s ease-in-out infinite' }}>
            <ChevronDown size={32} />
          </div>
        </div>
      </div>

      {/* Animated counters */}
      <section style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { value: 10, suffix: '', label: 'Seasons of Data', icon: <Database size={22} /> },
            { value: 55, suffix: '+', label: 'CSV Datasets', icon: <BarChart3 size={22} /> },
            { value: 23, suffix: '', label: 'Trophy Predictions', icon: <Trophy size={22} /> },
            { value: 5, suffix: '', label: 'European Leagues', icon: <Shield size={22} /> },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ color: 'var(--accent)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: '2.75rem', fontWeight: 800 }}>
                <AnimatedCounter end={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* League cards */}
      <section style={{ padding: '0 0 4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Europe's <span style={{ color: 'var(--accent)' }}>Top 5</span> Leagues
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
          Click any league to explore predictions, standings, and trophy winners
        </p>
        {loading ? <div className="loader"><div className="spinner" /></div> : (
          <div className="grid-5">
            {(leagues || []).map((league, idx) => (
              <Link key={league.slug} to={`/leagues/${league.slug}`} style={{ textDecoration: 'none' }}>
                <div
                  className="card"
                  style={{ textAlign: 'center', cursor: 'pointer', transition: 'all 0.35s cubic-bezier(0.175,0.885,0.32,1.275)' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(34,197,94,0.13)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '' }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                    {leagueFlags[league.slug] || '⚽'}
                  </div>
                  <div className="card-title">{league.name}</div>
                  <div className="card-subtitle" style={{ marginBottom: '0.75rem' }}>{league.country}</div>
                  {league.predicted_champion && (
                    <span className="badge badge-green" style={{ fontSize: '0.78rem' }}>👑 {league.predicted_champion}</span>
                  )}
                  {league.model_accuracy != null && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Accuracy</span>
                        <span style={{ color: 'var(--accent)' }}>{(league.model_accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="confidence-bar">
                        <div className="confidence-fill" style={{ width: `${(league.model_accuracy * 100).toFixed(0)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section style={{ padding: '4rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '3rem' }}>
          How It <span style={{ color: 'var(--accent)' }}>Works</span>
        </h2>
        <div className="grid-3">
          {[
            { icon: <Database size={32} />, title: 'Data Collection', desc: '10 seasons of match data from football-data.co.uk. 55+ CSVs with detailed stats across all 5 major leagues.', step: '01' },
            { icon: <Brain size={32} />, title: 'ML Training', desc: 'Random Forest + Gradient Boosting ensemble trained on 25+ features: ELO, form, shot accuracy, and more.', step: '02' },
            { icon: <Sparkles size={32} />, title: 'AI Enhancement', desc: 'Google Gemini AI adds expert context, player-level predictions, and validates ML outputs.', step: '03' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ position: 'relative', padding: '2rem', textAlign: 'center', borderTop: '2px solid var(--accent)' }}>
              <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#000', padding: '0.15rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
                STEP {item.step}
              </div>
              <div style={{ color: 'var(--accent)', marginTop: '0.5rem', marginBottom: '1rem' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{item.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '4rem 2rem', textAlign: 'center', marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
        borderRadius: 'var(--radius-lg)', border: '1px solid rgba(34,197,94,0.15)',
      }}>
        <Trophy size={46} style={{ color: 'var(--gold)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Ready to explore all 23 predictions?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '460px', margin: '0 auto 2rem' }}>
          Champions, top scorers, Ballon d'Or, and more — all powered by data science.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/trophies" className="btn btn-primary" style={{ padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={18} /> Trophy Room
          </Link>
          <Link to="/champions-league" className="btn btn-outline" style={{ padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} /> Champions League
          </Link>
        </div>
      </section>
    </div>
  )
}
