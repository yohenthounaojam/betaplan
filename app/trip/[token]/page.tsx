'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Trip, Respondent, Availability, AvailStatus } from '@/lib/supabase'
import { getSport, getDays, fmtRange, fmtDay, collapseRanges, MONTHS, DOWS, getMondayOffset } from '@/lib/utils'

type AvailMap = Record<string, AvailStatus>
type AllAvail = Record<string, AvailMap>

export default function TripPage() {
  const params = useParams()
  const token = params.token as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [respondents, setRespondents] = useState<Respondent[]>([])
  const [allAvail, setAllAvail] = useState<AllAvail>({})
  const [myRespondentId, setMyRespondentId] = useState<string | null>(null)
  const [myName, setMyName] = useState<string | null>(null)
  const [tab, setTab] = useState<'my' | 'overview'>('my')
  const [myMonth, setMyMonth] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() })
  const [ovMonth, setOvMonth] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() })
  const [localAvail, setLocalAvail] = useState<AvailMap>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nameInput, setNameInput] = useState('')
  const [joiningAs, setJoiningAs] = useState(false)
  const [newRespInput, setNewRespInput] = useState('')
  const dragging = useRef(false)

  useEffect(() => {
    if (!token) return
    loadTrip()
  }, [token])

  async function loadTrip() {
    setLoading(true)
    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('invite_token', token)
      .single()

    if (!tripData) { setLoading(false); return }
    setTrip(tripData as Trip)

    const startM = new Date(tripData.start_date + 'T12:00:00')
    setMyMonth({ y: startM.getFullYear(), m: startM.getMonth() })
    setOvMonth({ y: startM.getFullYear(), m: startM.getMonth() })

    const { data: respData } = await supabase
      .from('respondents')
      .select('*')
      .eq('trip_id', tripData.id)
      .order('created_at')

    if (respData) setRespondents(respData as Respondent[])

    const { data: availData } = await supabase
      .from('availability')
      .select('*')
      .eq('trip_id', tripData.id)

    if (availData) {
      const map: AllAvail = {}
      ;(availData as Availability[]).forEach(a => {
        if (!map[a.respondent_id]) map[a.respondent_id] = {}
        map[a.respondent_id][a.date] = a.status
      })
      setAllAvail(map)
    }

    const savedId = localStorage.getItem(`betaplan_resp_${token}`)
    const savedName = localStorage.getItem(`betaplan_resp_name_${token}`)
    if (savedId && savedName) {
      setMyRespondentId(savedId)
      setMyName(savedName)
      const myAv: AvailMap = {}
      if (availData) {
        ;(availData as Availability[])
          .filter(a => a.respondent_id === savedId)
          .forEach(a => { myAv[a.date] = a.status })
      }
      setLocalAvail(myAv)
    }

    setLoading(false)
  }

  async function joinAs() {
    if (!nameInput.trim() || !trip) return
    setJoiningAs(true)
    const name = nameInput.trim()

    const existing = respondents.find(r => r.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      setMyRespondentId(existing.id)
      setMyName(existing.name)
      localStorage.setItem(`betaplan_resp_${token}`, existing.id)
      localStorage.setItem(`betaplan_resp_name_${token}`, existing.name)
      const myAv: AvailMap = {}
      Object.entries(allAvail[existing.id] || {}).forEach(([d, s]) => { myAv[d] = s })
      setLocalAvail(myAv)
      setJoiningAs(false)
      return
    }

    const { data: resp } = await supabase
      .from('respondents')
      .insert({ trip_id: trip.id, name })
      .select()
      .single()

    if (resp) {
      setRespondents(prev => [...prev, resp as Respondent])
      setMyRespondentId(resp.id)
      setMyName(resp.name)
      localStorage.setItem(`betaplan_resp_${token}`, resp.id)
      localStorage.setItem(`betaplan_resp_name_${token}`, resp.name)
      setLocalAvail({})
    }
    setJoiningAs(false)
  }

  async function addRespondent() {
    if (!newRespInput.trim() || !trip) return
    const name = newRespInput.trim()
    const existing = respondents.find(r => r.name.toLowerCase() === name.toLowerCase())
    if (existing) { setNewRespInput(''); return }
    const { data: resp } = await supabase
      .from('respondents')
      .insert({ trip_id: trip.id, name })
      .select()
      .single()
    if (resp) {
      setRespondents(prev => [...prev, resp as Respondent])
      setNewRespInput('')
    }
  }

  async function saveAvailability() {
    if (!myRespondentId || !trip) return
    setSaving(true)
    await supabase.from('availability').delete().eq('respondent_id', myRespondentId)
    const upserts = Object.entries(localAvail).map(([date, status]) => ({
      respondent_id: myRespondentId,
      trip_id: trip.id,
      date,
      status,
    }))
    if (upserts.length > 0) {
      await supabase.from('availability').insert(upserts)
    }
    setAllAvail(prev => ({ ...prev, [myRespondentId]: { ...localAvail } }))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function cycleDay(iso: string) {
    setLocalAvail(prev => {
      const next = { ...prev }
      const cur = next[iso] || 'busy'
      if (cur === 'busy') next[iso] = 'avail'
      else if (cur === 'avail') next[iso] = 'maybe'
      else delete next[iso]
      return next
    })
  }

  function endDrag() {
    dragging.current = false
  }

  function shiftMonth(dir: number, which: 'my' | 'ov') {
    const setter = which === 'my' ? setMyMonth : setOvMonth
    setter(prev => {
      let { y, m } = prev
      m += dir
      if (m > 11) { m = 0; y++ }
      if (m < 0) { m = 11; y-- }
      return { y, m }
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-20 text-gray-400">Loading...</div>
      </main>
    )
  }

  if (!trip) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-lg font-medium text-gray-700">Trip not found</p>
          <p className="text-sm text-gray-400 mt-1">This link may be invalid or expired</p>
        </div>
      </main>
    )
  }

  const sp = getSport(trip.sport)

  return (
    <main className="max-w-2xl mx-auto px-4 py-6" onMouseUp={endDrag}>
      {/* Header */}
      <div className="mb-1">
        <div className="flex items-center gap-2">
          <a href="/" className="text-gray-400 hover:text-gray-600 text-lg flex-shrink-0">←</a>
          <span className="text-xl flex-shrink-0">{sp.icon}</span>
          <h1 className="text-xl font-semibold text-gray-900 flex-1 min-w-0 truncate">{trip.name}</h1>
          <button
            onClick={copyLink}
            className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0 transition-all hidden sm:block"
            style={copied ? { background: '#1D9E75', color: 'white' } : {}}
          >
            {copied ? '✓ Copied!' : 'Share link'}
          </button>
        </div>
        {/* Share link on its own row for mobile */}
        <div className="flex items-center justify-between mt-1.5 ml-8">
          <p className="text-sm text-gray-400">{fmtRange(trip.start_date, trip.end_date)}</p>
          <button
            onClick={copyLink}
            className="btn-secondary text-xs px-3 py-1 sm:hidden transition-all"
            style={copied ? { background: '#1D9E75', color: 'white' } : {}}
          >
            {copied ? '✓ Copied!' : 'Share link'}
          </button>
        </div>
        <p className="text-xs text-gray-300 ml-8 mt-0.5">Active for 1 year</p>
      </div>
      <div className="mb-5"></div>

      {/* Join prompt */}
      {!myRespondentId && (
        <div className="card mb-5" style={{ background: sp.bg, borderColor: sp.color + '40' }}>
          <p className="text-sm font-medium text-gray-800 mb-3">Who are you?</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Enter your name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinAs()}
            />
            <button
              onClick={joinAs}
              disabled={joiningAs}
              className="btn-primary px-4"
              style={{ background: sp.color }}
            >
              {joiningAs ? '...' : 'Join'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5">
        {(['my', 'overview'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={tab === t ? { borderColor: sp.color, color: sp.color } : {}}
          >
            {t === 'my' ? 'My availability' : 'Overview'}
          </button>
        ))}
      </div>

      {/* MY AVAILABILITY TAB */}
      {tab === 'my' && (
        <div className="flex flex-col gap-5">
          {/* Mobile: stacked. Desktop: side by side */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* Calendar */}
            <div className="flex-1 min-w-0">
              <CalendarGrid
                month={myMonth}
                trip={trip}
                avail={localAvail}
                sportColor={sp.color}
                onShift={dir => shiftMonth(dir, 'my')}
                onCycleDay={cycleDay}
              />
              {/* Legend with tap hint */}
              <div className="mt-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-400">Tap to cycle:</span>
                  {[
                    { color: sp.color, label: 'Free' },
                    { color: '#EF9F27', label: 'Maybe' },
                    { color: '#f3f4f6', label: 'Busy', border: true },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded" style={{ background: l.color, border: l.border ? '1px solid #e5e7eb' : undefined }} />
                      <span className="text-xs text-gray-500">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:w-44 md:flex-shrink-0 md:border-l md:border-gray-100 md:pl-5 flex flex-row md:flex-col gap-4 md:gap-0">
              {myRespondentId ? (
                <>
                  <div className="flex-1 md:flex-none">
                    <p className="text-xs text-gray-400 mb-0.5">Responding as</p>
                    <p className="text-sm font-semibold text-gray-900 md:mb-4">{myName}</p>
                  </div>

                  {/* Stats - hidden on mobile to save space */}
                  <div className="hidden md:flex gap-2 mb-4">
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xl font-semibold" style={{ color: sp.color }}>
                        {countInMonth(localAvail, myMonth, trip, 'avail')}
                      </p>
                      <p className="text-xs text-gray-400">free</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xl font-semibold text-amber-500">
                        {countInMonth(localAvail, myMonth, trip, 'maybe')}
                      </p>
                      <p className="text-xs text-gray-400">maybe</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 md:w-full">
                    <button
                      onClick={saveAvailability}
                      disabled={saving}
                      className="w-full btn-primary py-2 text-sm disabled:opacity-50"
                      style={{ background: sp.color }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    {saved && <p className="text-xs text-green-600 mt-1.5 text-center">✓ Saved</p>}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400">Enter your name above to mark your availability</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Heatmap */}
            <div className="flex-1 min-w-0">
              <HeatmapGrid
                month={ovMonth}
                trip={trip}
                respondents={respondents}
                allAvail={allAvail}
                sport={sp}
                onShift={dir => shiftMonth(dir, 'ov')}
                onDayClick={iso => setSelectedDay(iso)}
              />
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-400">Fewer</span>
                <div className="flex gap-1">
                  {['#f3f4f6', ...sp.heat].map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded" style={{ background: c, border: '0.5px solid #e5e7eb' }} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">More</span>
              </div>
            </div>

            {/* Sidebar */}
            <div className="md:w-44 md:flex-shrink-0 md:border-l md:border-gray-100 md:pl-5">
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Best days</p>
                <BestDays month={ovMonth} trip={trip} respondents={respondents} allAvail={allAvail} sport={sp} />
              </div>

              <p className="text-xs font-medium text-gray-700 mb-2">Responses ({respondents.length})</p>
              <div className="flex flex-col gap-2 mb-4">
                {respondents.map((r, i) => {
                  const days = getDays(trip.start_date, trip.end_date)
                  const av = allAvail[r.id] || {}
                  const freeCount = days.filter(d => av[d] === 'avail').length
                  const pct = days.length ? Math.round((freeCount / days.length) * 100) : 0
                  const initials = r.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  const colors = ['#E6F1FB', '#EEEDFE', '#E1F5EE', '#FAEEDA', '#FAECE7']
                  const fgColors = ['#0C447C', '#3C3489', '#085041', '#633806', '#712B13']
                  const ci = i % 5
                  return (
                    <div key={r.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ background: colors[ci], color: fgColors[ci] }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs text-gray-700 truncate">{r.name}</span>
                          <span className="text-xs text-gray-400 ml-1">{freeCount}d</span>
                        </div>
                        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sp.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1.5">Add person</p>
                <div className="flex gap-1">
                  <input
                    className="input text-xs py-1 px-2 flex-1"
                    placeholder="Name"
                    value={newRespInput}
                    onChange={e => setNewRespInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addRespondent()}
                  />
                  <button onClick={addRespondent} className="btn-secondary text-xs px-2 py-1">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day detail modal */}
      {selectedDay && trip && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-900">{fmtDay(selectedDay)}</p>
              <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {(['avail', 'maybe', 'busy'] as const).map(status => {
              const group = respondents.filter(r => {
                const v = allAvail[r.id]?.[selectedDay] || 'busy'
                return v === status
              })
              if (!group.length) return null
              const label = status === 'avail' ? '✓ Free' : status === 'maybe' ? '~ Maybe' : '✗ Busy'
              const color = status === 'avail' ? sp.color : status === 'maybe' ? '#EF9F27' : '#9ca3af'
              const bg = status === 'avail' ? sp.bg : status === 'maybe' ? '#FAEEDA' : '#f3f4f6'
              const fg = status === 'avail' ? sp.fg : status === 'maybe' ? '#633806' : '#6b7280'
              return (
                <div key={status} className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <p className="text-xs font-medium" style={{ color }}>{label}</p>
                    <span className="text-xs text-gray-400">({group.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.map((r) => {
                      const initials = r.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                      return (
                        <div key={r.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: bg, color: fg }}>
                          <span>{initials}</span>
                          <span>{r.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}

// ── Calendar grid ─────────────────────────────────────────────────────────────

function CalendarGrid({
  month, trip, avail, sportColor, onShift, onCycleDay
}: {
  month: { y: number; m: number }
  trip: Trip
  avail: AvailMap
  sportColor: string
  onShift: (dir: number) => void
  onCycleDay: (iso: string) => void
}) {
  const { y, m } = month
  const tripDays = new Set(getDays(trip.start_date, trip.end_date))
  const firstDow = getMondayOffset(y, m)
  const dim = new Date(y, m + 1, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => onShift(-1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">‹</button>
        <span className="text-sm font-medium text-gray-900 w-28 text-center">{MONTHS[m]} {y}</span>
        <button onClick={() => onShift(1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1" style={{ maxWidth: 320 }}>
        {DOWS.map(d => <div key={d} className="text-center text-xs text-gray-400 pb-1">{d}</div>)}
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: dim }).map((_, i) => {
          const d = i + 1
          const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const inTrip = tripDays.has(iso)
          const v = avail[iso] || 'busy'
          const isToday = iso === today

          let bg = '#f3f4f6', color = '#9ca3af', border = '1px solid #e5e7eb'
          if (inTrip) {
            if (v === 'avail') { bg = sportColor; color = '#fff'; border = 'none' }
            else if (v === 'maybe') { bg = '#EF9F27'; color = '#412402'; border = 'none' }
            else { bg = '#f3f4f6'; color = '#6b7280'; border = '1px solid #e5e7eb' }
          }

          return (
            <div
              key={iso}
              className="rounded-md flex items-center justify-center text-xs font-medium select-none"
              style={{
                aspectRatio: '1',
                background: bg,
                color: inTrip ? color : '#d1d5db',
                border,
                cursor: inTrip ? 'pointer' : 'default',
                outline: isToday ? `2px solid ${sportColor}` : undefined,
                outlineOffset: isToday ? '-2px' : undefined,
                opacity: inTrip ? 1 : 0.3,
              }}
              onClick={inTrip ? () => onCycleDay(iso) : undefined}
            >
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Heatmap grid ──────────────────────────────────────────────────────────────

function HeatmapGrid({
  month, trip, respondents, allAvail, sport, onShift, onDayClick
}: {
  month: { y: number; m: number }
  trip: Trip
  respondents: Respondent[]
  allAvail: AllAvail
  sport: ReturnType<typeof getSport>
  onShift: (dir: number) => void
  onDayClick: (iso: string) => void
}) {
  const { y, m } = month
  const tripDays = new Set(getDays(trip.start_date, trip.end_date))
  const firstDow = getMondayOffset(y, m)
  const dim = new Date(y, m + 1, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)
  const total = respondents.length || 1
  const activeRespondents = respondents.filter(r => Object.keys(allAvail[r.id] || {}).length > 0)
  const activeTotal = activeRespondents.length || 1
  const heat = ['#f3f4f6', ...sport.heat]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => onShift(-1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">‹</button>
        <span className="text-sm font-medium text-gray-900 w-28 text-center">{MONTHS[m]} {y}</span>
        <button onClick={() => onShift(1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1" style={{ maxWidth: 320 }}>
        {DOWS.map(d => <div key={d} className="text-center text-xs text-gray-400 pb-1">{d}</div>)}
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: dim }).map((_, i) => {
          const d = i + 1
          const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const inTrip = tripDays.has(iso)
          const count = activeRespondents.filter(r => allAvail[r.id]?.[iso] === 'avail').length
          const bucket = inTrip ? Math.round((count / activeTotal) * 4) : 0
          const bg = inTrip ? heat[bucket] : 'transparent'
          const textColor = bucket >= 3 ? sport.fg : bucket >= 1 ? sport.fg : '#9ca3af'
          const isToday = iso === today

          return (
            <div
              key={iso}
              title={inTrip ? `${count}/${activeTotal} free` : undefined}
              className="rounded-md flex items-center justify-center text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                aspectRatio: '1',
                background: bg,
                color: inTrip ? textColor : '#d1d5db',
                border: inTrip ? '0.5px solid #e5e7eb' : 'none',
                opacity: inTrip ? 1 : 0.3,
                outline: isToday ? `2px solid ${sport.color}` : undefined,
                outlineOffset: isToday ? '-2px' : undefined,
              }}
              onClick={inTrip ? () => onDayClick(iso) : undefined}
            >
              {inTrip ? d : <span className="text-gray-200">{d}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Best days ─────────────────────────────────────────────────────────────────

function BestDays({
  month, trip, respondents, allAvail, sport
}: {
  month: { y: number; m: number }
  trip: Trip
  respondents: Respondent[]
  allAvail: AllAvail
  sport: ReturnType<typeof getSport>
}) {
  const { y, m } = month
  const tripDays = getDays(trip.start_date, trip.end_date)

  // Only count respondents who have filled in at least one day
  const activeRespondents = respondents.filter(r => {
    const av = allAvail[r.id] || {}
    return Object.keys(av).length > 0
  })

  const total = activeRespondents.length
  if (total === 0) return <p className="text-xs text-gray-400">No responses yet</p>

  const best = tripDays.filter(iso => {
    const iy = +iso.slice(0, 4), im = +iso.slice(5, 7) - 1
    if (iy !== y || im !== m) return false
    const count = activeRespondents.filter(r => allAvail[r.id]?.[iso] === 'avail').length
    return count === total
  })

  if (!best.length) return <p className="text-xs text-gray-400">No days where everyone is free yet</p>

  return (
    <div className="flex flex-wrap gap-1">
      {collapseRanges(best).slice(0, 4).map(r => (
        <span key={r} className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: sport.bg, color: sport.fg }}>
          {r}
        </span>
      ))}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countInMonth(avail: AvailMap, month: { y: number; m: number }, trip: Trip, status: AvailStatus): number {
  const tripDays = new Set(getDays(trip.start_date, trip.end_date))
  return Object.entries(avail).filter(([iso, s]) => {
    if (s !== status) return false
    if (!tripDays.has(iso)) return false
    const iy = +iso.slice(0, 4), im = +iso.slice(5, 7) - 1
    return iy === month.y && im === month.m
  }).length
}
