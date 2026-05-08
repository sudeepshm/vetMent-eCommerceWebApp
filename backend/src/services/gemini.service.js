/**
 * gemini.service.js
 *
 * Wraps the @google/genai SDK to provide a conversational style advisor
 * that is context-aware of the current product catalog.
 */

const { GoogleGenAI } = require("@google/genai")

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const MODEL = "gemini-2.0-flash"

/**
 * Build the system prompt injected into every advisor session.
 * @param {Array} catalog  – Lightweight product snapshot from MongoDB
 * @returns {string}
 */
function buildSystemPrompt(catalog) {
  const catalogText = catalog
    .map(
      (p) =>
        `ID:${p._id} | ${p.name} | ${p.category} | $${p.price} | sizes: ${(p.sizes || []).join(", ")} | tags: ${(p.tags || []).join(", ")}`
    )
    .join("\n")

  return `You are a luxury fashion style advisor for VÊTEMENT, an AI-powered e-commerce store.
Your role is to:
- Help customers discover outfits and garments from the current catalog
- Provide personalised styling tips, outfit combinations, and trend insights
- Reference specific products by name and ID when relevant
- Keep responses concise, elegant, and on-brand for a luxury fashion house
- When recommending products include a markdown link like [Product Name](/product/PRODUCT_ID)

CURRENT CATALOG (${catalog.length} items):
${catalogText}

Always respond in English. Do not fabricate products that are not in the catalog.`
}

/**
 * Send a user message to the Gemini API with full catalog context.
 *
 * @param {string} message          – The user's text message
 * @param {Array}  catalog          – Catalog snapshot array from DB
 * @param {string|null} imageBase64 – Optional base64-encoded image (without data URI prefix)
 * @param {string|null} imageMime   – MIME type of the image (e.g. "image/jpeg")
 * @returns {Promise<string>}       – The advisor's reply text
 */
async function askStyleAdvisor(message, catalog, imageBase64 = null, imageMime = null) {
  const systemInstruction = buildSystemPrompt(catalog)

  const contents = []

  // Add image part if provided (multimodal)
  if (imageBase64 && imageMime) {
    contents.push({
      inlineData: {
        mimeType: imageMime,
        data: imageBase64,
      },
    })
  }

  // Always add the text message
  contents.push({ text: message })

  const response = await genAI.models.generateContent({
    model: MODEL,
    config: { systemInstruction },
    contents: [{ role: "user", parts: contents }],
  })

  return response.text() ?? "I'm sorry, I could not generate a response. Please try again."
}

module.exports = { askStyleAdvisor }
