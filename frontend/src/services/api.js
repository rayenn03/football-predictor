import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Accept': 'application/json' }
})

export const getDashboard = () => api.get('/dashboard')
export const getLeagues = () => api.get('/leagues')
export const getLeague = (slug) => api.get(`/leagues/${slug}`)
export const getLeaguePredictions = (slug) => api.get(`/leagues/${slug}/predictions`)
export const getLeagueTopScorers = (slug) => api.get(`/leagues/${slug}/top-scorers`)
export const getChampionsLeague = () => api.get('/champions-league')
export const getTrophies = () => api.get('/trophies')

export default api
