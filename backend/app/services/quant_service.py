import yfinance as yf
import pandas as pd
import numpy as np
import logging
from abc import ABC, abstractmethod
from scipy.optimize import minimize
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 1. DATA ABSTRACTION LAYER ---
class MarketDataProvider(ABC):
    @abstractmethod
    def fetch_historical_prices(self, tickers: list, years: int = 5) -> pd.DataFrame:
        pass

class YahooFinanceProvider(MarketDataProvider):
    def fetch_historical_prices(self, tickers: list, years: int = 5) -> pd.DataFrame:
        logger.info(f"Fetching {years} years of data for {tickers} from Yahoo Finance...")
        end_date = datetime.today()
        start_date = end_date - timedelta(days=years * 365)
        
        # Download Adjusted Close prices
        data = yf.download(tickers, start=start_date, end=end_date)['Adj Close']
        
        # Clean the data: Forward-fill missing days (like holidays), then drop what can't be filled
        data = data.ffill().dropna()
        return data

# --- 2. QUANTITATIVE OPTIMIZATION ENGINE ---
class PortfolioOptimizer:
    def __init__(self, risk_free_rate: float = 0.04):
        self.risk_free_rate = risk_free_rate
        self.trading_days = 252 # Standard trading days in a year

    def calculate_metrics(self, data: pd.DataFrame):
        """Calculates expected annualized returns and the covariance matrix."""
        # Calculate daily percentage returns
        daily_returns = data.pct_change().dropna()
        
        # Annualize the returns and covariance
        expected_returns = daily_returns.mean() * self.trading_days
        cov_matrix = daily_returns.cov() * self.trading_days
        
        return expected_returns, cov_matrix

    def portfolio_performance(self, weights: np.ndarray, expected_returns: pd.Series, cov_matrix: pd.DataFrame):
        """Calculates the return and volatility for a specific set of weights."""
        returns = np.sum(expected_returns * weights)
        std_dev = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        return returns, std_dev

    def maximize_sharpe(self, expected_returns: pd.Series, cov_matrix: pd.DataFrame):
        """Finds the weights that maximize the Sharpe Ratio (Best Risk-Adjusted Return)."""
        num_assets = len(expected_returns)
        args = (expected_returns, cov_matrix)

        # We want to maximize Sharpe, which means minimizing the negative Sharpe
        def negative_sharpe(weights, expected_returns, cov_matrix):
            p_ret, p_std = self.portfolio_performance(weights, expected_returns, cov_matrix)
            return -(p_ret - self.risk_free_rate) / p_std

        # Constraints: All weights must sum to 1.0 (100%)
        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        # Bounds: No short selling (weights between 0 and 1)
        bounds = tuple((0.0, 1.0) for asset in range(num_assets))
        # Initial guess: Equal weighting
        initial_guess = num_assets * [1. / num_assets,]

        optimized = minimize(negative_sharpe, initial_guess, args=args, method='SLSQP', bounds=bounds, constraints=constraints)
        return np.round(optimized.x, 4)

# --- 3. THE MAIN SERVICE ---
class QuantService:
    def __init__(self, data_provider: MarketDataProvider):
        self.data_provider = data_provider
        self.optimizer = PortfolioOptimizer()

    def generate_optimal_portfolio(self, tickers: list):
        # 1. Get the cleaned historical data
        price_data = self.data_provider.fetch_historical_prices(tickers)
        
        # 2. Calculate mathematical expectations
        expected_returns, cov_matrix = self.optimizer.calculate_metrics(price_data)
        
        # 3. Run the optimization algorithm (Max Sharpe)
        optimal_weights = self.optimizer.maximize_sharpe(expected_returns, cov_matrix)
        
        # 4. Calculate final metrics for the optimal portfolio
        opt_return, opt_volatility = self.optimizer.portfolio_performance(optimal_weights, expected_returns, cov_matrix)
        
        # Map weights back to their ticker symbols
        allocations = dict(zip(tickers, optimal_weights))
        
        return {
            "allocations": allocations,
            "metrics": {
                "expected_annual_return_pct": round(opt_return * 100, 2),
                "annual_volatility_pct": round(opt_volatility * 100, 2),
                "sharpe_ratio": round((opt_return - self.optimizer.risk_free_rate) / opt_volatility, 2)
            }
        }

# Instantiate the service to be imported by our API
quant_service = QuantService(data_provider=YahooFinanceProvider())