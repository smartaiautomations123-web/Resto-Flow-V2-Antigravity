import { OpenAI } from "openai";
import { z } from "zod";
import { ENV } from "../_core/env";

// Initialize OpenAI client
// We use a dummy key if not provided so it doesn't crash on boot, but will fail gracefully if actually called without a key.
const openai = new OpenAI({
    apiKey: ENV.openaiApiKey || "dummy-key-for-build",
});

// -----------------------------------------------------------------------------
// AI Menu Importer types & functions
// -----------------------------------------------------------------------------

export const aiMenuSchema = z.object({
    categories: z.array(z.object({
        name: z.string().describe("The name of the menu category, e.g., 'Appetizers', 'Mains', 'Drinks'"),
        items: z.array(z.object({
            name: z.string().describe("The name of the dish/item"),
            description: z.string().optional().describe("A brief description of the item, if provided on the menu"),
            price: z.string().describe("The price of the item as a string without currency symbols, e.g., '12.99'"),
            dietaryFlags: z.array(z.string()).optional().describe("E.g., 'Vegan', 'Gluten-Free', 'Spicy'"),
        }))
    }))
});

export type AiMenuResult = z.infer<typeof aiMenuSchema>;

/**
 * Parses a menu image into a structured JSON format using OpenAI's Vision model.
 */
export async function parseMenuImage(base64Image: string): Promise<AiMenuResult> {
    if (!ENV.openaiApiKey) {
        throw new Error("OpenAI API Key is not configured in environment variables.");
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an expert data extraction assistant for a restaurant management platform. Your job is to extract all categories, menu items, prices, descriptions, and dietary flags from the provided menu image and format it precisely according to the requested JSON schema."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Please parse this menu image and return the structured data." },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                                detail: "high"
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content returned from AI");
        }

        // Try parsing the returned string as JSON
        const parsedData = JSON.parse(content);

        // Validate the parsed data against our Zod schema
        const validatedData = aiMenuSchema.parse(parsedData);

        return validatedData;
    } catch (error) {
        console.error("Error parsing menu image with AI:", error);
        throw new Error(`Failed to parse menu image: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

// -----------------------------------------------------------------------------
// AI Invoice Scanner types & functions
// -----------------------------------------------------------------------------

export const aiInvoiceSchema = z.object({
    supplierName: z.string().optional().describe("The name of the supplier or vendor on the invoice"),
    invoiceDate: z.string().optional().describe("The date of the invoice (YYYY-MM-DD if possible)"),
    invoiceNumber: z.string().optional().describe("The invoice ticket number"),
    totalAmount: z.string().optional().describe("The total amount billed"),
    items: z.array(z.object({
        description: z.string().describe("The name or description of the product purchased"),
        quantity: z.number().describe("The amount purchased (e.g., if it says '3 cases', the quantity is 3)"),
        unitOfMeasure: z.string().optional().describe("E.g., 'case', 'lbs', 'kg', 'each'"),
        unitPrice: z.string().describe("The price for a single unit as a string (e.g., '15.50')"),
        totalPrice: z.string().describe("The total price for this line item (e.g., '46.50')"),
    }))
});

export type AiInvoiceResult = z.infer<typeof aiInvoiceSchema>;

/**
 * Parses an invoice image into a structured JSON format using OpenAI's Vision model.
 */
export async function parseInvoiceImage(base64Image: string): Promise<AiInvoiceResult> {
    if (!ENV.openaiApiKey) {
        throw new Error("OpenAI API Key is not configured in environment variables.");
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an expert accounting assistant for a restaurant. Extract the supplier details, invoice metadata, and every single line item strictly according to the requested JSON schema from the provided invoice image."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Please parse this supplier invoice and return the structured data." },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                                detail: "high"
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No content returned from AI");
        }

        const parsedData = JSON.parse(content);
        const validatedData = aiInvoiceSchema.parse(parsedData);

        return validatedData;
    } catch (error) {
        console.error("Error parsing invoice image with AI:", error);
        throw new Error(`Failed to parse invoice image: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

// -----------------------------------------------------------------------------
// AI Dynamic Combos types & functions
// -----------------------------------------------------------------------------

export const aiIdeaSchema = z.object({
    suggestions: z.array(z.object({
        comboName: z.string(),
        reasoning: z.string(),
        suggestedPrice: z.string().optional(),
        itemIds: z.array(z.number()),
    }))
});

/**
 * Given a list of recent prominent orders (or item pairings), generate smart combo suggestions.
 * Note: Real implementation would query the database for frequent co-occurrences.
 */
export async function generateComboSuggestions(contextDataStr: string, currentItemMapStr: string): Promise<z.infer<typeof aiIdeaSchema>> {
    if (!ENV.openaiApiKey) {
        throw new Error("OpenAI API Key is not configured.");
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Faster model is fine for this
            messages: [
                {
                    role: "system",
                    content: "You are a restaurant revenue optimization AI. Based on the provided order data and mapping of available items (ID -> Name), suggest 3 high-converting combo meals that the restaurant should offer. Return strictly in the requested JSON schema."
                },
                {
                    role: "user",
                    content: `Here are the available items (ID and Name): ${currentItemMapStr}\n\nHere is recent order pairing data: ${contextDataStr}`
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const validatedData = aiIdeaSchema.parse(JSON.parse(content));
        return validatedData;
    } catch (error) {
        console.error("Error generating combos with AI:", error);
        throw new Error("Failed to generate combo suggestions");
    }
}
