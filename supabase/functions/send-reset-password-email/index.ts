import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import nodemailer from 'npm:nodemailer'
import { createClient } from 'npm:@supabase/supabase-js@2'

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

    if (!email) {
      throw new Error('Informe o e-mail para envio do link.')
    }

    const trimmedEmail = String(email).trim()

    // Determina a URL base para redefinir senha (sempre garantindo path /redefinir-senha)
    let targetRedirect = 'https://nexusorbital.planettaweb.com.br/redefinir-senha'

    const candidateUrl = resetLink || req.headers.get('origin') || req.headers.get('referer')
    if (candidateUrl) {
      try {
        const parsed = new URL(candidateUrl)
        // Se a URL enviada apontar para /recuperar-senha ou qualquer outro endpoint, força /redefinir-senha
        parsed.pathname = '/redefinir-senha'
        parsed.hash = ''
        targetRedirect = parsed.toString().replace(/\/$/, '')
      } catch {
        targetRedirect = 'https://nexusorbital.planettaweb.com.br/redefinir-senha'
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    let finalLink = targetRedirect

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // SEMPRE gerar link do tipo 'recovery' para redefinição de senha
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: trimmedEmail,
        options: { redirectTo: targetRedirect },
      })

      if (error) {
        console.error('Erro ao gerar recovery link:', error.message)
        throw new Error(error.message)
      }

      if (data?.properties?.action_link) {
        const actionUrl = new URL(data.properties.action_link)
        // action_link do Supabase contém token_hash ou token
        const tokenHash =
          actionUrl.searchParams.get('token_hash') || actionUrl.searchParams.get('token')
        if (tokenHash) {
          const urlObj = new URL(targetRedirect)
          urlObj.pathname = '/redefinir-senha'
          urlObj.searchParams.set('token', tokenHash)
          urlObj.searchParams.set('email', trimmedEmail)
          urlObj.searchParams.set('type', 'recovery')
          finalLink = urlObj.toString()
        } else {
          // Se não encontrou token direto, garante que qualquer redirect embutido no action_link aponte para /redefinir-senha
          if (actionUrl.searchParams.has('redirect_to')) {
            const redirectParam = actionUrl.searchParams.get('redirect_to') || ''
            try {
              const parsedRedirect = new URL(redirectParam)
              parsedRedirect.pathname = '/redefinir-senha'
              actionUrl.searchParams.set('redirect_to', parsedRedirect.toString())
            } catch {
              actionUrl.searchParams.set('redirect_to', targetRedirect)
            }
          }
          finalLink = actionUrl.toString()
        }
      }
    }

    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('SMTP_PASSWORD')
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465')
    const smtpFrom = Deno.env.get('SMTP_FROM_EMAIL') || Deno.env.get('SMTP_FROM') || smtpUser

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error('Configuração SMTP incompleta no servidor.')
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const subject = 'Nexus Orbital • Redefinição de senha'
    const textContent = `Olá,\n\nRecebemos uma solicitação para redefinir a sua senha de acesso ao Nexus Orbital.\n\nPara cadastrar uma nova senha, acesse o link abaixo:\n${finalLink}\n\nSe você não solicitou esta redefinição, desconsidere esta mensagem. Sua senha atual permanecerá segura.\n\nAtenciosamente,\nEquipe Nexus Orbital`

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Redefinição de Senha</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0a14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f0f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0a14; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, #181528 0%, #12101e 100%); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 16px; padding: 36px 32px; box-shadow: 0 12px 40px rgba(0,0,0,0.5);">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-block; padding: 8px 16px; border-radius: 9999px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: #c084fc; text-transform: uppercase;">
                Nexus Orbital • Segurança
              </div>
              <h1 style="margin: 16px 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                Redefinição de Senha
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #a19fb5;">
                Recebemos um pedido para alterar a senha da sua conta Nexus Orbital associada a <strong style="color: #f1f0f7;">${trimmedEmail}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 16px 0 28px 0;">
              <a href="${finalLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 0 24px rgba(168, 85, 247, 0.45);">
                Criar Nova Senha
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
              <p style="margin: 0 0 12px 0; font-size: 12px; line-height: 18px; color: #727088;">
                Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:
              </p>
              <p style="margin: 0; font-size: 11px; line-height: 16px; color: #c084fc; word-break: break-all;">
                <a href="${finalLink}" style="color: #c084fc; text-decoration: underline;">${finalLink}</a>
              </p>
              <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 18px; color: #727088;">
                Se você não solicitou esta alteração, desconsidere este e-mail. Sua senha permanecerá inalterada.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0 0; font-size: 11px; color: #555368; text-align: center;">
          Nexus Orbital Finance • Sistema de Gestão Financeira Segura
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    await transporter.sendMail({
      from: `"Nexus Orbital" <${smtpFrom}>`,
      to: trimmedEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    })

    return new Response(JSON.stringify({ message: 'Email de recuperação enviado com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Falha ao enviar e-mail de redefinição:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro ao enviar e-mail de recuperação.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
