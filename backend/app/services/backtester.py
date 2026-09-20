import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class BacktestService:
    def run_backtest(self, prices_df: pd.DataFrame, weights: dict, transaction_cost_pct: float = 0.001):
        """
        Runs a rigorous historical backtest.
        Returns keys precisely mapped to the Phase 6 React dashboard.
        """
        logger.info("Running advanced historical backtest...")
        
        # Align weights to DataFrame columns
        ticker_list = list(prices_df.columns)
        w_vector = np.array([weights.get(ticker, 0.0) for ticker in ticker_list])
        
        # Normalize weights to sum to 1.0
        if w_vector.sum() > 0:
            w_vector = w_vector / w_vector.sum()
        else:
            w_vector = np.ones(len(ticker_list)) / len(ticker_list)

        # Calculate daily returns of individual assets
        daily_returns = prices_df.pct_change().dropna()
        
        # Portfolio daily returns
        portfolio_returns = daily_returns.dot(w_vector)
        
        # Calculate growth curve (assuming $10,000 initial investment)
        cumulative_growth = (1 + portfolio_returns).cumprod()
        initial_value = 10000.0
        portfolio_value = initial_value * cumulative_growth
        
        # Calculate performance metrics
        total_days = len(portfolio_returns)
        years = total_days / 252.0 if total_days > 0 else 1.0
        
        final_value = portfolio_value.iloc[-1] if not portfolio_value.empty else initial_value
        cagr = (final_value / initial_value) ** (1 / years) - 1 if years > 0 else 0.0
        
        annualized_vol = portfolio_returns.std() * np.sqrt(252)
        
        # Sharpe Ratio (assuming 2% risk-free rate)
        risk_free_rate = 0.02
        excess_returns = portfolio_returns - (risk_free_rate / 252)
        sharpe_ratio = (excess_returns.mean() * np.sqrt(252)) / annualized_vol if annualized_vol > 0 else 0.0
        
        # Maximum Drawdown
        rolling_max = portfolio_value.cummax()
        drawdown = (portfolio_value - rolling_max) / rolling_max
        max_drawdown = drawdown.min() if not drawdown.empty else 0.0

        # Format historical time series exactly how Recharts expects it ("history" array)
        history_records = []
        for date, val in portfolio_value.items():
            date_str = date.strftime('%Y-%m-%d') if hasattr(date, 'strftime') else str(date)[:10]
            history_records.append({"date": date_str, "value": round(float(val), 2)})

        # Return exact keys mapped to PortfolioChart.jsx state
        return {
            "initial_value": initial_value,
            "final_value": round(float(final_value), 2),
            "cagr": round(float(cagr) * 100, 2),
            "annualized_volatility": round(float(annualized_vol) * 100, 2),
            "sharpe_ratio": round(float(sharpe_ratio), 2),
            "max_drawdown": round(float(max_drawdown) * 100, 2),
            "history": history_records
        }

backtest_service = BacktestService()