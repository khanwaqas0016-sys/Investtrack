import { GoogleGenAI } from "@google/genai";
import { AppState, AIAnalysisResult } from '../types';

const getClient = () => {
  // Use Vite's import.meta.env for environment variables
  // Fallback to process.env if needed, though in Vite env it's usually import.meta
  const apiKey = (import.meta as any).env.VITE_API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : undefined);
  
  if (!apiKey) {
    // We log but don't throw immediately to avoid crashing the app on load if the key isn't used yet.
    // However, generating content will fail.
    console.warn("VITE_API_KEY is missing. AI features will not work.");
  }
  return new GoogleGenAI({ apiKey: apiKey || 'dummy-key' }); 
};

export const generateFinancialInsights = async (data: AppState): Promise<AIAnalysisResult> => {
  const apiKey = (import.meta as any).env.VITE_API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : undefined);
  if (!apiKey) {
    throw new Error("API Key not configured. Please set VITE_API_KEY.");
  }

  const ai = getClient();
  
  // Prepare a summary of the data to avoid token limits if data is huge
  const summaryData = {
    totalCustomers: data.customers.length,
    activeInvestments: data.investments.filter(i => i.status === 'active').length,
    totalInvested: data.investments.reduce((sum, inv) => sum + inv.amountInvested, 0),
    totalCollected: data.payments.filter(p => p.type !== 'lend').reduce((sum, pay) => sum + pay.amount, 0),
    investments: data.investments.map(inv => ({
      ...inv,
      totalPaid: data.payments.filter(p => p.investmentId === inv.id && p.type !== 'lend').reduce((sum, p) => sum + p.amount, 0)
    }))
  };

  const prompt = `
    You are a senior financial investment analyst. All monetary values are in Pakistani Rupees (PKR). Analyze the following investment portfolio JSON data.
    
    Data:
    ${JSON.stringify(summaryData, null, 2)}
    
    Provide a structured analysis in JSON format with the following keys:
    - "summary": A brief executive summary of the portfolio performance (max 50 words).
    - "riskAssessment": Identify 2-3 potential risks (e.g., low repayment rates on specific investments, concentration risk).
    - "opportunities": Suggest 2-3 actionable tips to improve profitability or cash flow.
    
    Do not use markdown formatting. Return raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    
    return {
      summary: result.summary || "Unable to generate summary.",
      riskAssessment: Array.isArray(result.riskAssessment) ? result.riskAssessment.join('. ') : (result.riskAssessment || "No risks identified."),
      opportunities: Array.isArray(result.opportunities) ? result.opportunities.join('. ') : (result.opportunities || "No specific opportunities found."),
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
};