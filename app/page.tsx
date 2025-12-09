'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Sponsor } from '@/lib/supabase'

type GiftPreview = {
  id: string
  gift_name: string
  gift_type: string
  sponsor: Sponsor
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [gifts, setGifts] = useState<GiftPreview[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadGiftPreviews()
    loadSponsors()
  }, [])

  const loadGiftPreviews = async () => {
    const { data } = await supabase
      .from('gifts')
      .select(`
        id,
        gift_name,
        gift_type,
        sponsor:sponsors!inner(*)
      `)
      .eq('status', 'active')
      .limit(6)

    if (data) {
      // Transform data to match type (sponsor comes as single object with !inner)
      const gifts = data.map((g: any) => ({
        ...g,
        sponsor: Array.isArray(g.sponsor) ? g.sponsor[0] : g.sponsor
      }))
      setGifts(gifts as GiftPreview[])
    }
  }

  const loadSponsors = async () => {
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .eq('approval_status', 'approved')
      .order('tier', { ascending: true })

    if (data) setSponsors(data)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: `Magic link sent to ${email}! Please check your inbox.`,
      })
      setEmail('')
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send magic link. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Check if already logged in
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      router.push('/profile')
    }
  })

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      {/* Hero Section with Gift Preview */}
      <div className="text-center mb-12 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          SEO Community Secret Santa 🎁
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-2">
          Get amazing gifts from top SEO tool sponsors
        </p>
        <p className="text-gray-600">
          Sign in to participate and receive your gift!
        </p>
      </div>

      {/* How It Works Section */}
      <div className="mb-12 bg-gradient-to-br from-green-50 to-red-50 rounded-lg p-4 sm:p-6 md:p-8 border-2 border-green-200">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-lg mb-2">1. Sign Up</h3>
            <p className="text-gray-700 text-sm">
              Sign in with your email and complete your profile. Tell us about your SEO interests and expertise level.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="font-bold text-lg mb-2">2. Get Matched</h3>
            <p className="text-gray-700 text-sm">
              Our sponsors contribute awesome SEO tools, services, and resources. You'll be matched with a gift from our pool!
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🎄</div>
            <h3 className="font-bold text-lg mb-2">3. Enjoy Your Gift</h3>
            <p className="text-gray-700 text-sm">
              Receive your gift with instructions on how to redeem it. Celebrate the season with the SEO community!
            </p>
          </div>
        </div>
      </div>

      {/* For Sponsors Section */}
      <div className="mb-12 bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">For Sponsors</h2>
          <p className="text-center text-gray-700 mb-4">
            Want to give back to the SEO community and showcase your tools or services?
          </p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <h3 className="font-bold mb-2">Sponsor Login</h3>
            <p className="text-sm text-gray-700 mb-2">
              If you're an approved sponsor, use the same magic link login above. Once logged in, you'll have access to your sponsor dashboard where you can:
            </p>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1 ml-2">
              <li>Add and manage your gift offerings</li>
              <li>View analytics on gift distribution and redemption</li>
              <li>Track engagement with your contributions</li>
            </ul>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Interested in becoming a sponsor?
            </p>
            <p className="text-sm text-gray-700">
              Contact us at <a href="mailto:sponsors@seokringle.com" className="text-blue-600 hover:underline font-semibold">sponsors@seokringle.com</a> to learn more about sponsorship opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Sponsor Logos */}
      {sponsors.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Our Generous Sponsors</h2>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {sponsors.map(sponsor => (
              <div key={sponsor.id} className="flex flex-col items-center">
                {sponsor.logo_url ? (
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.company_name}
                    className="h-12 object-contain mb-2"
                  />
                ) : (
                  <div className="px-6 py-3 bg-gray-100 rounded-lg font-semibold text-gray-800">
                    {sponsor.company_name}
                  </div>
                )}
                {sponsor.tier && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    sponsor.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                    sponsor.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {sponsor.tier}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gift Preview */}
      {gifts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Available Gifts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gifts.map(gift => (
              <div key={gift.id} className="card bg-gradient-to-br from-red-50 to-green-50 border-2 border-red-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{gift.gift_name}</h3>
                  <span className="px-2 py-1 bg-white rounded text-xs text-gray-700">
                    {gift.gift_type}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  Sponsored by <span className="font-semibold">{gift.sponsor.company_name}</span>
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  🎄 Sign in to see if you'll receive this gift!
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Login Form */}
      <div className="max-w-md mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In to Participate</h2>
            <p className="text-gray-600">
              Join the SEO Community Secret Santa
            </p>
          </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : '✨ Send Magic Link'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>How it works:</strong>
          </p>
          <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
            <li>Enter your email address</li>
            <li>Check your inbox for a magic link</li>
            <li>Click the link to sign in securely</li>
            <li>Complete your profile and join the exchange!</li>
          </ol>
        </div>
      </div>
      </div>
    </div>
  )
}
