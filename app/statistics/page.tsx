'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Participant, Assignment, Sponsor, Gift } from '@/lib/supabase'

export default function StatisticsPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'statistics' | 'participants' | 'sponsors' | 'gifts' | 'matching'>('statistics')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Check if user is admin
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim())

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      setUser(user)
      setIsAdmin(adminEmails.includes(user.email || ''))

      await Promise.all([
        loadParticipants(),
        loadAssignments(),
        loadSponsors(),
        loadGifts()
      ])
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  const loadParticipants = async () => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setParticipants(data)
  }

  const loadAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setAssignments(data)
  }

  const loadSponsors = async () => {
    // Load sponsors directly from Supabase (accessible to all authenticated users)
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('approval_status', 'approved')
      .order('tier', { ascending: true })

    if (data && !error) {
      setSponsors(data)
    }
  }

  const loadGifts = async () => {
    // Load gifts directly from Supabase with sponsor info (accessible to all authenticated users)
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && !error) {
      setGifts(data)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading statistics...</div>
      </div>
    )
  }

  const stats = {
    totalParticipants: participants.length,
    totalAssignments: assignments.length,
    assignmentsByStatus: {
      pending: assignments.filter(a => a.status === 'pending').length,
      sent: assignments.filter(a => a.status === 'sent').length,
      completed: assignments.filter(a => a.status === 'completed').length,
    },
    participantsByExpertise: {
      junior: participants.filter(p => p.expertise_level === 'Junior').length,
      mid: participants.filter(p => p.expertise_level === 'Mid').length,
      senior: participants.filter(p => p.expertise_level === 'Senior').length,
    },
    totalSponsors: sponsors.length,
    approvedSponsors: sponsors.filter(s => s.approval_status === 'approved').length,
    totalGifts: gifts.length,
    activeGifts: gifts.filter(g => g.status === 'active').length,
    totalGiftQuantity: gifts.reduce((sum, g) => sum + g.quantity, 0),
    claimedGifts: gifts.reduce((sum, g) => sum + g.quantity_claimed, 0),
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Read-only view • Logged in as: {user?.email}
          </p>
        </div>
        <button
          onClick={() => router.push('/profile')}
          className="btn-secondary"
        >
          Back to Profile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['statistics', 'participants', 'sponsors', 'gifts', ...(isAdmin ? ['matching'] : [])].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Total Participants</h3>
              <p className="text-3xl font-bold text-blue-900">{stats.totalParticipants}</p>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <h3 className="text-sm font-medium text-green-800 mb-2">Assignments</h3>
              <p className="text-3xl font-bold text-green-900">{stats.totalAssignments}</p>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <h3 className="text-sm font-medium text-purple-800 mb-2">Sponsors</h3>
              <p className="text-3xl font-bold text-purple-900">{stats.approvedSponsors}/{stats.totalSponsors}</p>
              <p className="text-xs text-purple-700 mt-1">Approved</p>
            </div>
            <div className="card bg-gradient-to-br from-red-50 to-red-100">
              <h3 className="text-sm font-medium text-red-800 mb-2">Gifts</h3>
              <p className="text-3xl font-bold text-red-900">{stats.claimedGifts}/{stats.totalGiftQuantity}</p>
              <p className="text-xs text-red-700 mt-1">Claimed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Participants by Expertise</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Junior</span>
                    <span className="font-medium">{stats.participantsByExpertise.junior}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(stats.participantsByExpertise.junior / stats.totalParticipants) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mid-level</span>
                    <span className="font-medium">{stats.participantsByExpertise.mid}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(stats.participantsByExpertise.mid / stats.totalParticipants) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Senior</span>
                    <span className="font-medium">{stats.participantsByExpertise.senior}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(stats.participantsByExpertise.senior / stats.totalParticipants) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Assignment Status</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pending</span>
                    <span className="font-medium">{stats.assignmentsByStatus.pending}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{ width: `${(stats.assignmentsByStatus.pending / stats.totalAssignments) * 100 || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sent</span>
                    <span className="font-medium">{stats.assignmentsByStatus.sent}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(stats.assignmentsByStatus.sent / stats.totalAssignments) * 100 || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Completed</span>
                    <span className="font-medium">{stats.assignmentsByStatus.completed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(stats.assignmentsByStatus.completed / stats.totalAssignments) * 100 || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Participants</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expertise</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{p.name || 'N/A'}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-sm text-gray-600">{p.email}</td>
                    )}
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        p.expertise_level === 'Senior'
                          ? 'bg-purple-100 text-purple-800'
                          : p.expertise_level === 'Mid'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {p.expertise_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sponsors Tab */}
      {activeTab === 'sponsors' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sponsors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsors.filter(s => s.approval_status === 'approved').map((sponsor) => (
              <div key={sponsor.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {sponsor.logo_url ? (
                    <img src={sponsor.logo_url} alt={sponsor.company_name} className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-xs">
                      {sponsor.company_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{sponsor.company_name}</h3>
                    {sponsor.tier && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        sponsor.tier === 'Gold'
                          ? 'bg-yellow-100 text-yellow-800'
                          : sponsor.tier === 'Silver'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {sponsor.tier}
                      </span>
                    )}
                  </div>
                </div>
                {sponsor.website && (
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Visit Website ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gifts Tab */}
      {activeTab === 'gifts' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Gift Pool</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gifts.filter(g => g.status === 'active').map((gift) => (
              <div key={gift.id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{gift.gift_name}</h3>
                {gift.gift_description && (
                  <p className="text-sm text-gray-600 mb-2">{gift.gift_description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{gift.gift_type}</span>
                  <span className="text-gray-600">
                    {gift.quantity_claimed}/{gift.quantity} claimed
                  </span>
                  {gift.value_usd && <span className="text-gray-600">${gift.value_usd}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matching Tab */}
      {activeTab === 'matching' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Secret Santa Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-gray-600">No assignments generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{a.giver_email}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{a.receiver_email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
