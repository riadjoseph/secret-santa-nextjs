import { NextRequest } from 'next/server'
import { verifyAdmin, ApiResponse } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase-server'
import { validateSponsor } from '@/lib/validation'

/**
 * PUT /api/admin/sponsors/[id]
 * Update a sponsor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin()

    const { id } = await params
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
      .update(validation.data)
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

/**
 * DELETE /api/admin/sponsors/[id]
 * Delete a sponsor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin()

    const { id } = await params

    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id)

    if (error) throw error

    return ApiResponse.success({ message: 'Sponsor deleted successfully' })
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
