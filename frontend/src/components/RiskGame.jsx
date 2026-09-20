import { useState } from "react";
import apiClient from "../api/client";

export default function RiskGame({ onAssessmentComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    drawdownReaction: 0,
    timeHorizonYears: 0,
    volatilityComfort: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalScore, setFinalScore] = useState(null); // Tracks if the game is finished

  const questions = [
    {
      id: "drawdown",
      title: "The 15% Drop Test 📉",
      description:
        "Imagine you invested €10,000 in a balanced portfolio. Due to a sudden market shock, it drops to €8,500 (-15%) in one month. What is your immediate reaction?",
      options: [
        {
          label: "Panic and sell everything to stop further losses",
          score: 10,
        },
        { label: "Sell a portion to reduce stress", score: 30 },
        { label: "Do nothing and ride out the storm", score: 70 },
        { label: "Buy more assets at a discount!", score: 100 },
      ],
    },
    {
      id: "horizon",
      title: "Investment Horizon ⏳",
      description:
        "How long do you plan to keep your money invested before needing to withdraw a significant portion?",
      options: [
        { label: "Less than 1 year (Short-term)", score: 15 },
        { label: "1 to 3 years", score: 40 },
        { label: "3 to 5 years", score: 70 },
        { label: "5+ years (Long-term wealth building)", score: 100 },
      ],
    },
    {
      id: "volatility",
      title: "Crypto & High-Growth Vibe 🚀",
      description:
        "How do you feel about holding high-volatility assets like tech stocks and cryptocurrencies in your portfolio?",
      options: [
        { label: "Keep it safe—avoid high-risk assets completely.", score: 20 },
        {
          label: "Small exposure (under 5%) is fine for excitement.",
          score: 50,
        },
        { label: "Balanced mix—I want growth even if it swings.", score: 80 },
        {
          label: "Bring on the volatility—high risk, high reward!",
          score: 100,
        },
      ],
    },
  ];

  const handleOptionSelect = async (score) => {
    const updatedAnswers = { ...answers };

    if (step === 0) updatedAnswers.drawdownReaction = score;
    if (step === 1)
      updatedAnswers.timeHorizonYears =
        score === 15 ? 1 : score === 40 ? 3 : score === 70 ? 5 : 10;
    if (step === 2) updatedAnswers.volatilityComfort = score;

    setAnswers(updatedAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      await submitAssessment(updatedAnswers);
    }
  };

  const submitAssessment = async (finalAnswers) => {
    setLoading(true);
    setError("");

    const overallScore = Math.round(
      finalAnswers.drawdownReaction * 0.4 +
        (finalAnswers.timeHorizonYears / 10) * 30 +
        finalAnswers.volatilityComfort * 0.3,
    );

    const boundedScore = Math.min(Math.max(overallScore, 10), 100);

    try {
      await apiClient.post("/risk-assessment", {
        overall_risk_score: boundedScore,
        risk_capacity_score: finalAnswers.timeHorizonYears * 10,
        risk_tolerance_score: finalAnswers.drawdownReaction,
        investment_horizon_months: finalAnswers.timeHorizonYears * 12,
      });

      // Instead of instantly closing the game, we save the score to trigger the Result Card
      setFinalScore(boundedScore);
    } catch (err) {
      setError("Failed to save risk assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Logic to determine the user's persona based on their score
  const getPersona = (score) => {
    if (score <= 40)
      return {
        role: "The Politician",
        emoji: "🏛️",
        color: "text-blue-400",
        bg: "bg-blue-900/30 border-blue-500",
        description:
          "Calculated, highly defensive, and focused on wealth preservation. You prefer steady bonds and gold over the wild swings of crypto. You don't take unnecessary risks.",
      };
    if (score <= 70)
      return {
        role: "The Diplomat",
        emoji: "⚖️",
        color: "text-purple-400",
        bg: "bg-purple-900/30 border-purple-500",
        description:
          "Balanced and steady. You want reasonable growth from equities but keep a safety net of stable assets. You negotiate the middle ground of the market.",
      };
    return {
      role: "The Fighter",
      emoji: "🥊",
      color: "text-orange-400",
      bg: "bg-orange-900/30 border-orange-500",
      description:
        "Aggressive and bold! You embrace high volatility for maximum long-term gains. Market crashes don't scare you—they are just discounts on tech stocks and crypto.",
    };
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-xl p-8 bg-slate-900 rounded-2xl shadow-xl border border-slate-800">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-300 font-medium">
              Calculating your personalized investor profile...
            </p>
          </div>
        ) : finalScore !== null ? (
          /* --- THE NEW RESULT CARD --- */
          <div className="text-center space-y-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Assessment Complete
            </h2>

            <div
              className={`p-8 rounded-2xl border ${getPersona(finalScore).bg} transition-all`}
            >
              <div className="text-6xl mb-4">
                {getPersona(finalScore).emoji}
              </div>
              <h1
                className={`text-3xl font-black mb-2 ${getPersona(finalScore).color}`}
              >
                {getPersona(finalScore).role}
              </h1>
              <div className="inline-block px-4 py-1 rounded-full bg-slate-950 text-slate-300 font-semibold mb-4">
                Risk Score: {finalScore} / 100
              </div>
              <p className="text-slate-300 leading-relaxed">
                {getPersona(finalScore).description}
              </p>
            </div>

            <button
              onClick={() => onAssessmentComplete(finalScore)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-900/50"
            >
              Proceed to Budget Allocation →
            </button>
          </div>
        ) : (
          /* --- THE QUESTIONNAIRE --- */
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                Risk Assessment • Step {step + 1} of {questions.length}
              </span>
              <span className="text-xs text-slate-500">
                {Math.round((step / questions.length) * 100)}%
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {questions[step].title}
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {questions[step].description}
            </p>

            <div className="space-y-3">
              {questions[step].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(opt.score)}
                  className="w-full text-left p-4 bg-slate-800/80 hover:bg-blue-600/20 hover:border-blue-500 border border-slate-700/80 rounded-xl text-slate-200 text-sm font-medium transition-all duration-200 flex items-center justify-between group"
                >
                  <span>{opt.label}</span>
                  <span className="text-slate-500 group-hover:text-blue-400 transition-colors">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
