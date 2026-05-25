export function LogoIcon({ size = 36 }: { size?: number }) {
  const radius = Math.round(size * 0.25)
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: '#1D9E75',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 32 32" fill="none">
        <rect x="3" y="6" width="26" height="22" rx="3" stroke="white" strokeWidth="1.8" fill="none"/>
        <line x1="3" y1="13" x2="29" y2="13" stroke="white" strokeWidth="1.8"/>
        <line x1="9" y1="2" x2="9" y2="9" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="23" y1="2" x2="23" y2="9" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="10" cy="19" r="2" fill="white"/>
        <circle cx="16" cy="19" r="2" fill="white"/>
        <circle cx="22" cy="19" r="2" fill="white"/>
        <circle cx="10" cy="24" r="2" fill="white" fillOpacity="0.5"/>
        <circle cx="16" cy="24" r="2" fill="white"/>
        <circle cx="22" cy="24" r="2" fill="white" fillOpacity="0.5"/>
      </svg>
    </div>
  )
}
