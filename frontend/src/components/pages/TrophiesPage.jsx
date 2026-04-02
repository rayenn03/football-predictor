import { useState } from 'react'
import useFetch from '../../hooks/useFetch'
import { getTrophies } from '../../services/api'
import { Trophy, Star, Shield, Target, Zap, Crown } from 'lucide-react'

const trophyMeta = {
  ballon_dor:          { icon: '🏆', label: "Ballon d'Or", color: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },
  kopa_trophy:         { icon: '🌟', label: 'Kopa Trophy', color: '#c084fc', glow: 'rgba(192,132,252,0.2)' },
  yashin_trophy:       { icon: '🧤', label: 'Yashin Trophy', color: '#60a5fa', glow: 'rgba(96,165,250,0.2)' },
  gerd_muller_trophy:  { icon: '⚽', label: 'Gerd Müller Trophy', color: '#f97316', glow: 'rgba(249,115,22,0.2)' },
  european_golden_boot:{ icon: '👟', label: 'European Golden Boot', color: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },
  ucl_winner:          { icon: '🏆', label: 'UCL Winner', color: '#22c55e', glow: 'rgba(34,197,94,0.2)' },
  title:               { icon: '🏆', label: 'League Title', color: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },
  golden_boot:         { icon: '👟', label: 'Golden Boot', color: '#fbbf24', glow: 'rgba(251,191,36,0.2)' },
  pichichi:            { icon: '👟', label: 'Pichichi', color: '#f87171', glow: 'rgba(248,113,113,0.2)' },
  capocannoniere:      { icon: '👟', label: 'Capocannoniere', color: '#34d399', glow: 'rgba(52,211,153,0.2)' },
  torjaegerkanone:     { icon: '👟', label: 'Torjägerkanone', color: '#60a5fa', glow: 'rgba(96,165,250,0.2)' },
  meilleur_buteur:     { icon: '👟', label: 'Meilleur Buteur', color: '#c084fc', glow: 'rgba(192,132,252,0.2)' },
  playmaker:           { icon: '🎯', label: 'Playmaker Award', color: '#22c55e', glow: 'rgba(34,197,94,0.2)' },
  playmaker_award:     { icon: '🎯', label: 'Playmaker Award', color: '#22c55e', glow: 'rgba(34,197,94,0.2)' },
  top_assists:         { icon: '🎯', label: 'Top Assists', color: '#22c55e', glow: 'rgba(34,197,94,0.2)' },
  zamora:              { icon: '🧤', label: 'Zamora Trophy', color: '#60a5fa', glow: 'rgba(96,165,250,0.2)' },
  golden_glove:        { icon: '🧤', label: 'Golden Glove', color: '#60a5fa', glow: 'rgba(96,165,250,0.2)' },
  scudetto:            { icon: '🏆', label: 'Scudetto', color: '#34d399', glow: 'rgba(52,211,153,0.2)' },
  meisterschale:       { icon: '🏆', label: 'Meisterschale', color: '#60a5fa', glow: 'rgba(96,165,250,0.2)' },
}

const leagueFlags = {
  'premier-league': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'la-liga': '🇪🇸',
  'serie-a': '🇮🇹',
  'bundesliga': '🇩🇪',
  'ligue-1': '🇫🇷',
}

function getWinner(val) {
  if (!val) return '—'
  if (typeof val === 'string') return val
  return val.winner || val.player || val.name || val.team || '—'
}

function getDetail(val) {
  if (!val || typeof val === 'string') return null
  const parts = []
  if (val.team && val.team !== getWinner(val)) parts.push(val.team)
  if (val.goals) parts.push(`${val.goals} goals`)
  if (val.assists) parts.push(`${val.assists} assists`)
  if (val.probability) parts.push(`${(val.probability * 100).toFixed(0)}% confidence`)
  return parts.length ? parts.join(' · ') : null
}

