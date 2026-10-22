import { prisma } from "@/lib/db";

export const POLICY_SLUGS = [
  "privacy", "terms", "shipping", "returns",
  "cancellation", "payment", "grievance", "faq", "cookies",
] as const;

export type PolicySlug = (typeof POLICY_SLUGS)[number];

/**
 * Draft templates loaded only when the DB has no body text yet.
 * [PLACEHOLDER] markers highlight business-specific values the owner must confirm
 * and legal counsel should review before publishing.
 */
const DRAFT_BODIES: Record<PolicySlug, { title: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

This is a **draft policy** prepared for BRENSTA — a women's fashion and lifestyle store operating in India. **[PLACEHOLDER — have this reviewed by qualified legal counsel before publishing.]**

## 1. Who we are
BRENSTA is operated by _[PLACEHOLDER — legal entity name]_ (hereafter "we", "us"), registered at _[PLACEHOLDER — registered business address]_. You can reach us at _[PLACEHOLDER — contact email]_ or _[PLACEHOLDER — contact phone]_.

## 2. What we collect
When you shop with us we collect:
- Account information you provide (name, email, mobile).
- Shipping and billing addresses.
- Order and payment metadata (your card/UPI details are handled by our payment partner, not stored by us).
- Technical information needed to run the site (cookies required for sign-in and cart).

## 3. How we use your data
- To process and deliver your orders.
- To send order updates and support messages.
- To improve the store and prevent fraud.

## 4. Who we share it with
- Shipping and payment partners we work with (only what they need to complete your order).
- Government authorities when required by law.

We do **not** sell your data.

## 5. Your rights
Under Indian data-protection law (DPDP Act 2023) you can request access to, correction of, or deletion of your personal data. Write to _[PLACEHOLDER — grievance email]_ and we will respond within _[PLACEHOLDER — SLA]_.

## 6. Security
We use industry-standard encryption in transit and hashed passwords at rest. No system is ever perfectly secure; if we detect a breach that affects you, we will notify you promptly.

## 7. Changes
We will post updates on this page with a new "Last updated" date.
`,
  },
  terms: {
    title: "Terms & Conditions",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

These Terms govern your use of the BRENSTA store, operated by _[PLACEHOLDER — legal entity name]_.

## 1. Acceptance
By placing an order you confirm you are at least 18, that the information you provided is accurate, and that you accept these Terms.

## 2. Products and pricing
We make every effort to describe our products accurately. Colours and textures may vary slightly between devices. Prices on this website are in INR and inclusive of applicable taxes unless stated otherwise.

## 3. Orders
We may cancel an order if an item is out of stock, the price was listed incorrectly, or we suspect fraudulent activity. In those cases we will refund you in full.

## 4. Delivery
See the [Shipping & Delivery Policy](/p/policies/shipping).

## 5. Returns & refunds
See the [Returns & Refunds Policy](/p/policies/returns) and the [Cancellation Policy](/p/policies/cancellation).

## 6. Intellectual property
All product photographs, descriptions and the BRENSTA wordmark are our property and may not be reused without our written permission.

## 7. Governing law
These Terms are governed by Indian law. Disputes will be resolved in the courts of _[PLACEHOLDER — jurisdiction]_.
`,
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

**This is a draft policy for a development build. [PLACEHOLDER — the owner must confirm courier partners and SLAs before this is published.]**

- We dispatch orders within _[PLACEHOLDER — e.g. 1–2 working days]_.
- Expected delivery time: _[PLACEHOLDER — e.g. 5–7 working days]_ depending on your location.
- A tracking number will be shared with you once your order is dispatched.
- Shipping is free on orders above ₹999. Smaller orders attract a flat ₹50 shipping fee.
- Cash on Delivery is available in serviceable pincodes with a nominal handling fee of ₹40.
`,
  },
  returns: {
    title: "Returns & Refunds Policy",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

**Draft — please confirm the actual window and process before publishing. [PLACEHOLDER]**

- Return window: _[PLACEHOLDER — e.g. 7 days from delivery]_.
- Items must be unused, unworn, with original tags and packaging.
- Earrings, intimate wear and items marked "final sale" are not eligible for return.
- Refunds are issued to the original payment method within _[PLACEHOLDER — SLA]_ of the item reaching our warehouse.

To request a return, visit your [My Orders](/account/orders) page or write to _[PLACEHOLDER — support email]_.
`,
  },
  cancellation: {
    title: "Cancellation Policy",
    body: `_Last updated: ${new Date().toISOString().slice(0, 10)}_

- You may cancel an order free of charge any time before it is dispatched.
- Once dispatched, the order can only be returned under the [Returns & Refunds Policy](/p/policies/returns).
- Cash on Delivery orders are cancelled by the system if the first delivery attempt fails and no response is received within _[PLACEHOLDER — SLA]_.
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

Under the Consumer Protection (E-Commerce) Rules 2020, every e-commerce entity in India must appoint a grievance officer.

**Grievance Officer:** _[PLACEHOLDER — name]_
**Email:** _[PLACEHOLDER — grievance email]_
**Phone:** _[PLACEHOLDER — grievance phone, business hours only]_
**Address:** _[PLACEHOLDER — registered business address]_

We acknowledge every complaint within _[PLACEHOLDER — SLA, typically 48 hours]_ and aim to resolve it within _[PLACEHOLDER — SLA, typically 15–30 days]_.
`,
  },
  faq: {
    title: "Frequently Asked Questions",
    body: `## How do I place an order?
Browse our collections, add items to your cart and head to checkout. You can sign in or create an account at the checkout step.

## Where do you deliver?
We deliver across India. Delivery is typically 5–7 working days from dispatch.

## Is Cash on Delivery available?
Yes, with a ₹40 handling fee, subject to pincode serviceability.

## How can I track my order?
Once your order ships you'll find a tracking link in your [My Orders](/account/orders) page.

## What is your return policy?
See our [Returns & Refunds Policy](/p/policies/returns). _[PLACEHOLDER — confirm final window before publishing.]_

## How do I contact you?
Write to _[PLACEHOLDER — contact email]_ or use the [Contact](/contact) page.
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
