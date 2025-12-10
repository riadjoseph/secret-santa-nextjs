'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Participant } from '@/lib/supabase'

export default function CommunityPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expertiseFilter, setExpertiseFilter] = useState<'All' | 'Junior' | 'Mid' | 'Senior'>('All')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadParticipants() {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // Fetch all participants
      try {
        const response = await fetch('/api/participants')
        if (response.ok) {
          const data = await response.json()
          setParticipants(data.participants || [])
          setFilteredParticipants(data.participants || [])
        }
      } catch (error) {
        console.error('Error loading participants:', error)
      } finally {
        setLoading(false)
      }
    }

    loadParticipants()
  }, [router, supabase])

  // Filter participants based on search and expertise
  useEffect(() => {
    let filtered = participants

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term)
      )
    }

    // Filter by expertise
    if (expertiseFilter !== 'All') {
      filtered = filtered.filter(p => p.expertise_level === expertiseFilter)
    }

    setFilteredParticipants(filtered)
  }, [searchTerm, expertiseFilter, participants])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading community...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Community</h1>
          <p className="text-gray-600 mt-1">
            {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => router.push('/profile')}
          className="btn-secondary"
        >
          Back to Profile
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="label">
              Search by name
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="expertise" className="label">
              Filter by expertise
            </label>
            <select
              id="expertise"
              value={expertiseFilter}
              onChange={(e) => setExpertiseFilter(e.target.value as any)}
              className="input"
            >
              <option value="All">All Levels</option>
              <option value="Junior">Junior</option>
              <option value="Mid">Mid-level</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Grid */}
      {filteredParticipants.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No participants found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParticipants.map((participant) => (
            <div
              key={participant.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">👤</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {participant.name || 'Anonymous'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Joined {participant.created_at
                      ? new Date(participant.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'Recently'
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">Expertise:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    participant.expertise_level === 'Senior'
                      ? 'bg-purple-100 text-purple-800'
                      : participant.expertise_level === 'Mid'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {participant.expertise_level || 'Not specified'}
                  </span>
                </div>

                {participant.wishlist && participant.wishlist.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Wishlist:</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {participant.wishlist
                        .filter(item => item.name && item.name.trim() !== '')
                        .slice(0, 2)
                        .map((item, idx) => (
                          <li key={idx} className="truncate">
                            • {item.name}
                          </li>
                        ))}
                      {participant.wishlist.filter(item => item.name && item.name.trim() !== '').length > 2 && (
                        <li className="text-xs text-gray-500 italic">
                          +{participant.wishlist.filter(item => item.name && item.name.trim() !== '').length - 2} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {participant.linkedin_url && (
                    <a
                      href={participant.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      LinkedIn ↗
                    </a>
                  )}
                  {participant.website_url && (
                    <a
                      href={participant.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Website ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
