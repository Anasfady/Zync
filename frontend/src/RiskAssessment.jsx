import { useState } from "react";
import api from "./api";

export default function RiskAssessment({ onComplete }) {
  const [loading, setLoading] = useState(false);

  const handleChoice = async (choiceType) => {
    setLoading(true);

    // Map the gamified choice to our new quantitative backend schema
    let payload;
    if (choiceType === "safe") {
      payload = {
        overall_risk_score: 25.0,
        risk_capacity_score: 40.0,
        risk_tolerance_score: 20.0,
        investment_horizon_months: 60,
      };
    } else {
      payload = {
        overall_risk_score: 85.0,
        risk_capacity_score: 80.0,
        risk_tolerance_score: 90.0,
        investment_horizon_months: 120,
      };
    }

    try {
      // Send the correctly formatted payload using your authenticated API interceptor
      await api.post("/risk-assessment", payload);

      // Tell the parent component (App.jsx) that we are done so it loads the Dashboard!
      if (onComplete) onComplete();
    } catch (error) {
      console.error("Backend Error:", error.response?.data || error.message);
      alert(
        "Failed to save your choice. Open your browser console (F12) to see the exact error!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col items-center justify-center p-8">
      <div className="bg-[#1c1e24] p-8 rounded-2xl shadow-2xl border border-gray-700 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-indigo-400 mb-6">Scenario 1</h2>
        <p className="text-xl text-gray-300 mb-8 font-medium">
          You just received $5,000. Do you...
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleChoice("safe")}
            disabled={loading}
            className="w-full bg-[#2a2d35] hover:bg-[#323640] border border-gray-600 text-left px-6 py-4 rounded-xl transition-all disabled:opacity-50"
          >
            <span className="mr-3">🔒</span> Lock it in a safe 5% savings
            account
          </button>

          <button
            onClick={() => handleChoice("risky")}
            disabled={loading}
            className="w-full bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-left px-6 py-4 rounded-xl transition-all disabled:opacity-50"
          >
            <span className="mr-3">🚀</span> Invest it in a volatile tech
            startup
          </button>
        </div>

        {loading && (
          <p className="text-center text-indigo-400 mt-6 animate-pulse">
            Saving profile...
          </p>
        )}
      </div>
    </div>
  );
}
