import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendAssignmentEmails } from '@/lib/email'
import type { Assignment, Participant } from '@/lib/supabase-types'

/**
 * POST /api/admin/send-assignment-emails
 * Send batch assignment notification emails to all pending assignments
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all pending assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('status', 'pending')

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      throw assignmentsError
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json(
        { error: 'No pending assignments found' },
        { status: 400 }
      )
    }

    // Fetch all participants
    const { data: participantsArray, error: participantsError } = await supabase
      .from('participants')
      .select('*')

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      throw participantsError
    }

    // Create participants map for quick lookup
    const participantsMap = new Map<string, Participant>()
    participantsArray?.forEach(p => {
      participantsMap.set(p.email, p)
    })

    // Send batch emails
    const result = await sendAssignmentEmails(
      assignments as Assignment[],
      participantsMap
    )

    return NextResponse.json({
      sent: result.sent,
      failed: result.failed,
      total: result.total,
      errors: result.errors,
    })
  } catch (error: any) {
    console.error('Error in /api/admin/send-assignment-emails:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
