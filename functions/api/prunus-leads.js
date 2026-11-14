// Optional Prunus Media lead handoff for Michal Rebekah Art.
// Never blocks or replaces Resend delivery. Env vars:
// PRUNUS_LEADS_WEBHOOK_URL (HTTPS URL owned by Prunus)
// PRUNUS_LEADS_WEBHOOK_SECRET (shared secret, never exposed client-side)
//
// Receiver verifies HMAC SHA-256 over `<timestamp>.<raw_request_body>`.
// A short timeout prevents a slow CRM from holding up an artist enquiry.
const encoder = new TextEncoder();

export async function signedPrunusLead({env,lead,resendId,now=Date.now(),fetchImpl=fetch}) {
  const url = String(env.PRUNUS_LEADS_WEBHOOK_URL || '').trim();
  const secret = String(env.PRUNUS_LEADS_WEBHOOK_SECRET || '').trim();
  if (!url && !secret) return {status:'not_configured'};
  if (!url || !secret) return {status:'misconfigured'};
  let endpoint;
  try {
    endpoint = new URL(url);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.hash)
      return {status:'misconfigured'};
  } catch { return {status:'misconfigured'}; }

  const timestamp = String(Math.floor(now/1000));
  const eventId = resendId ? 'resend:' + String(resendId).slice(0,100) : crypto.randomUUID();
  // Deliberately no IP address, user agent, cookies or other tracking details.
  const payload = JSON.stringify({
    event:'art.enquiry.created',
    event_id:eventId,
    source:'michal-rebekah-art',
    source_url:'https://www.michalrebekahart.co.uk/contact/',
    received_at:new Date(now).toISOString(),
    lead:{
      name:lead.name,
      email:lead.email,
      message:lead.message,
      category:lead.category
    }
  });
  const key = await crypto.subtle.importKey('raw',encoder.encode(secret),
    {name:'HMAC',hash:'SHA-256'},false,['sign']);
  const mac = await crypto.subtle.sign('HMAC',key,encoder.encode(timestamp+'.'+payload));
  const signature = [...new Uint8Array(mac)].map(x=>x.toString(16).padStart(2,'0')).join('');
  try {
    const response = await fetchImpl(endpoint.toString(),{
      method:'POST',
      headers:{
        'Content-Type':'application/json; charset=utf-8',
        'X-Prunus-Event':'art.enquiry.created',
        'X-Prunus-Timestamp':timestamp,
        'X-Prunus-Signature':'sha256='+signature,
        'X-Prunus-Idempotency-Key':eventId
      },
      body:payload,
      signal:AbortSignal.timeout(4500)
    });
    return {status:response.ok?'delivered':'failed'};
  } catch {
    return {status:'failed'};
  }
}
