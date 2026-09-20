import numpy as np
import pandas as pd
from scipy.optimize import minimize
import logging

logger = logging.getLogger(__name__)

class OptimizerService:
    
    def _calculate_cvar(self, weights: np.ndarray, returns: pd.DataFrame, alpha: float = 0.05) -> float:
        """Calculates the Conditional Value at Risk (Expected Shortfall)."""
        portfolio_returns = returns.dot(weights)
        var = np.percentile(portfolio_returns, alpha * 100)
        cvar = portfolio_returns[portfolio_returns <= var].mean()
        return -cvar # Return as positive loss to minimize

    def generate_optimal_portfolio(self, prices_df: pd.DataFrame, risk_score: float) -> dict:
        returns = prices_df.pct_change().dropna()
        num_assets = len(returns.columns)
        
        # FIX 1: Ensure max_weight is always mathematically capable of summing to 1.0
        min_weight = 0.02
        dynamic_max = 0.20 + (risk_score / 150.0)
        # Force the max weight to be at least slightly larger than an equal split
        max_weight = max(dynamic_max, (1.0 / num_assets) + 0.05) 
        
        bounds = tuple((min_weight, max_weight) for _ in range(num_assets))
        init_weights = np.array([1.0 / num_assets] * num_assets)
        constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
        
        alpha = max(0.0, min(risk_score / 100.0, 1.0))
        
        def objective(w):
            port_returns = returns.dot(w)
            var_95 = np.percentile(port_returns, 5)
            cvar_tail = port_returns[port_returns <= var_95]
            cvar = -cvar_tail.mean() if len(cvar_tail) > 0 else 0
            sharpe = -(port_returns.mean() / (port_returns.std() + 1e-9))
            return ((1.0 - alpha) * cvar * 10) + (alpha * sharpe)

        result = minimize(objective, init_weights, method='SLSQP', bounds=bounds, constraints=constraints)
        
        optimal_weights = np.round(result.x, 4) if result.success else init_weights
        
        # FIX 2: Explicitly convert numpy floats to native Python floats for FastAPI JSON
        return {str(ticker): float(weight) for ticker, weight in zip(returns.columns, optimal_weights)}

    def run_monte_carlo(self, historical_data: pd.DataFrame, days_to_simulate: int = 1260, num_simulations: int = 10000):
        """Phase 6: Monte Carlo Simulation (10,000 paths over 5 years)."""
        # We assume historical_data is a Series or a single-column DataFrame of prices
        if isinstance(historical_data, pd.DataFrame):
            historical_data = historical_data.iloc[:, 0]
            
        daily_returns = historical_data.pct_change().dropna()
        mu = daily_returns.mean()
        sigma = daily_returns.std()
        
        last_price = historical_data.iloc[-1]
        
        # Pre-allocate array for performance: (days, simulations)
        simulation_df = np.zeros((days_to_simulate, num_simulations))
        simulation_df[0] = last_price
        
        # Generate random shocks for all paths at once (Vectorized for speed)
        Z = np.random.normal(0, 1, (days_to_simulate - 1, num_simulations))
        
        # Apply Geometric Brownian Motion (GBM) formula
        daily_drift = mu - (sigma ** 2) / 2
        daily_shocks = daily_drift + sigma * Z
        
        # Calculate cumulative price paths
        simulation_df[1:] = last_price * np.exp(np.cumsum(daily_shocks, axis=0))
        
        # Extract final day prices to calculate percentiles
        final_prices = simulation_df[-1, :]
        
        return {
            "current_price": round(float(last_price), 2),
            "median_projection": round(float(np.percentile(final_prices, 50)), 2),
            "bull_case_90th": round(float(np.percentile(final_prices, 90)), 2),
            "bear_case_10th": round(float(np.percentile(final_prices, 10)), 2),
            "probability_positive_return_pct": round(float((np.sum(final_prices > last_price) / num_simulations) * 100), 2)
        }

# Instantiate the service so main.py can import it
optimizer_service = OptimizerService()