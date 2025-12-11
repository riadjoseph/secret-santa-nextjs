import { verifySponsor, ApiResponse } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase-server'

/**
 * GET /api/sponsor/analytics
 * Get analytics for the authenticated sponsor's gifts
 */
export async function GET() {
  try {
    const { sponsor } = await verifySponsor()

    const supabase = createAdminClient()

    // Get gift analytics using the database function
    const { data: analytics, error: analyticsError } = await supabase
      .rpc('get_sponsor_gift_analytics', { sponsor_uuid: sponsor.id })
      .single()

    if (analyticsError) throw analyticsError

    // Get sponsor's gift IDs first
    const { data: sponsorGifts } = await supabase
      .from('gifts')
      .select('id')
      .eq('sponsor_id', sponsor.id)

    const giftIds = sponsorGifts?.map(g => g.id) || []

    // Get gift assignments with redemption status
    const { data: assignments, error: assignmentsError } = await supabase
      .from('gift_assignments')
      .select(`
        id,
        gift_id,
        participant_email,
        redemption_code,
        status,
        redeemed_at,
        created_at,
        gift:gifts(gift_name)
      `)
      .in('gift_id', giftIds)
      .order('created_at', { ascending: false })

    if (assignmentsError) throw assignmentsError

    return ApiResponse.success({
      analytics,
      assignments: assignments || [],
      sponsor,
    })
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
