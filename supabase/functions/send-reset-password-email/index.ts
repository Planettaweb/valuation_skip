import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import nodemailer from 'npm:nodemailer'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, resetLink } = await req.json()

    if (!email || !resetLink) {
      throw new Error('Missing email or resetLink')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    let finalLink = resetLink
    const isSignup = !resetLink.includes('reset-password')
    let subject = isSignup ? 'Confirme seu cadastro' : 'Resete sua senha'
    let textStr = isSignup ? 'confirmar seu cadastro' : 'resetar sua senha'

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      const linkType = isSignup ? 'magiclink' : 'recovery'

      const { data, error } = await supabase.auth.admin.generateLink({
        type: linkType,
        email,
        options: { redirectTo: resetLink },
      })

      if (error) {
        console.error('Generate link error:', error.message)
      } else if (data?.properties?.action_link) {
        finalLink = data.properties.action_link
      }
    }

    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465')

    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS') || Deno.env.get('SMTP_PASSWORD'),
      },
    })

    await transporter.sendMail({
      from: `"Support" <${Deno.env.get('SMTP_USER')}>`,
      to: email,
      subject: subject,
      text: `Clique aqui para ${textStr}: ${finalLink}`,
      html: `<p>Clique <a href="${finalLink}">aqui</a> para ${textStr}.</p>`,
    })

    return new Response(JSON.stringify({ message: 'Email sent successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
