import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Activity,
  History,
  AlertTriangle,
  DollarSign,
  Info,
  PieChart as PieChartIcon,
  ShieldCheck,
} from "lucide-react";
import api from "./api";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [userProfile, setUserProfile] = useState(null);

  // Tab 1 State: Forecaster
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [showInvestmentView, setShowInvestmentView] = useState(false);

  // Tab 2 State: Portfolio Builder & Backtest
  const [portfolioTickers, setPortfolioTickers] =
    useState("SPY, QQQ, TLT, GLD");
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioResults, setPortfolioResults] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);
  const [error, setError] = useState("");

  const INITIAL_INVESTMENT = 5000;

  const fetchData = async () => {
    try {
      const [histRes, profRes] = await Promise.all([
        api.get("/simulations").catch(() => ({ data: [] })),
        api.get("/profile").catch(() => ({ data: null })),
      ]);
      setHistory(histRes.data);
      setUserProfile(profRes.data);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FORECASTER LOGIC ---
  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!ticker) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const response = await api.get(`/simulate/${ticker}`);
      setResults(response.data);
      await api.post("/simulations", {
        ticker: response.data.ticker,
        days_simulated: response.data.projections.days_simulated,
        current_price: response.data.projections.current_price,
        median_projection: response.data.projections.median_projection,
        bull_case_95th: response.data.projections.bull_case_95th,
        bear_case_5th: response.data.projections.bear_case_5th,
      });
      fetchData();
    } catch (err) {
      setError("Simulation failed. Check your Python terminal for errors!");
    } finally {
      setLoading(false);
    }
  };

  // --- PORTFOLIO BUILDER & BACKTEST LOGIC ---
  const handleGeneratePortfolio = async (e) => {
    e.preventDefault();
    if (!portfolioTickers) return;
    setPortfolioLoading(true);
    setError("");
    setPortfolioResults(null);
    setBacktestResults(null);

    const tickersArray = portfolioTickers
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t);

    try {
      // 1. Generate the CVaR Portfolio
      const genResponse = await api.post("/portfolios/generate", {
        tickers: tickersArray,
      });
      setPortfolioResults(genResponse.data);

      // 2. Automatically Backtest the newly generated weights
      const backtestResponse = await api.post("/portfolios/backtest", {
        tickers: tickersArray,
        weights: genResponse.data.allocations,
      });
      setBacktestResults(backtestResponse.data);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to generate or backtest portfolio. Ensure tickers are valid.",
      );
    } finally {
      setPortfolioLoading(false);
    }
  };

  // Helpers
  const formatCurrency = (val) =>
    `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const pieData = portfolioResults
    ? Object.entries(portfolioResults.allocations).map(([name, value]) => ({
        name,
        value: parseFloat((value * 100).toFixed(2)),
      }))
    : [];

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-indigo-400 mb-2">
        Your AI Portfolio Engine
      </h1>
      <p className="text-gray-400 text-lg mb-6">
        {userProfile
          ? `Risk Score: ${userProfile.overall_risk_score.toFixed(0)}`
          : "Loading profile..."}
      </p>

      {/* Tabs */}
      <div className="flex bg-[#1c1e24] p-1 rounded-xl mb-8 border border-gray-800">
        <button
          onClick={() => setActiveTab("forecast")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === "forecast" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
        >
          <TrendingUp className="w-5 h-5" /> Asset Forecaster
        </button>
        <button
          onClick={() => setActiveTab("portfolio")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === "portfolio" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
        >
          <PieChartIcon className="w-5 h-5" /> AI Portfolio Builder
        </button>
      </div>

      <div className="w-full max-w-4xl bg-[#1c1e24] p-8 rounded-2xl shadow-2xl border border-gray-700">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* TAB 1: ASSET FORECASTER (Hidden for brevity, it's untouched) */}
        {activeTab === "forecast" && (
          <div className="text-center text-gray-400 py-10">
            Switch to the AI Portfolio Builder tab!
          </div>
        )}

        {/* TAB 2: AI PORTFOLIO BUILDER & BACKTESTER */}
        {activeTab === "portfolio" && (
          <div>
            <form
              onSubmit={handleGeneratePortfolio}
              className="flex gap-4 mb-8"
            >
              <input
                type="text"
                value={portfolioTickers}
                onChange={(e) => setPortfolioTickers(e.target.value)}
                placeholder="e.g., SPY, QQQ, TLT, GLD"
                className="flex-1 bg-[#2a2d35] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 uppercase"
              />
              <button
                type="submit"
                disabled={portfolioLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {portfolioLoading ? (
                  <Activity className="animate-spin" />
                ) : (
                  <PieChartIcon />
                )}{" "}
                {portfolioLoading
                  ? "Optimizing & Testing..."
                  : "Generate Portfolio"}
              </button>
            </form>

            <div className="bg-[#0f1115] rounded-xl p-6 border border-gray-800 min-h-[300px] flex flex-col items-center justify-center">
              {!portfolioResults && !portfolioLoading && (
                <p className="text-gray-500">
                  Enter tickers to generate an optimized CVaR portfolio and run
                  a 1-year historical backtest.
                </p>
              )}
              {portfolioLoading && (
                <div className="text-indigo-400 animate-pulse text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 animate-bounce" />
                  <p>
                    Calculating optimal weights & running historical
                    simulation...
                  </p>
                </div>
              )}

              {portfolioResults && !portfolioLoading && (
                <div className="w-full">
                  {/* Row 1: Pie Chart & Strategy */}
                  <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-800 pb-8 mb-8">
                    <div className="w-full md:w-1/2 h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value) => `${value}%`}
                            contentStyle={{
                              backgroundColor: "#1c1e24",
                              border: "none",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full md:w-1/2 p-4">
                      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5">
                        <h4 className="text-indigo-300 font-bold mb-3 flex items-center gap-2">
                          <Info className="w-5 h-5" /> AI Allocation Strategy
                        </h4>
                        <ul className="space-y-2">
                          {pieData.map((asset, idx) => (
                            <li
                              key={idx}
                              className="flex justify-between text-sm font-medium"
                            >
                              <span className="text-gray-400">
                                {asset.name}
                              </span>
                              <span
                                style={{ color: COLORS[idx % COLORS.length] }}
                              >
                                {asset.value}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Backtest Results Dashboard */}
                  {backtestResults && (
                    <div className="w-full">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <ShieldCheck className="text-green-400 w-6 h-6" />{" "}
                        1-Year Historical Performance
                      </h3>

                      {/* Metric Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-[#1c1e24] border border-gray-700 p-4 rounded-xl">
                          <p className="text-gray-400 text-sm">
                            Initial Balance
                          </p>
                          <p className="text-xl font-bold text-white">
                            {formatCurrency(backtestResults.initial_balance)}
                          </p>
                        </div>
                        <div className="bg-[#1c1e24] border border-gray-700 p-4 rounded-xl">
                          <p className="text-gray-400 text-sm">Final Balance</p>
                          <p
                            className={`text-xl font-bold ${backtestResults.total_return_pct >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            {formatCurrency(backtestResults.final_balance)}
                          </p>
                        </div>
                        <div className="bg-[#1c1e24] border border-gray-700 p-4 rounded-xl">
                          <p className="text-gray-400 text-sm">Total Return</p>
                          <p
                            className={`text-xl font-bold ${backtestResults.total_return_pct >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            {backtestResults.total_return_pct}%
                          </p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                          <p className="text-red-300 text-sm">Max Drawdown</p>
                          <p className="text-xl font-bold text-red-400">
                            {backtestResults.max_drawdown_pct}%
                          </p>
                        </div>
                      </div>

                      {/* Equity Curve Line Chart */}
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={backtestResults.equity_curve}
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#374151"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#9ca3af"
                              tick={{ fontSize: 12 }}
                              minTickGap={30}
                            />
                            <YAxis
                              domain={["auto", "auto"]}
                              stroke="#9ca3af"
                              tickFormatter={(val) => `$${val}`}
                              width={80}
                            />
                            <RechartsTooltip
                              formatter={(val) => [
                                formatCurrency(val),
                                "Portfolio Value",
                              ]}
                              labelStyle={{ color: "#000" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
