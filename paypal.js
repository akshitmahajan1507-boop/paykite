require("dotenv").config();

const BASE = process.env.PAYPAL_BASE;

// Token lena
async function getToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("Token nahi mila: " + JSON.stringify(data));
  return data.access_token;
}

// Invoice banana aur bhejna
async function createInvoice({ name, email, amount, description }) {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 1) Draft invoice banao
  const draftRes = await fetch(`${BASE}/v2/invoicing/invoices`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      detail: {
        currency_code: "USD",
        note: description,
      },
      primary_recipients: [
        {
          billing_info: {
            name: { given_name: name },
            email_address: email,
          },
        },
      ],
      items: [
        {
          name: description,
          quantity: "1",
          unit_amount: { currency_code: "USD", value: String(amount) },
        },
      ],
    }),
  });

  const draft = await draftRes.json();
  if (!draftRes.ok) throw new Error("Draft fail: " + JSON.stringify(draft));

  // Response mein invoice ka link aata hai, usse ID nikalo
  const invoiceId = draft.href.split("/").pop();

  // 2) Invoice send karo
  const sendRes = await fetch(`${BASE}/v2/invoicing/invoices/${invoiceId}/send`, {
    method: "POST",
    headers,
    body: JSON.stringify({ send_to_recipient: true }),
  });

  const sent = await sendRes.json();
  if (!sendRes.ok) throw new Error("Send fail: " + JSON.stringify(sent));

  return { invoiceId, status: "SENT", link: sent.href };
}
// Payout bhejna
async function sendPayout({ email, amount, note }) {
  const token = await getToken();

  const res = await fetch(`${BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: "batch_" + Date.now(),
        email_subject: "You have a payment",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: { value: String(amount), currency: "USD" },
          receiver: email,
          note: note || "Payment",
          sender_item_id: "item_" + Date.now(),
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Payout fail: " + JSON.stringify(data));

  return {
    batchId: data.batch_header.payout_batch_id,
    status: data.batch_header.batch_status,
  };
}

// Checkout order banana (buyer ko approve karna hoga)
async function createOrder({ title, amount, returnUrl, cancelUrl }) {
  const token = await getToken();
  const value = Number(amount).toFixed(2);

  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": "order_" + Date.now(),
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: title,
          amount: {
            currency_code: "USD",
            value,
            breakdown: { item_total: { currency_code: "USD", value } },
          },
          items: [
            {
              name: title,
              quantity: "1",
              unit_amount: { currency_code: "USD", value },
            },
          ],
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Paykite Demo Store",
            user_action: "PAY_NOW",
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Order fail: " + JSON.stringify(data));

  const link = (data.links || []).find(
    (l) => l.rel === "payer-action" || l.rel === "approve"
  );
  return { orderId: data.id, status: data.status, approveUrl: link && link.href };
}

// Buyer approve kar de, tab paisa capture karna
async function captureOrder(orderId) {
  const token = await getToken();

  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Capture fail: " + JSON.stringify(data));

  const cap = data.purchase_units?.[0]?.payments?.captures?.[0];
  return { orderId: data.id, status: data.status, captureId: cap?.id, amount: cap?.amount?.value };
}
module.exports = { getToken, createInvoice, sendPayout, createOrder, captureOrder };