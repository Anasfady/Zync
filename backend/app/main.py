from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd
from datetime import timedelta
from jose import JWTError, jwt

# Import our internal modules
from core.database import engine, Base, get_db
from core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from app.models import models
from app.schemas import schemas
from app.services.backtester import backtest_service
from app.services.market_data import market_data_service
from app.services.portfolio_optimizer import optimizer_service
from app.services.llm_service import llm_service

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zync Gen Z API", version="0.1.0")

# Security Scheme for Swagger UI integration (Fixed trailing slash)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")

# Bulletproof CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://zync-frontend.onrender.com"  # Added your exact live frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Registers a new user and securely hashes their password."""
    clean_email = user.email.strip().lower() # Strip invisible spaces
    db_user = db.query(models.User).filter(models.User.email == clean_email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user.password)
    new_user = models.User(email=clean_email, hashed_password=hashed_pwd)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/v1/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticates a user and returns a JWT Bearer token."""
    clean_username = form_data.username.strip().lower() # Strip invisible spaces
    
    print(f"\n--- DEBUG LOGIN ATTEMPT ---")
    print(f"1. React sent email: '{clean_username}'")
    print(f"2. Password length provided: {len(form_data.password)}")
    
    user = db.query(models.User).filter(models.User.email == clean_username).first()
    
    if not user:
        print("3. RESULT: FAILED - Email does not exist in the database.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    if not verify_password(form_data.password, user.hashed_password):
        print("3. RESULT: FAILED - Password did not match the hash.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    print("3. RESULT: SUCCESS! Generating JWT Token.")
    
    # Generate the JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/me", response_model=schemas.UserResponse)
def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Protected route: Returns the profile of the currently authenticated user."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/v1/risk-assessment", response_model=schemas.ProfileResponse)
def submit_risk_assessment(
    assessment: schemas.RiskAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(read_users_me)
):
    """Saves the user's risk assessment results directly to their Profile."""
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    
    if profile:
        profile.overall_risk_score = assessment.overall_risk_score
        profile.risk_capacity_score = assessment.risk_capacity_score
        profile.risk_tolerance_score = assessment.risk_tolerance_score
        profile.investment_horizon_months = assessment.investment_horizon_months
    else:
        profile = models.Profile(
            user_id=current_user.id,
            overall_risk_score=assessment.overall_risk_score,
            risk_capacity_score=assessment.risk_capacity_score,
            risk_tolerance_score=assessment.risk_tolerance_score,
            investment_horizon_months=assessment.investment_horizon_months
        )
        db.add(profile)
        
    db.commit()
    db.refresh(profile)
    return profile

@app.get("/api/v1/market-data/{ticker}")
def get_market_data(
    ticker: str, 
    period: str = "1mo",
    current_user: models.User = Depends(read_users_me)
):
    df = market_data_service.get_historical_prices(ticker, period=period)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {ticker}")
    
    df.reset_index(inplace=True)
    df['Date'] = df['Date'].astype(str)
    
    return {
        "ticker": ticker.upper(),
        "period": period,
        "data": df.to_dict(orient="records")
    }

@app.get("/api/v1/simulate/{ticker}")
def run_simulation(
    ticker: str,
    days: int = 252,
    current_user: models.User = Depends(read_users_me)
):
    df = market_data_service.get_historical_prices(ticker, period="1y")
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {ticker}")
        
    simulation_results = optimizer_service.run_monte_carlo(
        historical_data=df, 
        days_to_simulate=days
    )
    
    return {
        "ticker": ticker.upper(),
        "projections": simulation_results
    }


@app.post("/api/v1/simulations", response_model=schemas.SimulationResponse)
def save_simulation(
    sim_data: schemas.SimulationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(read_users_me)
):
    new_sim = models.Simulation(
        user_id=current_user.id,
        ticker=sim_data.ticker.upper(),
        days_simulated=sim_data.days_simulated,
        current_price=sim_data.current_price,
        median_projection=sim_data.median_projection,
        bull_case_95th=sim_data.bull_case_95th,
        bear_case_5th=sim_data.bear_case_5th
    )
    
    db.add(new_sim)
    db.commit()
    db.refresh(new_sim)
    return new_sim

@app.get("/api/v1/simulations", response_model=list[schemas.SimulationResponse])
def get_user_simulations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(read_users_me)
):
    simulations = db.query(models.Simulation)\
        .filter(models.Simulation.user_id == current_user.id)\
        .order_by(models.Simulation.id.desc())\
        .all()
    return simulations

@app.get("/api/v1/profile")
def get_user_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(read_users_me)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    return profile

@app.post("/api/v1/portfolios/generate", response_model=schemas.PortfolioGenerateResponse)
def generate_portfolio(
    request: schemas.PortfolioGenerateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(read_users_me)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete the Risk Assessment first.")
        
    risk_score = profile.overall_risk_score
    series_list = []
    
    for ticker in request.tickers:
        df = market_data_service.get_historical_prices(ticker, period="1y")
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No market data found for {ticker}")
        
        col = 'Adjusted_Close' if 'Adjusted_Close' in df.columns else 'Adj Close'
        if col not in df.columns:
            col = 'Close'
            
        s = df[col].copy()
        
        if isinstance(s.index, pd.DatetimeIndex):
            s.index = s.index.tz_localize(None).normalize()
            
        s.name = ticker
        series_list.append(s)
        
    combined_prices = pd.concat(series_list, axis=1)
    combined_prices.dropna(inplace=True)
    
    if combined_prices.empty or len(combined_prices) < 10:
        raise HTTPException(status_code=500, detail="Data alignment failed. Check ticker timezones.")

    allocations = optimizer_service.generate_optimal_portfolio(combined_prices, risk_score)
    
    return {
        "allocations": allocations,
        "risk_score_used": risk_score
    }

@app.post("/api/v1/portfolios/backtest", response_model=schemas.BacktestResponse)
def backtest_portfolio(
    request: schemas.BacktestRequest,
    current_user: models.User = Depends(read_users_me)
):
    series_list = []
    
    for ticker in request.tickers:
        df = market_data_service.get_historical_prices(ticker, period="1y")
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data for {ticker}")
        
        col = 'Adjusted_Close' if 'Adjusted_Close' in df.columns else 'Adj Close'
        if col not in df.columns:
            col = 'Close'
            
        s = df[col].copy()
        
        if isinstance(s.index, pd.DatetimeIndex):
            s.index = s.index.tz_localize(None).normalize()
            
        s.name = ticker
        series_list.append(s)
        
    if not series_list:
        raise HTTPException(status_code=400, detail="No data could be retrieved.")
        
    combined_prices = pd.concat(series_list, axis=1)
    combined_prices.dropna(inplace=True)
    
    if combined_prices.empty or len(combined_prices) < 10:
        raise HTTPException(status_code=500, detail="Data alignment failed. Check ticker timezones.")
    
    results = backtest_service.run_backtest(combined_prices, request.weights)
    return results

@app.post("/api/v1/portfolios/explain", response_model=schemas.PortfolioExplainResponse)
def explain_portfolio(
    request: schemas.PortfolioExplainRequest,
    current_user: models.User = Depends(read_users_me)
):
    explanation = llm_service.generate_explanation(
        risk_score=request.risk_score,
        allocations=request.allocations,
        metrics=request.metrics or {}
    )
    
    return {"explanation": explanation}