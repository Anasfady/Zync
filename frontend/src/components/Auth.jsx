import { useState } from "react";
import apiClient from "../api/client";
import { Shield, Mail, Lock, ArrowRight } from "lucide-react";

export default function Auth({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        // Pointing directly to the /login endpoint defined in Swagger
        const res = await apiClient.post("/login", formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        setToken(res.data.access_token);
      } else {
        // Pointing directly to the /register endpoint defined in Swagger
        await apiClient.post("/register", { email, password });
        setIsLogin(true);
        setError("Registration successful! Please sign in.");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Authentication failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/30 text-blue-500 mb-4 border border-blue-800/50">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isLogin ? "Sign In to ZYNC" : "Create ZYNC Account"}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Your AI-powered quantitative portfolio manager
          </p>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div
            className={`p-4 rounded-lg mb-6 text-sm border ${
              error.includes("successful")
                ? "bg-green-900/30 border-green-800 text-green-400"
                : "bg-red-900/30 border-red-800 text-red-400"
            }`}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : isLogin
                ? "Access Dashboard"
                : "Create Account"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
