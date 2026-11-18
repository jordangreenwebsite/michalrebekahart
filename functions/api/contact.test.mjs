// Run with node --test. Mocks the outbound email API, no real emails.
import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from './contact.js';
const makeForm = (entries) => new Request('https://www.michalrebekahart.com/api/contact',{
  method:'POST',
  headers:{Origin:'https://www.michalrebekahart.com','Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams(entries).toString()
});
const good = {name:'A visitor',email:'visitor@example.com',message:'I am interested in one of the family paintings.'};
test('rejects invalid fields and does not call provider', async()=>{
  const response=await onRequestPost({request:makeForm({...good,email:'not-an-email'}),env:{}});
  assert.equal(response.status,422);
});
test('no credentials is a clear error, not a false success', async()=>{
  const response=await onRequestPost({request:makeForm(good),env:{}});
  assert.equal(response.status,503);
  assert.equal((await response.json()).ok,false);
});
test('valid form sends to provider with safe Reply-To', async()=>{
  const prior=globalThis.fetch;
  try {
    let payload;
    globalThis.fetch=async(url,options)=>{payload={url,options};return {ok:true};};
    const response=await onRequestPost({request:makeForm(good),env:{
      RESEND_API_KEY:'test-secret', CONTACT_FROM_EMAIL:'artist@example.com',
      CONTACT_TO_EMAIL:'michalrebekahart@gmail.com'
    }});
    assert.equal(response.status,200);
    assert.equal((await response.json()).ok,true);
    assert.equal(payload.url,'https://api.resend.com/emails');
    const data=JSON.parse(payload.options.body);
    assert.deepEqual(data.to,['michalrebekahart@gmail.com']);
    assert.equal(data.reply_to,'visitor@example.com');
    assert.ok(data.text.includes('family paintings'));
  } finally {globalThis.fetch=prior;}
});
test('provider failure is not displayed as success',async()=>{
  const prior=globalThis.fetch;
  try {
    globalThis.fetch=async()=>({ok:false});
    const response=await onRequestPost({request:makeForm(good),env:{
      RESEND_API_KEY:'test',CONTACT_FROM_EMAIL:'artist@example.com',
      CONTACT_TO_EMAIL:'michalrebekahart@gmail.com'
    }});
    assert.equal(response.status,502);
    assert.equal((await response.json()).ok,false);
  } finally{globalThis.fetch=prior;}
});

test('optional Prunus handoff is signed, names the source and uses Resend id for deduplication',async()=>{
  const prior=globalThis.fetch;
  try {
    const sent=[];
    globalThis.fetch=async(url,options)=>{
      sent.push({url,options});
      if(String(url).includes('api.resend.com')) return {ok:true,json:async()=>({id:'email-123'})};
      return {ok:true};
    };
    const response=await onRequestPost({request:makeForm({...good,category:'business_artwork'}),env:{
      RESEND_API_KEY:'test',CONTACT_FROM_EMAIL:'artist@example.com',
      CONTACT_TO_EMAIL:'michalrebekahart@gmail.com',
      PRUNUS_LEADS_WEBHOOK_URL:'https://backend.prunusmedia.com/integrations/leads',
      PRUNUS_LEADS_WEBHOOK_SECRET:'long-random-test-signing-secret'
    }});
    assert.equal(response.status,200);
    assert.equal(sent.length,2);
    const handoff=sent[1];
    assert.equal(handoff.url,'https://backend.prunusmedia.com/integrations/leads');
    const event=JSON.parse(handoff.options.body);
    assert.equal(event.event,'art.enquiry.created');
    assert.equal(event.event_id,'resend:email-123');
    assert.equal(event.source,'michal-rebekah-art');
    assert.deepEqual(event.lead,{name:'A visitor',email:'visitor@example.com',message:good.message,category:'business_artwork'});
    const timestamp=handoff.options.headers['X-Prunus-Timestamp'];
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('long-random-test-signing-secret'),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    const actual=handoff.options.headers['X-Prunus-Signature'].replace(/^sha256=/,'');
    const signed=Uint8Array.from(actual.match(/.{2}/g).map(x=>parseInt(x,16)));
    const valid=await crypto.subtle.verify('HMAC',key,signed,new TextEncoder().encode(timestamp+'.'+handoff.options.body));
    assert.equal(valid,true);
  } finally{globalThis.fetch=prior;}
});

test('Prunus endpoint failure cannot turn a delivered Resend email into an error',async()=>{
  const prior=globalThis.fetch;
  try {
    globalThis.fetch=async(url)=>String(url).includes('api.resend.com')
      ? {ok:true,json:async()=>({id:'email-456'})}
      : {ok:false,status:503};
    const response=await onRequestPost({request:makeForm(good),env:{
      RESEND_API_KEY:'test',CONTACT_FROM_EMAIL:'artist@example.com',CONTACT_TO_EMAIL:'michalrebekahart@gmail.com',
      PRUNUS_LEADS_WEBHOOK_URL:'https://backend.prunusmedia.com/integrations/leads',
      PRUNUS_LEADS_WEBHOOK_SECRET:'test-secret'
    }});
    assert.equal(response.status,200);
    assert.equal((await response.json()).ok,true);
  } finally{globalThis.fetch=prior;}
});

test('Resend failure never sends data to the optional Prunus integration',async()=>{
  const prior=globalThis.fetch;
  try {
    const requests=[];
    globalThis.fetch=async(url)=>{requests.push(url);return {ok:false};};
    const response=await onRequestPost({request:makeForm(good),env:{
      RESEND_API_KEY:'test',CONTACT_FROM_EMAIL:'artist@example.com',CONTACT_TO_EMAIL:'michalrebekahart@gmail.com',
      PRUNUS_LEADS_WEBHOOK_URL:'https://backend.prunusmedia.com/integrations/leads',
      PRUNUS_LEADS_WEBHOOK_SECRET:'test-secret'
    }});
    assert.equal(response.status,502);
    assert.equal(requests.length,1);
  } finally{globalThis.fetch=prior;}
});

test('current Cloudflare QUOTE_* variable names deliver through Resend to configured recipients',async()=>{
  const originalFetch=globalThis.fetch;
  try {
    let sent;
    globalThis.fetch=async(url,options)=>{ sent={url,body:JSON.parse(options.body)};return {ok:true,json:async()=>({id:'verified-test-id'})}; };
    const response=await onRequestPost({request:makeForm(good),env:{
      RESEND_API_KEY:'test-secret',
      QUOTE_FROM_EMAIL:'enquiries@contact.prunusmedia.com',
      QUOTE_TO_EMAIL:'michalrebekahart@hotmail.com, secondary@example.com'
    }});
    assert.equal(response.status,200);
    assert.equal(sent.url,'https://api.resend.com/emails');
    assert.equal(sent.body.from,'enquiries@contact.prunusmedia.com');
    assert.deepEqual(sent.body.to,['michalrebekahart@hotmail.com','secondary@example.com']);
  } finally {globalThis.fetch=originalFetch;}
});

test('invalid configured recipient prevents a false form success',async()=>{
  const response=await onRequestPost({request:makeForm(good),env:{
    RESEND_API_KEY:'test', QUOTE_FROM_EMAIL:'enquiries@contact.prunusmedia.com',
    QUOTE_TO_EMAIL:'not-a-valid-email'
  }});
  assert.equal(response.status,503);
  assert.equal((await response.json()).ok,false);
});

test('standard site token sends flat tenant-scoped payload once after Resend',async()=>{
  const prior=globalThis.fetch;
  try{
    const calls=[];
    globalThis.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({id:'email-123'})};};
    const response=await onRequestPost({request:makeForm({...good,category:'business_artwork'}),env:{
      RESEND_API_KEY:'test',CONTACT_FROM_EMAIL:'artist@example.com',CONTACT_TO_EMAIL:'artist@example.com',
      PORTAL_INGEST_TOKEN:'a'.repeat(64),PRUNUS_LEADS_WEBHOOK_URL:'https://example.com/legacy',PRUNUS_LEADS_WEBHOOK_SECRET:'legacy'
    }});
    assert.equal(response.status,200);
    assert.equal(calls.length,2);
    assert.equal(calls[1].url,'https://portal.prunusmedia.com/api/ingest/lead');
    assert.equal(calls[1].options.headers.Authorization,'Bearer '+'a'.repeat(64));
    assert.deepEqual(JSON.parse(calls[1].options.body),{external_id:'art:email-123',name:good.name,email:good.email,phone:'',postcode:'',service:'Artwork for a business',message:good.message,source_page:'/contact/'});
  }finally{globalThis.fetch=prior;}
});
test('standard portal outage preserves email success',async()=>{
  const prior=globalThis.fetch;
  try{
    globalThis.fetch=async(url)=>String(url).includes('api.resend.com')?{ok:true,json:async()=>({id:'email-456'})}:{ok:false,status:503};
    const response=await onRequestPost({request:makeForm(good),env:{RESEND_API_KEY:'test',CONTACT_FROM_EMAIL:'artist@example.com',CONTACT_TO_EMAIL:'artist@example.com',PORTAL_INGEST_TOKEN:'a'.repeat(64)}});
    assert.equal(response.status,200);
  }finally{globalThis.fetch=prior;}
});
