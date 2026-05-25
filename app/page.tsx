'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Trip } from '@/lib/supabase'
import { getSport, fmtRange } from '@/lib/utils'
import Link from 'next/link'
import { LogoIcon } from '@/components/Logo'

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [undoTrip, setUndoTrip] = useState<Trip | null>(null)
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => { loadTrips() }, [])

  async function loadTrips() {
    const stored = localStorage.getItem('betaplan_trips')
    if (!stored) return
    const ids: string[] = JSON.parse(stored)
    if (!ids.length) return
    const { data } = await supabase
      .from('trips').select('*').in('id', ids)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (data) setTrips(data as Trip[])
  }

  async function softDelete(trip: Trip) {
    setConfirmId(null)
    await supabase.from('trips')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', trip.id)
    setTrips(prev => prev.filter(t => t.id !== trip.id))
    setUndoTrip(trip)
    if (undoTimer) clearTimeout(undoTimer)
    const timer = setTimeout(() => setUndoTrip(null), 7000)
    setUndoTimer(timer)
  }

  async function undoDelete(trip: Trip) {
    await supabase.from('trips').update({ deleted_at: null }).eq('id', trip.id)
    if (undoTimer) clearTimeout(undoTimer)
    setUndoTrip(null)
    loadTrips()
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      {/* Confirm delete modal */}
      {confirmId && (() => {
        const trip = trips.find(t => t.id === confirmId)!
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="card w-full max-w-sm">
              <p className="text-base font-semibold text-gray-900 mb-1">Delete this outing?</p>
              <p className="text-sm text-gray-500 mb-5">"{trip.name}" will be removed. You'll have 7 seconds to undo.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmId(null)} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={() => softDelete(trip)}
                  className="flex-1 btn py-2 text-sm font-medium bg-red-500 text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <LogoIcon size={36} />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">BetaPlan</h1>
            <p className="text-xs text-gray-500">Find dates your whole crew can do</p>
          </div>
        </div>
        <Link href="/create" className="btn-primary">+ New BetaPlan</Link>
      </div>

      {/* Undo toast */}
      {undoTrip && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl text-sm">
          <span className="truncate">"{undoTrip.name}" deleted</span>
          <button
            onClick={() => undoDelete(undoTrip)}
            className="font-semibold text-brand-400 hover:text-brand-300 flex-shrink-0"
            style={{ color: '#5DCAA5' }}
          >
            Undo
          </button>
        </div>
      )}

      {/* Trip list */}
      {trips.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Your outings</p>
          <div className="flex flex-col gap-3">
            {trips.map(trip => {
              const sp = getSport(trip.sport)
              return (
                <div key={trip.id} className="card flex items-center gap-3 hover:border-gray-300 transition-colors">
                  <Link href={`/trip/${trip.invite_token}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ background: sp.bg }}>
                      {sp.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{trip.name}</p>
                      <p className="text-sm text-gray-500">{fmtRange(trip.start_date, trip.end_date)}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{ background: sp.bg, color: sp.fg }}>
                      {sp.label}
                    </span>
                  </Link>
                  <button
                    onClick={() => setConfirmId(trip.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-xl leading-none px-1"
                    title="Delete outing"
                    aria-label="Delete outing"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {trips.length === 0 && !undoTrip && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏔️</div>
          <p className="text-lg font-medium text-gray-700 mb-1">Plan your first outing</p>
          <p className="text-sm text-gray-400 mb-6">Create a trip, share the link, find dates that work for everyone</p>
          <Link href="/create" className="btn-primary">Create outing</Link>
        </div>
      )}

      {/* How it works */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">How it works</p>
        <div className="flex flex-col gap-4">
          {[
            { n: '1', title: 'Create an outing', desc: 'Pick your sport, dates, and name' },
            { n: '2', title: 'Share the link', desc: 'Send to your crew — no login needed' },
            { n: '3', title: 'Find the best dates', desc: 'See instantly when everyone is free' },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#1D9E75' }}>
                {step.n}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{step.title}</p>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
