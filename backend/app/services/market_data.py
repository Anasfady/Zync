from abc import ABC, abstractmethod
import pandas as pd
import yfinance as yf
import logging

# Configure professional logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketDataProvider(ABC):
    """
    Abstract base class for all market data providers.
    Enforces a strict contract so we can swap providers (e.g., to Bloomberg or Alpaca) seamlessly.
    """
    @abstractmethod
    def fetch_historical_data(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        pass

class YahooFinanceProvider(MarketDataProvider):
    """
    Concrete implementation using Yahoo Finance.
    Handles extraction, basic cleaning, and normalization.
    """
    def fetch_historical_data(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        try:
            logger.info(f"Fetching data for {ticker} using Yahoo Finance...")
            stock = yf.Ticker(ticker)
            df = stock.history(period=period)
            
            if df.empty:
                logger.warning(f"No data found for {ticker}. Symbol may be delisted or regional suffix missing.")
                return pd.DataFrame()
                
            # Data Cleaning: Forward fill missing days, then backward fill remaining NaNs
            df = df.ffill().bfill()
            
            # Standardize columns for our ML & Database schemas
            df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
            
            # yf.history() 'Close' is already split/dividend adjusted. 
            # We map it to explicitly match our database schema expectations.
            df['Adjusted_Close'] = df['Close'] 
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching data for {ticker} from Yahoo Finance: {str(e)}")
            return pd.DataFrame()

class MarketDataService:
    """
    The main service layer injected into our API routes. 
    It doesn't care WHERE the data comes from, only that it gets a DataFrame back.
    """
    def __init__(self, provider: MarketDataProvider):
        self.provider = provider
        
    def get_historical_prices(self, ticker: str, period: str = "1y") -> pd.DataFrame:
        # NOTE: In Phase 4, we will add logic here to check PostgreSQL first, 
        # and only call the provider if the database is missing today's data.
        return self.provider.fetch_historical_data(ticker, period)

# Dependency Injection: We instantiate the service with our specific provider.
# If we change to Polygon.io later, we ONLY change this one line.
market_data_service = MarketDataService(provider=YahooFinanceProvider())