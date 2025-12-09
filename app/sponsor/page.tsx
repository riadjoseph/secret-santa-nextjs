'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Gift, GiftWithSponsor, Sponsor } from '@/lib/supabase'

type Analytics = {
  total_gifts: number
  total_quantity: number
  total_claimed: number
  total_available: number
  total_value_usd: number
  redemption_rate: number
}

type Assignment = {
  id: string
  gift_id: string
  participant_email: string
  redemption_code: string | null
  status: 'pending' | 'sent' | 'redeemed'
  redeemed_at: string | null
  created_at: string
  gift: { gift_name: string }
}

export default function SponsorDashboard() {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null)
  const [gifts, setGifts] = useState<GiftWithSponsor[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'gifts' | 'analytics'>('gifts')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingGift, setEditingGift] = useState<GiftWithSponsor | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Form state for adding/editing gifts
  const [formData, setFormData] = useState({
    gift_name: '',
    gift_description: '',
    gift_type: 'trial' as 'trial' | 'license' | 'audit' | 'consultation' | 'credits' | 'other',
    quantity: 1,
    value_usd: 0,
    redemption_instructions: '',
  })

  useEffect(() => {
    checkAuth()
    loadGifts()
    loadAnalytics()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }

    // Get sponsor record
    const { data: sponsorData } = await supabase
      .from('sponsors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!sponsorData) {
      setError('No sponsor account found. Please contact an administrator.')
      setLoading(false)
      return
    }

    if (sponsorData.approval_status !== 'approved') {
      setError(`Your sponsor account is ${sponsorData.approval_status}. Please wait for admin approval.`)
      setLoading(false)
      return
    }

    setSponsor(sponsorData)
    setLoading(false)
  }

  const loadGifts = async () => {
    const res = await fetch('/api/sponsor/gifts')
    if (res.ok) {
      const { data } = await res.json()
      setGifts(data)
    }
  }

  const loadAnalytics = async () => {
    const res = await fetch('/api/sponsor/analytics')
    if (res.ok) {
      const { data } = await res.json()
      setAnalytics(data.analytics)
      setAssignments(data.assignments)
    }
  }

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/sponsor/gifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      setShowAddForm(false)
      setFormData({
        gift_name: '',
        gift_description: '',
        gift_type: 'trial',
        quantity: 1,
        value_usd: 0,
        redemption_instructions: '',
      })
      loadGifts()
      loadAnalytics()
    } else {
      const { error } = await res.json()
      alert(`Error: ${error}`)
    }
  }

  const handleUpdateGift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGift) return

    const res = await fetch(`/api/sponsor/gifts/${editingGift.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      setEditingGift(null)
      setFormData({
        gift_name: '',
        gift_description: '',
        gift_type: 'trial',
        quantity: 1,
        value_usd: 0,
        redemption_instructions: '',
      })
      loadGifts()
      loadAnalytics()
    } else {
      const { error } = await res.json()
      alert(`Error: ${error}`)
    }
  }

  const handleDeleteGift = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gift?')) return

    const res = await fetch(`/api/sponsor/gifts/${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      loadGifts()
      loadAnalytics()
    }
  }

  const startEdit = (gift: GiftWithSponsor) => {
    setEditingGift(gift)
    setFormData({
      gift_name: gift.gift_name,
      gift_description: gift.gift_description || '',
      gift_type: gift.gift_type,
      quantity: gift.quantity,
      value_usd: gift.value_usd || 0,
      redemption_instructions: gift.redemption_instructions || '',
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="card bg-red-50 border-2 border-red-200">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {sponsor?.company_name} - Sponsor Dashboard
        </h1>
        <p className="text-gray-600">Manage your gifts for the SEO Community Secret Santa</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('gifts')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'gifts'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Gift Inventory
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'analytics'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics & Redemptions
        </button>
      </div>

      {/* Gift Inventory Tab */}
      {activeTab === 'gifts' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Gifts</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              + Add New Gift
            </button>
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingGift) && (
            <div className="card mb-6 bg-blue-50 border-2 border-blue-200">
              <h3 className="text-xl font-bold mb-4">
                {editingGift ? 'Edit Gift' : 'Add New Gift'}
              </h3>
              <form onSubmit={editingGift ? handleUpdateGift : handleAddGift} className="space-y-4">
                <div>
                  <label className="label">Gift Name *</label>
                  <input
                    type="text"
                    value={formData.gift_name}
                    onChange={e => setFormData({ ...formData, gift_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.gift_description}
                    onChange={e => setFormData({ ...formData, gift_description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Gift Type *</label>
                    <select
                      value={formData.gift_type}
                      onChange={e => setFormData({ ...formData, gift_type: e.target.value as any })}
                      className="input"
                      required
                    >
                      <option value="trial">Trial</option>
                      <option value="license">License</option>
                      <option value="audit">Audit</option>
                      <option value="consultation">Consultation</option>
                      <option value="credits">Credits</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Value (USD)</label>
                  <input
                    type="number"
                    value={formData.value_usd}
                    onChange={e => setFormData({ ...formData, value_usd: parseInt(e.target.value) })}
                    className="input"
                    min="0"
                  />
                </div>

                <div>
                  <label className="label">Redemption Instructions</label>
                  <textarea
                    value={formData.redemption_instructions}
                    onChange={e => setFormData({ ...formData, redemption_instructions: e.target.value })}
                    className="input"
                    rows={4}
                    placeholder="How should recipients redeem this gift?"
                  />
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    {editingGift ? 'Update Gift' : 'Add Gift'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingGift(null)
                      setFormData({
                        gift_name: '',
                        gift_description: '',
                        gift_type: 'trial',
                        quantity: 1,
                        value_usd: 0,
                        redemption_instructions: '',
                      })
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Gifts Table */}
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Gift Name</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-center py-3 px-4">Total</th>
                  <th className="text-center py-3 px-4">Claimed</th>
                  <th className="text-center py-3 px-4">Available</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map(gift => (
                  <tr key={gift.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">{gift.gift_name}</p>
                        {gift.value_usd && (
                          <p className="text-sm text-gray-600">${gift.value_usd}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {gift.gift_type}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">{gift.quantity}</td>
                    <td className="text-center py-3 px-4">{gift.quantity_claimed}</td>
                    <td className="text-center py-3 px-4">{gift.quantity - gift.quantity_claimed}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        gift.status === 'active' ? 'bg-green-100 text-green-800' :
                        gift.status === 'exhausted' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {gift.status}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <button
                        onClick={() => startEdit(gift)}
                        className="text-blue-600 hover:underline mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGift(gift.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {gifts.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                <p className="text-lg mb-2">No gifts yet</p>
                <p>Click "Add New Gift" to get started!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Analytics & Redemptions</h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card bg-blue-50 border-2 border-blue-200">
              <p className="text-sm text-blue-800 mb-1">Total Gifts</p>
              <p className="text-3xl font-bold text-blue-900">{analytics.total_gifts}</p>
            </div>
            <div className="card bg-green-50 border-2 border-green-200">
              <p className="text-sm text-green-800 mb-1">Total Quantity</p>
              <p className="text-3xl font-bold text-green-900">{analytics.total_quantity}</p>
              <p className="text-sm text-green-700">Claimed: {analytics.total_claimed}</p>
            </div>
            <div className="card bg-purple-50 border-2 border-purple-200">
              <p className="text-sm text-purple-800 mb-1">Redemption Rate</p>
              <p className="text-3xl font-bold text-purple-900">{analytics.redemption_rate}%</p>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Gift Assignments</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Gift</th>
                    <th className="text-left py-3 px-4">Participant</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Assigned</th>
                    <th className="text-center py-3 px-4">Redeemed</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(assignment => (
                    <tr key={assignment.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{assignment.gift.gift_name}</td>
                      <td className="py-3 px-4">{assignment.participant_email}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          assignment.status === 'redeemed' ? 'bg-green-100 text-green-800' :
                          assignment.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-600">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-gray-600">
                        {assignment.redeemed_at
                          ? new Date(assignment.redeemed_at).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {assignments.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  <p>No gift assignments yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
