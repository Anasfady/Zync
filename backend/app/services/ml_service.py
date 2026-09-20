import pandas as pd
import yfinance as yf
from stable_baselines3 import PPO
from app.services.rl_environment import PortfolioEnv
import os

MODEL_PATH = "ppo_portfolio_agent.zip"

class DRLService:
    def fetch_training_data(self, tickers, start_date="2015-01-01", end_date="2023-01-01"):
        """Downloads historical data for the AI to practice on."""
        # Changed 'Adj Close' to 'Close' here
        df = yf.download(tickers, start=start_date, end=end_date)['Close']
        return df.dropna()

    def train_agent(self, tickers):
        """Creates the gym environment and trains the neural network."""
        print(f"Fetching data for {tickers}...")
        df = self.fetch_training_data(tickers)
        
        env = PortfolioEnv(df_prices=df)
        
        print("Initializing PPO Neural Network...")
        # MlpPolicy is a standard feed-forward neural network
        model = PPO("MlpPolicy", env, verbose=1, learning_rate=0.0003)
        
        print("Training AI across 50,000 market days...")
        model.learn(total_timesteps=50000)
        
        model.save(MODEL_PATH)
        print(f"Model saved to {MODEL_PATH}")
        return model

    def predict_next_allocations(self, recent_prices_df: pd.DataFrame) -> dict:
        """Used in production to generate tomorrow's allocations."""
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError("AI Model not trained yet!")
            
        model = PPO.load(MODEL_PATH)
        env = PortfolioEnv(df_prices=recent_prices_df)
        
        # Get current market observation
        obs, _ = env.reset()
        
        # AI predicts the best action (weights) for the current market state
        action, _states = model.predict(obs, deterministic=True)
        
        # Softmax to ensure weights sum to 1.0
        import numpy as np
        exp_action = np.exp(action - np.max(action))
        optimal_weights = exp_action / exp_action.sum()
        
        tickers = recent_prices_df.columns.tolist()
        return {str(ticker): float(weight) for ticker, weight in zip(tickers, optimal_weights)}

drl_service = DRLService()