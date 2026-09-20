import { useState, useEffect } from "react";
import Auth from "./components/Auth";
import RiskGame from "./components/RiskGame";
import PortfolioChart from "./components/PortfolioChart";
import apiClient from "./api/client";
import { LogOut, Loader2 } from "lucide-react";
import LandingPage from "./components/LandingPage";

export default function App() {
  // Check for an existing token in local storage so users stay logged in
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [showAuth, setShowAuth] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [savedRiskScore, setSavedRiskScore] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // 1. Declare the function FIRST so it can be accessed safely
  const fetchUserProfile = async () => {
    setLoadingProfile(true);
    try {
      // Calls the profile endpoint from your Swagger docs
      const res = await apiClient.get("/profile");

      if (res.data && res.data.risk_score) {
        // Returning User: Load score and bypass the game
        setSavedRiskScore(res.data.risk_score);
        setShowGame(false);
      } else {
        // New User: No score found, force them to take the assessment
        setShowGame(true);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      // Fallback: If profile fetch fails, default to showing the game
      setShowGame(true);
    } finally {
      setLoadingProfile(false);
    }
  };

  // 2. Call the function inside useEffect SECOND
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      // Attach token to all future API requests automatically
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      localStorage.removeItem("token");
      delete apiClient.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    setSavedRiskScore(null);
    setShowGame(false);
  };

  // 1. Not Logged In -> Show Auth Screen
  // 1. Not Logged In -> Show Landing Page OR Auth Screen
  if (!token) {
    if (showAuth) {
      return (
        <div className="relative">
          {/* Add a back button to return to the landing page */}
          <button
            onClick={() => setShowAuth(false)}
            className="absolute top-6 left-6 text-slate-400 hover:text-white z-50 flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <Auth setToken={setToken} />
        </div>
      );
    }
    // Pass the toggle function to the Landing Page
    return <LandingPage onNavigateToAuth={setShowAuth} />;
  }

  // 2. Fetching Data -> Show Loading Screen
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-blue-500 space-y-4">
        <Loader2 className="animate-spin" size={48} />
        <p className="text-slate-400 font-medium">Loading ZYNC Profile...</p>
      </div>
    );
  }

  // 3. Logged In -> Show Main App
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <nav className="bg-slate-900 border-b border-slate-800 p-4 shadow-md shadow-black/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black text-white tracking-tighter">
            ZYNC<span className="text-blue-500">.</span>
          </h1>

          <div className="flex gap-6 items-center">
            {savedRiskScore && !showGame && (
              <button
                onClick={() => setShowGame(true)}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                🎮 Retake Risk Assessment
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-400 hover:text-red-400 flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 py-8">
        {showGame ? (
          <RiskGame
            onAssessmentComplete={(score) => {
              setSavedRiskScore(score);
              setShowGame(false);
            }}
          />
        ) : (
          <PortfolioChart savedRiskScore={savedRiskScore} />
        )}
      </main>
    </div>
  );
}
