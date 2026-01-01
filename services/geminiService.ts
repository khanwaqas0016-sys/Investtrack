import { GoogleGenAI } from "@google/genai";
import { AppState, AIAnalysisResult } from '../types';

export const generateFinancialInsights = async (data: AppState): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const summaryData = {
    totalCustomers: data.customers.length,
    activeInvestments: data.investments.filter(i => i.status === 'active').length,
    totalInvested: data.investments.reduce((sum, inv) => sum + inv.amountInvested, 0),
    totalCollected: data.payments.filter(p => p.type !== 'lend').reduce((sum, pay) => sum + pay.amount, 0),
    investments: data.investments.map(inv => ({
      title: inv.title,
      amount: inv.amountInvested,
      totalPaid: data.payments.filter(p => p.investmentId === inv.id && p.type !== 'lend').reduce((sum, p) => sum + p.amount, 0)
    }))
  };

  const prompt = `
    You are a senior financial investment analyst. All monetary values are in Pakistani Rupees (PKR). 
    Analyze the following investment portfolio JSON data.
    
    Data:
    ${JSON.stringify(summaryData, null, 2)}
    
    Provide a structured analysis in JSON format with exactly these keys:
    - "summary": A brief executive summary (max 50 words).
    - "riskAssessment": A string identifying 2-3 potential risks.
    - "opportunities": A string suggesting 2-3 actionable tips.
    
    Return raw JSON only. Do not use markdown blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text received from Gemini.");

    const result = JSON.parse(text);
    
    return {
      summary: result.summary || "Unable to generate summary.",
      riskAssessment: result.riskAssessment || "No specific risks identified.",
      opportunities: result.opportunities || "No specific opportunities found.",
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      summary: "Analysis currently unavailable. Please check your connection.",
      riskAssessment: "Unable to assess risks at this time.",
      opportunities: "Unable to identify opportunities at this time.",
      timestamp: Date.now()
    };
  }
};