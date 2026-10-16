import nodemailer from 'nodemailer';

/**
 * Service for sending system emails (Admin notifications, customer receipts, etc.)
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  /**
   * Dedicated Google Workspace/Gmail mailbox for 1:1 outreach (lead emails).
   * Kept separate from the transactional transport: cold/sales email sent
   * through a real Google mailbox lands in inboxes far more reliably than
   * email sent through an API relay, and replies thread in the mailbox.
   */
  private outreachTransporter: nodemailer.Transporter | null = null;
  private outreachFrom: string | null = null;

  constructor() {
    this.init();
    this.initOutreach();
  }

  private init() {
    // In production, use real SMTP settings
    // For now, we'll use a mock/log approach if environment variables are missing
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      console.log('✅ Email Service initialized with SMTP');
    } else if (process.env.RESEND_API_KEY) {
      // Resend SMTP relay — works with nodemailer, no SDK restructuring needed
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      });
      console.log('✅ Email Service initialized with Resend SMTP relay');
    } else {
      console.warn('[Email] No SMTP or Resend config found. Console fallback enabled.');
    }
  }

  private initOutreach() {
    // Requires a Gmail/Google Workspace app password:
    // Google Account → Security → 2-Step Verification → App passwords
    const user = process.env.GOOGLE_OUTREACH_EMAIL;
    const pass = process.env.GOOGLE_OUTREACH_APP_PASSWORD;
    if (!user || !pass) {
      console.warn('[Email] GOOGLE_OUTREACH_EMAIL / GOOGLE_OUTREACH_APP_PASSWORD not set — lead outreach will fall back to the transactional transport.');
      return;
    }
    const name = process.env.GOOGLE_OUTREACH_NAME || 'Reframe Visuals';
    this.outreachTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    this.outreachFrom = `"${name}" <${user}>`;
    console.log('✅ Outreach Email initialized with Google mailbox');
  }

  /**
   * Send a 1:1 outreach email (lead follow-ups) through the Google mailbox.
   * Plain text only — no HTML wrapper, no tracking pixels — so it reads and
   * scores like a personally written email. Falls back to the transactional
   * transport when the Google mailbox is not configured.
   */
  async sendOutreachEmail(to: string, subject: string, body: string) {
    if (this.outreachTransporter && this.outreachFrom) {
      try {
        await this.outreachTransporter.sendMail({
          from: this.outreachFrom,
          to,
          subject,
          text: body,
        });
        return true;
      } catch (error: any) {
        console.error('❌ Failed to send outreach email via Google mailbox:', error.message || 'Unknown error');
        return false;
      }
    }
    console.warn('[Email] Google outreach mailbox not configured — sending lead email via transactional transport.');
    return this.sendEmail(to, subject, String(body).replace(/\n/g, '<br/>'));
  }

  /**
   * Send a generic email
   */
  async sendEmail(to: string, subject: string, html: string) {
    return this.sendEmailWithHeaders(to, subject, html);
  }

  /**
   * Send an email with optional SMTP threading headers.
   */
  async sendEmailWithHeaders(
    to: string,
    subject: string,
    html: string,
    headers?: { messageId?: string; inReplyTo?: string; references?: string }
  ) {
    const from = process.env.EMAIL_FROM || '"Reframe Visuals" <hello@reframevisuals.com>';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
          replyTo: 'hello@reframevisuals.com',
          messageId: headers?.messageId,
          inReplyTo: headers?.inReplyTo,
          references: headers?.references,
        });
        return true;
      } catch (error: any) {
        // Sanitize error log - only message
        console.error('❌ Failed to send email:', error.message || 'Unknown error');
        return false;
      }
    } else {
      // In development, log a summary but avoid full PII if possible.
      // In production, fail closed so API callers do not show a false "sent" success.
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        console.error('[Email] SMTP is not configured. Refusing to report email as sent.');
        return false;
      }

      console.log('📧 [MOCK EMAIL]');
      console.log(`TO: ${to.split('@')[0]}@***`); // Partially mask email
      console.log(`SUBJECT: ${subject}`);
      return true;
    }
  }

  /**
   * Send notification to admin about a new meeting request
   */
  async sendMeetingNotificationEmail(meeting: any) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'hello@reframevisuals.com';
    // FIX: Removed customer name from subject for privacy
    const subject = `[NEW MEETING] Request Received (Company: ${meeting.company || 'N/A'})`;
    
    const html = `
      <h2>New Meeting Request</h2>
      <p><strong>Name:</strong> ${meeting.name}</p>
      <p><strong>Email:</strong> ${meeting.email}</p>
      <p><strong>Company:</strong> ${meeting.company}</p>
      <p><strong>Message:</strong> ${meeting.message}</p>
      <p><strong>Submitted At:</strong> ${meeting.createdAt}</p>
      <hr />
      <p><a href="${process.env.ADMIN_DASHBOARD_URL || 'https://reframevisuals.com'}/admin/meetings">View in Admin Dashboard</a></p>
    `;

    return this.sendEmail(adminEmail, subject, html);
  }

  /**
   * Send notification to admin about a new quote request
   */
  async sendQuoteNotificationEmail(quote: any) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'hello@reframevisuals.com';
    // FIX: Removed customer name from subject for privacy
    const subject = `[NEW QUOTE] Request Received (Quantity: ${quote.quantity} images)`;
    
    const html = `
      <h2>New Quote Request</h2>
      <p><strong>Name:</strong> ${quote.name}</p>
      <p><strong>Email:</strong> ${quote.email}</p>
      <p><strong>Company:</strong> ${quote.company}</p>
      <p><strong>Quantity:</strong> ${quote.quantity} images</p>
      <p><strong>Estimated Total:</strong> $${quote.estimatedPrice}</p>
      <p><strong>Turnaround:</strong> ${quote.turnaround}</p>
      <p><strong>Submitted At:</strong> ${quote.createdAt}</p>
      <hr />
      <p><a href="${process.env.ADMIN_DASHBOARD_URL || 'https://reframevisuals.com'}/admin/quotes">View in Admin Dashboard</a></p>
    `;

    return this.sendEmail(adminEmail, subject, html);
  }
}

export const emailService = new EmailService();
