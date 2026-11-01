require("dotenv").config();
const { GoogleGenAI, Type } = require("@google/genai");
const { sendPayout } = require("./paypal");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Pehla model fail ho to doosra try hoga
const MODELS = ["gemini-3.5-flash", "gemini-3.8-flash"];

// Naam -> sandbox email. Apne sandbox Personal emails yahan daalo
const CONTACTS = {
  priya: "sb-ylw2m53613855@personal.example.com",
  rahul: "sb-ylw2m53613855@personal.example.com",
};

const MAX_AUTO_AMOUNT = 100; // isse upar abhi allowed nahi
const payoutLog = []; // UI ke side panel ke liye

const tools = [
  {
    functionDeclarations: [
      {
        name: "send_payout",
        description:
          "Send money in USD to a contact via PayPal. Use the contact's name.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Contact name, e.g. Priya" },
            amount: { type: Type.NUMBER, description: "Amount in USD" },
            note: { type: Type.STRING, description: "Short note for the payment" },
          },
          required: ["name", "amount"],
        },
      },
    ],
  },
];

async function callModel(contents) {
  let lastErr;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          contents,
          config: {
            tools,
            systemInstruction:
              "You are Paykite, an assistant that sends PayPal payments. " +
              "Only use the send_payout tool when the user clearly asks to pay someone. " +
              "Reply in the same language as the user, briefly.",
          },
        });
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  throw lastErr;
}

// Tool ko asli kaam yahan milta hai
async function runTool(name, args, { confirmed = false } = {}) {
  if (name === "send_payout") {
    const email = CONTACTS[String(args.name).toLowerCase()];
    if (!email) return { error: `Contact '${args.name}' not found` };
    if (!(args.amount > 0)) return { error: "Amount must be greater than 0" };

    // Bada amount: bina user ki ha ke paisa nahi jayega
    if (args.amount > MAX_AUTO_AMOUNT && !confirmed) {
      return { needsConfirmation: true };
    }

    const r = await sendPayout({ email, amount: args.amount, note: args.note });
        payoutLog.unshift({
      time: new Date().toLocaleTimeString(),
      name: args.name,
      amount: args.amount,
      status: r.status,
    });
    return { ok: true, batchId: r.batchId, status: r.status };
  }
  return { error: "Unknown tool" };
}

async function runAgent(userMessage) {
  const contents = [{ role: "user", parts: [{ text: userMessage }] }];

  for (let step = 0; step < 5; step++) {
    const response = await callModel(contents);
    const calls = response.functionCalls;

    if (!calls || calls.length === 0) return { type: "text", text: response.text };

    contents.push(response.candidates[0].content);

    const parts = [];
    for (const call of calls) {
      console.log("🔧 Tool call:", call.name, call.args);
      const result = await runTool(call.name, call.args);

      // Confirmation chahiye to yahin ruk jao aur user se pucho
      if (result.needsConfirmation) {
        return {
          type: "confirm",
          action: { name: call.name, args: call.args },
          message: `${call.args.name} ko $${call.args.amount} bhejna hai. Confirm karein?`,
        };
      }

      console.log("   Result:", result);
      parts.push({ functionResponse: { name: call.name, response: result } });
    }
    contents.push({ role: "user", parts });
  }
  return { type: "text", text: "Too many steps, stopped." };
}

// User ne "Confirm" dabaya, tab ye chalega
async function confirmAction(action) {
  return await runTool(action.name, action.args, { confirmed: true });
}

module.exports = { runAgent, confirmAction, payoutLog };