// Type definitions for our database
export type Participant = {
  id: string
  email: string
  name: string
  linkedin_url: string
  website_url: string
  bio: string
  address: string
  pledge: string
  expertise_level: 'Junior' | 'Mid' | 'Senior'
  wishlist: Array<{ name: string; url: string }>
  created_at: string
  updated_at: string
}

export type Assignment = {
  id: string
  giver_email: string
  receiver_email: string
  status: 'pending' | 'completed'
  created_at: string
}
