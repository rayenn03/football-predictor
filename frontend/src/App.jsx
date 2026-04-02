import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LandingPage from './components/pages/LandingPage'
import Dashboard from './components/pages/Dashboard'
import LeagueDetail from './components/pages/LeagueDetail'
import UCLPage from './components/pages/UCLPage'
import TrophiesPage from './components/pages/TrophiesPage'
import AnalyticsPage from './components/pages/AnalyticsPage'
import ComparePage from './components/pages/ComparePage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leagues/:slug" element={<LeagueDetail />} />
        <Route path="/champions-league" element={<UCLPage />} />
        <Route path="/trophies" element={<TrophiesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Route>
    </Routes>
  )
}

export default App
