# 🪁 Paykite: your agent haggles, you hold the string

Paykite is an AI shopping agent that negotiates a price for you and checks out through **PayPal**. Two software agents (a buyer and a seller) haggle in front of you, your spending rules are enforced **in code**, and money moves only after **you approve on PayPal**.

**Live demo:** https://paykite.onrender.com
(Free hosting sleeps when idle. The first load can take up to a minute.)
**Demo video:** _add link here_
**Category:** AI Agents or Automation

> This is a PayPal **sandbox** demo. No real money moves and no real purchase is made.

## What it does

1. You pick a product (or type: "headphones chahiye, 40 dollar se zyada nahi") and set the most you will pay.
2. A **buyer agent** and a **seller agent** negotiate over several rounds. The chat shows each offer.
3. When they agree, your **spending rules** are checked (per-order limit and monthly budget).
4. Paykite creates a **PayPal order**. You approve it on PayPal, then the server captures the payment.
5. The order appears in an **AG Grid** table with its status: paid, awaiting approval, cancelled, blocked by a rule, or no deal.

## Where PayPal is central

| PayPal feature | How Paykite uses it |
|---|---|
| **Orders API v2** (create, capture) | Every checkout. The deal price becomes a PayPal order. Capture happens only after the buyer approves |
| **OAuth 2.0** | Server-side access tokens, secrets never reach the browser |
| **Payouts API** | Earlier agent prototype in `agent.js` (send money by chat) |
| **Sandbox** | All testing uses fake buyer and seller accounts |

## Safety design: "you hold the string"

The AI-style parts can talk, but the money rules live in code:

- **Seller's minimum price** is never sent to the browser or the buyer agent, and the code refuses any deal below it.
- **Buyer's maximum budget** is enforced in code, so the buyer agent can never offer or accept above it.
- **Spending rules** (`rules.js`) are checked twice: when the deal is made and again right before capture.
- **Human approval**: PayPal itself requires the buyer to approve before any money is captured.
- The browser only sends an order ID. Prices are always taken from the server.
- Rate limiting on public endpoints.

## Product data

- **Demo store:** 12 made-up products (no real brands).
- **Live catalog:** real product titles, photos, prices and merchant links from the **Channel3** API.
- Real stores do not haggle, so for live products the **seller's minimum price is simulated** (80% of the listed price). The UI says so. Payment is PayPal sandbox, so the merchant receives no money.

## How AI and agents are used

- The **buyer** and **seller** are autonomous agents with opposing strategies (buyer starts low and rises toward its budget; seller falls toward its hidden minimum). Their moves are decided by code, so the outcome is predictable and testable.
- **Google Gemini** understands free-text requests in Hinglish when simple parsing cannot ("ek yoga mat kharid do 30 ke andar"). Code is tried first to save quota.
- `agent.js` is an earlier Gemini tool-calling prototype that sends PayPal payouts from chat (with a human confirmation for large amounts). It is not wired into the current UI.

## Sponsor tools

| Tool | Use |
|---|---|
| **Render** | Hosts the live app |
| **Postman** | `postman/` collection with automated tests against PayPal sandbox and the live app |
| **AG Grid** (Community v36.1.0) | Sortable, filterable orders table with CSV export |
| **Channel3** | Live product catalog (search, photos, prices, merchant links) |

## Tests

Import `postman/paykite.postman_collection.json` into Postman and create an environment with `client_id`, `client_secret` and `receiver_email` (your PayPal sandbox values). The collection checks: token, order creation, capture rules, payouts, that `minPrice` never leaks, spending rules, a haggle, and that an over-limit purchase is blocked.

## Run it locally

```bash
git clone https://github.com/akshitmahajan1507-boop/paykite.git
cd paykite
npm install
cp .env.example .env   # then fill in your keys
npm start
```

Open http://localhost:3000. You need a free PayPal developer sandbox app (Client ID and Secret) and a **US** sandbox business and personal account.

## Tech

Node.js, Express, PayPal REST APIs, Google Gemini, Channel3, AG Grid, plain HTML/JS front end.

## Limitations

- Orders and budget live in server memory and reset on restart.
- Live-catalog negotiation is simulated, as explained above.
- Prices are in USD, and live products are limited to what Channel3 returns for the query.

## Built during the hackathon

Paykite was built from scratch during the hackathon submission period.
