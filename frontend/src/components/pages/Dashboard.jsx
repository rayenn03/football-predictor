import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import useFetch from '../../hooks/useFetch'
import { getDashboard } from '../../services/api'
import { Trophy, TrendingUp, Target, Award, ArrowRight } from 'lucide-react'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

const leagueFlags = {
  'premier-league': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'la-liga': '🇪🇸',
  'serie-a': '🇮🇹',
  'bundesliga': '🇩🇪',
  'ligue-1': '🇫🇷',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: '0.85rem' }}>
          {p.name}: {typeof p.value === 'number' ? (p.value <= 1 ? (p.value * 100).toFixed(1) + '%' : p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data, loading, error } = useFetch(getDashboard)

  if (loading) return <div className="loader"><div className="spinner" /></div>
  if (error) return <div className="error-box">Error: {error}</div>

  const { leagues = [], total_predictions } = data || {}

  const accuracyData = leagues.map((item, i) => ({
    name: item.league.name.replace(' League', '').replace('Ligue 1', 'Ligue\u00A01'),
    accuracy: item.model_accuracy || 0,
    color: COLORS[i],
  }))

  const scorerData = leagues.map((item, i) => ({
    player: item.top_scorer?.player || '—',
    league: item.league.name.split(' ')[0],
    goals: item.top_scorer?.goals || 0,
    color: COLORS[i],
  })).sort((a, b) => b.goals - a.goals)

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Predictions <span style={{ color: 'var(--accent)' }}>Dashboard</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>ML-powered predictions for the 2024/25 season</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: <Trophy size={20} />, value: total_predictions || 23, label: 'Total Predictions', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { icon: <TrendingUp size={20} />, value: `${((Math.max(...leagues.map(l => l.model_accuracy || 0))) * 100).toFixed(0)}%`, label: 'Best Accuracy', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { icon: <Target size={20} />, value: '5', label: 'Leagues Covered', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { icon: <Award size={20} />, value: '2', label: 'ML Models', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} /> Model Accuracy by League
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `${(v*100).toFixed(0)}%`} domain={[0,1]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="accuracy" name="Accuracy" radius={[6,6,0,0]}>
                {accuracyData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={16} style={{ color: 'var(--gold)' }} /> Top Scorers Comparison
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scorerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis type="category" dataKey="player" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={115} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ fontWeight: 600 }}>{d.player}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.league}</p>
                  <p style={{ color: 'var(--gold)', fontWeight: 700 }}>{d.goals} goals</p>
                </div>
              }} />
              <Bar dataKey="goals" name="Goals" radius={[0,6,6,0]}>
                {scorerData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Champions grid */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Trophy size={18} style={{ color: 'var(--accent)' }} /> Predicted Champions
      </h2>
      <div className="grid-5" style={{ marginBottom: '2rem' }}>
        {leagues.map((item, i) => (
          <Link key={item.league.slug} to={`/leagues/${item.league.slug}`} style={{ textDecoration: 'none' }}>
            <div
              className="prediction-card"
              style={{ textAlign: 'center', cursor: 'pointer', borderLeft: `3px solid ${COLORS[i]}`, transition: 'all 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{leagueFlags[item.league.slug] || '⚽'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{item.league.name}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                {item.champion?.winner || item.champion?.top4?.[0]?.team || '—'}
              </div>
              {item.model_accuracy && (
                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>{(item.model_accuracy * 100).toFixed(1)}%</span>
              )}
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.75rem' }}>
                Details <ArrowRight size={12} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Scorers & Assists */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>🥇 Top Scorers</h3>
          {leagues.map((item, i) => (
            <div key={item.league.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < leagues.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{leagueFlags[item.league.slug]}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.top_scorer?.player || '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.top_scorer?.team || ''}</div>
                </div>
              </div>
              <span className="badge badge-gold" style={{ fontSize: '0.78rem' }}>{item.top_scorer?.goals || '?'} goals</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>🎯 Top Assists</h3>
          {leagues.map((item, i) => (
            <div key={item.league.slug} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < leagues.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{leagueFlags[item.league.slug]}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.top_assists?.player || '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.top_assists?.team || ''}</div>
                </div>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '0.78rem' }}>{item.top_assists?.assists || '?'} assists</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
