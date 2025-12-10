import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isAfterRevealDate } from '@/lib/config'
import type { GiftAssignmentWithDetails } from '@/lib/supabase-types'

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

    const isRevealed = isAfterRevealDate()

    // Get assignment where user is the giver (always show to giver)
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
      console.error('User email:', user.email)
      console.error('Error code:', givingError.code)
      console.error('Error details:', givingError.details)
    }

    console.log('Giving assignment found:', !!givingAssignment, 'for user:', user.email)

    let selectedGift: GiftAssignmentWithDetails | null = null

    if (givingAssignment?.receiver_email) {
      const { data: giftAssignment, error: giftAssignmentError } = await supabase
        .from('gift_assignments')
        .select(`
          *,
          gift:gifts(
            *,
            sponsor:sponsors(*)
          )
        `)
        .eq('participant_email', givingAssignment.receiver_email)
        .eq('given_by', user.email)
        .maybeSingle()

      if (giftAssignmentError && giftAssignmentError.code !== 'PGRST116') {
        console.error('Error fetching selected gift:', giftAssignmentError)
      } else if (giftAssignment) {
        selectedGift = giftAssignment as GiftAssignmentWithDetails
      }
    }

    // Get assignment where user is the receiver (only after reveal date)
    let receivingAssignment = null
    if (isRevealed) {
      const { data, error: receivingError } = await supabase
        .from('assignments')
        .select(`
          *,
          giver:participants!assignments_giver_email_fkey(*)
        `)
        .eq('receiver_email', user.email)
        .single()

      if (receivingError) {
        console.error('Error fetching receiving assignment:', receivingError)
      } else {
        receivingAssignment = data
      }
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
      selected_gift?: GiftAssignmentWithDetails | null
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
      response.selected_gift = selectedGift
    }

    if (receivingAssignment) {
      response.receiving_from = Array.isArray(receivingAssignment.giver)
        ? receivingAssignment.giver[0]
        : receivingAssignment.giver
    }

    console.log('API Response:', JSON.stringify(response, null, 2))

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error in /api/my-assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
