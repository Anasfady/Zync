from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# ==========================================
# AUTH & USER SCHEMAS
# ==========================================
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# ==========================================
# RISK PROFILE / ASSESSMENT SCHEMAS
# ==========================================
class RiskAssessmentCreate(BaseModel):
    overall_risk_score: float
    risk_capacity_score: Optional[float] = 50.0
    risk_tolerance_score: Optional[float] = 50.0
    investment_horizon_months: Optional[int] = 60

class ProfileCreate(BaseModel):
    overall_risk_score: float
    risk_capacity_score: Optional[float] = 50.0
    risk_tolerance_score: Optional[float] = 50.0
    investment_horizon_months: Optional[int] = 60

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    overall_risk_score: float
    risk_capacity_score: float
    risk_tolerance_score: float
    investment_horizon_months: int
    
    class Config:
        from_attributes = True

# ==========================================
# SIMULATION SCHEMAS (Phase 2 MVP)
# ==========================================
class SimulationCreate(BaseModel):
    ticker: str
    days_simulated: int
    current_price: float
    median_projection: float
    bull_case_95th: float
    bear_case_5th: float

class SimulationResponse(SimulationCreate):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==========================================
# CVaR PORTFOLIO SCHEMAS (Phase 4)
# ==========================================
class PortfolioGenerateRequest(BaseModel):
    tickers: List[str]

class PortfolioGenerateResponse(BaseModel):
    allocations: Dict[str, float]
    risk_score_used: float

class BacktestRequest(BaseModel):
    tickers: List[str]
    weights: Dict[str, float]

class BacktestResponse(BaseModel):
    initial_value: float
    final_value: float
    cagr: float
    annualized_volatility: float
    sharpe_ratio: float
    max_drawdown: float
    history: List[Dict[str, Any]]

# ==========================================
# LLM EXPLAIN SCHEMAS (Phase 7)
# ==========================================
class PortfolioExplainRequest(BaseModel):
    risk_score: float
    allocations: Dict[str, float]
    metrics: Optional[Dict[str, float]] = None

class PortfolioExplainResponse(BaseModel):
    explanation: str    