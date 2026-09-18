import type { APIRoute } from 'astro'
import { Resend } from 'resend'

export const POST: APIRoute = async ({ request }) => {
  const { email, message } = await request.json()

  if (!email || !message) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  const resend = new Resend(import.meta.env.SECRET_RESEND_API_KEY)

  const result = await resend.emails.send({
    from: 'info@reframevisuals.com',
    to: 'admin@reframevisuals.com',
    subject: `New contact from ${email}`,
    html: `<p><strong>From:</strong> ${email}</p><p>${message}</p>`,
  })

  return new Response(JSON.stringify({ ok: true, id: result.data?.id }), { status: 200 })
}
