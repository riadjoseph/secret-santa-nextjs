import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * POST /api/assign-gift
 * Allows a Secret Santa giver to assign a gift to their receiver
 * Body: { gift_id: string, receiver_email: string }
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

    // Parse request body
    const body = await request.json()
    const { gift_id, receiver_email } = body

    if (!gift_id || !receiver_email) {
      return NextResponse.json(
        { error: 'gift_id and receiver_email are required' },
        { status: 400 }
      )
    }

    // Verify that the user is actually the Secret Santa for this receiver
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('giver_email', user.email)
      .eq('receiver_email', receiver_email)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'You are not the Secret Santa for this person' },
        { status: 403 }
      )
    }

    // Check if gift exists and is available
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', gift_id)
      .single()

    if (giftError || !gift) {
      return NextResponse.json(
        { error: 'Gift not found' },
        { status: 404 }
      )
    }

    if (gift.status !== 'active') {
      return NextResponse.json(
        { error: 'Gift is no longer available' },
        { status: 400 }
      )
    }

    if (gift.quantity <= gift.quantity_claimed) {
      return NextResponse.json(
        { error: 'Gift is out of stock' },
        { status: 400 }
      )
    }

    // Check if giver already assigned a gift to this receiver
    const { data: existingAssignment, error: existingAssignmentError } = await supabase
      .from('gift_assignments')
      .select('*')
      .eq('participant_email', receiver_email)
      .eq('given_by', user.email)
      .maybeSingle()

    if (existingAssignmentError && existingAssignmentError.code !== 'PGRST116') {
      console.error('Error checking gift assignment:', existingAssignmentError)
    }

    const fetchAssignmentWithDetails = async (assignmentId: string) => {
      const { data, error } = await supabase
        .from('gift_assignments')
        .select(`
          *,
          gift:gifts(
            *,
            sponsor:sponsors(*)
          )
        `)
        .eq('id', assignmentId)
        .single()

      if (error) throw error
      return data
    }

    if (existingAssignment && existingAssignment.gift_id === gift_id) {
      const assignmentWithGift = await fetchAssignmentWithDetails(existingAssignment.id)
      return NextResponse.json({
        success: true,
        message: 'Gift already assigned to this receiver',
        assignment: assignmentWithGift,
      })
    }

    let assignmentRecordId: string | null = null
    let successMessage = 'Gift assigned successfully'

    if (existingAssignment) {
      const { data: updatedAssignment, error: updateError } = await supabase
        .from('gift_assignments')
        .update({
          gift_id,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAssignment.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating gift assignment:', updateError)
        return NextResponse.json(
          { error: 'Failed to update gift assignment', details: updateError.message },
          { status: 500 }
        )
      }

      assignmentRecordId = updatedAssignment.id
      successMessage = 'Gift assignment updated successfully'

      if (existingAssignment.gift_id && existingAssignment.gift_id !== gift_id) {
        const { data: previousGift } = await supabase
          .from('gifts')
          .select('id, quantity_claimed')
          .eq('id', existingAssignment.gift_id)
          .single()

        if (previousGift) {
          await supabase
            .from('gifts')
            .update({
              quantity_claimed: Math.max(0, (previousGift.quantity_claimed || 0) - 1),
            })
            .eq('id', previousGift.id)
        }
      }
    } else {
      const { data: newAssignment, error: insertError } = await supabase
        .from('gift_assignments')
        .insert({
          gift_id,
          participant_email: receiver_email,
          given_by: user.email,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating gift assignment:', insertError)
        return NextResponse.json(
          { error: 'Failed to assign gift', details: insertError.message },
          { status: 500 }
        )
      }

      assignmentRecordId = newAssignment.id
    }

    const currentClaimed = gift.quantity_claimed || 0
    await supabase
      .from('gifts')
      .update({ quantity_claimed: currentClaimed + 1 })
      .eq('id', gift_id)

    if (!assignmentRecordId) {
      return NextResponse.json(
        { error: 'Failed to determine assignment result' },
        { status: 500 }
      )
    }

    const assignmentWithGift = await fetchAssignmentWithDetails(assignmentRecordId)

    return NextResponse.json({
      success: true,
      message: successMessage,
      assignment: assignmentWithGift,
    })
  } catch (error: any) {
    console.error('Error in /api/assign-gift:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
