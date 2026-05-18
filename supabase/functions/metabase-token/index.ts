import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import jwt from 'npm:jsonwebtoken@9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { reportId } = await req.json()
    if (!reportId) {
      throw new Error('reportId is required')
    }

    const { data: report, error: reportError } = await supabaseClient
      .from('embedded_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      throw new Error('Report not found or access denied')
    }

    const METABASE_SITE_URL = Deno.env.get('METABASE_SITE_URL')
    const METABASE_SECRET_KEY = Deno.env.get('METABASE_SECRET_KEY')

    if (!METABASE_SITE_URL || !METABASE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Metabase is not configured on the server' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const finalParams = {
      ...(typeof report.params === 'object' && report.params ? report.params : {}),
    }

    // Forçamos o envio do client_id exatamente como string para prevenir truncamento de hex/UUID
    // e garantimos que ele não seja sobrescrito por valores em report.params
    finalParams['identidadeaplicacao'] = String(report.client_id)

    const payload = {
      resource: { [report.report_type]: report.resource_id },
      params: finalParams,
      exp: Math.round(Date.now() / 1000) + 10 * 60,
    }

    const token = jwt.sign(payload, METABASE_SECRET_KEY, { algorithm: 'HS256' })

    const iframeUrl = `${METABASE_SITE_URL}/embed/${report.report_type}/${token}#theme=night&bordered=true&titled=true`

    return new Response(JSON.stringify({ url: iframeUrl }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
