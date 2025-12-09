'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Participant, GiftAssignmentWithDetails, Sponsor, GiftWithSponsor } from '@/lib/supabase'
import { validateParticipantProfile } from '@/lib/validation'
import { getTimeUntilReveal, getRevealDateFormatted } from '@/lib/config'

type AssignmentResponse = {
  giving_to?: Participant
  receiving_from?: Participant
  assignment?: {
    id: string
    status: string
    created_at: string
  }
  selected_gift?: GiftAssignmentWithDetails | null
}

type AvailableGift = GiftWithSponsor & { remaining: number }

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Partial<Participant> | null>(null)
  const [myGift, setMyGift] = useState<GiftAssignmentWithDetails | null>(null)
  const [myAssignment, setMyAssignment] = useState<AssignmentResponse | null>(null)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [availableGifts, setAvailableGifts] = useState<AvailableGift[]>([])
  const [assigningGiftId, setAssigningGiftId] = useState<string | null>(null)
  const [giftSelectionMessage, setGiftSelectionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [timeUntilReveal, setTimeUntilReveal] = useState(getTimeUntilReveal())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    linkedin_url: '',
    website_url: '',
    expertise_level: 'Mid' as 'Junior' | 'Mid' | 'Senior',
    wishlist: [
      { name: '', url: '' },
      { name: '', url: '' },
      { name: '', url: '' },
    ],
  })

  const router = useRouter()
  const supabase = createClient()

  const loadMyGiftData = async () => {
    try {
      const giftResponse = await fetch('/api/my-gift')
      if (!giftResponse.ok) {
        setMyGift(null)
        return
      }

      const giftData = await giftResponse.json()
      if (giftData.success && giftData.data) {
        setMyGift(giftData.data)
      } else {
        setMyGift(null)
      }
    } catch (error) {
      console.error('Failed to load gift assignment:', error)
      setMyGift(null)
    }
  }

  const loadAssignmentData = async (): Promise<boolean> => {
    try {
      const assignmentResponse = await fetch('/api/my-assignment')
      if (!assignmentResponse.ok) {
        setMyAssignment(null)
        return false
      }

      const assignmentData = await assignmentResponse.json()
      if (assignmentData.giving_to || assignmentData.receiving_from) {
        setMyAssignment(assignmentData)
        return Boolean(assignmentData.giving_to)
      }

      setMyAssignment(null)
      return false
    } catch (error) {
      console.error('Assignment not yet available:', error)
      setMyAssignment(null)
      return false
    }
  }

  const loadAvailableSponsorGifts = async () => {
    try {
      const response = await fetch('/api/gifts/available')
      if (!response.ok) {
        setAvailableGifts([])
        return
      }

      const data = await response.json()
      if (data.success) {
        setAvailableGifts((data.data || []) as AvailableGift[])
      } else {
        setAvailableGifts([])
      }
    } catch (error) {
      console.error('Failed to load available gifts:', error)
      setAvailableGifts([])
    }
  }

  useEffect(() => {
    async function loadUserAndProfile() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      setUser(user)

      // Check if admin
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
      setIsAdmin(adminEmails.includes(user.email || ''))

      // Load existing profile
      const { data: profileData } = await supabase
        .from('participants')
        .select('*')
        .eq('email', user.email)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData({
          name: profileData.name || '',
          email: profileData.email || user.email || '',
          linkedin_url: profileData.linkedin_url || '',
          website_url: profileData.website_url || '',
          expertise_level: profileData.expertise_level || 'Mid',
          wishlist: profileData.wishlist || [
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' },
          ],
        })
      } else {
        // Set email from user auth if no profile exists yet
        setFormData(prev => ({ ...prev, email: user.email || '' }))
      }

      await loadMyGiftData()
      const hasGivingAssignment = await loadAssignmentData()
      if (hasGivingAssignment) {
        await loadAvailableSponsorGifts()
      } else {
        setAvailableGifts([])
      }

      // Load sponsors
      const { data: sponsorsData } = await supabase
        .from('sponsors')
        .select('*')
        .eq('approval_status', 'approved')
        .order('tier', { ascending: true })

      if (sponsorsData) setSponsors(sponsorsData)

      setLoading(false)
    }

    loadUserAndProfile()
  }, [router, supabase])

  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReveal(getTimeUntilReveal())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (!user?.email) return

    try {
      // Validate with Zod
      const validation = validateParticipantProfile(formData)

      if (!validation.success) {
        const firstError = validation.error.issues[0]
        throw new Error(firstError.message)
      }

      const payload = validation.data

      const { error } = profile
        ? await supabase
            .from('participants')
            .update(payload)
            .eq('email', user.email)
        : await supabase
            .from('participants')
            .insert(payload)

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Profile saved successfully!',
      })
    } catch (error: any) {
      // Handle duplicate key error gracefully (user clicked save twice)
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        setMessage({
          type: 'success',
          text: 'Your details are saved.',
        })
      } else {
        setMessage({
          type: 'error',
          text: error.message || 'Failed to save profile. Please try again.',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAssignGift = async (giftId: string) => {
    if (!myAssignment?.giving_to?.email) {
      setGiftSelectionMessage({
        type: 'error',
        text: 'You do not have an assigned recipient yet.',
      })
      return
    }

    setAssigningGiftId(giftId)
    setGiftSelectionMessage(null)

    try {
      const response = await fetch('/api/assign-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gift_id: giftId,
          receiver_email: myAssignment.giving_to.email,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign gift')
      }

      setGiftSelectionMessage({
        type: 'success',
        text: data.message || 'Gift assigned successfully!',
      })

      await loadAssignmentData()
      await loadAvailableSponsorGifts()
    } catch (error: any) {
      setGiftSelectionMessage({
        type: 'error',
        text: error.message || 'Failed to assign gift. Please try again.',
      })
    } finally {
      setAssigningGiftId(null)
    }
  }

  const handleMarkAsRedeemed = async () => {
    try {
      const response = await fetch('/api/my-gift', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'redeemed' }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      // Reload gift assignment
      const giftResponse = await fetch('/api/my-gift')
      if (giftResponse.ok) {
        const giftData = await giftResponse.json()
        if (giftData.success && giftData.data) {
          setMyGift(giftData.data)
        }
      }

      setMessage({
        type: 'success',
        text: 'Marked as redeemed!',
      })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Failed to update status',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-sm text-gray-600 mt-1">Logged in as: {user?.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push('/community')}
            className="btn-secondary text-sm"
          >
            👥 Community
          </button>
          <button
            onClick={() => router.push('/statistics')}
            className="btn-secondary text-sm"
          >
            📊 Statistics
          </button>
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="btn-secondary text-sm"
            >
              ⚙️ Admin Panel
            </button>
          )}
          <button onClick={handleSignOut} className="btn-secondary text-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* Secret Santa Assignment Section */}
      {myAssignment?.giving_to && (
        <div className="card mb-6 bg-gradient-to-r from-green-50 to-red-50 border-2 border-green-300">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎁</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">You're gifting to</h2>

              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border-l-4 border-green-500">
                <p className="text-xl font-semibold text-gray-900 mb-3">{myAssignment.giving_to.name}</p>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-gray-700">Expertise:</span>{' '}
                    <span className="text-gray-900">{myAssignment.giving_to.expertise_level}</span>
                  </p>

                  {myAssignment.giving_to.wishlist && myAssignment.giving_to.wishlist.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Wishlist:</p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        {myAssignment.giving_to.wishlist
                          .filter(item => item.name && item.name.trim() !== '')
                          .map((item, idx) => (
                            <li key={idx} className="text-gray-800">
                              {item.name}
                              {item.url && item.url.trim() !== '' && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline ml-2"
                                >
                                  ↗
                                </a>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {myAssignment.giving_to.linkedin_url && (
                    <p>
                      <span className="font-medium text-gray-700">LinkedIn:</span>{' '}
                      <a
                        href={myAssignment.giving_to.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Profile ↗
                      </a>
                    </p>
                  )}

                  {myAssignment.giving_to.website_url && (
                    <p>
                      <span className="font-medium text-gray-700">Website:</span>{' '}
                      <a
                        href={myAssignment.giving_to.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Site ↗
                      </a>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => router.push('/community')}
                  className="mt-4 btn-primary text-sm"
                >
                  View Full Profile in Community
                </button>
              </div>

              {myAssignment.selected_gift && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-green-800 mb-1">Reserved gift</p>
                  <p className="text-lg font-semibold text-green-900">
                    {myAssignment.selected_gift.gift.gift_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Sponsored by {myAssignment.selected_gift.gift.sponsor.company_name}. You can change this selection anytime before reveal day.
                  </p>
                </div>
              )}

              <div className="mt-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose a sponsor gift</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Select a gift from our sponsor pool. Your recipient will unlock it on reveal day and redeem it directly with the sponsor.
                </p>

                {giftSelectionMessage && (
                  <div
                    className={`p-3 rounded-lg mb-3 ${
                      giftSelectionMessage.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {giftSelectionMessage.text}
                  </div>
                )}

                {availableGifts.length > 0 ? (
                  <div className="space-y-3">
                    {availableGifts.map((gift) => {
                      const isSelected = myAssignment.selected_gift?.gift_id === gift.id
                      return (
                        <div key={gift.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-lg font-semibold text-gray-900">{gift.gift_name}</p>
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 uppercase">
                                  {gift.gift_type}
                                </span>
                              </div>
                              {gift.gift_description && (
                                <p className="text-sm text-gray-600 mb-2">{gift.gift_description}</p>
                              )}
                              <p className="text-sm text-gray-600">
                                Sponsored by{' '}
                                <span className="font-semibold text-gray-900">
                                  {gift.sponsor.company_name}
                                </span>
                                {gift.value_usd && (
                                  <span className="text-gray-500"> • ${gift.value_usd}</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{gift.remaining} gifts remaining</p>
                            </div>
                            <div className="flex flex-col gap-2 min-w-[180px]">
                              <button
                                type="button"
                                onClick={() => handleAssignGift(gift.id)}
                                disabled={assigningGiftId === gift.id || isSelected}
                                className={`btn-primary text-sm ${
                                  isSelected ? 'opacity-70 cursor-default' : ''
                                }`}
                              >
                                {isSelected
                                  ? 'Selected'
                                  : assigningGiftId === gift.id
                                  ? 'Assigning...'
                                  : 'Assign Gift'}
                              </button>
                              <p className="text-xs text-gray-500 text-right">
                                {gift.redemption_instructions ? 'Includes redemption instructions' : '\u00A0'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                    No sponsor gifts are available right now. Check back soon as new partners add gifts regularly.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {timeUntilReveal && (
        <div className="card mb-6 bg-gradient-to-r from-red-50 via-white to-green-50 border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎅</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Secret Santa Reveal Countdown</h2>
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <p className="text-lg font-medium text-gray-800 mb-2">
                  You'll discover who is gifting you on:
                </p>
                <p className="text-xl font-bold text-red-600 mb-4">{getRevealDateFormatted()}</p>
                <div className="flex gap-4 justify-center mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{timeUntilReveal.days}</div>
                    <div className="text-xs text-gray-600">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{timeUntilReveal.hours}</div>
                    <div className="text-xs text-gray-600">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{timeUntilReveal.minutes}</div>
                    <div className="text-xs text-gray-600">Mins</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Finish your profile and wishlist so your Secret Santa picks the perfect gift.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!timeUntilReveal && myAssignment?.receiving_from && (
        <div className="card mb-6 bg-gradient-to-r from-yellow-50 to-red-50 border-2 border-yellow-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎉</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Meet your Secret Santa</h2>
              <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                <p className="text-xl font-semibold text-gray-900">{myAssignment.receiving_from.name}</p>
                <p className="text-sm text-gray-600 mt-2">
                  They've secured a sponsored gift for you. Scroll down to see the details and redeem it!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sponsors Section */}
      {sponsors.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Generous Sponsors</h2>
          <p className="text-gray-600 mb-6">
            These amazing people & organizations are making this Secret Santa possible by contributing gifts to the community!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sponsors.map(sponsor => (
              <div key={sponsor.id} className="flex flex-col items-center text-center">
                {sponsor.logo_url ? (
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.company_name}
                    className="h-16 w-auto object-contain mb-2"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-100 rounded-lg font-semibold text-gray-800 mb-2">
                    {sponsor.company_name}
                  </div>
                )}
                {sponsor.tier && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    sponsor.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                    sponsor.tier === 'Silver' ? 'bg-gray-200 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {sponsor.tier}
                  </span>
                )}
                {sponsor.website && (
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-2"
                  >
                    Visit →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Gift Section */}
      {!timeUntilReveal && myGift && (
        <div className="card mb-6 bg-gradient-to-r from-red-50 to-green-50 border-2 border-red-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🎁</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Secret Santa Gift!</h2>

              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-primary-600">
                    {myGift.gift.gift_name}
                  </h3>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                    {myGift.gift.gift_type}
                  </span>
                </div>

                {myGift.gift.gift_description && (
                  <p className="text-gray-700 mb-3">{myGift.gift.gift_description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <span className="font-medium">Sponsored by:</span>
                  <span className="text-primary-600 font-semibold">
                    {myGift.gift.sponsor.company_name}
                  </span>
                </div>

                {myGift.gift.value_usd && (
                  <div className="text-sm text-gray-600 mb-3">
                    Value: <span className="font-semibold">${myGift.gift.value_usd}</span>
                  </div>
                )}

                {myGift.redemption_code && (
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Redemption Code:</div>
                    <code className="text-lg font-mono font-bold text-primary-600">
                      {myGift.redemption_code}
                    </code>
                  </div>
                )}

                {myGift.gift.redemption_instructions && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-3">
                    <div className="text-sm font-medium text-blue-900 mb-1">How to Redeem:</div>
                    <p className="text-sm text-blue-800">{myGift.gift.redemption_instructions}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      myGift.status === 'redeemed'
                        ? 'bg-green-100 text-green-800'
                        : myGift.status === 'sent'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {myGift.status === 'redeemed' ? '✓ Redeemed' : myGift.status === 'sent' ? 'Sent' : 'Pending'}
                    </span>
                  </div>

                  {myGift.status !== 'redeemed' && (
                    <button
                      onClick={handleMarkAsRedeemed}
                      className="btn-primary text-sm"
                    >
                      Mark as Redeemed
                    </button>
                  )}
                </div>
              </div>

              {myGift.gift.sponsor.website && (
                <a
                  href={myGift.gift.sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                >
                  Visit {myGift.gift.sponsor.company_name} →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Professional Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4">1. Professional Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="label">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Your email may be used to communicate with you about the Secret Santa exchange.
              </p>
            </div>

            <div>
              <label htmlFor="expertise" className="label">
                SEO Expertise Level *
              </label>
              <select
                id="expertise"
                value={formData.expertise_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expertise_level: e.target.value as 'Junior' | 'Mid' | 'Senior',
                  })
                }
                className="input"
              >
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            <div>
              <label htmlFor="linkedin" className="label">
                LinkedIn URL
              </label>
              <input
                id="linkedin"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="input"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <label htmlFor="website" className="label">
                Website / Agency URL
              </label>
              <input
                id="website"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="input"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

        </div>

        {/* Wishlist */}
        <div>
          <h2 className="text-xl font-semibold mb-4">2. Your Wishlist (Optional)</h2>
          <p className="text-sm text-gray-600 mb-3">Give your Santa up to 3 gift ideas! This is completely optional.</p>

          {formData.wishlist.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label htmlFor={`wishlist-name-${index}`} className="label">
                  Gift Idea #{index + 1}
                </label>
                <input
                  id={`wishlist-name-${index}`}
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const newWishlist = [...formData.wishlist]
                    newWishlist[index].name = e.target.value
                    setFormData({ ...formData, wishlist: newWishlist })
                  }}
                  className="input"
                  placeholder="e.g., SEO Audit, Tool Access, Consultation"
                />
              </div>
              <div>
                <label htmlFor={`wishlist-url-${index}`} className="label">
                  URL (Optional)
                </label>
                <input
                  id={`wishlist-url-${index}`}
                  type="url"
                  value={item.url}
                  onChange={(e) => {
                    const newWishlist = [...formData.wishlist]
                    newWishlist[index].url = e.target.value
                    setFormData({ ...formData, wishlist: newWishlist })
                  }}
                  className="input"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  )
}