function TrophyCard({ tkey, val, rank }) {
  const [hovered, setHovered] = useState(false)
  const meta = trophyMeta[tkey] || { icon: '🏆', label: tkey.replace(/_/g, ' '), color: '#22c55e', glow: 'rgba(34,197,94,0.2)' }
  const winner = getWinner(val)
  const detail = getDetail(val)
  const prob = typeof val === 'object' ? val?.probability : null

  const rankColors = ['#fbbf24', '#94a3b8', '#d97706']
  const rankLabels = ['🥇', '🥈', '🥉']

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, var(--bg-card-hover), ${meta.glow})`
          : 'var(--bg-card)',
        border: `1px solid ${hovered ? meta.color : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        textAlign: 'center',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : '',
        boxShadow: hovered ? `0 12px 40px ${meta.glow}, 0 0 0 1px ${meta.color}22` : 'none',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Shine effect */}
      <div style={{
        position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
        transform: hovered ? 'translateX(300%)' : 'translateX(0)',
        transition: 'transform 0.6s ease',
        pointerEvents: 'none',
      }} />

      {rank !== undefined && (
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontSize: '1rem' }}>
          {rankLabels[rank] || null}
        </div>
      )}

      <div style={{
        fontSize: '2.5rem',
        marginBottom: '0.75rem',
        filter: hovered ? `drop-shadow(0 0 12px ${meta.color})` : 'none',
        transition: 'filter 0.3s',
      }}>
        {meta.icon}
      </div>

      <div style={{
        fontSize: '0.7rem',
        color: meta.color,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '0.5rem',
      }}>
        {meta.label}
      </div>

      <div style={{
        fontSize: '1.05rem',
        fontWeight: 700,
        color: hovered ? meta.color : 'var(--text-primary)',
        transition: 'color 0.3s',
        lineHeight: 1.3,
        marginBottom: detail ? '0.4rem' : 0,
      }}>
        {winner}
      </div>

      {detail && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {detail}
        </div>
      )}

      {prob != null && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Confidence</span>
            <span style={{ color: meta.color, fontWeight: 600 }}>{(prob * 100).toFixed(0)}%</span>
          </div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(prob * 100).toFixed(0)}%`,
              background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)`,
              borderRadius: '2px',
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function TrophiesPage() {
  const { data, loading, error } = useFetch(getTrophies)

  if (loading) return <div className="loader"><div className="spinner" /></div>
  if (error) return <div className="error-box">Error: {error}</div>

  const { global_trophies = {}, leagues = [] } = data || {}
  const totalTrophies = Object.keys(global_trophies).length + leagues.reduce((sum, l) => sum + Object.keys(l.trophies || {}).length, 0)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={24} style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
              Trophy <span style={{ color: '#fbbf24' }}>Room</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              {totalTrophies} predictions powered by ML + Gemini AI
            </p>
          </div>
        </div>

        {/* Trophy count pills */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {[
            { label: 'Global Awards', count: Object.keys(global_trophies).length, color: '#fbbf24' },
            ...leagues.map(l => ({ label: l.name, count: Object.keys(l.trophies || {}).length, color: '#22c55e' }))
          ].map((item, i) => (
            <span key={i} style={{
              padding: '0.3rem 0.9rem',
              borderRadius: '999px',
              background: `${item.color}15`,
              border: `1px solid ${item.color}30`,
              fontSize: '0.78rem',
              color: item.color,
              fontWeight: 600,
            }}>
              {item.label} · {item.count}
            </span>
          ))}
        </div>
      </div>

      {/* Global Trophies */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Crown size={18} style={{ color: '#fbbf24' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Global <span style={{ color: '#fbbf24' }}>Awards</span>
          </h2>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', marginLeft: '0.5rem' }} />
        </div>
        <div className="grid-5">
          {Object.entries(global_trophies).map(([key, val], i) => (
            <TrophyCard key={key} tkey={key} val={val} rank={i < 3 ? i : undefined} />
          ))}
        </div>
      </section>

      {/* Per-League Trophies */}
      {leagues.map((league, li) => (
        <section key={league.slug} style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>{leagueFlags[league.slug] || '⚽'}</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>{league.name}</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{league.country}</div>
            </div>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)', marginLeft: '0.5rem' }} />
          </div>
          <div className="grid-3">
            {Object.entries(league.trophies || {}).map(([key, val], i) => (
              <TrophyCard key={key} tkey={key} val={val} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
