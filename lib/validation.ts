import { z } from 'zod'

/**
 * Validation schemas for the Secret Santa application
 * Using Zod for runtime type safety and validation
 */

// Wishlist item schema
export const wishlistItemSchema = z.object({
  name: z.string().min(1, 'Gift idea name is required').max(100, 'Name too long'),
  url: z.string().url('Invalid URL format').optional().or(z.literal('')),
})

// Gift preference presets (for quick toggles)
export const GIFT_PREFERENCE_PRESETS = [
  { id: 'sponsored-tool', label: 'Sponsored Tool Access', description: 'SEO tools, software trials' },
  { id: 'personal-audit', label: 'Personal Audit', description: 'Site audit, consultation' },
  { id: 'learning-resources', label: 'Learning Resources', description: 'Courses, tutorials, datasets' },
  { id: 'surprise-me', label: 'Surprise Me!', description: 'Open to anything' },
] as const

// Popular wishlist suggestions (for quick selection)
export const WISHLIST_SUGGESTIONS = [
  'SEO Audit',
  'Technical SEO Consultation',
  'Keyword Research',
  'Backlink Analysis',
  'Content Strategy Session',
  'Link Building Campaign',
  'Local SEO Setup',
  'Site Speed Optimization',
  'Schema Markup Implementation',
  'Google Analytics Setup',
] as const

// Streamlined participant profile schema (minimal required fields)
export const participantProfileSchema = z.object({
  name: z.string().min(2, 'Name required').max(100, 'Name too long'),
  expertise_level: z.enum(['Junior', 'Mid', 'Senior'], {
    errorMap: () => ({ message: 'Must select expertise level' }),
  }),
  // Quick preset toggles instead of long text
  gift_preference_preset: z.enum(['sponsored-tool', 'personal-audit', 'learning-resources', 'surprise-me']).optional(),
  // Optional custom preferences (only if they want to elaborate)
  preferences: z.string().max(300, 'Keep it brief (300 chars max)').optional().or(z.literal('')),
  // Simple wishlist - name only, no URLs required
  wishlist: z.array(z.object({
    name: z.string().min(1, 'Name required').max(100, 'Too long'),
    url: z.string().optional().or(z.literal('')), // URL is completely optional
  })).max(3, 'Max 3 items'),
  // Optional fields (defer to later)
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  bio: z.string().max(200, 'Keep it brief').optional().or(z.literal('')),
  address: z.string().max(500, 'Too long').optional().or(z.literal('')),
})

// Sponsor schema
export const sponsorSchema = z.object({
  company_name: z.string().min(2, 'Company name required').max(100, 'Name too long'),
  logo_url: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  contact_email: z.string().email('Invalid email address'),
  tier: z.enum(['Gold', 'Silver', 'Bronze']).optional(),
})

// Gift schema
export const giftSchema = z.object({
  sponsor_id: z.string().uuid('Invalid sponsor ID'),
  gift_name: z.string().min(3, 'Gift name required').max(200, 'Name too long'),
  gift_description: z.string().max(1000, 'Description too long').optional().or(z.literal('')),
  gift_type: z.enum(['trial', 'license', 'audit', 'consultation', 'credits', 'other']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  value_usd: z.number().int().min(0, 'Value cannot be negative').optional(),
  redemption_instructions: z.string().max(2000, 'Instructions too long').optional().or(z.literal('')),
})

// Gift assignment status update schema
export const assignmentStatusSchema = z.object({
  status: z.enum(['pending', 'sent', 'redeemed']),
  redeemed_at: z.string().datetime().optional(),
})

// Type exports for use in components
export type ParticipantProfileInput = z.infer<typeof participantProfileSchema>
export type SponsorInput = z.infer<typeof sponsorSchema>
export type GiftInput = z.infer<typeof giftSchema>
export type WishlistItem = z.infer<typeof wishlistItemSchema>

// Validation helper functions
export function validateParticipantProfile(data: unknown) {
  return participantProfileSchema.safeParse(data)
}

export function validateSponsor(data: unknown) {
  return sponsorSchema.safeParse(data)
}

export function validateGift(data: unknown) {
  return giftSchema.safeParse(data)
}

// URL validation helper (for use in forms)
export function isValidUrl(url: string): boolean {
  if (!url) return true // Empty is valid (optional fields)
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
