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
    const admin = await verifyAdmin()

    const body = await request.json()

    // Validate input
    const validation = validateSponsor(body)
    if (!validation.success) {
      return ApiResponse.error(
        validation.error.issues.map(e => e.message).join(', ')
      )
    }

    // Prepare data with defaults for admin-created sponsors
    const sponsorData: any = {
      ...validation.data,
      approval_status: 'approved', // Admin-created sponsors are auto-approved
      approved_by: admin.email,
      approved_at: new Date().toISOString(),
      user_id: null, // No user account linked initially
    }

    // Convert empty tier to null
    if (sponsorData.tier === '' || !sponsorData.tier) {
      sponsorData.tier = null
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('sponsors')
      .insert(sponsorData)
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
