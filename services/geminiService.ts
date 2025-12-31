import { GoogleGenAI } from "@google/genai";
import { UserProfile, Invoice, Client } from '../types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  generateInvoice: async (
    userPrompt: string, 
    profile: UserProfile, 
    previousInvoices: Invoice[],
    invoiceNumber: string,
    currentContent?: string,
    selectedClient?: Client | null,
    formattedDueDate?: string
  ): Promise<{ markdown: string; summary: string; clientName: string }> => {
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Client Context
    let clientContext = "";
    if (selectedClient) {
      clientContext = `
      SELECTED CLIENT (Recipient):
      Name: ${selectedClient.name}
      Address: ${selectedClient.address}
      Email: ${selectedClient.email}
      Phone: ${selectedClient.phone || 'N/A'}
      
      INSTRUCTION: You MUST use the "SELECTED CLIENT" details above for the "Bill To" section of the invoice. Ignore any conflicting client names in the user request if they are ambiguous, prioritize this selected client.
      `;
    } else {
      clientContext = `
      OPTIONAL DEFAULT CLIENT ADDRESS (Use if relevant or if no specific client address is provided in request):
      ${profile.defaultClientAddress || 'N/A'}
      `;
    }

    // Construct Context
    const profileContext = `
      CURRENT DATE: ${currentDate}
      DUE DATE: ${formattedDueDate || "Upon Receipt"}
      ASSIGNED INVOICE NUMBER: ${invoiceNumber}
      
      CURRENT USER PROFILE (The Sender):
      Business: ${profile.businessName}
      Owner: ${profile.ownerName}
      Address: ${profile.address}
      Email: ${profile.email}
      Website: ${profile.websiteUrl || 'N/A'}
      Payment Info: ${profile.paymentDetails}
      Default Terms: ${profile.defaultPaymentTerms || 'Due on Receipt'}
      Currency: ${profile.currency}

      ${clientContext}
    `;

    const historyContext = previousInvoices.length > 0 
      ? `PREVIOUS INVOICES (Use these for style/structure consistency):
         ${previousInvoices.map((inv, i) => `--- EXAMPLE ${i+1} ---\n${inv.markdownContent}`).join('\n')}`
      : "No previous invoices available. Use a standard professional format.";

    const editingContext = currentContent 
      ? `CURRENT INVOICE CONTENT (The user wants to modify this):
         ${currentContent}
         
         IMPORTANT: Maintain the existing structure, line items, and details of the CURRENT INVOICE CONTENT, only applying the changes requested in the USER REQUEST. Do not hallucinate new items unless asked.`
      : "";

    const systemInstruction = `
      You are an expert document generator agent specializing in Markdown Invoices.
      
      Your goal is to generate a CLEAN, PROFESSIONAL Markdown string representing an invoice based on the user's request.
      
      RULES:
      1. ONLY return the Markdown content. Do not include conversational filler.
      2. Use Standard Markdown tables for line items.
      3. Use H1 (#) for the document title (e.g. INVOICE ${invoiceNumber}).
      4. Use H2 (##) for major sections like "Bill To", "Details", "Terms".
      5. INCLUDE the "CURRENT USER PROFILE" details as the "From" section automatically.
      6. USE the "ASSIGNED INVOICE NUMBER" (${invoiceNumber}) and "CURRENT DATE" (${currentDate}) explicitly in the document header.
      7. INCLUDE the "DUE DATE" (${formattedDueDate || 'N/A'}) in the header or terms section.
      8. INCLUDE the Default Terms (${profile.defaultPaymentTerms}) unless the user specifies otherwise.
      9. Infer the Client details from the prompt. If a "SELECTED CLIENT" is provided in context, USE THAT.
      10. Calculate totals if individual items are listed.
      11. Do NOT wrap the output in \`\`\`markdown code blocks. Return raw markdown text.
      12. At the very end of the response, add a hidden metadata section strictly in this format:
          <!-- METADATA
          CLIENT: [Extracted Client Name]
          SUMMARY: [Short summary of invoice, e.g. "Web Dev Services - Oct"]
          -->
    `;

    const fullPrompt = `
      ${profileContext}
      
      ${historyContext}

      ${editingContext}
      
      USER REQUEST: "${userPrompt}"
      
      Generate the Invoice Markdown now.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3, 
        }
      });

      const text = response.text || "";
      
      // Extract Metadata
      let clientName = selectedClient ? selectedClient.name : "Unknown Client";
      let summary = "Invoice";
      let markdown = text;

      const metadataRegex = /<!-- METADATA\s+CLIENT:\s*(.*?)\s+SUMMARY:\s*(.*?)\s+-->/s;
      const match = text.match(metadataRegex);

      if (match) {
        if (!selectedClient) {
            clientName = match[1];
        }
        summary = match[2];
        markdown = text.replace(metadataRegex, '').trim();
      }

      return { markdown, clientName, summary };

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to generate invoice. Please try again.");
    }
  }
};