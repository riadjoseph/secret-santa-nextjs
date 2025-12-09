/**
 * Email Service for Secret Santa Notifications
 * Uses Supabase Auth for sending emails
 */

import { createAdminClient } from './supabase-server'
import { CONFIG } from './config'
import type { Assignment, Participant } from './supabase-types'

export type EmailResult = {
  success: boolean
  assignmentId: string
  error?: string
}

export type BatchEmailResult = {
  sent: number
  failed: number
  total: number
  errors: string[]
  results: EmailResult[]
}

/**
 * Send assignment notification emails in batches
 * Processes assignments in batches to prevent rate limiting
 */
export async function sendAssignmentEmails(
  assignments: Assignment[],
  participants: Map<string, Participant>,
  onProgress?: (progress: {sent: number, total: number, currentEmail: string}) => void
): Promise<BatchEmailResult> {
  const results: EmailResult[] = []
  const errors: string[] = []
  let sent = 0
  let failed = 0

  const batches = chunkArray(assignments, CONFIG.EMAIL_BATCH_SIZE)

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]

    // Send all emails in this batch in parallel
    const batchPromises = batch.map(async (assignment) => {
      const giver = participants.get(assignment.giver_email)
      const receiver = participants.get(assignment.receiver_email)

      if (!giver || !receiver) {
        const error = `Missing participant data for assignment ${assignment.id}`
        errors.push(error)
        failed++
        return {
          success: false,
          assignmentId: assignment.id,
          error,
        }
      }

      try {
        // Notify progress
        if (onProgress) {
          onProgress({
            sent: sent + failed,
            total: assignments.length,
            currentEmail: giver.email,
          })
        }

        // Send email to giver
        await sendGiverEmail(assignment, giver, receiver)

        // Send email to receiver
        await sendReceiverEmail(assignment, giver, receiver)

        // Update assignment status in database
        const supabase = createAdminClient()
        await supabase
          .from('assignments')
          .update({
            status: 'sent',
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq('id', assignment.id)

        sent++
        return {
          success: true,
          assignmentId: assignment.id,
        }
      } catch (error: any) {
        const errorMsg = `Failed to send email for assignment ${assignment.id}: ${error.message}`
        errors.push(errorMsg)
        failed++
        return {
          success: false,
          assignmentId: assignment.id,
          error: errorMsg,
        }
      }
    })

    // Wait for this batch to complete
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Wait between batches (except after the last batch)
    if (batchIndex < batches.length - 1) {
      await delay(CONFIG.EMAIL_BATCH_DELAY_MS)
    }
  }

  return {
    sent,
    failed,
    total: assignments.length,
    errors,
    results,
  }
}

/**
 * Send email to giver about their assignment
 */
async function sendGiverEmail(
  assignment: Assignment,
  giver: Participant,
  receiver: Participant
): Promise<void> {
  const supabase = createAdminClient()

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're a Secret Santa!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎅 You're a Secret Santa!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${giver.name}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">You've been matched in the ${CONFIG.APP_NAME}!</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #10b981; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 18px; margin: 0 0 10px 0;">🎁 You are the Secret Santa for:</p>
      <p style="font-size: 24px; font-weight: bold; color: #667eea; margin: 0;">${receiver.name}</p>
    </div>

    <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        ⏰ <strong>Your match will be revealed on December 29, 2025.</strong><br>
        Log in to see all details and choose a perfect gift from our sponsor pool!
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${CONFIG.APP_URL}/profile" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Your Match</a>
    </div>

    <p style="font-size: 16px; margin-top: 30px;">Happy gifting! 🎄</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #6b7280; text-align: center;">
      ${CONFIG.APP_NAME}<br>
      <a href="${CONFIG.APP_URL}" style="color: #667eea;">${CONFIG.APP_URL}</a>
    </p>
  </div>
</body>
</html>
  `.trim()

  // Send email using Resend
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'SEO Kringle <team@seokringle.com>',
    to: giver.email,
    subject: '🎅 You\'re a Secret Santa!',
    html: emailHtml,
  })
}

/**
 * Send email to receiver about being matched
 */
async function sendReceiverEmail(
  assignment: Assignment,
  giver: Participant,
  receiver: Participant
): Promise<void> {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Secret Santa Match!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎁 Your Secret Santa Match!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>${receiver.name}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">Great news! You've been matched in the ${CONFIG.APP_NAME}!</p>

    <div style="background: white; padding: 20px; border-left: 4px solid #f5576c; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 18px; margin: 0 0 10px 0;">🎅 Your Secret Santa is:</p>
      <p style="font-size: 24px; font-weight: bold; color: #f5576c; margin: 0;">${giver.name}</p>
    </div>

    <p style="font-size: 16px;">They'll be choosing a gift for you from our amazing sponsor pool. Keep an eye out for your gift notification!</p>

    <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        ⏰ <strong>Your match will be revealed on December 29, 2025.</strong><br>
        Log in to see all details!
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${CONFIG.APP_URL}/profile" style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Your Match</a>
    </div>

    <p style="font-size: 14px; color: #6b7280; font-style: italic;">P.S. You're also a Secret Santa for someone else - check your profile to see who! 🎁</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 12px; color: #6b7280; text-align: center;">
      ${CONFIG.APP_NAME}<br>
      <a href="${CONFIG.APP_URL}" style="color: #f5576c;">${CONFIG.APP_URL}</a>
    </p>
  </div>
</body>
</html>
  `.trim()

  // Send email using Resend
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'SEO Kringle <team@seokringle.com>',
    to: receiver.email,
    subject: '🎁 Your Secret Santa Match!',
    html: emailHtml,
  })
}

/**
 * Utility: Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Utility: Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
