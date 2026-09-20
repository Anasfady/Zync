import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../api/client";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Sliders,
  RefreshCw,
  Wallet,
  CreditCard,
  Building,
  Bitcoin,
  CheckCircle,
  X,
} from "lucide-react";

const ASSET_UNIVERSES = {
  conservative: [
    { ticker: "BND", name: "Total Bond Market" },
    { ticker: "TLT", name: "20Y Treasury Bonds" },
    { ticker: "SPLV", name: "Low Volatility S&P 500" },
    { ticker: "VIG", name: "Dividend Appreciation" },
    { ticker: "GLD", name: "Physical Gold" },
  ],
  moderate: [
    { ticker: "SPY", name: "S&P 500 Index" },
    { ticker: "QQQ", name: "Nasdaq 100 Growth" },
    { ticker: "VEA", name: "Developed International" },
    { ticker: "VNQ", name: "US Real Estate / REITs" },
    { ticker: "BND", name: "Total Bond Market" },
    { ticker: "GLD", name: "Physical Gold" },
  ],
  aggressive: [
    { ticker: "QQQ", name: "Nasdaq 100 Tech" },
    { ticker: "SMH", name: "Semiconductors Index" },
    { ticker: "IWM", name: "Russell 2000 Small Caps" },
    { ticker: "SPY", name: "S&P 500 Index" },
    { ticker: "BTC-USD", name: "Bitcoin" },
    { ticker: "ETH-USD", name: "Ethereum" },
  ],
};

const parseApiError = (err) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg).join(", ");
  return err.message || "An unexpected network error occurred.";
};

