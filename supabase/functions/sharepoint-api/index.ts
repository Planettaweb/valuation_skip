import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
};

async function getAccessToken() {
  const tenantId = Deno.env.get('SHAREPOINT_TENANT_ID');
  const clientId = Deno.env.get('SHAREPOINT_CLIENT_ID');
  const clientSecret = Deno.env.get('SHAREPOINT_CLIENT_SECRET');

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('SharePoint credentials are not fully configured.');
  }

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get SharePoint access token: ${err}`);
  }
  
  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const driveId = Deno.env.get('SHAREPOINT_DRIVE_ID');
    
    if (!driveId) throw new Error('SHAREPOINT_DRIVE_ID is missing');

    const token = await getAccessToken();

    if (action === 'upload') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const folderPath = formData.get('folderPath') as string;
      const fileName = formData.get('fileName') as string;

      if (!file) throw new Error('No file provided');

      const spPath = `${folderPath}/${fileName}`;
      const encodedPath = spPath.split('/').map(encodeURIComponent).join('/');
      const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/content`;

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: await file.arrayBuffer()
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`SharePoint Upload Failed: ${err}`);
      }

      const uploadData = await uploadRes.json();

      return new Response(JSON.stringify({ success: true, path: spPath, spData: uploadData }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (action === 'delete') {
      const { path } = await req.json();
      if (!path) throw new Error('No path provided for deletion');
      
      const encodedPath = path.split('/').map(encodeURIComponent).join('/');
      const deleteUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}`;

      const deleteRes = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!deleteRes.ok && deleteRes.status !== 404) {
        const err = await deleteRes.text();
        throw new Error(`SharePoint Delete Failed: ${err}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    throw new Error('Invalid action or action not specified');
  } catch (error: any) {
    console.error('SharePoint API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
