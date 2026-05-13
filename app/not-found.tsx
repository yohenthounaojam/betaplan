import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🏔️</div>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">Page not found</h1>
      <p className="text-gray-400 mb-6">This trip link may be invalid or expired.</p>
      <Link href="/" className="btn-primary">Back to BetaPlan</Link>
    </main>
  )
}
