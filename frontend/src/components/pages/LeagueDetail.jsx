import { useParams, Link } from 'react-router-dom'
import useFetch from '../../hooks/useFetch'
import { getLeague, getLeaguePredictions, getLeagueTopScorers } from '../../services/api'

export default function LeagueDetail() {
  const { slug } = useParams()
  const { data: leagueData, loading: l1 } = useFetch(() => getLeague(slug), [slug])
  const { data: predictions, loading: l2 } = useFetch(() => getLeaguePredictions(slug), [slug])
  const { data: scorers, loading: l3 } = useFetch(() => getLeagueTopScorers(slug), [slug])

  if (l1 || l2) return <div className="loader"><div className="spinner" /></div>

  const league = leagueData?.league || {}
  const standings = leagueData?.standings || []
  const champion = predictions?.champion
  const topScorer = predictions?.top_scorer || scorers
  const topAssists = predictions?.top_assists

  return (
    <div>
      <div style={{ marginBottom: '0.5rem' }}>
        <Link to="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="section-title" style={{ fontSize: '2rem' }}>
        {league.name || slug}
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
          {league.country}
        </span>
      </h1>

      {/* Predictions Summary */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="prediction-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            🏆 Predicted Champion
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {champion?.data?.top4?.[0]?.team || champion?.data?.winner || '—'}
          </div>
          {champion?.confidence && (
            <div className="confidence-bar" style={{ marginTop: '0.75rem' }}>
              <div className="confidence-fill" style={{ width: `${(champion.confidence * 100)}%` }} />
            </div>
          )}
          {champion?.model_accuracy && (
            <div style={{ marginTop: '0.5rem' }}>
              <span className="badge badge-green">
                Model: {(champion.model_accuracy * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="prediction-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            🥇 Top Scorer
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {topScorer?.data?.name || topScorer?.data?.player || topScorer?.name || '—'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {topScorer?.data?.goals || topScorer?.goals || ''} {topScorer?.data?.goals ? 'goals' : ''}
          </div>
        </div>
        <div className="prediction-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            🎯 Top Assists
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {topAssists?.data?.name || topAssists?.data?.player || '—'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {topAssists?.data?.assists || ''} {topAssists?.data?.assists ? 'assists' : ''}
          </div>
        </div>
      </div>

      {/* Top 4 Predictions */}
      {champion?.data?.top4 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="section-title"><span className="icon">📊</span> Predicted Top 4</h2>
          <div className="grid-2">
            {champion.data.top4.map((item, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: i === 0 ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text-secondary)',
                  border: `2px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.team}</div>
                  {item.probability && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(item.probability * 100).toFixed(1)}% probability
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standings Table */}
      {standings.length > 0 && (
        <div>
          <h2 className="section-title"><span className="icon">📋</span> Current Standings</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>GF</th>
                  <th>GA</th>
                  <th>GD</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={i} style={i < 4 ? { borderLeft: '3px solid var(--accent)' } : {}}>
                    <td style={{ fontWeight: 600 }}>{s.position}</td>
                    <td style={{ fontWeight: 600 }}>{s.team}</td>
                    <td>{s.played}</td>
                    <td>{s.won}</td>
                    <td>{s.drawn}</td>
                    <td>{s.lost}</td>
                    <td>{s.goals_for}</td>
                    <td>{s.goals_against}</td>
                    <td style={{ color: s.goal_difference > 0 ? 'var(--accent)' : s.goal_difference < 0 ? 'var(--red)' : 'inherit' }}>
                      {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
