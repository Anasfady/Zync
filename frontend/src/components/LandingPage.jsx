import {
  TrendingUp,
  Brain,
  Shield,
  ArrowRight,
  LineChart,
  Send,
  Code,
  Database,
  Lock,
  Terminal,
  Activity,
} from "lucide-react";

export default function LandingPage({ onNavigateToAuth }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* FLOATING NAVIGATION */}
      <div className="fixed w-full top-6 z-50 flex justify-center px-4">
        <nav className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl shadow-blue-900/10">
          <div className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
            ZYNC<span className="text-blue-500">.</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a
              href="#features"
              className="hover:text-blue-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#quant"
              className="hover:text-emerald-400 transition-colors"
            >
              How It Works
            </a>
            <a href="#ai" className="hover:text-indigo-400 transition-colors">
              AI Guide
            </a>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigateToAuth(true)}
              className="text-sm font-bold text-slate-300 hover:text-white px-4 py-2 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => onNavigateToAuth(false)}
              className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
            >
              Start Now
            </button>
          </div>
        </nav>
      </div>

      {/* ASYMMETRIC SPLIT HERO */}
      <section className="pt-40 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Activity size={16} className="animate-pulse" />
            Live Market System Active
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-[1.1]">
            Automate <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400">
              Your Financial Growth.
            </span>
          </h1>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
            ZYNC combines financial psychology with advanced Artificial
            Intelligence. Discover your risk profile, automatically build the
            best portfolios, and test your strategies instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onNavigateToAuth(false)}
              className="px-8 py-4 bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Launch App <ArrowRight size={18} />
            </button>
            <a
              href="#features"
              className="px-8 py-4 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold rounded-xl transition-all flex items-center justify-center"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Abstract Graphic Right Side */}
        <div className="relative hidden lg:block h-[500px] w-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-slate-800/50 rounded-full animate-[spin_60s_linear_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-slate-700/50 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-slate-400 uppercase font-bold">
                Sharpe Ratio
              </span>
              <span className="text-emerald-400 text-sm font-bold">+2.41</span>
            </div>
            <div className="h-16 w-full flex items-end gap-1">
              {[40, 60, 45, 80, 55, 90, 75, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-500 rounded-t-sm"
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BENTO BOX FEATURES */}
      <section id="features" className="py-24 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 flex items-center gap-3">
            <Shield className="text-blue-500" /> Platform Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
            {/* Bento 1: Large Risk Game */}
            <div className="md:col-span-2 md:row-span-1 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 hover:border-slate-600 transition-colors group">
              <div className="w-12 h-12 bg-blue-900/40 text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Interactive Risk Test
              </h3>
              <p className="text-slate-400 leading-relaxed max-w-md">
                Turn your financial choices into clear risk scores (0-100). We
                give you a specific investor profile to unlock the best assets
                for your needs.
              </p>
            </div>

            {/* Bento 2: Tall Simulator */}
            <div className="md:col-span-1 md:row-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden flex flex-col hover:border-emerald-500/50 transition-colors">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <div className="w-12 h-12 bg-emerald-900/40 text-emerald-400 rounded-xl flex items-center justify-center mb-6 z-10">
                <LineChart size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 z-10">
                Investment Simulator
              </h3>
              <p className="text-slate-400 leading-relaxed z-10 flex-grow">
                Bridge the gap between testing and real trading. Simulate
                deposits using Stripe, Bank Wire, or Web3 to see your expected
                1-year returns based on AI calculations.
              </p>
              <div className="mt-8 bg-slate-950 rounded-xl p-4 border border-slate-800 z-10">
                <div className="text-xs text-slate-500 mb-1">
                  Expected Profit
                </div>
                <div className="text-xl text-emerald-400 font-mono font-bold">
                  +$12,450.00
                </div>
              </div>
            </div>

            {/* Bento 3: Routing */}
            <div className="md:col-span-2 md:row-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-purple-900/40 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Smart User Login
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Our secure backend saves your best portfolio settings. Returning
                users can skip the setup process and go straight to their
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HORIZONTAL QUANT STRIP */}
      <section
        id="quant"
        className="py-24 bg-slate-900 border-y border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              The Math Behind ZYNC
            </h2>
            <p className="text-slate-400 max-w-2xl">
              How our system calculates the best way to invest your money.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <Database className="text-blue-500 mb-4" size={28} />
              <h4 className="text-lg font-bold text-white mb-3">
                PPO Neural Network
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                A custom AI model trained over 50,000 market steps. It analyzes
                current market conditions to find the best way to distribute
                your money across different assets.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <Code className="text-emerald-500 mb-4" size={28} />
              <h4 className="text-lg font-bold text-white mb-3">
                Future Simulations
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                We simulate future market trends using advanced math equations.
                This helps predict how your portfolio might perform over time,
                even with random market changes.
              </p>
              <div className="bg-slate-900 px-3 py-2 rounded border border-slate-800 text-xs font-mono text-emerald-400">
                dS(t) = μ S(t) dt + σ S(t) dW(t)
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <TrendingUp className="text-purple-500 mb-4" size={28} />
              <h4 className="text-lg font-bold text-white mb-3">
                Balancing Risk and Reward
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Our system carefully manages your risk limits while aiming for
                the highest possible profit for that level of risk (Sharpe
                Ratio).
              </p>
              <div className="bg-slate-900 px-3 py-2 rounded border border-slate-800 text-xs font-mono text-purple-400">
                Sharpe = (E[Rp] - Rf) / σp
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TERMINAL AI SECTION */}
      <section id="ai" className="py-24 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl shadow-indigo-900/20">
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="ml-2 text-xs font-mono text-slate-500">
                ollama@zync:~/router
              </span>
            </div>
            <div className="p-6 font-mono text-sm">
              <p className="text-indigo-400 mb-2">
                $ python run_llm_analysis.py --portfolio="Aggressive"
              </p>
              <p className="text-slate-300 mb-4">
                {">"} Analyzing your strategy...
              </p>
              <p className="text-emerald-400 leading-relaxed">
                [OUTPUT]: The AI chose QQQ and Bitcoin because they match your
                high risk score of 85. It also noticed that your digital assets
                do not move in the same way as gold. This helps protect your
                money if the technology market drops suddenly.
              </p>
              <p className="text-slate-500 mt-4 animate-pulse">_</p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-900/30 text-indigo-400 mb-6 border border-indigo-800/50">
              <Terminal size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-6">
              Smart AI Explanations
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg mb-8">
              Complex AI can be hard to understand. ZYNC uses a smart language
              model to translate our advanced math into clear, easy-to-read
              investment advice.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>{" "}
                Explains how your assets are connected
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>{" "}
                Finds weak points in your strategy
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>{" "}
                Explains the AI's choices instantly
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* COMPACT FOOTER & CONTACT */}
      <footer className="bg-slate-900 py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 md:p-12 text-center mb-16 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Contact Our Team
            </h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Are you interested in custom features, API connections, or
              specialized AI models for your company?
            </p>
            <form
              className="max-w-md mx-auto space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter corporate email"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                className="w-full py-4 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Send size={18} /> Request Information
              </button>
            </form>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
            <div className="font-black text-slate-400 tracking-tighter">
              ZYNC<span className="text-blue-500">.</span>
            </div>
            <p>© {new Date().getFullYear()} ZYNC Financial Technologies.</p>
            <div className="text-xs">For educational purposes only.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
