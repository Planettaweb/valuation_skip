import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import nodemailer from 'npm:nodemailer'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, redirect_to, type = 'recovery', password, fullName, orgName } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let linkToSend = ''
    let subject = ''
    let text = ''
    let html = ''

    if (type === 'recovery') {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: redirect_to,
        },
      })

      if (error) {
        throw error
      }

      linkToSend = data.properties.action_link
      subject = 'Recuperação de Senha'
      text = `Clique no link para redefinir sua senha: ${linkToSend}`
      html = `<p>Clique <a href="${linkToSend}">aqui</a> para redefinir sua senha.</p>`
    } else if (type === 'signup') {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            org_name: orgName,
          },
          redirectTo: redirect_to,
        },
      })

      if (error) {
        throw error
      }

      linkToSend = data.properties.action_link
      subject = 'Confirme seu E-mail'
      text = `Olá ${fullName || email}, clique no link para ativar sua conta: ${linkToSend}`
      html = `<p>Olá ${fullName || email},</p><p>Clique <a href="${linkToSend}">aqui</a> para ativar sua conta.</p>`
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
      from: `"Suporte" <${Deno.env.get('SMTP_FROM_EMAIL') || Deno.env.get('SMTP_FROM') || Deno.env.get('SMTP_USER')}>`,
      to: email,
      subject: subject,
      text: text,
      html: html,
    })

    return new Response(JSON.stringify({ message: 'Email sent successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error in send-reset-password-email:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
