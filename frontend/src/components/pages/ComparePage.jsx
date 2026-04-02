import { useState, useEffect } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import { ArrowLeftRight, Trophy, Target, TrendingUp, Shield } from 'lucide-react'

const LEAGUES = [
  { slug: 'premier-league', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'la-liga', name: 'La Liga', flag: '🇪🇸' },
  { slug: 'serie-a', name: 'Serie A', flag: '🇮🇹' },
  { slug: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪' },
  { slug: 'ligue-1', name: 'Ligue 1', flag: '🇫🇷' },
]

function StatRow({ icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{icon} {label}</span>
      <span style={{ fontWeight: 700, color: color || 'var(--text-primary)', fontSize: '0.9rem' }}>{value}</span>
    </div>
  )
}

export default function ComparePage() {
  const [slug1, setSlug1] = useState('premier-league')
  const [slug2, setSlug2] = useState('la-liga')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (slug1 === slug2) return
    setLoading(true)
    axios.get('/api/compare/' + slug1 + '/' + slug2)
      .then(res => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [slug1, slug2])

  const flag1 = LEAGUES.find(l => l.slug === slug1)?.flag || ''
  const flag2 = LEAGUES.find(l => l.slug === slug2)?.flag || ''
  const ld1 = data?.league1 || {}
  const ld2 = data?.league2 || {}

  const radarData = [
    { metric: 'Accuracy', v1: +((ld1.model_accuracy || 0) * 100).toFixed(1), v2: +((ld2.model_accuracy || 0) * 100).toFixed(1) },
    { metric: 'Confidence', v1: +((ld1.champion_confidence || 0) * 100).toFixed(1), v2: +((ld2.champion_confidence || 0) * 100).toFixed(1) },
    { metric: 'Competitive', v1: +(ld1.competitiveness || 0).toFixed(1), v2: +(ld2.competitiveness || 0).toFixed(1) },
    { metric: 'Trophies', v1: (ld1.trophy_count || 0) * 25, v2: (ld2.trophy_count || 0) * 25 },
    { metric: 'Teams', v1: (ld1.league?.teams_count || 20) * 5, v2: (ld2.league?.teams_count || 20) * 5 },
  ]

  const selStyle = { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', outline: 'none', width: '100%' }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeftRight size={26} style={{ color: 'var(--accent)' }} />
          League <span style={{ color: 'var(--accent)', marginLeft: '0.4rem' }}>Comparison</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Compare predictions and performance between any two leagues</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', maxWidth: '700px' }}>
        <div style={{ flex: 1 }}>
          <select value={slug1} onChange={e => setSlug1(e.target.value)} style={selStyle}>
            {LEAGUES.map(l => <option key={l.slug} value={l.slug} disabled={l.slug === slug2}>{l.flag} {l.name}</option>)}
          </select>
        </div>
        <button onClick={() => { const tmp = slug1; setSlug1(slug2); setSlug2(tmp) }} className="btn btn-outline" style={{ padding: '0.75rem', flexShrink: 0 }}>
          <ArrowLeftRight size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <select value={slug2} onChange={e => setSlug2(e.target.value)} style={selStyle}>
            {LEAGUES.map(l => <option key={l.slug} value={l.slug} disabled={l.slug === slug1}>{l.flag} {l.name}</option>)}
          </select>
        </div>
      </div>

      {slug1 === slug2 && <div className="error-box">Please select two different leagues.</div>}
      {loading && <div className="loader"><div className="spinner" /></div>}

      {data && slug1 !== slug2 && (
        <>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Head-to-Head Profile</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                <Radar name={ld1.league?.name || slug1} dataKey="v1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                <Radar name={ld2.league?.name || slug2} dataKey="v2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid-2">
            {[{ ld: ld1, color: '#22c55e', flag: flag1 }, { ld: ld2, color: '#3b82f6', flag: flag2 }].map(({ ld, color, flag }, idx) => (
              <div key={idx} className="card" style={{ borderTop: '3px solid ' + color, padding: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>{flag}</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.5rem' }}>{ld.league?.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ld.league?.country} · {ld.league?.teams_count} teams</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <StatRow icon={<Trophy size={13} />} label="Champion" value={ld.champion || '—'} />
                  <StatRow icon={<TrendingUp size={13} />} label="Model Accuracy" value={((ld.model_accuracy || 0) * 100).toFixed(1) + '%'} color={color} />
                  <StatRow icon={<Shield size={13} />} label="Competitiveness" value={(ld.competitiveness || 0).toFixed(0) + '%'} />
                  <StatRow icon={<Target size={13} />} label="Top Scorer" value={(ld.top_scorer?.player || '—') + ' (' + (ld.top_scorer?.goals || '?') + 'g)'} />
                </div>
                {ld.top4?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.04em' }}>PREDICTED TOP 4</div>
                    {ld.top4.map((team, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, background: i === 0 ? color : 'var(--border)', color: i === 0 ? '#000' : 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</span>
                          <span style={{ fontSize: '0.9rem' }}>{team.team}</span>
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{((team.probability || 0) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
