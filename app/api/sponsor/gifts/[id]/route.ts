import { NextRequest } from 'next/server'
import { verifySponsor, ApiResponse } from '@/lib/auth-utils'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { validateGift } from '@/lib/validation'

/**
 * PUT /api/sponsor/gifts/[id]
 * Update a gift (sponsor can only update their own gifts)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sponsor } = await verifySponsor()
    const { id } = await params
    const body = await request.json()

    // Force the sponsor_id to the authenticated sponsor's ID
    const giftData = {
      ...body,
      sponsor_id: sponsor.id,
    }

    // Validate input
    const validation = validateGift(giftData)
    if (!validation.success) {
      return ApiResponse.error(
        validation.error.issues.map(e => e.message).join(', ')
      )
    }

    const supabase = await createServerSupabaseClient()

    // First verify the gift belongs to this sponsor
    const { data: existingGift } = await supabase
      .from('gifts')
      .select('sponsor_id')
      .eq('id', id)
      .single()

    if (!existingGift || existingGift.sponsor_id !== sponsor.id) {
      return ApiResponse.forbidden('You can only update your own gifts')
    }

    // Update the gift
    const { data, error } = await supabase
      .from('gifts')
      .update(validation.data)
      .eq('id', id)
      .select(`
        *,
        sponsor:sponsors(*)
      `)
      .single()

    if (error) throw error
    if (!data) return ApiResponse.notFound('Gift not found')

    return ApiResponse.success(data)
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return ApiResponse.unauthorized()
    }
    if (error.message === 'Sponsor account required' || error.message === 'Sponsor account pending approval') {
      return ApiResponse.forbidden(error.message)
    }
    return ApiResponse.serverError(error.message)
  }
}

/**
 * DELETE /api/sponsor/gifts/[id]
 * Delete a gift (sponsor can only delete their own gifts)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sponsor } = await verifySponsor()
    const { id } = await params

    const supabase = await createServerSupabaseClient()

    // First verify the gift belongs to this sponsor
    const { data: existingGift } = await supabase
      .from('gifts')
      .select('sponsor_id')
      .eq('id', id)
      .single()

    if (!existingGift || existingGift.sponsor_id !== sponsor.id) {
      return ApiResponse.forbidden('You can only delete your own gifts')
    }

    // Delete the gift
    const { error } = await supabase
      .from('gifts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return ApiResponse.success({ message: 'Gift deleted successfully' })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return ApiResponse.unauthorized()
    }
    if (error.message === 'Sponsor account required' || error.message === 'Sponsor account pending approval') {
      return ApiResponse.forbidden(error.message)
    }
    return ApiResponse.serverError(error.message)
  }
}
