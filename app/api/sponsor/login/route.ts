import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'sponsor_session'
const SESSION_DURATION_DAYS = 7

/**
 * POST /api/sponsor/login
 * Authenticate a sponsor with username and password
 * Returns session token and sets secure cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Authenticate sponsor using database function
    const { data: authResult, error: authError } = await supabase
      .rpc('authenticate_sponsor', {
        p_username: username,
        p_password: password,
      })

    if (authError || !authResult || authResult.length === 0) {
      console.error('Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const sponsor = authResult[0]

    // Check if sponsor is approved
    if (sponsor.approval_status !== 'approved') {
      return NextResponse.json(
        { error: 'Sponsor account is not approved yet' },
        { status: 403 }
      )
    }

    // Generate session token
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create session in database
    const { error: sessionError } = await supabase
      .from('sponsor_sessions')
      .insert({
        sponsor_id: sponsor.sponsor_id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    if (sessionError) {
      console.error('Failed to create session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Update last login timestamp
    await supabase
      .from('sponsors')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', sponsor.sponsor_id)

    // Set secure session cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      sponsor: {
        id: sponsor.sponsor_id,
        company_name: sponsor.company_name,
        is_admin: sponsor.is_admin,
      },
    })
  } catch (error: any) {
    console.error('Error in /api/sponsor/login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sponsor/login
 * Logout sponsor by deleting session
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (sessionToken) {
      const supabase = createAdminClient()

      // Delete session from database
      await supabase
        .from('sponsor_sessions')
        .delete()
        .eq('session_token', sessionToken)

      // Delete cookie
      cookieStore.delete(SESSION_COOKIE_NAME)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in /api/sponsor/logout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
