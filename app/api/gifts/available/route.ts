import { ApiResponse, requireAuth } from '@/lib/auth-utils'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/gifts/available
 * Returns the list of sponsor gifts that are still available for Secret Santa givers
 */
export async function GET() {
  try {
    await requireAuth()
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('gifts')
      .select(`
        *,
        sponsor:sponsors(*)
      `)
      .eq('status', 'active')
      .order('value_usd', { ascending: false })

    if (error) throw error

    const availableGifts = (data || [])
      .map((gift) => {
        const remaining = Math.max(0, (gift.quantity || 0) - (gift.quantity_claimed || 0))
        return {
          ...gift,
          remaining,
        }
      })
      .filter((gift) => gift.remaining > 0)

    return ApiResponse.success(availableGifts)
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return ApiResponse.unauthorized()
    }
    console.error('Error loading available gifts:', error)
    return ApiResponse.serverError(error.message)
  }
}
