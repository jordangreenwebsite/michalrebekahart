// Cloudflare Pages Function. Requires a verified sender domain and the env
// variables RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL.
// No successful submission is reported until the email provider accepts the message.
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
});
const field = (form,key,max) => String(form.get(key) || '').trim().slice(0, max + 1);
export async function onRequestPost({ request, env }) {
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
  if (name.length < 2 || name.length > 120 || email.length > 254 ||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
      message.length < 15 || message.length > 5000) {
    return json({ok:false,message:'Please add your name, a valid email address and a message of at least 15 characters.'},422);
  }
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL || !env.CONTACT_TO_EMAIL) {
    return json({ok:false,message:'The enquiry form is temporarily unavailable. Please use the email or WhatsApp link below.'},503);
  }
  const cleanName = name.replace(/[\r\n]/g,' ');
  const plainText = ['New artwork enquiry from Michal Rebekah Art','','Name: '+cleanName,
    'Email: '+email,'','Message:',message,'','Sent from: https://www.michalrebekahart.co.uk/contact/'].join('\n');
  let provider;
  try {
    provider = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json' },
      body:JSON.stringify({
        from:env.CONTACT_FROM_EMAIL,
        to:[env.CONTACT_TO_EMAIL],
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
