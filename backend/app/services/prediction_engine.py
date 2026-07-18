"""
FlowSense - Prediction Engine
Wraps the ML engine and provides the same interface as before
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass

from .ml_engine import ml_engine, PredictionResult


@dataclass
class LegacyPredictionResult:
    """Backward-compatible prediction result"""
    timestamp: datetime
    prediction_horizon: int
    predicted_boarding: float
    confidence_score: float
    risk_level: str
    current_boarding: int
    features_used: Dict
    contributing_factors: List[str]


class BoardingPredictor:
    """
    Prediction facade - delegates to ML engine.
    
    On first use, trains the ML models on synthetic data.
    After that, uses trained GradientBoosting + RandomForest + Ridge ensemble.
    """
    
    def __init__(self):
        self._trained = False
    
    def _ensure_trained(self):
        if not self._trained and not ml_engine.is_trained:
            print("[PredictionEngine] First prediction - training ML models...")
            ml_engine.train(days=90)
            self._trained = True
    
    def predict(
        self,
        current_state: Dict,
        prediction_horizon: int = 6,
        arrival_rate: float = 10.0,
        discharge_rate: float = 4.0,
    ) -> LegacyPredictionResult:
        self._ensure_trained()
        
        result = ml_engine.predict(current_state, prediction_horizon, arrival_rate, discharge_rate)
        
        return LegacyPredictionResult(
            timestamp=result.timestamp,
            prediction_horizon=result.prediction_horizon,
            predicted_boarding=result.predicted_boarding,
            confidence_score=result.confidence_score,
            risk_level=result.risk_level,
            current_boarding=result.current_boarding,
            features_used=result.features_used,
            contributing_factors=result.contributing_factors,
        )
    
    def predict_timeline(
        self,
        current_state: Dict,
        horizons: List[int] = [4, 6, 8, 12],
        arrival_rate: float = 10.0,
        discharge_rate: float = 4.0,
    ) -> List[LegacyPredictionResult]:
        self._ensure_trained()
        
        results = ml_engine.predict_timeline(current_state, horizons, arrival_rate, discharge_rate)
        
        return [
            LegacyPredictionResult(
                timestamp=r.timestamp,
                prediction_horizon=r.prediction_horizon,
                predicted_boarding=r.predicted_boarding,
                confidence_score=r.confidence_score,
                risk_level=r.risk_level,
                current_boarding=r.current_boarding,
                features_used=r.features_used,
                contributing_factors=r.contributing_factors,
            )
            for r in results
        ]
    
    def get_peak_risk(self, predictions: List[LegacyPredictionResult]) -> Tuple[str, datetime]:
        """Get the peak risk level using weighted scoring — closer horizons matter more."""
        risk_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        horizon_weights = {4: 0.4, 6: 0.3, 8: 0.2, 12: 0.1}
        
        weighted_score = 0.0
        max_risk = "low"
        max_risk_time = datetime.now()
        
        for pred in predictions:
            w = horizon_weights.get(pred.prediction_horizon, 0.1)
            weighted_score += risk_order.get(pred.risk_level, 0) * w
            if risk_order.get(pred.risk_level, 0) > risk_order.get(max_risk, 0):
                max_risk = pred.risk_level
                max_risk_time = pred.timestamp + timedelta(hours=pred.prediction_horizon)
        
        if weighted_score >= 2.5:
            peak_risk = "critical"
        elif weighted_score >= 1.5:
            peak_risk = "high"
        elif weighted_score >= 0.5:
            peak_risk = "medium"
        else:
            peak_risk = "low"
        
        return peak_risk, max_risk_time
    
    def estimate_time_to_critical(
        self,
        current_state: Dict,
        arrival_rate: float = 10.0,
        discharge_rate: float = 4.0,
        threshold: int = 15,
    ) -> Optional[int]:
        self._ensure_trained()
        return ml_engine.estimate_time_to_critical(current_state, arrival_rate, discharge_rate, threshold)


predictor = BoardingPredictor()
