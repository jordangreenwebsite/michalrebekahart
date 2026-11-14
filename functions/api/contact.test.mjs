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
