# Current Prunus portal connection — 18 November 2026

The standard connection is the site's own server-side Cloudflare Production secret `PORTAL_INGEST_TOKEN` (64 lowercase hexadecimal characters), generated in the Prunus portal for this registered site. After Resend accepts the email, the Pages Function posts a flat lead payload to `https://portal.prunusmedia.com/api/ingest/lead` using bearer authentication. Resend sending and recipients are unchanged. The standard token takes precedence over the previous optional HMAC webhook so only one archive attempt occurs. If the token is absent, the legacy handoff remains available for backward compatibility. Never share a token between businesses. No personal data or secrets in GitHub. Verify actual production deployment and test both email and portal receipt before declaring connected.

---

# Michal Rebekah Art to Prunus Media: contact lead handoff

## What happens when someone submits the art website contact form

1. The visitor chooses an enquiry type and provides a name, email and message.
2. Cloudflare Pages Function at `/api/contact` validates it and sends the email using **Resend**. Destination: `michalrebekahart@hotmail.com`.
3. After Resend accepts the email, the function **optionally** sends the same enquiry to an authenticated Prunus Media backend webhook.
4. If Prunus is not configured or unavailable, the email is still sent. The website never falsely claims the Prunus lead was recorded, and the visitor is told only whether the **email** was accepted.
5. Only a deliberately configured endpoint is called. Nothing is sent to a guessed Prunus URL.

## Required Cloudflare Pages variables

Configure these in both Preview and Production environments, in **Settings > Variables and Secrets**:

| Variable | Meaning |
| --- | --- |
| `RESEND_API_KEY` | Secret key, provided by Resend |
| `CONTACT_FROM_EMAIL` | Email address on a domain verified with Resend, e.g. `Michal Rebekah Art <hello@michalrebekahart.co.uk>` after verification |
| Contact recipient | Fixed in the site's contact handler as `michalrebekahart@hotmail.com` (outdated Cloudflare `CONTACT_TO_EMAIL` and `QUOTE_TO_EMAIL` are ignored) |
| `PRUNUS_LEADS_WEBHOOK_URL` | Optional HTTPS endpoint **you provide**, receiving leads in your Prunus backend |
| `PRUNUS_LEADS_WEBHOOK_SECRET` | Optional high-entropy shared secret used to sign the lead payload |

The Prunus URL and secret must either **both** be configured or **both** be omitted. Never place any API keys or webhook signing secrets in GitHub files, site HTML or client-side JavaScript.

## Payload Prunus should accept

POST JSON:

```json
{
  "event": "art.enquiry.created",
  "event_id": "resend:<provider-email-id>",
  "source": "michal-rebekah-art",
  "source_url": "https://www.michalrebekahart.co.uk/contact/",
  "received_at": "<ISO-8601-time>",
  "lead": {
    "name": "<visitor-name>",
    "email": "<visitor-email>",
    "message": "<visitor-message>",
    "category": "personalised_painting"
  }
}
```

Categories: `general`, `original_artwork`, `personalised_painting`, `childrens_book`, `business_artwork`, `other`.

HTTP headers:
- `X-Prunus-Event: art.enquiry.created`
- `X-Prunus-Timestamp: <unix-seconds>`
- `X-Prunus-Signature: sha256=<lowercase-hex-hmac>`
- `X-Prunus-Idempotency-Key: resend:<provider-email-id>`

**Signature contract:** HMAC-SHA256 over the exact UTF-8 bytes of `timestamp + "." + rawRequestBody`, with `PRUNUS_LEADS_WEBHOOK_SECRET` as the shared key. Compare signatures in constant time; require timestamps within approximately five minutes of the server time; reject invalid signatures and replayed event IDs; persist the idempotency key to prevent duplicate records. Use the raw JSON request body to verify the signature, not JSON re-serialization.

Example verification logic (Node.js, run **on the Prunus server**, not in the browser):

```js
import { createHmac, timingSafeEqual } from "node:crypto";

function checkSignature(rawBody, timestamp, suppliedSignature, secret) {
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(timestamp + ".")
    .update(rawBody)
    .digest("hex");

  const supplied = String(suppliedSignature || "").replace(/^sha256=/, "");
  if (!/^[a-f0-9]{64}$/.test(supplied)) return false;

  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
}
```

Backend mapping suggestion: source website = Michal Rebekah Art; lead type = art enquiry; status = new; category as provided; owner = art enquiries inbox. Do not automatically send commercial marketing or copy the message to unrelated client accounts.

## Reliability and limitations

- Resend acceptance is the success condition for the website form. Provider acceptance does **not** guarantee a person has opened the message.
- The Prunus webhook is **best effort** with a 4.5-second timeout; it is not a guaranteed delivery queue. If storing every lead in Prunus becomes business-critical, add a proper durable Cloudflare Queue/outbox and retry/dead-letter handling.
- Cloudflare Pages `context.waitUntil` keeps the best-effort webhook attempt running after the response. The route also supports direct awaiting in tests.
- The backend must already have a route that accepts and validates this contract. We have not altered any other repository or claimed the endpoint exists.
- Update the privacy statement before enabling the Prunus integration. The website now discloses that the same lead may be recorded securely in the internal Prunus Media business system.

## Verification checklist

- Confirm domain verified in Resend.
- Set the three Resend variables and send one genuine form submission, then check Mikie's inbox and reply-to.
- Configure the two Prunus variables with the real verified endpoint and shared secret.
- Submit one test enquiry of each type. Confirm exactly one new lead per submission in the Prunus backend.
- Temporarily make the Prunus endpoint unavailable and confirm that Mikie still receives the email.
- Confirm cloud configuration has an appropriate form rate limit/bot protection.
