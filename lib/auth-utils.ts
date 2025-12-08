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