// Helper for formatting currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export default function PortfolioChart({ savedRiskScore }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [allocations, setAllocations] = useState(null);
  const [aiOptimalAllocations, setAiOptimalAllocations] = useState(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");

  // Payment & Investment State
  const [activeInvestment, setActiveInvestment] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [gateway, setGateway] = useState("stripe");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const getTier = (score) => {
    if (score <= 40) return "conservative";
    if (score <= 70) return "moderate";
    return "aggressive";
  };

  const activeTier = getTier(savedRiskScore);
  const activeUniverse = ASSET_UNIVERSES[activeTier];

  useEffect(() => {
    let isMounted = true;

    const runAutoPilot = async () => {
      setLoading(true);
      setError("");
      try {
        const tickers = activeUniverse.map((a) => a.ticker);

        const genRes = await apiClient.post("/portfolios/generate", {
          tickers: tickers,
          risk_score: savedRiskScore,
        });
        if (!isMounted) return;

        const optimalWeights = genRes.data.allocations;
        setAllocations(optimalWeights);
        setAiOptimalAllocations(optimalWeights);

        const backtestRes = await apiClient.post("/portfolios/backtest", {
          tickers,
          weights: optimalWeights,
        });
        if (!isMounted) return;
        setData(backtestRes.data);

        apiClient
          .post("/portfolios/explain", {
            risk_score: savedRiskScore,
            allocations: optimalWeights,
            metrics: {
              expected_return: backtestRes.data.cagr,
              volatility: backtestRes.data.annualized_volatility,
            },
          })
          .then((aiRes) => {
            if (isMounted) setExplanation(aiRes.data.explanation);
          })
          .catch(() => {
            if (isMounted)
              setExplanation(
                "AI engine is analyzing strategy risk dynamics...",
              );
          });
      } catch (err) {
        if (isMounted) setError(parseApiError(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (savedRiskScore) {
      runAutoPilot();
    }

    return () => {
      isMounted = false;
    };
  }, [savedRiskScore]);

  const handleWeightChange = (ticker, newRawValue) => {
    setAllocations((prev) => ({
      ...prev,
      [ticker]: Number(newRawValue) / 100,
    }));
  };

  const runCustomSimulation = async () => {
    setLoading(true);
    setError("");
    setExplanation("");
    try {
      const tickers = activeUniverse.map((a) => a.ticker);

      const backtestRes = await apiClient.post("/portfolios/backtest", {
        tickers,
        weights: allocations,
      });
      setData(backtestRes.data);

      apiClient
        .post("/portfolios/explain", {
          risk_score: savedRiskScore,
          allocations: allocations,
          metrics: {
            expected_return: backtestRes.data.cagr,
            volatility: backtestRes.data.annualized_volatility,
          },
        })
        .then((aiRes) => setExplanation(aiRes.data.explanation))
        .catch(() =>
          setExplanation("AI engine is analyzing your custom strategy..."),
        );

      setIsCustomizing(false);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Payment Handlers
  const handleDeposit = () => {
    setIsProcessingPayment(true);
    // Simulate network delay for payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setActiveInvestment(Number(budgetInput));
      setShowSuccessPopup(true);
    }, 1500);
  };

  return (
    <div className="space-y-6 relative">
      {/* 1. PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="text-blue-400" /> Fund Your Strategy
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Investment Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min="100"
                    placeholder="10000"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGateway("stripe")}
                    className={`flex flex-col items-center p-3 border rounded-xl transition-all ${gateway === "stripe" ? "border-blue-500 bg-blue-900/20 text-blue-400" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600"}`}
                  >
                    <CreditCard size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Credit Card</span>
                  </button>
                  <button
                    onClick={() => setGateway("bank")}
                    className={`flex flex-col items-center p-3 border rounded-xl transition-all ${gateway === "bank" ? "border-blue-500 bg-blue-900/20 text-blue-400" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600"}`}
                  >
                    <Building size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Bank Wire</span>
                  </button>
                  <button
                    onClick={() => setGateway("crypto")}
                    className={`flex flex-col items-center p-3 border rounded-xl transition-all ${gateway === "crypto" ? "border-blue-500 bg-blue-900/20 text-blue-400" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600"}`}
                  >
                    <Bitcoin size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Crypto Web3</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={
                    !budgetInput || budgetInput < 100 || isProcessingPayment
                  }
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isProcessingPayment ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    "Deposit & Activate"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-green-500/30 rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-900/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Deposit Successful!
            </h2>
            <p className="text-slate-400 mb-6">
              Your investment of{" "}
              <strong className="text-green-400">
                {formatCurrency(activeInvestment)}
              </strong>{" "}
              has been successfully deployed to your AI portfolio.
            </p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN DASHBOARD */}
      <div className="p-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <TrendingUp className="text-blue-400" /> AI Adaptive Strategy
              Builder
            </h2>
            <p className="text-sm text-slate-400">
              Indices and assets automatically generated based on your verified
              risk profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {loading && (
              <div className="flex items-center gap-2 text-blue-400 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-800/50">
                <Cpu className="animate-pulse" size={18} />
                <span className="text-sm font-semibold tracking-wide">
                  Processing Engine...
                </span>
              </div>
            )}

            {/* Invest Button */}
            {!loading && data && activeInvestment === 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-green-900/20"
              >
                <Wallet size={18} /> Invest Now
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recommended Asset Universe ({activeTier.toUpperCase()})
            </p>
            <span className="text-xs text-blue-400 font-mono">
              Risk Index: {savedRiskScore}/100
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeUniverse.map((asset) => (
              <div
                key={asset.ticker}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full"
              >
                <span className="text-blue-400 font-bold text-sm">
                  {asset.ticker}
                </span>
                <span className="text-slate-400 text-xs">{asset.name}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded flex items-center gap-2">
            <AlertTriangle size={18} className="shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* ACTIVE INVESTMENT BANNER (If funded) */}
            {activeInvestment > 0 && (
              <div className="p-6 bg-gradient-to-r from-blue-900/40 to-emerald-900/20 border border-blue-500/30 rounded-xl shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">
                    Active Balance
                  </p>
                  <h3 className="text-3xl font-black text-white">
                    {formatCurrency(activeInvestment)}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm font-medium mb-1">
                    Expected 1-Year Return
                  </p>
                  <h3
                    className={`text-2xl font-bold ${data.cagr >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {data.cagr >= 0 ? "+" : ""}
                    {formatCurrency(activeInvestment * (data.cagr / 100))}
                  </h3>
                </div>
              </div>
            )}

            <div className="p-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800">
              <div className="mb-6 flex items-center justify-between bg-slate-800/60 border border-slate-700 p-4 rounded-xl shadow-sm">
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg
                    ${
                      savedRiskScore <= 40
                        ? "bg-blue-900/50 text-blue-400 border border-blue-500"
                        : savedRiskScore <= 70
                          ? "bg-purple-900/50 text-purple-400 border border-purple-500"
                          : "bg-orange-900/50 text-orange-400 border border-orange-500"
                    }`}
                  >
                    {savedRiskScore}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      Allocated Profile: {activeTier.toUpperCase()}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {savedRiskScore <= 40
                        ? "Conservative (Capital preservation, low volatility)"
                        : savedRiskScore <= 70
                          ? "Moderate (Balanced growth across broad markets)"
                          : "Aggressive (High-beta innovation & digital assets)"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-400">Historic CAGR</p>
                  <p
                    className={`text-2xl font-bold ${data.cagr >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {data.cagr >= 0 ? "+" : ""}
                    {data.cagr}%
                  </p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-400">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-400">
                    {data.max_drawdown}%
                  </p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-400">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {data.sharpe_ratio}
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderColor: "#334155",
                        color: "#f8fafc",
                      }}
                      formatter={(value) => [`$${value}`, "Index Value"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">
                  Strategy Allocations
                </h3>
                <button
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className={`text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                    isCustomizing
                      ? "bg-slate-800 text-slate-300 border-slate-700"
                      : "bg-blue-900/30 text-blue-400 border-blue-800/50 hover:bg-blue-900/50"
                  }`}
                >
                  <Sliders size={14} />{" "}
                  {isCustomizing ? "Cancel" : "Tweak Weights"}
                </button>
              </div>

              <div className="space-y-4">
                {allocations &&
                  (() => {
                    const totalWeight =
                      Object.values(allocations).reduce(
                        (sum, w) => sum + w,
                        0,
                      ) || 1;

                    return Object.entries(allocations).map(
                      ([ticker, rawWeight]) => {
                        const normalizedPct = (rawWeight / totalWeight) * 100;

                        return (
                          <div key={ticker} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300 font-medium">
                                {ticker}
                              </span>
                              <span className="text-blue-400 font-bold">
                                {normalizedPct.toFixed(1)}%
                              </span>
                            </div>

                            {isCustomizing && (
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={rawWeight * 100}
                                onChange={(e) =>
                                  handleWeightChange(ticker, e.target.value)
                                }
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                            )}
                          </div>
                        );
                      },
                    );
                  })()}
              </div>

              {isCustomizing && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={runCustomSimulation}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <RefreshCw
                      size={18}
                      className={loading ? "animate-spin" : ""}
                    />
                    Run Custom Simulation
                  </button>
                  <button
                    onClick={() => {
                      setAllocations(aiOptimalAllocations);
                      setIsCustomizing(false);
                    }}
                    className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Restore AI Optimal Math
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-900/50 to-slate-900 rounded-xl shadow-lg border border-indigo-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="text-indigo-400" /> AI Insights
              </h3>
              {explanation ? (
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </p>
              ) : (
                <div className="animate-pulse space-y-3 py-2">
                  <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-700 rounded"></div>
                  <div className="h-2 bg-slate-700 rounded w-5/6"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
