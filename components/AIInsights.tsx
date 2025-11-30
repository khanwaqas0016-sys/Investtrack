import React, { useState } from 'react';
import { AppState, AIAnalysisResult } from '../types';
import { generateFinancialInsights } from '../services/geminiService';
import { Sparkles, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';

interface AIInsightsProps {
  data: AppState;
}

const AIInsights: React.FC<AIInsightsProps> = ({ data }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateFinancialInsights(data);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to generate insights. Check API Key or connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <div className="bg-indigo-100 p-4 rounded-full mb-4">
          <Sparkles className="text-indigo-600" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Investment Advisor</h2>
        <p className="text-slate-500 mb-8 max-w-xs">
          Get smart summaries, risk alerts, and profit opportunities based on your portfolio data using Gemini AI.
        </p>
        <button 
          onClick={handleAnalyze}
          className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-indigo-700 transition-transform active:scale-95"
        >
          Analyze Portfolio
        </button>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <RefreshCw className="text-indigo-600 animate-spin mb-4" size={32} />
        <p className="text-slate-500 font-medium">Analyzing your finances...</p>
        <p className="text-xs text-slate-400 mt-2">This may take a few seconds</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">AI Insights</h2>
        <button onClick={handleAnalyze} className="text-indigo-600 p-2 bg-indigo-50 rounded-full hover:bg-indigo-100">
          <RefreshCw size={20} />
        </button>
      </div>

      {analysis && (
        <>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
            <h3 className="font-bold text-lg mb-2 opacity-90">Executive Summary</h3>
            <p className="leading-relaxed">{analysis.summary}</p>
            <p className="text-xs mt-4 opacity-60 text-right">Generated: {new Date(analysis.timestamp).toLocaleTimeString()}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
             <div className="flex items-center space-x-2 mb-3 text-red-600">
               <AlertTriangle size={20} />
               <h3 className="font-bold">Risk Assessment</h3>
             </div>
             <p className="text-slate-700 text-sm leading-6">{analysis.riskAssessment}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
             <div className="flex items-center space-x-2 mb-3 text-amber-600">
               <Lightbulb size={20} />
               <h3 className="font-bold">Opportunities</h3>
             </div>
             <p className="text-slate-700 text-sm leading-6">{analysis.opportunities}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AIInsights;