'use client'

import { useState, useEffect } from 'react'
import type { Gift, Sponsor, GiftWithSponsor } from '@/lib/supabase'

export default function GiftManagement() {
  const [gifts, setGifts] = useState<GiftWithSponsor[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    sponsor_id: '',
    gift_name: '',
    gift_description: '',
    gift_type: 'trial' as 'trial' | 'license' | 'audit' | 'consultation' | 'credits' | 'other',
    quantity: 1,
    value_usd: 0,
    redemption_instructions: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [giftsRes, sponsorsRes] = await Promise.all([
        fetch('/api/admin/gifts'),
        fetch('/api/admin/sponsors'),
      ])

      const giftsData = await giftsRes.json()
      const sponsorsData = await sponsorsRes.json()

      if (giftsData.success) setGifts(giftsData.data)
      if (sponsorsData.success) setSponsors(sponsorsData.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      const url = editingId
        ? `/api/admin/gifts/${editingId}`
        : '/api/admin/gifts'

      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save gift')
      }

      setMessage({
        type: 'success',
        text: editingId ? 'Gift updated successfully!' : 'Gift created successfully!',
      })

      resetForm()
      loadData()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message,
      })
    }
  }

  const handleEdit = (gift: GiftWithSponsor) => {
    setFormData({
      sponsor_id: gift.sponsor_id,
      gift_name: gift.gift_name,
      gift_description: gift.gift_description || '',
      gift_type: gift.gift_type,
      quantity: gift.quantity,
      value_usd: gift.value_usd || 0,
      redemption_instructions: gift.redemption_instructions || '',
    })
    setEditingId(gift.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gift?')) return

    try {
      const response = await fetch(`/api/admin/gifts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete gift')
      }

      setMessage({
        type: 'success',
        text: 'Gift deleted successfully!',
      })

      loadData()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message,
      })
    }
  }

  const resetForm = () => {
    setFormData({
      sponsor_id: '',
      gift_name: '',
      gift_description: '',
      gift_type: 'trial',
      quantity: 1,
      value_usd: 0,
      redemption_instructions: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading gifts...</div>
  }

  const getAvailableQuantity = (gift: GiftWithSponsor) => {
    return gift.quantity - gift.quantity_claimed
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gift Pool Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          disabled={sponsors.length === 0}
        >
          {showForm ? 'Cancel' : 'Add Gift'}
        </button>
      </div>

      {sponsors.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Please add sponsors first before creating gifts.
        </div>
      )}

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

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
          <h3 className="font-semibold text-lg">
            {editingId ? 'Edit Gift' : 'Add New Gift'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sponsor_id" className="label">
                Sponsor *
              </label>
              <select
                id="sponsor_id"
                value={formData.sponsor_id}
                onChange={(e) => setFormData({ ...formData, sponsor_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select sponsor</option>
                {sponsors.map((sponsor) => (
                  <option key={sponsor.id} value={sponsor.id}>
                    {sponsor.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gift_type" className="label">
                Gift Type *
              </label>
              <select
                id="gift_type"
                value={formData.gift_type}
                onChange={(e) => setFormData({ ...formData, gift_type: e.target.value as any })}
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

            <div className="md:col-span-2">
              <label htmlFor="gift_name" className="label">
                Gift Name *
              </label>
              <input
                id="gift_name"
                type="text"
                value={formData.gift_name}
                onChange={(e) => setFormData({ ...formData, gift_name: e.target.value })}
                className="input"
                required
                placeholder="e.g., Ahrefs 1-Month Pro Trial"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="gift_description" className="label">
                Description
              </label>
              <textarea
                id="gift_description"
                value={formData.gift_description}
                onChange={(e) => setFormData({ ...formData, gift_description: e.target.value })}
                className="input"
                rows={3}
                placeholder="Describe what's included..."
              />
            </div>

            <div>
              <label htmlFor="quantity" className="label">
                Quantity Available *
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="value_usd" className="label">
                Value (USD)
              </label>
              <input
                id="value_usd"
                type="number"
                min="0"
                value={formData.value_usd}
                onChange={(e) => setFormData({ ...formData, value_usd: parseInt(e.target.value) || 0 })}
                className="input"
                placeholder="e.g., 99"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="redemption_instructions" className="label">
                Redemption Instructions
              </label>
              <textarea
                id="redemption_instructions"
                value={formData.redemption_instructions}
                onChange={(e) => setFormData({ ...formData, redemption_instructions: e.target.value })}
                className="input"
                rows={3}
                placeholder="How to redeem this gift..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Gift' : 'Create Gift'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Gifts List */}
      {gifts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No gifts in the pool yet</p>
          {sponsors.length > 0 && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add Your First Gift
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Gift Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sponsor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Available
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gifts.map((gift) => (
                <tr key={gift.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {gift.gift_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {gift.sponsor.company_name}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {gift.gift_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {getAvailableQuantity(gift)} / {gift.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {gift.value_usd ? `$${gift.value_usd}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        gift.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : gift.status === 'exhausted'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {gift.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(gift)}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(gift.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
