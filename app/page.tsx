'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Trip } from '@/lib/supabase'
import { getSport, fmtRange } from '@/lib/utils'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('betaplan_trips')
    if (!stored) return
    const ids: string[] = JSON.parse(stored)
    if (!ids.length) return
    supabase
      .from('trips')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRecentTrips(data as Trip[])
      })
  }, [])

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">BetaPlan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Find dates your whole crew can do</p>
        </div>
        <Link href="/create" className="btn-primary">
          + New outing
        </Link>
      </div>

      {/* Recent trips */}
      {recentTrips.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Your outings</p>
          <div className="flex flex-col gap-3">
            {recentTrips.map(trip => {
              const sp = getSport(trip.sport)
              return (
                <Link
                  key={trip.id}
                  href={`/trip/${trip.invite_token}`}
                  className="card flex items-center gap-3 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: sp.bg }}
                  >
                    {sp.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{trip.name}</p>
                    <p className="text-sm text-gray-500">{fmtRange(trip.start_date, trip.end_date)}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                    style={{ background: sp.bg, color: sp.fg }}
                  >
                    {sp.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentTrips.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏔️</div>
          <p className="text-lg font-medium text-gray-700 mb-1">Plan your first outing</p>
          <p className="text-sm text-gray-400 mb-6">Create a trip, share the link, find dates that work for everyone</p>
          <Link href="/create" className="btn-primary">
            Create outing
          </Link>
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
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
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
