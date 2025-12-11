import { createServerSupabaseClient } from './supabase-server'

/**
 * Server-side authentication and authorization utilities
 * These functions should ONLY be used in server components, API routes, or server actions
 */

/**
 * Get admin emails from environment variable
 */
export function getAdminEmails(): string[] {
  const adminEmailsStr = process.env.NEXT_PUBLIC_ADMIN_EMAILS || ''
  return adminEmailsStr.split(',').map(e => e.trim()).filter(Boolean)
}

/**
 * Check if an email is an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = getAdminEmails()
  return adminEmails.includes(email.toLowerCase())
}

/**
 * Get current authenticated user (server-side)
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Verify current user is admin (server-side)
 * Throws error if not authenticated or not admin
 */
export async function verifyAdmin() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  if (!isAdminEmail(user.email)) {
    throw new Error('Admin access required')
  }

  return user
}

/**
 * Check if current user is admin (server-side)
 * Returns boolean without throwing
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    await verifyAdmin()
    return true
  } catch {
    return false
  }
}

/**
 * Require authentication (server-side)
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Get sponsor record for current user
 * Returns null if user is not linked to a sponsor
 */
export async function getSponsorForUser() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('sponsors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data
}

/**
 * Verify current user is an approved sponsor
 * Checks for sponsor session cookie (not Supabase Auth)
 * Throws error if not authenticated, not a sponsor, or not approved
 */
export async function verifySponsor() {
  // Import cookies at runtime to avoid edge runtime issues
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('sponsor_session')?.value

  if (!sessionToken) {
    throw new Error('Authentication required')
  }

  // Import admin client to bypass RLS
  const { createAdminClient } = await import('./supabase-server')
  const supabase = createAdminClient()

  // Validate session token
  const { data: session, error: sessionError } = await supabase
    .from('sponsor_sessions')
    .select('*, sponsor:sponsors(*)')
    .eq('session_token', sessionToken)
    .single()

  if (sessionError || !session) {
    throw new Error('Authentication required')
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    throw new Error('Authentication required')
  }

  const sponsor = session.sponsor

  if (!sponsor) {
    throw new Error('Sponsor account required')
  }

  if (sponsor.approval_status !== 'approved') {
    throw new Error('Sponsor account pending approval')
  }

  return { sponsor }
}

/**
 * Check if current user is an approved sponsor
 * Returns boolean without throwing
 */
export async function checkIsSponsor(): Promise<boolean> {
  try {
    await verifySponsor()
    return true
  } catch {
    return false
  }
}

/**
 * API Response helpers
 */
export const ApiResponse = {
  success: <T>(data: T, status: number = 200) => {
    return Response.json({ success: true, data }, { status })
  },

  error: (message: string, status: number = 400) => {
    return Response.json({ success: false, error: message }, { status })
  },

  unauthorized: (message: string = 'Unauthorized') => {
    return Response.json({ success: false, error: message }, { status: 401 })
  },

  forbidden: (message: string = 'Forbidden') => {
    return Response.json({ success: false, error: message }, { status: 403 })
  },

  notFound: (message: string = 'Not found') => {
    return Response.json({ success: false, error: message }, { status: 404 })
  },

  serverError: (message: string = 'Internal server error') => {
    return Response.json({ success: false, error: message }, { status: 500 })
  },
}
