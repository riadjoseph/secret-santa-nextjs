'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Sponsor } from '@/lib/supabase'
import { CONFIG, getTimeUntilReveal, getRevealDateFormatted } from '@/lib/config'

type GiftPreview = {
  id: string
  gift_name: string
  gift_type: string
  sponsor: Sponsor
}

type LLMRibbonOption = {
  id: string
  name: string
  tagline: string
  baseUrl: string
  queryParam: string
  prompt: string
}

const LLM_RIBBON_OPTIONS: LLMRibbonOption[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    tagline: 'Warm, social explainer',
    baseUrl: 'https://chat.openai.com/',
    queryParam: 'prompt',
    prompt:
      'Explain what SEO Kringle (the SEO Community Secret Santa hosted at SEOkringle.com) is, how the Secret Santa flow works, what Kringle means linguistically/culturally, and why the program is inclusive and beyond religion. Mention that sponsors donate gifts and the call to action is to join the exchange.'
  },
  {
    id: 'mistral',
    name: 'Mistral',
    tagline: 'Bullet-point clarity',
    baseUrl: 'https://chat.mistral.ai/chat',
    queryParam: 'q',
    prompt:
      'Give a concise bullet summary of SEO Kringle, the Secret Santa platform at SEOkringle.com. Cover: the mission of the site, how its Secret Santa gifting works, what “Kringle” references, and how the event welcomes every background beyond religion. Suggest a friendly CTA to enter via LinkedIn.'
  },
  {
    id: 'claude',
    name: 'Claude',
    tagline: 'Storyteller mode',
    baseUrl: 'https://claude.ai/chat',
    queryParam: 'input',
    prompt:
      'Narrate what happens on SEOkringle.com. Explain the Secret Santa process, define Kringle as a pastry/Santa nickname, and emphasize the inclusive, non-religious spirit. Keep the tone poetic yet clear.'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    tagline: 'Research vibe',
    baseUrl: 'https://www.perplexity.ai/search',
    queryParam: 'q',
    prompt:
      'Summarize SEO Kringle: the site concept at SEOkringle.com, how the Secret Santa gifting works, what Kringle means, and why it is beyond religion and open to everyone. Highlight that SEO sponsors underwrite the gifts.'
  },
  {
    id: 'grok',
    name: 'Grok',
    tagline: 'Snappy and bold',
    baseUrl: 'https://x.com/i/grok',
    queryParam: 'text',
    prompt:
      'Give a punchy explanation of SEO Kringle (SEO Community Secret Santa) over at SEOkringle.com. Include: how it works, why it is inclusive and not religious, what Kringle means, and a playful CTA to jump in.'
  }
]

