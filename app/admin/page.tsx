'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSport, SPORTS } from '@/lib/utils'

interface Stats {
  totalTrips: number
  activeTrips: number
  tripsLast7Days: number
  tripsLast30Days: number
  totalRespondents: number
  avgRespondentsPerTrip: number
  sportBreakdown: { sport: string; count: number }[]
  recentTrips: { name: string; sport: string; created_at: string; respondent_count: number }[]
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)

  function login() {
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY
    if (password === adminKey) {
      setAuthed(true)
      setError('')
      loadStats()
    } else {
      setError('Incorrect password')
    }
  }

  async function loadStats() {
    setLoading(true)
    const now = new Date().toISOString()
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString()

    // All trips
    const { data: allTrips } = await supabase
      .from('trips')
      .select('id, name, sport, created_at, deleted_at, expires_at')

    // All respondents
    const { data: allRespondents } = await supabase
      .from('respondents')
      .select('id, trip_id')

    if (!allTrips) { setLoading(false); return }

    const activeTrips = allTrips.filter(t => !t.deleted_at && t.expires_at > now)
    const tripsLast7 = allTrips.filter(t => t.created_at > sevenDaysAgo)
    const tripsLast30 = allTrips.filter(t => t.created_at > thirtyDaysAgo)

    // Sport breakdown
    const sportBreakdown = SPORTS.map(sp => ({
      sport: sp.id,
      count: activeTrips.filter(t => t.sport === sp.id).length
    })).sort((a, b) => b.count - a.count)

    // Respondents per trip
    const respPerTrip: Record<string, number> = {}
    allRespondents?.forEach(r => {
      respPerTrip[r.trip_id] = (respPerTrip[r.trip_id] || 0) + 1
    })
    const avgRespondents = activeTrips.length
      ? Math.round((activeTrips.reduce((sum, t) => sum + (respPerTrip[t.id] || 0), 0) / activeTrips.length) * 10) / 10
      : 0

    // Recent trips with respondent counts
    const recentTrips = activeTrips
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10)
      .map(t => ({
        name: t.name,
        sport: t.sport,
        created_at: t.created_at,
        respondent_count: respPerTrip[t.id] || 0,
      }))

    setStats({
      totalTrips: allTrips.length,
      activeTrips: activeTrips.length,
      tripsLast7Days: tripsLast7.length,
      tripsLast30Days: tripsLast30.length,
      totalRespondents: allRespondents?.length || 0,
      avgRespondentsPerTrip: avgRespondents,
      sportBreakdown,
      recentTrips,
    })
    setLoading(false)
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card w-full max-w-sm">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">BetaPlan Admin</h1>
          <p className="text-sm text-gray-400 mb-5">Enter your password to continue</p>
          <input
            className="input mb-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <button onClick={login} className="btn-primary w-full py-2.5">Sign in</button>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">BetaPlan live stats</p>
        </div>
        <button onClick={loadStats} className="btn-secondary text-sm">
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {loading && !stats && (
        <div className="text-center py-20 text-gray-400">Loading stats...</div>
      )}

      {stats && (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Active trips', value: stats.activeTrips, color: '#1D9E75' },
              { label: 'Total trips ever', value: stats.totalTrips, color: '#185FA5' },
              { label: 'New this week', value: stats.tripsLast7Days, color: '#534AB7' },
              { label: 'New this month', value: stats.tripsLast30Days, color: '#854F0B' },
              { label: 'Total respondents', value: stats.totalRespondents, color: '#0F6E56' },
              { label: 'Avg per trip', value: stats.avgRespondentsPerTrip, color: '#4B5563' },
            ].map(m => (
              <div key={m.label} className="card text-center">
                <p className="text-3xl font-bold mb-1" style={{ color: m.color }}>{m.value}</p>
                <p className="text-xs text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Sport breakdown */}
          <div className="card mb-6">
            <p className="text-sm font-medium text-gray-700 mb-4">Active trips by sport</p>
            <div className="flex flex-col gap-3">
              {stats.sportBreakdown.map(s => {
                const sp = getSport(s.sport)
                const pct = stats.activeTrips ? Math.round((s.count / stats.activeTrips) * 100) : 0
                return (
                  <div key={s.sport} className="flex items-center gap-3">
                    <span className="text-lg w-7">{sp.icon}</span>
                    <span className="text-sm text-gray-600 w-20">{sp.label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sp.color }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{s.count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent trips */}
          <div className="card">
            <p className="text-sm font-medium text-gray-700 mb-4">Recent active trips</p>
            <div className="flex flex-col divide-y divide-gray-100">
              {stats.recentTrips.map((t, i) => {
                const sp = getSport(t.sport)
                const date = new Date(t.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <span className="text-base">{sp.icon}</span>
                    <span className="flex-1 text-sm text-gray-800 truncate">{t.name}</span>
                    <span className="text-xs text-gray-400">{t.respondent_count} people</span>
                    <span className="text-xs text-gray-300">{date}</span>
                  </div>
                )
              })}
              {stats.recentTrips.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No active trips yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
