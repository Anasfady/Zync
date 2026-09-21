import requests
import logging
import os
from dotenv import load_dotenv
from abc import ABC, abstractmethod
import google.generativeai as genai
    
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMProvider(ABC):
    @abstractmethod
    def generate_explanation(self, risk_score: float, allocations: dict, metrics: dict) -> str:
        pass

# 1. PRIMARY: OLLAMA (Upgraded to the Lightning-Fast 1B Model)
class OllamaProvider(LLMProvider):
    # Changed default model to the ultra-light laptop version!
    def __init__(self, model_name: str = "llama3.2:1b"): 
        self.base_url = "http://localhost:11434/api/generate"
        self.model_name = model_name

    def generate_explanation(self, risk_score: float, allocations: dict, metrics: dict) -> str:
        prompt = f"Explain this portfolio strategy to a Gen Z user in 3 sentences. Risk: {risk_score}, Allocations: {allocations}, Metrics: {metrics}"
        
        logger.info(f"Attempting local generation (Ollama {self.model_name})...")
        # Reduced timeout to 60s because this model is extremely fast
        response = requests.post(
            self.base_url, 
            json={"model": self.model_name, "prompt": prompt, "stream": False}, 
            timeout=60
        )
        response.raise_for_status()
        return response.json().get("response", "")

# 2. SECONDARY: GEMINI (Upgraded to the 2026 Model)
class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        # We listened to Google's error log and updated the string!
        self.model_name = 'gemini-3.6-flash'

    def generate_explanation(self, risk_score: float, allocations: dict, metrics: dict) -> str:
        prompt = f"You are a professional, Gen Z-friendly financial advisor. Explain this mathematical portfolio strategy in 3 engaging sentences. User Risk Score: {risk_score}. Allocations: {allocations}. 1-Year Backtest Metrics: {metrics}."
        
        logger.info("Attempting commercial generation (Gemini Fallback)...")
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt
        )
        return response.text

# 3. THE SAFETY NET: MOCKED AI
class MockProvider(LLMProvider):
    def generate_explanation(self, risk_score: float, allocations: dict, metrics: dict) -> str:
        logger.info("Using Mock AI Provider...")
        drawdown = metrics.get('max_drawdown_pct', -6.99)
        return f"Based on your risk score of {risk_score}, this strategy is mathematically optimized to protect your capital. We heavily weighted Treasury bonds to minimize your max drawdown to {drawdown}%. This ensures steady, risk-adjusted returns while shielding you from tech market volatility."

# 4. THE TRIPLE HYBRID ROUTER
class HybridLLMProvider(LLMProvider):
    def __init__(self, providers: list):
        self.providers = providers

    def generate_explanation(self, risk_score: float, allocations: dict, metrics: dict) -> str:
        for provider in self.providers:
            try:
                return provider.generate_explanation(risk_score, allocations, metrics)
            except Exception as e:
                logger.warning(f"{provider.__class__.__name__} failed: {str(e)}. Moving to next fallback...")
        
        return "My AI brain is offline, but your math is sound!"

# INSTANTIATE THE ENGINE
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

llm_service = HybridLLMProvider([
    OllamaProvider(model_name="llama3.2:1b"),
    GeminiProvider(api_key=GEMINI_API_KEY),
    MockProvider() 
])