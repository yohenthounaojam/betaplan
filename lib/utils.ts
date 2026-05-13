export const SPORTS = [
  {
    id: 'climbing',
    label: 'Climbing',
    icon: '🧗',
    color: '#1D9E75',
    bg: '#E1F5EE',
    fg: '#085041',
    heat: ['#E1F5EE', '#9FE1CB', '#5DCAA5', '#1D9E75'],
  },
  {
    id: 'golf',
    label: 'Golf',
    icon: '⛳',
    color: '#185FA5',
    bg: '#E6F1FB',
    fg: '#0C447C',
    heat: ['#E6F1FB', '#B5D4F4', '#85B7EB', '#185FA5'],
  },
  {
    id: 'skiing',
    label: 'Skiing',
    icon: '⛷️',
    color: '#534AB7',
    bg: '#EEEDFE',
    fg: '#3C3489',
    heat: ['#EEEDFE', '#CECBF6', '#AFA9EC', '#534AB7'],
  },
  {
    id: 'surfing',
    label: 'Surfing',
    icon: '🏄',
    color: '#0F6E56',
    bg: '#E1F5EE',
    fg: '#04342C',
    heat: ['#E1F5EE', '#9FE1CB', '#5DCAA5', '#0F6E56'],
  },
  {
    id: 'cycling',
    label: 'Cycling',
    icon: '🚵',
    color: '#854F0B',
    bg: '#FAEEDA',
    fg: '#633806',
    heat: ['#FAEEDA', '#FAC775', '#EF9F27', '#854F0B'],
  },
] as const

export function getSport(id: string) {
  return SPORTS.find(s => s.id === id) ?? SPORTS[0]
}

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export const DOWS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function getDays(start: string, end: string): string[] {
  const days: string[] = []
  const cur = new Date(start + 'T12:00:00')
  const last = new Date(end + 'T12:00:00')
  while (cur <= last) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

export function fmtRange(s: string, e: string): string {
  const sm = MONTHS[+s.slice(5, 7) - 1]
  const em = MONTHS[+e.slice(5, 7) - 1]
  const sd = +s.slice(8), ed = +e.slice(8)
  const sy = s.slice(0, 4), ey = e.slice(0, 4)
  if (sy !== ey) return `${sm} ${sd}, ${sy} – ${em} ${ed}, ${ey}`
  if (sm === em) return `${sm} ${sd}–${ed}, ${sy}`
  return `${sm} ${sd} – ${em} ${ed}, ${sy}`
}

export function fmtDay(iso: string): string {
  return `${MONTHS[+iso.slice(5, 7) - 1].slice(0, 3)} ${+iso.slice(8)}`
}

export function collapseRanges(days: string[]): string[] {
  if (!days.length) return []
  const out: string[] = []
  let s = days[0], p = days[0]
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(p + 'T12:00:00')
    prev.setDate(prev.getDate() + 1)
    if (prev.toISOString().slice(0, 10) === days[i]) {
      p = days[i]
    } else {
      out.push(s === p ? fmtDay(s) : `${fmtDay(s)}–${fmtDay(p)}`)
      s = p = days[i]
    }
  }
  out.push(s === p ? fmtDay(s) : `${fmtDay(s)}–${fmtDay(p)}`)
  return out
}
