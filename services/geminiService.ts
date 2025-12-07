import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, AIAnalysisResult } from '../types';

const getClient = () => {
  // Use Vite's import.meta.env for environment variables on Vercel.
  // We cast to 'any' to avoid TypeScript errors if types aren't configured.
  const apiKey = (import.meta as any).env.VITE_API_KEY;
  
  if (!apiKey) {
    console.error("VITE_API_KEY is missing. Please add it to your Vercel Environment Variables.");
    throw new Error("API Key not found");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const generateFinancialInsights = async (data: AppState): Promise<AIAnalysisResult> => {
  const genAI = getClient();
  
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
    // Use the stable model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("No response from AI");

    const resultJson = JSON.parse(text);
    
    return {
      summary: resultJson.summary || "Unable to generate summary.",
      riskAssessment: Array.isArray(resultJson.riskAssessment) ? resultJson.riskAssessment.join('. ') : (resultJson.riskAssessment || "No risks identified."),
      opportunities: Array.isArray(resultJson.opportunities) ? resultJson.opportunities.join('. ') : (resultJson.opportunities || "No specific opportunities found."),
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
};