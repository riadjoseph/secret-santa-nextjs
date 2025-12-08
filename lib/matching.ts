import { Participant } from './supabase'

/**
 * Secret Santa Matcher
 * Implements SEO mentorship-based matching:
 * - Seniors prioritized to give to Juniors
 * - Derangement algorithm ensures no self-assignment
 */
export class SecretSantaMatcher {
  private participants: Participant[]

  constructor(participants: Participant[]) {
    this.participants = participants
  }

  /**
   * Execute the matching logic
   * Returns: Record of giver_email -> receiver_email
   */
  runMatch(): Record<string, string> {
    if (this.participants.length === 0) {
      return {}
    }

    // 1. Separate by expertise level
    const juniors: Participant[] = []
    const mids: Participant[] = []
    const seniors: Participant[] = []

    this.participants.forEach((p) => {
      const level = p.expertise_level?.toLowerCase()
      if (level === 'junior') {
        juniors.push(p)
      } else if (level === 'senior') {
        seniors.push(p)
      } else {
        // Mid or unknown defaults to Mid
        mids.push(p)
      }
    })

    const assignments: Record<string, string> = {}
    const giversPool = new Set(this.participants.map((p) => p.email))
    const receiversPool = new Set(this.participants.map((p) => p.email))

    // --- LOGIC: Senior -> Junior Priority ---
    // Shuffle for randomness
    const seniorEmails = this.shuffle(seniors.map((s) => s.email))
    const juniorEmails = this.shuffle(juniors.map((j) => j.email))
    const midEmails = this.shuffle(mids.map((m) => m.email))

    // 1. Seniors give to Juniors (as many as possible)
    for (const senior of seniorEmails) {
      if (juniorEmails.length > 0) {
        const receiver = juniorEmails.shift()!
        assignments[senior] = receiver

        giversPool.delete(senior)
        receiversPool.delete(receiver)
      }
      // If no juniors left, senior remains in pool for derangement
    }

    // 2. Remaining matching (Derangement)
    // Match remaining givers to remaining receivers ensuring no self-assignment
    const remGivers = Array.from(giversPool)
    const remReceivers = Array.from(receiversPool)

    const maxRetries = 100
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const shuffledReceivers = this.shuffle([...remReceivers])
      let valid = true
      const tempAssignments: Record<string, string> = {}

      for (let i = 0; i < remGivers.length; i++) {
        const giver = remGivers[i]
        const receiver = shuffledReceivers[i]

        if (giver === receiver) {
          valid = false
          break
        }
        tempAssignments[giver] = receiver
      }

      if (valid) {
        Object.assign(assignments, tempAssignments)
        return assignments
      }
    }

    // Failed to find valid matching after retries
    console.error('Failed to find valid matching after retries')
    return {}
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

/**
 * Verify that no one is assigned to themselves
 */
export function verifyDerangement(assignments: Record<string, string>): boolean {
  for (const [giver, receiver] of Object.entries(assignments)) {
    if (giver === receiver) {
      return false
    }
  }
  return true
}
