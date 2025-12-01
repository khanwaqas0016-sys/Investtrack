import { GoogleGenAI } from "@google/genai";
import { AppState, AIAnalysisResult } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateFinancialInsights = async (data: AppState): Promise<AIAnalysisResult> => {
  const ai = getClient();
  
  // Prepare a summary of the data to avoid token limits if data is huge
  // Filter out 'lend' type from collected amounts as those are money OUT
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