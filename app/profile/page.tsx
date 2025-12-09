'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Participant, GiftAssignmentWithDetails } from '@/lib/supabase'
import { validateParticipantProfile, type ParticipantProfileInput } from '@/lib/validation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Partial<Participant> | null>(null)
  const [myGift, setMyGift] = useState<GiftAssignmentWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
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
          linkedin_url: profileData.linkedin_url || '',
          website_url: profileData.website_url || '',
          expertise_level: profileData.expertise_level || 'Mid',
          wishlist: profileData.wishlist || [
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' },
          ],
        })
      }

      // Load gift assignment
      try {
        const giftResponse = await fetch('/api/my-gift')
        if (giftResponse.ok) {
          const giftData = await giftResponse.json()
          if (giftData.success && giftData.data) {
            setMyGift(giftData.data)
          }
        }
      } catch (error) {
        console.error('Failed to load gift assignment:', error)
      }

      setLoading(false)
    }

    loadUserAndProfile()
  }, [router, supabase])

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

      const payload = {
        email: user.email,
        ...validation.data,
      }

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-sm text-gray-600 mt-1">Logged in as: {user?.email}</p>
        </div>
        <div className="space-x-3">
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="btn-secondary"
            >
              Admin Panel
            </button>
          )}
          <button onClick={handleSignOut} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </div>

      {/* My Gift Section */}
      {myGift && (
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
