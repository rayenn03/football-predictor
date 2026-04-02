import useFetch from '../../hooks/useFetch'
import { getChampionsLeague } from '../../services/api'
import { Trophy, Shield, Star, MapPin, Users, Zap } from 'lucide-react'

const STAR_POSITIONS = [
  { top: '15%', left: '8%' }, { top: '25%', right: '10%' }, { top: '60%', left: '5%' },
  { top: '70%', right: '8%' }, { top: '40%', left: '2%' }, { top: '50%', right: '3%' },
]

export default function UCLPage() {
  const { data, loading, error } = useFetch(getChampionsLeague)

  if (loading) return <div className="loader"><div className="spinner" /></div>
  if (error) return <div className="error-box">Error: {error}</div>

  const ucl = data || {}
  const winner = ucl.winner || {}
  const runnerUp = ucl.runner_up || {}
  const winnerName = typeof winner === 'string' ? winner : winner.team || 'TBD'
  const runnerUpName = typeof runnerUp === 'string' ? runnerUp : runnerUp.team || 'TBD'
  const winnerProb = typeof winner === 'object' ? winner.probability : null
  const runnerUpProb = typeof runnerUp === 'object' ? runnerUp.probability : null
  const winnerLeague = typeof winner === 'object' ? winner.league : null
  const runnerLeague = typeof runnerUp === 'object' ? runnerUp.league : null

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: '2.5rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
      }}>
        {/* Decorative stars */}
        {STAR_POSITIONS.map((pos, i) => (
          <Star
            key={i}
            size={i % 2 === 0 ? 10 : 14}
            style={{
              position: 'absolute',
              color: `rgba(251,191,36,${0.2 + (i * 0.08)})`,
              animation: `float ${2 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              ...pos,
            }}
            fill="currentColor"
          />
        ))}

        {/* UCL logo area */}
        <div style={{
          width: 80, height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4338ca, #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 0 40px rgba(99,102,241,0.4)',
          fontSize: '2.5rem',
        }}>
          🏆
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.3rem 1rem', borderRadius: '999px',
          background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
          fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600,
          letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          <Zap size={11} /> ML + AI Prediction
        </div>

        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #f1f5f9, #a5b4fc 50%, #6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          lineHeight: 1.1,
        }}>
          UEFA Champions League
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>2024/25 Season Prediction</p>

        {ucl.final_venue && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            marginTop: '1rem', padding: '0.5rem 1.25rem',
            background: 'rgba(255,255,255,0.05)', borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.85rem', color: '#94a3b8',
          }}>
            <MapPin size={14} style={{ color: '#a5b4fc' }} />
            Final · {ucl.final_venue}
          </div>
        )}
      </div>

      {/* Winner & Runner-up */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Winner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-card), rgba(251,191,36,0.06))',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(251,191,36,0.08)',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)',
          }} />
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🥇</div>
          <div style={{
            fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem',
          }}>
            Predicted Winner
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginBottom: '0.25rem' }}>
            {winnerName}
          </div>
          {winnerLeague && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {winnerLeague}
            </div>
          )}
          {winnerProb != null && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Win Probability</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>{(winnerProb * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(winnerProb * 100).toFixed(0)}%`,
                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                  borderRadius: '3px',
                  transition: 'width 1s ease',
                }} />
              </div>
            </>
          )}
        </div>

        {/* Runner-up */}
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-card), rgba(148,163,184,0.06))',
          border: '1px solid rgba(148,163,184,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, #94a3b8, #cbd5e1, #94a3b8)',
          }} />
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🥈</div>
          <div style={{
            fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem',
          }}>
            Runner-Up
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '0.25rem' }}>
            {runnerUpName}
          </div>
          {runnerLeague && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {runnerLeague}
            </div>
          )}
          {runnerUpProb != null && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Finalist Probability</span>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>{(runnerUpProb * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(runnerUpProb * 100).toFixed(0)}%`,
                  background: 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                  borderRadius: '3px',
                  transition: 'width 1s ease',
                }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* UCL Top Scorer */}
      {ucl.top_scorer && (
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-card), rgba(34,197,94,0.05))',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: 60, height: 60,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem',
            flexShrink: 0,
            border: '2px solid rgba(34,197,94,0.2)',
          }}>⚽</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>UCL Top Scorer</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{ucl.top_scorer.player}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ucl.top_scorer.team}</div>
          </div>
          {ucl.top_scorer.goals && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{ucl.top_scorer.goals}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>goals</div>
            </div>
          )}
        </div>
      )}

      {/* Semi-finalists */}
      {ucl.semifinalists?.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Users size={17} style={{ color: 'var(--text-muted)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Semi-Finalists</h2>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)', marginLeft: '0.5rem' }} />
          </div>
          <div className="grid-2" style={{ maxWidth: '700px' }}>
            {ucl.semifinalists.map((team, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: i < 2 ? 'rgba(99,102,241,0.15)' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700,
                  color: i < 2 ? '#a5b4fc' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontWeight: 600 }}>
                  {typeof team === 'string' ? team : team.team}
                </div>
                {typeof team === 'object' && team.league && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {team.league}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Methodology card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-card), rgba(99,102,241,0.04))',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
      }}>
        <Shield size={20} style={{ color: '#a5b4fc', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: '#a5b4fc' }}>Prediction Methodology</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            Based on 10 seasons of league performance data, team ELO ratings, and historical Champions
            League results across all 5 major European leagues. Random Forest + Gradient Boosting
            ensemble models identify the strongest continental candidates, enhanced with Gemini AI analysis.
          </div>
        </div>
      </div>
    </div>
  )
}
