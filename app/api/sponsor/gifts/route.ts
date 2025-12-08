import { NextRequest } from 'next/server'
import { verifySponsor, ApiResponse } from '@/lib/auth-utils'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { validateGift } from '@/lib/validation'

/**
 * GET /api/sponsor/gifts
 * List all gifts for the authenticated sponsor
 */
export async function GET() {
  try {
    const { sponsor } = await verifySponsor()

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('gifts')
      .select(`
        *,
        sponsor:sponsors(*)
      `)
      .eq('sponsor_id', sponsor.id)
      .order('created_at', { ascending: false })

    if (error) throw error

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
 * POST /api/sponsor/gifts
 * Create a new gift (sponsor can only add gifts to their own sponsor record)
 */
export async function POST(request: NextRequest) {
  try {
    const { sponsor } = await verifySponsor()

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
    const { data, error } = await supabase
      .from('gifts')
      .insert(validation.data)
      .select(`
        *,
        sponsor:sponsors(*)
      `)
      .single()

    if (error) throw error

    return ApiResponse.success(data, 201)
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
