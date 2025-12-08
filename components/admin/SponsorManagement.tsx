'use client'

import { useState, useEffect } from 'react'
import type { Sponsor } from '@/lib/supabase'

export default function SponsorManagement() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    website: '',
    logo_url: '',
    tier: '' as '' | 'Gold' | 'Silver' | 'Bronze',
  })

  useEffect(() => {
    loadSponsors()
  }, [])

  const loadSponsors = async () => {
    try {
      const response = await fetch('/api/admin/sponsors')
      const data = await response.json()

      if (data.success) {
        setSponsors(data.data)
      }
    } catch (error) {
      console.error('Failed to load sponsors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      const url = editingId
        ? `/api/admin/sponsors/${editingId}`
        : '/api/admin/sponsors'

      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save sponsor')
      }

      setMessage({
        type: 'success',
        text: editingId ? 'Sponsor updated successfully!' : 'Sponsor created successfully!',
      })

      resetForm()
      loadSponsors()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message,
      })
    }
  }

  const handleEdit = (sponsor: Sponsor) => {
    setFormData({
      company_name: sponsor.company_name,
      contact_email: sponsor.contact_email,
      website: sponsor.website || '',
      logo_url: sponsor.logo_url || '',
      tier: (sponsor.tier || '') as any,
    })
    setEditingId(sponsor.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return

    try {
      const response = await fetch(`/api/admin/sponsors/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete sponsor')
      }

      setMessage({
        type: 'success',
        text: 'Sponsor deleted successfully!',
      })

      loadSponsors()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message,
      })
    }
  }

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_email: '',
      website: '',
      logo_url: '',
      tier: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading sponsors...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sponsor Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Add Sponsor'}
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

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
          <h3 className="font-semibold text-lg">
            {editingId ? 'Edit Sponsor' : 'Add New Sponsor'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company_name" className="label">
                Company Name *
              </label>
              <input
                id="company_name"
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="contact_email" className="label">
                Contact Email *
              </label>
              <input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="website" className="label">
                Website URL
              </label>
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="input"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label htmlFor="tier" className="label">
                Sponsor Tier
              </label>
              <select
                id="tier"
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                className="input"
              >
                <option value="">Select tier</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="logo_url" className="label">
                Logo URL
              </label>
              <input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="input"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Direct URL to the company logo image
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Sponsor' : 'Create Sponsor'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Sponsors List */}
      {sponsors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No sponsors yet</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Add Your First Sponsor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {sponsor.logo_url && (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.company_name}
                      className="h-12 w-auto object-contain mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-lg text-gray-900">
                    {sponsor.company_name}
                  </h3>
                  {sponsor.tier && (
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                        sponsor.tier === 'Gold'
                          ? 'bg-yellow-100 text-yellow-800'
                          : sponsor.tier === 'Silver'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {sponsor.tier}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <p>{sponsor.contact_email}</p>
                {sponsor.website && (
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline block truncate"
                  >
                    {sponsor.website}
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(sponsor)}
                  className="btn-secondary text-sm flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(sponsor.id)}
                  className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
