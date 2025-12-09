import { NextRequest } from 'next/server'
import { verifyAdmin, ApiResponse } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase-server'
import { validateGift } from '@/lib/validation'

/**
 * PUT /api/admin/gifts/[id]
 * Update a gift
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
    const validation = validateGift(body)
    if (!validation.success) {
      return ApiResponse.error(
        validation.error.issues.map(e => e.message).join(', ')
      )
    }

    const supabase = createAdminClient()
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
    if (error.message === 'Admin access required') {
      return ApiResponse.forbidden()
    }
    return ApiResponse.serverError(error.message)
  }
}

/**
 * DELETE /api/admin/gifts/[id]
 * Delete a gift
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin()

    const { id } = await params

    const supabase = createAdminClient()
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
    if (error.message === 'Admin access required') {
      return ApiResponse.forbidden()
    }
    return ApiResponse.serverError(error.message)
  }
}
