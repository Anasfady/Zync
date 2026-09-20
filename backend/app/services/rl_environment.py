import gymnasium as gym
from gymnasium import spaces
import numpy as np
import pandas as pd

class PortfolioEnv(gym.Env):
    """A custom DRL environment for portfolio allocation."""
    
    def __init__(self, df_prices: pd.DataFrame, initial_balance: float = 10000.0, transaction_cost: float = 0.001):
        super(PortfolioEnv, self).__init__()
        
        self.df_prices = df_prices.dropna()
        self.returns = self.df_prices.pct_change().dropna().values
        self.num_assets = self.df_prices.shape[1]
        self.n_steps = len(self.returns)
        
        self.initial_balance = initial_balance
        self.transaction_cost = transaction_cost
        
        # Action Space: The AI outputs a weight for each asset (0 to 1)
        self.action_space = spaces.Box(low=0, high=1, shape=(self.num_assets,), dtype=np.float32)
        
        # Observation Space: What the AI sees (Current weights + past 5 days of returns)
        self.window_size = 5
        obs_shape = self.num_assets + (self.num_assets * self.window_size)
        self.observation_space = spaces.Box(low=-np.inf, high=np.inf, shape=(obs_shape,), dtype=np.float32)
        
    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_step = self.window_size
        self.current_weights = np.ones(self.num_assets) / self.num_assets
        self.portfolio_value = self.initial_balance
        return self._get_obs(), {}

    def _get_obs(self):
        # AI looks at the last 5 days of market returns + its current portfolio weights
        past_returns = self.returns[self.current_step - self.window_size : self.current_step].flatten()
        return np.concatenate([self.current_weights, past_returns]).astype(np.float32)

    def step(self, action):
        # 1. AI decides on new weights (Action) -> Normalize using Softmax so they sum to 1.0
        exp_action = np.exp(action - np.max(action))
        new_weights = exp_action / exp_action.sum()
        
        # 2. Calculate transaction costs for changing the portfolio
        turnover = np.sum(np.abs(new_weights - self.current_weights))
        fees = turnover * self.transaction_cost
        
        # 3. Market moves forward one day
        step_returns = self.returns[self.current_step]
        portfolio_return = np.sum(new_weights * step_returns) - fees
        
        # Update portfolio value and weights
        self.portfolio_value = self.portfolio_value * (1 + portfolio_return)
        self.current_weights = new_weights
        self.current_step += 1
        
        # 4. Calculate Reward (Risk-adjusted return: penalize losing money)
        reward = portfolio_return
        if portfolio_return < 0:
            reward *= 1.5 # Heavier penalty for drawdowns
            
        done = self.current_step >= self.n_steps - 1
        
        return self._get_obs(), float(reward), done, False, {"portfolio_value": self.portfolio_value}