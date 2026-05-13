import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Sport = 'climbing' | 'golf' | 'skiing' | 'surfing' | 'cycling'
export type AvailStatus = 'avail' | 'maybe' | 'busy'

export interface Trip {
  id: string
  name: string
  sport: Sport
  start_date: string
  end_date: string
  creator_name: string
  invite_token: string
  expires_at: string
  created_at: string
}

export interface Respondent {
  id: string
  trip_id: string
  name: string
  created_at: string
}

export interface Availability {
  id: string
  respondent_id: string
  trip_id: string
  date: string
  status: AvailStatus
}
