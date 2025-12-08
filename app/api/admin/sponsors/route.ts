import { NextRequest } from 'next/server'
import { verifyAdmin, ApiResponse } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase-server'
import { validateSponsor } from '@/lib/validation'

/**
 * GET /api/admin/sponsors
 * List all sponsors
 */
export async function GET() {
  try {
    // Verify admin access
    await verifyAdmin()

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
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
 * POST /api/admin/sponsors
 * Create a new sponsor
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await verifyAdmin()

    const body = await request.json()

    // Validate input
    const validation = validateSponsor(body)
    if (!validation.success) {
      return ApiResponse.error(
        validation.error.errors.map(e => e.message).join(', ')
      )
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('sponsors')
      .insert(validation.data)
      .select()
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
