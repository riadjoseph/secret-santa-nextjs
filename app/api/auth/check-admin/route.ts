import { NextRequest, NextResponse } from 'next/server'
import { checkHasAdminAccess, getSponsorSession } from '@/lib/sponsor-auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * GET /api/auth/check-admin
 * Check if current user has admin access (either sponsor or regular admin)
 */
export async function GET(request: NextRequest) {
  try {
    const hasAdminAccess = await checkHasAdminAccess()

    if (!hasAdminAccess) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get session details
    const sponsorSession = await getSponsorSession()

    if (sponsorSession) {
      // Sponsor is logged in
      return NextResponse.json({
        isAdmin: true,
        type: 'sponsor',
        sponsor: {
          id: sponsorSession.sponsor_id,
          company_name: sponsorSession.company_name,
        },
      })
    }

    // Regular admin
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    return NextResponse.json({
      isAdmin: true,
      type: 'user',
      user: {
        email: user?.email,
      },
    })
  } catch (error: any) {
    console.error('Error checking admin access:', error)
    return NextResponse.json(
      { isAdmin: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
