import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Database Webhook payload: { type, table, schema, record, old_record }
    const { record } = await req.json();

    // Ignora tudo que não for PDF com status Uploaded
    if (record.file_type !== 'pdf' || record.status !== 'Uploaded') {
      return new Response(
        JSON.stringify({ skipped: true, reason: `file_type=${record.file_type} status=${record.status}` }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Triggering PDF processor: doc_id=${record.id} file_path=${record.file_path}`);

    const pythonUrl = Deno.env.get('PYTHON_SERVICE_URL');
    const apiKey   = Deno.env.get('PYTHON_API_KEY');

    const response = await fetch(`${pythonUrl}/process-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey ?? '',
      },
      body: JSON.stringify({ record }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});