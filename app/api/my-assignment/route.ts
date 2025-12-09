import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isAfterRevealDate } from '@/lib/config'
import type { AssignmentWithParticipants } from '@/lib/supabase-types'

/**
 * GET /api/my-assignment
 * Returns the user's Secret Santa assignment with full participant details
 * Only accessible after reveal date
 */
export async function GET(request: NextRequest) {
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

    // Check if reveal date has passed
    if (!isAfterRevealDate()) {
      return NextResponse.json(
        {
          error: 'Assignments not yet revealed',
          revealed: false,
          message: 'Secret Santa assignments will be revealed on December 29, 2025'
        },
        { status: 403 }
      )
    }

    // Get assignment where user is the giver
    const { data: givingAssignment, error: givingError } = await supabase
      .from('assignments')
      .select(`
        *,
        receiver:participants!assignments_receiver_email_fkey(*)
      `)
      .eq('giver_email', user.email)
      .single()

    if (givingError) {
      console.error('Error fetching giving assignment:', givingError)
    }

    // Get assignment where user is the receiver
    const { data: receivingAssignment, error: receivingError } = await supabase
      .from('assignments')
      .select(`
        *,
        giver:participants!assignments_giver_email_fkey(*)
      `)
      .eq('receiver_email', user.email)
      .single()

    if (receivingError) {
      console.error('Error fetching receiving assignment:', receivingError)
    }

    // If no assignments found at all
    if (!givingAssignment && !receivingAssignment) {
      return NextResponse.json(
        {
          error: 'No assignment found',
          message: 'You have not been assigned a Secret Santa match yet. Contact the admin if this is unexpected.'
        },
        { status: 404 }
      )
    }

    // Build response
    const response: {
      giving_to?: any
      receiving_from?: any
      assignment?: any
    } = {}

    if (givingAssignment) {
      response.giving_to = Array.isArray(givingAssignment.receiver)
        ? givingAssignment.receiver[0]
        : givingAssignment.receiver
      response.assignment = {
        id: givingAssignment.id,
        status: givingAssignment.status,
        created_at: givingAssignment.created_at,
      }
    }

    if (receivingAssignment) {
      response.receiving_from = Array.isArray(receivingAssignment.giver)
        ? receivingAssignment.giver[0]
        : receivingAssignment.giver
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error in /api/my-assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
