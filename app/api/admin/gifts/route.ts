import { NextRequest } from 'next/server'
import { verifyAdmin, ApiResponse } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase-server'
import { validateGift } from '@/lib/validation'

/**
 * GET /api/admin/gifts
 * List all gifts with sponsor info
 */
export async function GET() {
  try {
    await verifyAdmin()

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('gifts')
      .select(`
        *,
        sponsor:sponsors(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ApiResponse.success(data)
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return ApiResponse.unauthorized()
    }
    if (error.message === 'Admin access required') {
      return ApiResponse.forbidden()
    }
    return ApiResponse.serverError(error.message)
  }
}

/**
 * POST /api/admin/gifts
 * Create a new gift
 */
export async function POST(request: NextRequest) {
  try {
    await verifyAdmin()

    const body = await request.json()

    // Validate input
    const validation = validateGift(body)
    if (!validation.success) {
      return ApiResponse.error(
        validation.error.issues.map(e => e.message).join(', ')
      )
    }

    const supabase = createAdminClient()
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
    if (error.message === 'Admin access required') {
      return ApiResponse.forbidden()
    }
    return ApiResponse.serverError(error.message)
  }
}
