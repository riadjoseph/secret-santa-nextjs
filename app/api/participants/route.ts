import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/participants
 * Returns all participants for community directory
 * Available to all authenticated users
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch all participants
    const { data: participants, error } = await supabase
      .from('participants')
      .select('id, email, name, expertise_level, wishlist, linkedin_url, website_url')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching participants:', error)
      throw error
    }

    return NextResponse.json({ participants })
  } catch (error: any) {
    console.error('Error in /api/participants:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
