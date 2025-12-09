'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { SecretSantaMatcher } from '@/lib/matching'
import { useRouter } from 'next/navigation'
import type { Participant, Assignment } from '@/lib/supabase'
import SponsorManagement from '@/components/admin/SponsorManagement'
import GiftManagement from '@/components/admin/GiftManagement'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'statistics' | 'matching' | 'sponsors' | 'gifts'>('statistics')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailProgress, setEmailProgress] = useState<{ sent: number; total: number; current: string } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // Check if admin
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
      if (!adminEmails.includes(user.email || '')) {
        router.push('/profile')
        return
      }

      setUser(user)
      await loadParticipants()
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  const loadParticipants = async () => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setParticipants(data)
    }
  }

  const loadAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setAssignments(data)
    }
  }

  const handleGenerateAssignments = async () => {
    setGenerating(true)
    setMessage(null)

    try {
      if (participants.length < 2) {
        throw new Error('Need at least 2 participants to generate assignments')
      }

      // Run matching algorithm
      const matcher = new SecretSantaMatcher(participants)
      const result = matcher.runMatch()

      if (Object.keys(result).length === 0) {
        throw new Error('Algorithm failed to find a valid matching')
      }

      // Save to database
      const assignmentsData = Object.entries(result).map(([giver, receiver]) => ({
        giver_email: giver,
        receiver_email: receiver,
        status: 'pending' as const,
      }))

      const { error } = await supabase.from('assignments').insert(assignmentsData)

      if (error) throw error

      setMessage({
        type: 'success',
        text: `✅ Created ${assignmentsData.length} assignments successfully!`,
      })
      await loadAssignments()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to generate assignments',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSendEmails = async () => {
    setSendingEmails(true)
    setMessage(null)
    setEmailProgress(null)

    try {
      // Get pending assignments
      const pendingAssignments = assignments.filter(a => a.status === 'pending')

      if (pendingAssignments.length === 0) {
        throw new Error('No pending assignments to send emails for')
      }

      // Call API to send batch emails
      const response = await fetch('/api/admin/send-assignment-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send emails')
      }

      const result = await response.json()

      setMessage({
        type: 'success',
        text: `✅ Sent ${result.sent} emails successfully! ${result.failed > 0 ? `(${result.failed} failed)` : ''}`,
      })

      // Reload assignments to see updated statuses
      await loadAssignments()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send emails',
      })
    } finally {
      setSendingEmails(false)
      setEmailProgress(null)
    }
  }

  const handleExportCSV = () => {
    if (participants.length === 0) return

    const headers = ['Name', 'Email', 'Expertise', 'Preferences', 'LinkedIn', 'Website']
    const rows = participants.map(p => [
      p.name,
      p.email,
      p.expertise_level,
      p.preferences || '',
      p.linkedin_url,
      p.website_url,
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `participants-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  const expertiseCounts = participants.reduce(
    (acc, p) => {
      const level = p.expertise_level || 'Unknown'
      acc[level] = (acc[level] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-600 mt-1">Logged in as: {user?.email}</p>
        </div>
        <button onClick={() => router.push('/profile')} className="btn-secondary">
          ← Back to Profile
        </button>
      </div>

      <div className="card">
        {/* Tabs */}
        <div className="flex border-b mb-6 overflow-x-auto">
          {[
            { id: 'statistics', label: 'Statistics', value: 'statistics' },
            { id: 'sponsors', label: 'Sponsors', value: 'sponsors' },
            { id: 'gifts', label: 'Gift Pool', value: 'gifts' },
            { id: 'matching', label: 'Matching', value: 'matching' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.value as any)}
              className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.value
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Participant Statistics</h2>

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">
                    {participants.length}
                  </div>
                  <div className="text-sm text-blue-700">Total Participants</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-900">
                    {expertiseCounts['Senior'] || 0}
                  </div>
                  <div className="text-sm text-green-700">Seniors</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-900">
                    {expertiseCounts['Junior'] || 0}
                  </div>
                  <div className="text-sm text-purple-700">Juniors</div>
                </div>
              </div>

              {/* Expertise Breakdown */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Expertise Breakdown:</h3>
                <ul className="space-y-1">
                  {Object.entries(expertiseCounts).map(([level, count]) => (
                    <li key={level} className="text-sm text-gray-700">
                      • {level}: {count}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Participant Table */}
              {participants.length > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Participant List</h3>
                    <button onClick={handleExportCSV} className="btn-secondary text-sm">
                      📥 Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Expertise
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Preferences
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participants.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{p.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{p.email}</td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  p.expertise_level === 'Senior'
                                    ? 'bg-green-100 text-green-800'
                                    : p.expertise_level === 'Junior'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {p.expertise_level}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {p.preferences || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No participants yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Matching Tab */}
        {activeTab === 'matching' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Assignment Management</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={handleGenerateAssignments}
                  disabled={generating || participants.length < 2}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : '🎲 Generate New Assignments'}
                </button>

                <button
                  onClick={handleSendEmails}
                  disabled={sendingEmails || assignments.filter(a => a.status === 'pending').length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
                >
                  {sendingEmails ? 'Sending Emails...' : '📧 Send Assignment Emails'}
                </button>

                <button
                  onClick={loadAssignments}
                  className="btn-secondary"
                >
                  👁️ View Current Assignments
                </button>
              </div>

              {/* Email Progress */}
              {emailProgress && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Sending emails... {emailProgress.sent}/{emailProgress.total}
                    </span>
                    <span className="text-xs text-blue-700">
                      Current: {emailProgress.current}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(emailProgress.sent / emailProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {message && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {assignments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Current Assignments ({assignments.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giver
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receiver
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assignments.map((a) => (
                          <tr key={a.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {a.giver_email}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {a.receiver_email}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                a.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : a.status === 'sent'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                ⚠️ Generating new assignments will create new records. Make sure to clear old
                assignments if needed.
              </div>
            </div>
          </div>
        )}

        {/* Sponsors Tab */}
        {activeTab === 'sponsors' && <SponsorManagement />}

        {/* Gifts Tab */}
        {activeTab === 'gifts' && <GiftManagement />}
      </div>
    </div>
  )
}
