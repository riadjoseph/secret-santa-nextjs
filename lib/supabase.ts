// Re-exports for backward compatibility
// Import from specific files to avoid bundling server code in client bundles
export { createClient } from './supabase-client'
export type { Participant, Assignment } from './supabase-types'
