import { requireAuth, ApiResponse } from '@/lib/auth-utils'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/my-gift
 * Get the authenticated user's assigned gift
 */
export async function GET() {
  try {
    const user = await requireAuth()

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('gift_assignments')
      .select(`
        *,
        gift:gifts(
          *,
          sponsor:sponsors(*)
        )
      `)
      .eq('participant_email', user.email)
      .single()

    if (error) {
      // No assignment found
      if (error.code === 'PGRST116') {
        return ApiResponse.success(null)
      }
      throw error
    }

    return ApiResponse.success(data)
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return ApiResponse.unauthorized()
    }
    return ApiResponse.serverError(error.message)
  }
}

/**
 * PATCH /api/my-gift
 * Update the user's gift assignment status (mark as redeemed)
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    if (body.status !== 'redeemed') {
      return ApiResponse.error('Can only update status to "redeemed"')
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('gift_assignments')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
      })
      .eq('participant_email', user.email)
      .select()
      .single()

    if (error) throw error

    return ApiResponse.success(data)
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return ApiResponse.unauthorized()
    }
    return ApiResponse.serverError(error.message)
  }
}
