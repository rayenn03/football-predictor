import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Cell } from 'recharts'
import axios from 'axios'
import { TrendingUp, Zap, Award, BarChart3, Lightbulb } from 'lucide-react'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
const leagueFlags = { 'premier-league': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'la-liga': '🇪🇸', 'serie-a': '🇮🇹', 'bundesliga': '🇩🇪', 'ligue-1': '🇫🇷' }

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get('/api/analytics')
      .then(res => setData(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader"><div className="spinner" /></div>
  if (error) return <div className="error-box">Error: {error}</div>

  const { leagues = [], insights = {}, scorer_ranking = [] } = data || {}

  const radarData = leagues.map(l => ({
    league: l.league.name.split(' ')[0],
    Accuracy: +((l.model_accuracy || 0) * 100).toFixed(1),
    Competitiveness: +(l.competitiveness || 0).toFixed(1),
    Confidence: +((l.champion_probability || 0) * 100).toFixed(1),
  }))

  const compData = leagues
    .map(l => ({ name: l.league.name.split(' ')[0], competitiveness: +(l.competitiveness || 0).toFixed(1) }))
    .sort((a, b) => b.competitiveness - a.competitiveness)

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={26} style={{ color: 'var(--accent)' }} />
          Cross-League <span style={{ color: 'var(--accent)', marginLeft: '0.4rem' }}>Analytics</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Comparing predictions, competitiveness, and model performance across all 5 leagues</p>
      </div>

      {/* Insight cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Most Competitive', icon: <Zap size={16} />, color: 'var(--accent)', border: 'var(--accent)', bg: 'rgba(34,197,94,0.05)', value: (leagueFlags[insights.most_competitive_league?.slug] || '') + ' ' + (insights.most_competitive_league?.name || '—'), sub: 'Tightest title race' },
          { label: 'Most Dominant', icon: <Award size={16} />, color: 'var(--gold)', border: 'var(--gold)', bg: 'rgba(251,191,36,0.05)', value: (leagueFlags[insights.most_dominant_league?.slug] || '') + ' ' + (insights.most_dominant_league?.name || '—'), sub: 'Biggest gap #1 vs #2' },
          { label: 'Avg Model Accuracy', icon: <TrendingUp size={16} />, color: 'var(--blue)', border: 'var(--blue)', bg: 'rgba(59,130,246,0.05)', value: ((insights.avg_model_accuracy || 0) * 100).toFixed(1) + '%', sub: 'Across ' + (insights.total_predictions || 23) + ' predictions' },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: '1.5rem', borderTop: '3px solid ' + c.border, background: 'linear-gradient(135deg, var(--bg-card), ' + c.bg + ')' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: c.color }}>
              {c.icon}
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{c.label}</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{c.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>League Profile Radar</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="league" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
              <Radar name="Accuracy %" dataKey="Accuracy" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
              <Radar name="Competitiveness" dataKey="Competitiveness" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
              <Radar name="Champion Conf." dataKey="Confidence" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Title Race Competitiveness</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={compData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip formatter={v => [v + '%', 'Competitiveness']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Bar dataKey="competitiveness" radius={[6, 6, 0, 0]}>
                {compData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Golden Boot Race */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>👟 European Golden Boot Race</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {scorer_ranking.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', background: i === 0 ? 'rgba(251,191,36,0.07)' : 'var(--bg-secondary)', border: '1px solid ' + (i === 0 ? 'rgba(251,191,36,0.2)' : 'var(--border)') }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', background: i === 0 ? 'var(--gold)' : i === 1 ? 'var(--silver)' : i === 2 ? 'var(--bronze)' : 'var(--border)', color: i < 3 ? '#000' : 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{s.player}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.team} · {s.league}</div>
              </div>
              <div style={{ minWidth: '140px' }}>
                <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: ((s.goals / (scorer_ranking[0]?.goals || 1)) * 100) + '%', background: COLORS[i % COLORS.length], borderRadius: '3px' }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, marginTop: '0.2rem', color: COLORS[i % COLORS.length] }}>{s.goals} goals</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="card" style={{ padding: '1.5rem', borderTop: '2px solid #8b5cf6', background: 'linear-gradient(135deg, var(--bg-card), rgba(139,92,246,0.04))' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lightbulb size={16} style={{ color: '#8b5cf6' }} /> AI Insights per League
        </h3>
        <div className="grid-2">
          {leagues.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '1.4rem' }}>{leagueFlags[l.league.slug]}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{l.league.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {l.champion ? l.champion + ' predicted champion. ' : ''}
                  {l.competitiveness > 70 ? 'Highly competitive title race!' : l.competitiveness > 40 ? 'Moderate competition expected.' : 'One team dominates this season.'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
