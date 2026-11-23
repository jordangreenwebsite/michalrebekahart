import { signedPrunusLead } from './prunus-leads.js';
// Cloudflare Pages Function. Requires a verified sender domain and the env
// variables RESEND_API_KEY and CONTACT_FROM_EMAIL (or QUOTE_FROM_EMAIL).
// The recipient is fixed to Mikie's verified contact address to prevent stale
// Cloudflare recipient settings from silently misrouting artwork enquiries.
// No successful submission is reported until the email provider accepts the message.
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
});
const field = (form,key,max) => String(form.get(key) || '').trim().slice(0, max + 1);
const ARTIST_INBOX = 'michalrebekahart@hotmail.com';
export async function onRequestPost({ request, env, context, waitUntil }) {
  const origin = request.headers.get('Origin');
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return json({ok:false,message:'Please use the contact form on this website.'}, 403);
    } catch { return json({ok:false,message:'Invalid origin.'},403); }
  }
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('application/x-www-form-urlencoded') && !contentType.includes('multipart/form-data')) {
    return json({ok:false,message:'Invalid form format.'},415);
  }
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 20000) return json({ok:false,message:'Please send a shorter message.'},413);
  let form;
  try { form = await request.formData(); } catch { return json({ok:false,message:'Please check your message and try again.'},400); }
  // Hidden field is deliberately not visible to a person.
  if (field(form,'website',100)) return json({ok:true,message:'Thank you for your message.'},200);
  const name = field(form,'name',120);
  const email = field(form,'email',254);
  const message = field(form,'message',5000);
  const category = field(form,'category',40);
  const categories = {
    original_artwork:'Original artwork',
    personalised_painting:'Personalised painting',
    childrens_book:'Children’s book illustration',
    business_artwork:'Artwork for a business',
    other:'Something else',
    general:'General enquiry'
  };
  const safeCategory = Object.hasOwn(categories,category) ? category : 'general';
  if (name.length < 2 || name.length > 120 || email.length > 254 ||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
      message.length < 15 || message.length > 5000) {
    return json({ok:false,message:'Please add your name, a valid email address and a message of at least 15 characters.'},422);
  }
  // Preserve the existing Cloudflare sender configuration, but never accept
  // recipient overrides from stale CONTACT_TO_EMAIL / QUOTE_TO_EMAIL variables.
  const from = String(env.CONTACT_FROM_EMAIL || env.QUOTE_FROM_EMAIL || '').trim();
  if (!env.RESEND_API_KEY || !from) {
    return json({ok:false,message:'The enquiry form is temporarily unavailable. Please use the email or WhatsApp link below.'},503);
  }
  const cleanName = name.replace(/[\r\n]/g,' ');
  const plainText = ['New artwork enquiry from Michal Rebekah Art','','Name: '+cleanName,
    'Email: '+email,'Enquiry type: '+categories[safeCategory],'','Message:',message,'','Sent from: https://www.michalrebekahart.com/contact/'].join('\n');
  let provider;
  try {
    provider = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json' },
      body:JSON.stringify({
        from,
        to:[ARTIST_INBOX],
        reply_to:email,
        subject:'New painting enquiry from '+cleanName,
        text:plainText
      })
    });
  } catch {
    return json({ok:false,message:'The message could not be sent. Please email me directly instead.'},502);
  }
  if (!provider.ok) {
    // Never log the submitted message, email address or provider secrets.
    return json({ok:false,message:'The message could not be delivered. Please use the email or WhatsApp link instead.'},502);
  }
  // Once Resend accepts the message, optionally mirror the lead into the Prunus
  // backend. A failed/unconfigured webhook must never undo a successful email.
  let resendId;
  try {
    const accepted = await provider.json?.();
    if (typeof accepted?.id === 'string') resendId = accepted.id;
  } catch { /* The email is accepted even if its receipt cannot be decoded. */ }
  const portalToken=String(env.PORTAL_INGEST_TOKEN||'').trim();
  if (portalToken) {
    const save=async()=>{
      try {
        if(!/^[a-f0-9]{64}$/.test(portalToken)){console.warn('Art portal token invalid');return;}
        const rawId=String(resendId||'');
        const id=/^[a-zA-Z0-9._:-]{1,90}$/.test(rawId)?rawId:crypto.randomUUID();
        const response=await fetch('https://portal.prunusmedia.com/api/ingest/lead',{
          method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+portalToken},
          body:JSON.stringify({external_id:'art:'+id,name:cleanName,email,phone:'',postcode:'',service:categories[safeCategory],message,source_page:'/contact/'}),
          signal:AbortSignal.timeout(8000)
        });
        if(!response.ok)console.warn('Art portal intake rejected',response.status);
      }catch{console.warn('Art portal temporarily unavailable');}
    };
    // Cloudflare Pages supplies waitUntil directly; retain test/legacy context compatibility.
    if(typeof waitUntil==='function')waitUntil(save());
    else if(typeof context?.waitUntil==='function')context.waitUntil(save());
    else await save();
  } else if (env.PRUNUS_LEADS_WEBHOOK_URL || env.PRUNUS_LEADS_WEBHOOK_SECRET) {
    const delivery = signedPrunusLead({
      env,
      lead:{name:cleanName,email,message,category:safeCategory},
      resendId
    });
    if (typeof context?.waitUntil === 'function') context.waitUntil(delivery);
    else await delivery;
  }

  // Optional aggregate metric, configured as a Cloudflare Analytics Engine binding.
  // No name, email, message, IP address or other personal information is recorded.
  try {
    env.ART_ANALYTICS?.writeDataPoint({
      indexes:['michal-rebekah-art'],
      blobs:['contact-form','delivered'],
      doubles:[1]
    });
  } catch { /* Analytics must never interfere with delivery. */ }
  return json({ok:true,message:'Thank you. Your message has been sent. I will reply by email.'},200);
}
export function onRequestGet() {
  return json({ok:false,message:'Please use the contact form.'},405);
}
