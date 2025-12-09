/**
 * Application Configuration
 * Central configuration for the Secret Santa app
 */

export const CONFIG = {
  /**
   * Reveal date for Secret Santa assignments
   * Assignments will be hidden from participants until this date
   */
  REVEAL_DATE: new Date('2025-12-29T00:00:00Z'),

  /**
   * Email batch settings for sending notifications
   * Prevents rate limiting and improves deliverability
   */
  EMAIL_BATCH_SIZE: 5,
  EMAIL_BATCH_DELAY_MS: 60000, // 1 minute between batches

  /**
   * Application URL for email links
   */
  APP_URL: process.env.NEXT_PUBLIC_APP_DOMAIN || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  APP_NAME: 'SEO Community Secret Santa',
} as const

/**
 * Check if current date is after reveal date
 */
export function isAfterRevealDate(): boolean {
  return new Date() >= CONFIG.REVEAL_DATE
}

/**
 * Calculate time remaining until reveal date
 * Returns null if reveal date has passed
 */
export function getTimeUntilReveal(): {
  days: number
  hours: number
  minutes: number
  seconds: number
} | null {
  const now = new Date()
  const reveal = CONFIG.REVEAL_DATE

  if (now >= reveal) {
    return null
  }

  const diff = reveal.getTime() - now.getTime()

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  }
}

/**
 * Format reveal date for display
 */
export function getRevealDateFormatted(): string {
  return CONFIG.REVEAL_DATE.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
