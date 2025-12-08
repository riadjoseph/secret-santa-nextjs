import { NextRequest } from 'next/server'
import { verifyAdmin, ApiResponse } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase-server'

/**
 * POST /api/admin/sponsors/[id]/approve
 * Approve or reject a sponsor account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin()
    const { id } = await params
    const body = await request.json()
    const { approval_status } = body // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(approval_status)) {
      return ApiResponse.error('Invalid approval status')
    }

    const supabase = await createAdminClient()

    const updateData: any = {
      approval_status,
      approved_by: admin.email,
      approved_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('sponsors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return ApiResponse.notFound('Sponsor not found')

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
