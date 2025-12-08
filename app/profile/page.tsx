'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Participant } from '@/lib/supabase'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Partial<Participant> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    linkedin_url: '',
    website_url: '',
    expertise_level: 'Mid' as 'Junior' | 'Mid' | 'Senior',
    bio: '',
    pledge: '',
    address: '',
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
          bio: profileData.bio || '',
          pledge: profileData.pledge || '',
          address: profileData.address || '',
          wishlist: profileData.wishlist || [
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' },
          ],
        })
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
      if (!formData.name) {
        throw new Error('Name is required')
      }

      if (formData.pledge.length < 20) {
        throw new Error('Please provide a detailed pledge (minimum 20 characters)')
      }

      const payload = {
        email: user.email,
        ...formData,
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
        text: '✅ Profile saved successfully!',
      })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save profile. Please try again.',
      })
    } finally {
      setSaving(false)
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
    <div className="max-w-4xl mx-auto">
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
              🔑 Admin Panel
            </button>
          )}
          <button onClick={handleSignOut} className="btn-secondary">
            🚪 Sign Out
          </button>
        </div>
      </div>

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

          <div className="mt-4">
            <label htmlFor="bio" className="label">
              Short Bio (help your Santa know you)
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input"
              rows={3}
              maxLength={300}
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/300 characters</p>
          </div>
        </div>

        {/* The Pledge */}
        <div>
          <h2 className="text-xl font-semibold mb-4">2. The Pledge</h2>
          <p className="text-sm text-gray-600 mb-3">
            <strong>Community Rule:</strong> You must pledge a digital gift of value (Audit,
            Consultation, Tool Access, Dataset, etc).
          </p>
          <label htmlFor="pledge" className="label">
            I pledge to give... * (minimum 20 characters)
          </label>
          <textarea
            id="pledge"
            value={formData.pledge}
            onChange={(e) => setFormData({ ...formData, pledge: e.target.value })}
            className="input"
            rows={4}
            required
            placeholder="Describe what you'll give to your Secret Santa recipient..."
          />
          <p className="text-xs text-gray-500 mt-1">{formData.pledge.length} characters</p>
        </div>

        {/* Wishlist */}
        <div>
          <h2 className="text-xl font-semibold mb-4">3. Your Wishlist</h2>
          <p className="text-sm text-gray-600 mb-3">Give your Santa 3 ideas!</p>

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

        {/* Shipping Address */}
        <div>
          <h2 className="text-xl font-semibold mb-4">4. Shipping Address (Optional)</h2>
          <p className="text-sm text-gray-600 mb-3">
            Only if you're open to receiving physical gifts (books, swag, etc).
          </p>
          <label htmlFor="address" className="label">
            Address
          </label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="input"
            rows={3}
            placeholder="Your mailing address (optional)"
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : '💾 Save Profile'}
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
