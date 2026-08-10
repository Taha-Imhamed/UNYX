import nodemailer, { type Transporter } from 'nodemailer'
import { logger } from './logger.js'

export interface MailMessage {
  to: string
  subject: string
  text: string
  html?: string
}

let transporter: Transporter | null | undefined

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    logger.warn('[mailer] SMTP_HOST/SMTP_USER/SMTP_PASS not set — emails will be logged, not sent')
    transporter = null
    return transporter
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: SMTP_PORT === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

/**
 * Sends an email if SMTP_* env vars are configured; otherwise logs the message
 * and no-ops. Never throws — a notification failure should never break the
 * request that triggered it (grade posted, payment recorded, etc.).
 */
export async function sendMail(message: MailMessage): Promise<{ sent: boolean }> {
  const client = getTransporter()
  if (!client) {
    logger.info({ to: message.to, subject: message.subject }, '[mailer] SMTP not configured, email not sent (logged only)')
    return { sent: false }
  }

  try {
    await client.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })
    return { sent: true }
  } catch (error) {
    logger.error({ err: error, to: message.to, subject: message.subject }, '[mailer] failed to send email')
    return { sent: false }
  }
}
