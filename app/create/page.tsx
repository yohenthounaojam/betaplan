'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SPORTS } from '@/lib/utils'
import Link from 'next/link'

export default function CreatePage() {
  const router = useRouter()
  const [sport, setSport] = useState('climbing')
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [creator, setCreator] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const twoWeeks = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)

  async function handleCreate() {
    setError('')
    if (!name || !start || !end || !creator) {
      setError('Please fill in all fields')
      return
    }
    if (start > end) {
      setError('End date must be after start date')
      return
    }
    setLoading(true)
    try {
      // Create trip
      const { data: trip, error: tripErr } = await supabase
        .from('trips')
        .insert({ name, sport, start_date: start, end_date: end, creator_name: creator })
        .select()
        .single()

      if (tripErr || !trip) throw tripErr

      // Create creator as first respondent
      const { data: resp, error: respErr } = await supabase
        .from('respondents')
        .insert({ trip_id: trip.id, name: creator })
        .select()
        .single()

      if (respErr || !resp) throw respErr

      // Save trip ID to localStorage so creator can see their trips
      const stored = JSON.parse(localStorage.getItem('betaplan_trips') || '[]')
      stored.unshift(trip.id)
      localStorage.setItem('betaplan_trips', JSON.stringify(stored.slice(0, 20)))

      // Save respondent ID so creator is pre-selected
      localStorage.setItem(`betaplan_resp_${trip.invite_token}`, resp.id)
      localStorage.setItem(`betaplan_resp_name_${trip.invite_token}`, creator)

      router.push(`/trip/${trip.invite_token}`)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="btn-ghost px-2">←</Link>
        <h1 className="text-xl font-semibold text-gray-900">New outing</h1>
      </div>

      <div className="card flex flex-col gap-5">
        {/* Sport selector */}
        <div>
          <label className="text-sm text-gray-500 block mb-2">Sport</label>
          <div className="grid grid-cols-5 gap-2">
            {SPORTS.map(sp => (
              <button
                key={sp.id}
                onClick={() => setSport(sp.id)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs transition-all"
                style={sport === sp.id
                  ? { borderColor: sp.color, borderWidth: 2, background: sp.bg, color: sp.fg, fontWeight: 500 }
                  : { borderColor: '#e5e7eb', background: 'white', color: '#6b7280' }
                }
              >
                <span className="text-xl">{sp.icon}</span>
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-sm text-gray-500 block mb-1.5">Outing name</label>
          <input
            className="input"
            placeholder={`e.g. ${getSportPlaceholder(sport)}`}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500 block mb-1.5">Start date</label>
            <input
              className="input"
              type="date"
              min={today}
              defaultValue={today}
              onChange={e => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1.5">End date</label>
            <input
              className="input"
              type="date"
              min={today}
              defaultValue={twoWeeks}
              onChange={e => setEnd(e.target.value)}
            />
          </div>
        </div>

        {/* Creator name */}
        <div>
          <label className="text-sm text-gray-500 block mb-1.5">Your name</label>
          <input
            className="input"
            placeholder="Your name"
            value={creator}
            onChange={e => setCreator(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn-primary w-full py-3 text-base disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create outing'}
        </button>
      </div>
    </main>
  )
}

function getSportPlaceholder(sport: string): string {
  const map: Record<string, string> = {
    climbing: 'Squamish climbing weekend',
    golf: 'Whistler Golf Club round',
    skiing: 'Big White ski trip',
    surfing: 'Tofino surf weekend',
    cycling: 'Whistler mountain bike trip',
  }
  return map[sport] ?? 'Weekend outing'
}
