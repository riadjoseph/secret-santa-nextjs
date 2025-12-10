import { createServerSupabaseClient } from './supabase-server'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'sponsor_session'

export type SponsorSession = {
  sponsor_id: string
  company_name: string
  is_admin: boolean
  approval_status: string
}

/**
 * Get current sponsor session from cookie
 * Returns null if no valid session exists
 */
export async function getSponsorSession(): Promise<SponsorSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken) {
      return null
    }

    const supabase = await createServerSupabaseClient()

    // Get session and sponsor data
    const { data: session, error: sessionError } = await supabase
      .from('sponsor_sessions')
      .select(`
        sponsor_id,
        expires_at,
        sponsor:sponsors(
          id,
          company_name,
          is_admin,
          approval_status
        )
      `)
      .eq('session_token', sessionToken)
      .single()

    if (sessionError || !session) {
      return null
    }

    // Check if session is expired
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      // Session expired, delete it
      await supabase
        .from('sponsor_sessions')
        .delete()
        .eq('session_token', sessionToken)

      // Delete cookie
      cookieStore.delete(SESSION_COOKIE_NAME)

      return null
    }

    // Return sponsor data
    const sponsor = Array.isArray(session.sponsor) ? session.sponsor[0] : session.sponsor

    if (!sponsor) {
      return null
    }

    return {
      sponsor_id: sponsor.id,
      company_name: sponsor.company_name,
      is_admin: sponsor.is_admin,
      approval_status: sponsor.approval_status,
    }
  } catch (error) {
    console.error('Error getting sponsor session:', error)
    return null
  }
}

/**
 * Check if current request is from an authenticated sponsor
 * Returns boolean without throwing
 */
export async function checkIsSponsorLoggedIn(): Promise<boolean> {
  const session = await getSponsorSession()
  return session !== null && session.approval_status === 'approved'
}

/**
 * Verify current sponsor session
 * Throws error if not authenticated or not approved
 */
export async function verifySponsorSession(): Promise<SponsorSession> {
  const session = await getSponsorSession()

  if (!session) {
    throw new Error('Sponsor authentication required')
  }

  if (session.approval_status !== 'approved') {
    throw new Error('Sponsor account not approved')
  }

  return session
}

/**
 * Check if current user has admin privileges
 * This includes both regular admins and logged-in sponsors
 */
export async function checkHasAdminAccess(): Promise<boolean> {
  // Check if user is a logged-in sponsor with admin privileges
  const sponsorSession = await getSponsorSession()
  if (sponsorSession && sponsorSession.is_admin && sponsorSession.approval_status === 'approved') {
    return true
  }

  // Check if user is a regular admin (via email)
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email) {
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)

    return adminEmails.includes(user.email.toLowerCase())
  }

  return false
}

/**
 * Verify user has admin access (either sponsor or regular admin)
 * Throws error if not authorized
 */
export async function verifyAdminAccess(): Promise<void> {
  const hasAccess = await checkHasAdminAccess()

  if (!hasAccess) {
    throw new Error('Admin access required')
  }
}
