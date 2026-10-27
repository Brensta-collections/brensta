import { prisma } from "@/lib/db";
import {
  BUSINESS_EMAIL,
  BUSINESS_PHONE_DISPLAY,
  LEGAL_ENTITY_NAME,
  LEGAL_ADDRESS,
  GSTIN,
  GRIEVANCE_OFFICER,
  DISPUTE_JURISDICTION,
} from "@/lib/business";

export const POLICY_SLUGS = [
  "privacy", "terms", "shipping", "returns",
  "cancellation", "payment", "grievance", "faq", "cookies",
] as const;

export type PolicySlug = (typeof POLICY_SLUGS)[number];

/**
 * Owner-confirmed policy templates loaded when the DB `Policy` row for a
 * slug has no admin-saved body yet. All business-specific values (legal
 * entity, registered address, grievance officer, dispute jurisdiction,
 * return window, refund SLAs) are inlined from @/lib/business — single
 * source of truth. If anything changes (new address, new phone), update
 * lib/business.ts and these templates re-render automatically.
 *
 * These bodies are read by scripts/launch-check.ts; any remaining
 * `[PLACEHOLDER]` in a user-facing paragraph will cause the pre-launch
 * script to fail loudly.
 */
const DRAFT_BODIES: Record<PolicySlug, { title: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

This Privacy Policy explains how BRENSTA collects, uses and protects the personal information you share with us when you shop on our website.

## 1. Who we are
BRENSTA is a women's fashion and lifestyle brand operated by ${LEGAL_ENTITY_NAME} (hereafter "we", "us", "BRENSTA"), with registered business address: ${LEGAL_ADDRESS}. You can reach us at ${BUSINESS_EMAIL} or ${BUSINESS_PHONE_DISPLAY}.

## 2. What we collect
When you shop with us we collect:
- Account information you provide (name, email, mobile).
- Shipping and billing addresses.
- Order and payment metadata (your card / UPI details are handled by our payment partner, not stored by us).
- Technical information needed to run the site (cookies required for sign-in and cart).

## 3. How we use your data
- To process, pack and deliver your orders.
- To send order updates, delivery notifications and support messages.
- To respond to your questions and resolve complaints.
- To improve our storefront and detect fraud.

## 4. Who we share it with
- Shipping and payment partners we work with — only the minimum data they need to complete your order.
- Government or regulatory authorities when required by law.

We do **not** sell your data to anyone.

## 5. How long we keep it
We retain order and billing data for the period required by Indian tax law (typically 8 years). Account data is retained for as long as your account is active; you may ask us to delete it at any time.

## 6. Your rights (DPDP Act 2023)
Under India's Digital Personal Data Protection Act 2023, you have the right to:
- Access the personal data we hold about you.
- Correct inaccuracies.
- Request erasure (subject to tax-law retention above).
- Withdraw consent for marketing communication.

Write to ${BUSINESS_EMAIL} with your request. We will respond within **30 days**.

## 7. Security
We use industry-standard HTTPS encryption in transit and bcrypt-hashed passwords at rest. Payment information is handled by our PCI-compliant payment partner and never touches our servers. If we ever detect a breach that affects you, we will notify you promptly.

## 8. Cookies
See our [Cookie Notice](/p/policies/cookies).

## 9. Grievance Officer
Any complaint about this policy or your personal data should be addressed to our Grievance Officer — details on the [Contact & Grievance Redressal](/p/policies/grievance) page.

## 10. Changes
We will post updates on this page with a new "Last updated" date. Material changes will also be announced via email to registered customers.
`,
  },
  terms: {
    title: "Terms & Conditions",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

These Terms govern your use of the BRENSTA store, operated by ${LEGAL_ENTITY_NAME}, with registered business address: ${LEGAL_ADDRESS}. GSTIN: ${GSTIN}.

## 1. Acceptance
By placing an order on www.brensta.com, you confirm that:
- You are at least 18 years old (or have the consent of a parent / guardian).
- The information you provide (name, address, phone, email) is true and accurate.
- You accept these Terms and all referenced policies.

## 2. Products and pricing
We describe our products as accurately as possible. Colours, finish and texture may vary slightly between devices and from the actual product. Prices on this website are in **Indian Rupees (INR)** and inclusive of applicable GST unless clearly stated otherwise.

## 3. Orders
We reserve the right to cancel an order if:
- An item is out of stock.
- The price was displayed incorrectly due to a technical error.
- We reasonably suspect fraudulent activity.
In each case we will refund any amount already paid.

## 4. Delivery
See our [Shipping & Delivery Policy](/p/policies/shipping) for dispatch times, delivery windows and shipping charges.

## 5. Returns, refunds and cancellation
See our [Returns & Refunds Policy](/p/policies/returns) and [Cancellation Policy](/p/policies/cancellation).

## 6. Intellectual property
All product photographs, descriptions and the BRENSTA wordmark are our property. You may not copy, resell or reuse them without our prior written permission.

## 7. Prohibited use
You agree not to use the website in any way that is unlawful, infringes any third-party right, or disrupts the service for other customers.

## 8. Limitation of liability
To the extent permitted by Indian law, our total liability for any claim arising from an order will not exceed the amount you paid for that order.

## 9. Governing law and jurisdiction
These Terms are governed by the laws of India. Any dispute will be resolved exclusively by the competent courts at **${DISPUTE_JURISDICTION}**.

## 10. Contact
For questions about these Terms, write to ${BUSINESS_EMAIL} or call ${BUSINESS_PHONE_DISPLAY}.
`,
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

## Dispatch
- We dispatch orders from our Pune warehouse within **1–2 working days** of order confirmation (Monday–Saturday, excluding public holidays).
- Once your order is dispatched, you will receive a tracking link by email and WhatsApp.

## Delivery windows
- **Metros** (Mumbai, Delhi, Bengaluru, Chennai, Kolkata, Hyderabad, Pune): typically **3–5 working days** after dispatch.
- **Tier-2 cities**: typically **4–7 working days** after dispatch.
- **Other serviceable PIN codes**: typically **5–10 working days** after dispatch.

Delivery timelines are estimates. Festival seasons, weather and courier backlogs can cause occasional delays — we will keep you informed if your order is affected.

## Shipping charges
| Order value | Shipping fee |
| --- | --- |
| Orders above ₹999 | **Free** |
| Orders ₹1 – ₹998 | Flat ₹50 |

**Cash on Delivery (COD)** is available in serviceable PIN codes with an additional ₹40 handling fee.

## PIN code serviceability
Our courier partners cover most Indian PIN codes. If your area is not serviceable we will notify you at the time of checkout.

## Non-delivery
If a delivery attempt is made and the parcel cannot be handed over (locked premises, incorrect address, recipient unavailable), our courier partner will make up to **2 further attempts** before returning the parcel to us. We will contact you by phone before the return is initiated.

## Questions
For shipping-related queries, write to ${BUSINESS_EMAIL} or call ${BUSINESS_PHONE_DISPLAY} with your order number.
`,
  },
  returns: {
    title: "Returns & Refunds Policy",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

We want you to love your BRENSTA order. If something is not right, here is how returns and refunds work.

## Return window
You may request a return within **7 days of delivery**. Requests beyond this window cannot be accepted.

## Return eligibility
To be accepted, the product must be:
- **Unused and unworn**, with no signs of use, perfume or stains.
- With **all original tags attached** and the original packaging intact.
- Accompanied by the invoice / order number.

## Items not eligible for return
For hygiene and safety reasons, the following are **non-returnable**:
- Pierced earrings (including jhumkas, studs, nose pins).
- Items marked "Final Sale" or "Clearance" on the product page.
- Products damaged due to misuse by the customer.

## How to request a return
1. Visit your [My Orders](/account/orders) page and open the order.
2. Click "Request return" and briefly tell us the reason.
3. Our team will respond within **48 hours** with either an approval and pickup schedule, or a reason for refusing the request.

Alternatively, write to ${BUSINESS_EMAIL} with your order number.

## Pickup
If approved, our courier will pick up the parcel from your address. In case our courier does not service your PIN code for returns, we will arrange a self-ship with a reimbursed shipping fee (up to ₹100).

## Refunds
- Refunds are issued to the **original payment method** within **7 working days** of the returned item reaching our warehouse and passing a quality check.
- COD orders are refunded via UPI / bank transfer to the bank account you provide at return time.
- Shipping charges on the original order are **not refunded** unless the return was due to a defect or wrong item shipped.

## Damaged, defective or wrong item
If the item arrived damaged, defective or is not what you ordered:
- Report it within **48 hours of delivery** by writing to ${BUSINESS_EMAIL} with photos.
- We will replace the item at no extra cost or refund you in full, whichever you prefer.

## Exchanges
We currently do not offer direct exchanges. If you want a different size or variant, please return the original item and place a fresh order.
`,
  },
  cancellation: {
    title: "Cancellation Policy",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

## By you
- You may cancel an order **free of charge** at any time before it is dispatched. Visit [My Orders](/account/orders), open the order, and click "Cancel".
- Once the order is dispatched, cancellation is no longer possible. If you no longer want the item, follow the [Returns & Refunds Policy](/p/policies/returns) after delivery.

## By us
We may cancel your order and issue a full refund if:
- The item is out of stock.
- A pricing or system error has occurred.
- We are unable to verify the delivery address or we reasonably suspect fraud.

## Cash on Delivery (COD)
- COD orders are cancelled by the system if **two consecutive delivery attempts fail** and you cannot be reached by the courier.
- Repeated COD refusals from the same customer may lead us to disable COD on future orders for that account.

## Refund of cancelled orders
Refunds for prepaid orders are initiated within **24 hours of cancellation** and typically reach you in **5–7 working days**, depending on your bank or UPI app.
`,
  },
  payment: {
    title: "Payment Policy",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

We accept:
- Cash on Delivery (COD) in serviceable pincodes, with a ₹40 handling fee.
- Online payments via UPI, credit/debit cards and net-banking **(coming soon via Razorpay; the live gateway will be enabled only after the owner's explicit approval).**

Prices are shown in INR and are inclusive of applicable GST unless stated otherwise. We never store your card or UPI details on our servers — those are handled by the payment gateway's PCI-compliant infrastructure.
`,
  },
  grievance: {
    title: "Contact & Grievance Redressal",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

Under the **Consumer Protection (E-Commerce) Rules 2020**, every e-commerce entity in India must appoint a Grievance Officer and publish their contact details.

## Grievance Officer

| Field | Detail |
| --- | --- |
| **Name** | ${GRIEVANCE_OFFICER.name} |
| **Role** | Grievance Officer, BRENSTA |
| **Email** | ${GRIEVANCE_OFFICER.email} |
| **Phone / WhatsApp** | ${GRIEVANCE_OFFICER.phone} |
| **Address** | ${LEGAL_ADDRESS} |
| **GSTIN** | ${GSTIN} |

## How to raise a complaint

1. **Preferred:** email ${BUSINESS_EMAIL} with your order number and a short description of the issue.
2. **Alternatively:** call or WhatsApp ${BUSINESS_PHONE_DISPLAY} between 10:00 and 19:00 IST (Monday–Saturday).
3. **In writing:** send a letter to the registered address above.

## Service levels

- We **acknowledge** every complaint within **48 hours** of receipt.
- We **resolve** or respond substantively within **15 working days**, in line with the Consumer Protection Rules 2020.
- If a complaint requires longer investigation (e.g. courier dispute), we will keep you updated every 5 working days until closure.

## Escalation

If you are not satisfied with the response of the Grievance Officer, you may escalate to:

- **National Consumer Helpline** — 1915 or https://consumerhelpline.gov.in
- **The National Consumer Disputes Redressal Commission** — https://edaakhil.nic.in
- The jurisdictional Consumer Dispute Redressal Forum at **${DISPUTE_JURISDICTION}**.
`,
  },
  faq: {
    title: "Frequently Asked Questions",
    body: `## How do I place an order?
Browse our collections, add items to your cart and head to checkout. You can sign in or create an account at the checkout step.

## Where do you deliver?
We deliver across India. Dispatch times and expected delivery windows are listed in our [Shipping Policy](/p/policies/shipping) and will be finalised with our courier partners before launch.

## Is Cash on Delivery available?
Yes, with a ₹40 handling fee, subject to pincode serviceability.

## How can I track my order?
Once your order ships you'll find a tracking link in your [My Orders](/account/orders) page.

## What is your return policy?
See our [Returns & Refunds Policy](/p/policies/returns). You have **7 days from delivery** to request a return; pierced earrings and final-sale items are not returnable.

## How do I contact you?
Write to ${BUSINESS_EMAIL}, call ${BUSINESS_PHONE_DISPLAY}, or use the [Contact](/contact) page.
`,
  },
  cookies: {
    title: "Cookie Notice",
    body: `We use a small number of cookies strictly to run the site:

| Cookie | Purpose |
| --- | --- |
| \`brensta_guest\` | Keeps your cart items while you shop without an account. |
| \`authjs.session-token\` | Keeps you signed in. |

We **do not** use third-party advertising cookies on this build. Should we add privacy-respecting analytics later we will update this page.
`,
  },
};

export async function getPolicy(slug: PolicySlug) {
  const row = await prisma.policy.findUnique({ where: { slug } });
  const draft = DRAFT_BODIES[slug];
  if (!row) return { title: draft.title, body: draft.body, updatedAt: null as Date | null };
  // If admin has customised the body (non-placeholder-only), use theirs. Otherwise use draft.
  const isPlaceholderOnly = /_?\[PLACEHOLDER/.test(row.bodyMarkdown) && row.bodyMarkdown.length < 300;
  return {
    title: row.title ?? draft.title,
    body: isPlaceholderOnly ? draft.body : row.bodyMarkdown,
    updatedAt: row.updatedAt,
  };
}
