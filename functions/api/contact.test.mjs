// Run with node --test. Mocks the outbound email API, no real emails.
import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from './contact.js';
const makeForm = (entries) => new Request('https://www.michalrebekahart.co.uk/api/contact',{
  method:'POST',
  headers:{Origin:'https://www.michalrebekahart.co.uk','Content-Type':'application/x-www-form-urlencoded'},
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

test('forwards an authenticated lead to Prunus after Resend accepts the email',async()=>{
  const prior=globalThis.fetch;
  const requests=[];
  try {
    globalThis.fetch=async(url,options)=>{
      requests.push({url,options});
      return {ok:true};
    };
    const pending=[];
    const response=await onRequestPost({
      request:makeForm(good),
      env:{
        RESEND_API_KEY:'test',
        CONTACT_FROM_EMAIL:'artist@example.com',
        CONTACT_TO_EMAIL:'michalrebekahart@gmail.com',
        PRUNUS_LEADS_WEBHOOK_URL:'https://backend.example.com/webhooks/artist-leads',
        PRUNUS_LEADS_WEBHOOK_TOKEN:'test-private-webhook-token'
      },
      context:{waitUntil:p=>pending.push(p)}
    });
    await Promise.all(pending);
    assert.equal(response.status,200);
    assert.equal(requests.length,2);
    assert.equal(requests[0].url,'https://api.resend.com/emails');
    assert.equal(requests[1].url,'https://backend.example.com/webhooks/artist-leads');
    assert.equal(requests[1].options.headers.Authorization,'Bearer test-private-webhook-token');
    const event=JSON.parse(requests[1].options.body);
    assert.equal(event.event,'artwork_enquiry.created');
    assert.equal(event.source,'michalrebekahart.co.uk');
    assert.equal(event.lead.email,'visitor@example.com');
    assert.equal(event.delivery_status,'accepted_by_resend');
  } finally {globalThis.fetch=prior;}
});
test('a failed email never forwards a lead to the backend',async()=>{
  const prior=globalThis.fetch;
  const requests=[];
  try {
    globalThis.fetch=async(url,options)=>{
      requests.push(url);
      return {ok:false};
    };
    const response=await onRequestPost({request:makeForm(good),env:{
      RESEND_API_KEY:'test',
      CONTACT_FROM_EMAIL:'artist@example.com',
      CONTACT_TO_EMAIL:'michalrebekahart@gmail.com',
      PRUNUS_LEADS_WEBHOOK_URL:'https://backend.example.com/webhooks/artist-leads',
      PRUNUS_LEADS_WEBHOOK_TOKEN:'test-private-webhook-token'
    }});
    assert.equal(response.status,502);
    assert.deepEqual(requests,['https://api.resend.com/emails']);
  } finally {globalThis.fetch=prior;}
});
test('a backend failure does not hide successful email submission',async()=>{
  const prior=globalThis.fetch;
  try {
    globalThis.fetch=async(url)=>({ok:url.includes('api.resend.com')});
    const pending=[];
    const response=await onRequestPost({
      request:makeForm(good),
      env:{
        RESEND_API_KEY:'test',
        CONTACT_FROM_EMAIL:'artist@example.com',
        CONTACT_TO_EMAIL:'michalrebekahart@gmail.com',
        PRUNUS_LEADS_WEBHOOK_URL:'https://backend.example.com/webhooks/artist-leads',
        PRUNUS_LEADS_WEBHOOK_TOKEN:'test-private-webhook-token'
      },context:{waitUntil:p=>pending.push(p)}
    });
    await Promise.all(pending);
    assert.equal(response.status,200);
    assert.equal((await response.json()).ok,true);
  } finally {globalThis.fetch=prior;}
});
