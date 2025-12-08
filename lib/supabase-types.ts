// Type definitions for our database
export type Participant = {
  id: string
  email: string
  name: string
  linkedin_url: string
  website_url: string
  bio: string
  address: string
  preferences: string | null // Optional custom preferences
  gift_preference_preset: 'sponsored-tool' | 'personal-audit' | 'learning-resources' | 'surprise-me' | null // Quick preset
  expertise_level: 'Junior' | 'Mid' | 'Senior'
  wishlist: Array<{ name: string; url?: string }> // URL is optional now
  created_at: string
  updated_at: string
}

// Sponsor companies that contribute gifts
export type Sponsor = {
  id: string
  company_name: string
  logo_url: string | null
  website: string | null
  contact_email: string
  tier: 'Gold' | 'Silver' | 'Bronze' | null
  user_id: string | null
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_at: string | null
  approved_by: string | null
  created_at: string
}

// Gifts in the pool from sponsors
export type Gift = {
  id: string
  sponsor_id: string
  gift_name: string
  gift_description: string | null
  gift_type: 'trial' | 'license' | 'audit' | 'consultation' | 'credits' | 'other'
  quantity: number
  quantity_claimed: number
  value_usd: number | null
  redemption_instructions: string | null
  status: 'active' | 'exhausted' | 'inactive'
  created_at: string
}

// Gift with sponsor info (for joins)
export type GiftWithSponsor = Gift & {
  sponsor: Sponsor
}

// Assignment of gifts to participants
export type GiftAssignment = {
  id: string
  gift_id: string
  participant_email: string
  redemption_code: string | null
  redeemed_at: string | null
  status: 'pending' | 'sent' | 'redeemed'
  created_at: string
}

// Assignment with full gift and sponsor details
export type GiftAssignmentWithDetails = GiftAssignment & {
  gift: GiftWithSponsor
  participant: Participant
}

// Legacy type for backward compatibility (will be removed)
export type Assignment = {
  id: string
  giver_email: string
  receiver_email: string
  status: 'pending' | 'completed'
  created_at: string
}
