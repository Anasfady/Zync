import yfinance as yf
import numpy as np
from app.services.ml_service import drl_service
import warnings
warnings.filterwarnings('ignore') # Suppress yfinance warnings for a clean terminal

def project_future_performance(df_prices, weights_dict, initial_investment=10000):
    """Calculates expected future values based on historical drift and volatility."""
    
    # Align the AI weights to the dataframe columns
    tickers = list(df_prices.columns)
    weights = np.array([weights_dict.get(t, 0) for t in tickers])
    
    # Calculate daily returns of the AI's exact portfolio mix
    daily_returns = df_prices.pct_change().dropna()
    portfolio_returns = daily_returns.dot(weights)
    
    # Calculate Mean (mu) and Volatility (sigma)
    mu = portfolio_returns.mean()
    sigma = portfolio_returns.std()
    
    # Define time horizons in trading days
    horizons = {
        "1 Day": 1,
        "1 Month": 21,
        "3 Months": 63,
        "6 Months": 126,
        "1 Year": 252
    }
    
    print(f"\n🔮 Forecasting $10,000 Investment (Geometric Brownian Motion Projection):")
    print("-" * 65)
    
    for label, days in horizons.items():
        # Formula: Expected Growth = (μ - σ²/2) * t
        expected_growth = (mu - (sigma**2 / 2)) * days
        expected_value = initial_investment * np.exp(expected_growth)
        
        # Calculate risk range using standard deviation: σ * √t
        volatility_impact = sigma * np.sqrt(days)
        lower_bound = initial_investment * np.exp(expected_growth - volatility_impact)
        upper_bound = initial_investment * np.exp(expected_growth + volatility_impact)
        
        print(f" ⏳ {label:<10} | Expected: ${expected_value:,.2f}")
        print(f"    {'':<10} | Range:    ${lower_bound:,.2f} to ${upper_bound:,.2f}\n")

def run_test():
    tickers = ["SPY", "QQQ", "TLT", "GLD", "BTC-USD"]
    
    # We comment out training so it runs instantly using the brain you just saved!
    # drl_service.train_agent(tickers) 
    
    print("🧠 Loading Trained AI Brain for Inference...")
    # Fetch 1 year of data so the math engine has enough context for annual projections
    recent_data = yf.download(tickers, period="1y")['Close'].dropna()
    
    # AI predicts the weights
    predicted_allocations = drl_service.predict_next_allocations(recent_data)
    
    print("\n📈 AI Recommended Portfolio Weights for Tomorrow:")
    for ticker, weight in predicted_allocations.items():
        print(f" - {ticker}: {weight * 100:.2f}%")
        
    # Run the future projection math
    project_future_performance(recent_data, predicted_allocations)

if __name__ == "__main__":
    run_test()