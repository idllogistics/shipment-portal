import Anthropic from "@anthropic-ai/sdk";

export type ExtractedInvoiceFields = {
  itemDescription: string | null;
  itemQuantity: string | null;
  declaredValue: number | null;
  declaredValueCurrency: string | null;
  error: string | null;
};

const EMPTY_RESULT: ExtractedInvoiceFields = {
  itemDescription: null,
  itemQuantity: null,
  declaredValue: null,
  declaredValueCurrency: null,
  error: null,
};

function mediaTypeFor(mimeType: string): "image" | "document" | null {
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
    return "image";
  }
  if (mimeType === "application/pdf") return "document";
  return null;
}

export async function extractInvoiceFields(
  fileBuffer: Buffer,
  mimeType: string
): Promise<ExtractedInvoiceFields> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ...EMPTY_RESULT, error: "ANTHROPIC_API_KEY is not configured" };
  }

  const kind = mediaTypeFor(mimeType);
  if (!kind) {
    return { ...EMPTY_RESULT, error: `Unsupported document type: ${mimeType}` };
  }

  const anthropic = new Anthropic({ apiKey });
  const base64 = fileBuffer.toString("base64");

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            kind === "image"
              ? {
                  type: "image",
                  source: { type: "base64", media_type: mimeType as "image/jpeg", data: base64 },
                }
              : {
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: base64 },
                },
            {
              type: "text",
              text: `This is a commercial invoice or packing list for a freight shipment. Extract these fields and reply with ONLY a JSON object, no other text:

{
  "itemDescription": string or null — a short summary of the goods (e.g. "50x steel brackets, 20x electrical cable reels"),
  "itemQuantity": string or null — total quantity/unit count as written (e.g. "70 units" or "12 cartons"),
  "declaredValue": number or null — the total declared/invoice value as a plain number (no currency symbols or commas),
  "declaredValueCurrency": string or null — the 3-letter currency code (e.g. "AED", "USD"). Guess "AED" if a dirham symbol or no currency is shown but the document otherwise looks UAE-based.
}

If you can't confidently read a field, use null for it rather than guessing wildly. Reply with ONLY the JSON object.`,
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ...EMPTY_RESULT, error: "No text response from model" };
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { ...EMPTY_RESULT, error: "Couldn't parse a JSON response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      itemDescription:
        typeof parsed.itemDescription === "string" ? parsed.itemDescription : null,
      itemQuantity: typeof parsed.itemQuantity === "string" ? parsed.itemQuantity : null,
      declaredValue:
        typeof parsed.declaredValue === "number" ? parsed.declaredValue : null,
      declaredValueCurrency:
        typeof parsed.declaredValueCurrency === "string"
          ? parsed.declaredValueCurrency
          : null,
      error: null,
    };
  } catch (err) {
    return {
      ...EMPTY_RESULT,
      error: err instanceof Error ? err.message : "Unknown OCR error",
    };
  }
}