const buildLLMUrl = (option: LLMRibbonOption) => {
  const separator = option.baseUrl.includes('?') ? '&' : '?'
  return `${option.baseUrl}${separator}${option.queryParam}=${encodeURIComponent(option.prompt)}`
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [gifts, setGifts] = useState<GiftPreview[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [timeUntilReveal, setTimeUntilReveal] = useState(getTimeUntilReveal())
  const [participantCount, setParticipantCount] = useState(0)
  const [sponsorCount, setSponsorCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReveal(getTimeUntilReveal())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadGiftPreviews()
    loadSponsors()
    loadCounts()

    // Check for auth error in URL
    const searchParams = new URLSearchParams(window.location.search)
    const error = searchParams.get('error')

    if (error === 'auth_failed') {
      setMessage({
        type: 'error',
        text: 'Authentication failed. Please try requesting a new magic link.'
      })
      // Clean URL
      window.history.replaceState({}, '', '/')
    }

    // Set up real-time subscription for counts
    const participantsChannel = supabase
      .channel('participants-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
        loadCounts()
      })
      .subscribe()

    const sponsorsChannel = supabase
      .channel('sponsors-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, () => {
        loadCounts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(participantsChannel)
      supabase.removeChannel(sponsorsChannel)
    }
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

  const loadCounts = async () => {
    // Count total participants
    const { count: participantsTotal, error: participantsError } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })

    // Count approved sponsors
    const { count: sponsorsTotal, error: sponsorsError } = await supabase
      .from('sponsors')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'approved')

    console.log('Participants count:', participantsTotal, participantsError)
    console.log('Sponsors count:', sponsorsTotal, sponsorsError)

    if (participantsTotal !== null) setParticipantCount(participantsTotal)
    if (sponsorsTotal !== null) setSponsorCount(sponsorsTotal)
  }

  const handleLinkedInLogin = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid profile email',
        },
      })

      if (error) throw error
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to connect with LinkedIn. Please try again.',
      })
      setLoading(false)
    }
  }

  // Check if already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/profile')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <div className="space-y-12">
      {/* Hero Section with Gift Preview */}
      <div className="text-center mb-8 px-2 sm:px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-display">
          🎄 SEO Community Secret Santa 🥨
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-2">
          🎁 Join the gift exchange and spread holiday cheer! 🎁
        </p>
        <p className="text-gray-600 mb-6">
          Enter the draw to give and receive - featuring gifts generously sponsored by lovely SEO tools
        </p>

        {/* CTA Button - Above the Fold */}
        <div className="max-w-md mx-auto mb-6">
          <button
            onClick={handleLinkedInLogin}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl py-4"
          >
            {loading ? (
              'Connecting...'
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Enter with LinkedIn
              </>
            )}
          </button>
        </div>

        {/* Live Stats Counter */}
        <div className="mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200 shadow-sm">
              <div className="text-3xl font-bold text-green-700 mb-1">
                {participantCount}
              </div>
              <div className="text-gray-700 font-medium">
                🎁 Participants Joined
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200 shadow-sm">
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {sponsorCount}
              </div>
              <div className="text-gray-700 font-medium">
                🎄 Generous Sponsors
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Timer to Reveal Date */}
      <div className="mx-auto mb-12">
        {timeUntilReveal ? (
          <div className="bg-gradient-to-br from-red-50 via-green-50 to-red-50 rounded-lg p-6 sm:p-8 border-2 border-red-200 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-display">
                🎄 Secret Santa Reveal In: 🧦
              </h2>
              <div className="flex justify-center gap-4 sm:gap-6 my-6">
                <div className="flex flex-col items-center">
                  <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md min-w-[70px] sm:min-w-[90px]">
                    <div className="text-3xl sm:text-4xl font-bold text-red-600">
                      {timeUntilReveal.days}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {timeUntilReveal.days === 1 ? 'Day' : 'Days'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md min-w-[70px] sm:min-w-[90px]">
                    <div className="text-3xl sm:text-4xl font-bold text-green-600">
                      {timeUntilReveal.hours}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {timeUntilReveal.hours === 1 ? 'Hour' : 'Hours'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md min-w-[70px] sm:min-w-[90px]">
                    <div className="text-3xl sm:text-4xl font-bold text-red-600">
                      {timeUntilReveal.minutes}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {timeUntilReveal.minutes === 1 ? 'Min' : 'Mins'}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 font-medium">
                ⏰ Mark your calendar: <span className="font-bold text-red-700">{getRevealDateFormatted()}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-100 to-red-100 rounded-lg p-6 sm:p-8 border-2 border-green-300 shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-green-800 mb-3">
                🎅 Matching Revealed!
              </h2>
              <p className="text-lg text-gray-800 mb-4">
                Secret Santa assignments are now available!
              </p>
              <p className="text-base text-gray-700">
                Log in to see who you're matched with and start spreading holiday cheer! 🎁
              </p>
            </div>
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div className="mb-12 bg-gradient-to-br from-green-50 to-red-50 rounded-lg p-4 sm:p-6 md:p-8 border-2 border-green-200">
        <h2 className="text-4xl font-bold text-center mb-6 sm:mb-8 font-display">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center bg-white rounded-lg p-6 shadow-sm">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="font-bold text-xl mb-3">1. Enter</h3>
            <p className="text-gray-700">
              Sign up with LinkedIn and complete your profile. Share your SEO interests and what you'd love to receive.
            </p>
          </div>
          <div className="text-center bg-white rounded-lg p-6 shadow-sm">
            <div className="text-5xl mb-4">🎁</div>
            <h3 className="font-bold text-xl mb-3">2. Match</h3>
            <p className="text-gray-700">
              On reveal day, the system pairs everyone for gift exchange. Choose from gifts generously contributed by our sponsors! Offer them to your match.
            </p>
          </div>
          <div className="text-center bg-white rounded-lg p-6 shadow-sm">
            <div className="text-5xl mb-4">🎄</div>
            <h3 className="font-bold text-xl mb-3">3. Give & Receive</h3>
            <p className="text-gray-700">
              Exchange a gift with your match and get to know the SEO community!
            </p>
          </div>
        </div>

        {/* CTA Button after How It Works */}
        <div className="mx-auto">
          <button
            onClick={handleLinkedInLogin}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl py-4"
          >
            {loading ? (
              'Connecting...'
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Enter with LinkedIn
              </>
            )}
          </button>
        </div>
      </div>

      {/* For Sponsors Section */}
      <div className="mb-12 bg-gradient-to-br from-blue-50 via-red-50 to-green-50 rounded-lg p-4 sm:p-6 border-2 border-blue-300 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-2 font-display">🎁 Why Not Sponsor?</h2>
          <p className="text-center text-gray-700 mb-6">
🧦 Share some cheer with the SEO community and spotlight your tools or services.
You don’t need to go all out — a few meaningful gifts go a long way. 🥨          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-6 flex flex-col h-full shadow-md border-2 border-green-200">
              <h3 className="font-bold mb-3 text-lg">🎄 Sponsor Login</h3>
              <p className="text-gray-700 mb-3">
                If you're an approved sponsor, use the magic link login below. Once logged in, you'll have access to your sponsor dashboard where you can:
              </p>
              <ul className="text-gray-700 list-disc list-inside space-y-2 ml-2 flex-grow">
                <li>🎁 Add and manage your gift offerings</li>
                <li>📊 View analytics on gift distribution and redemption</li>
                <li>❤️ Track engagement with your contributions</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 flex flex-col h-full shadow-md border-2 border-red-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                🧦 Interested in becoming a sponsor?
              </h3>
              <p className="text-gray-700 mb-3 flex-grow">
                Contact me at <a href="mailto:sponsors@seokringle.com" className="text-blue-600 hover:underline font-semibold">sponsors@seokringle.com</a> to get started; it is free of charge obviously (you are already very generous)! 🎁
              </p>
              <p className="text-gray-600">
                🎄 You will receive your dedicated login where you will manage your gifts and company listing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsor Logos */}
      {sponsors.length > 0 && (
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-6">2025-2026 Generous Sponsors</h2>
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
                  <span className={`px-2 py-1 rounded ${
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
                  <span className="px-2 py-1 bg-white rounded text-gray-700">
                    {gift.gift_type}
                  </span>
                </div>
                <p className="text-gray-700">
                  Sponsored by <span className="font-semibold">{gift.sponsor.company_name}</span>
                </p>
                <p className="text-gray-600 mt-2">
                  🎄 Sign in to see if you'll receive this gift!
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Login Form */}
      <div className="mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In to Participate</h2>
            <p className="text-gray-600">
              Join the SEO Community Secret Santa
            </p>
          </div>

          {/* LinkedIn Button */}
          <button
            onClick={handleLinkedInLogin}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6"
          >
            {loading ? (
              'Connecting...'
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Enter with LinkedIn
              </>
            )}
          </button>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Privacy Notice */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-900 mb-2">
              <strong>⚠️ Important:</strong> By signing up, your name, email, and profile information will be visible to all participants.
            </p>
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
              Read our Privacy Policy →
            </a>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-900">
              <strong>How it works:</strong>
            </p>
            <ol className="text-blue-800 mt-2 space-y-1 list-decimal list-inside">
              <li>Click "Enter with LinkedIn" to authenticate securely</li>
              <li>Authorize SEO Kringle to access your basic LinkedIn profile</li>
              <li>Complete your profile with wishlist and preferences</li>
              <li>Join the Secret Santa gift exchange!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* AI explainer ribbon */}
      <div className="mt-12">
        <div className="bg-gradient-to-r from-purple-700 via-rose-600 to-amber-500 text-white rounded-2xl shadow-xl border border-white/40">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-2 mb-4">
              <p className="text-xl sm:text-2xl font-display">
                Want your favorite LLM to pitch SEO Kringle?
              </p>
              <p className="text-sm sm:text-base text-white/90">
                Each link opens a pre-filled prompt asking the AI to explain the site, the Secret Santa mechanics, what a Kringle is, and
                why this exchange is open to every belief (or none at all).
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {LLM_RIBBON_OPTIONS.map(option => (
                <a
                  key={option.id}
                  href={buildLLMUrl(option)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col justify-center rounded-xl border border-white/60 bg-white/10 px-4 py-3 min-w-[140px] hover:bg-white/20 transition-colors"
                  aria-label={`Launch ${option.name} with the SEO Kringle explainer prompt`}
                >
                  <span className="text-lg font-semibold">{option.name}</span>
                  <span className="text-sm text-white/80">{option.tagline}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
