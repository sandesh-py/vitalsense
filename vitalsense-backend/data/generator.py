"""
Simulated vital sign data generator.
Uses random walk with small sigma for realistic gradual drift.

Anomaly lifecycle has 3 realistic phases:
  1. RAMP_UP   — vitals gradually climb toward the anomaly target
  2. PEAK      — vitals sustain in the anomalous range (with small noise)
  3. RAMP_DOWN — vitals gradually return to the normal range

This mimics real physiology: a tachycardia episode doesn't jump from
75 bpm to 150 bpm instantly — it builds up, peaks, then recovers.
"""

import random
from datetime import datetime
from enum import Enum
import numpy as np


class AnomalyPhase(str, Enum):
    NONE      = "NONE"
    RAMP_UP   = "RAMP_UP"
    PEAK      = "PEAK"
    RAMP_DOWN = "RAMP_DOWN"


# Normal baseline targets (the values the body wants to return to)
NORMAL_TARGETS = {
    "heart_rate":       75.0,
    "spo2":             97.5,
    "temperature":      36.6,
    "systolic_bp":      120.0,
    "diastolic_bp":     78.0,
    "respiratory_rate": 16.0,
}

# Anomaly peak target ranges — what the body climbs toward
ANOMALY_TARGETS = {
    "TACHYCARDIA":  {"heart_rate":       (130.0, 155.0)},
    "HYPOXIA":      {"spo2":             (87.0,  92.0)},
    "FEVER":        {"temperature":      (38.6,  39.8)},
    "HYPERTENSION": {"systolic_bp":      (155.0, 175.0),
                     "diastolic_bp":     (90.0,  100.0)},
}

# Ramp speed (step per tick toward target, as a fraction of the gap)
RAMP_UP_RATE   = 0.12   # 12% of gap per tick → ~20 ticks to reach peak
RAMP_DOWN_RATE = 0.08   # 8% of gap per tick → ~30 ticks to recover

# Normal random-walk sigmas (noise during stable periods)
NORMAL_SIGMA = {
    "heart_rate":       1.2,
    "spo2":             0.2,
    "temperature":      0.04,
    "systolic_bp":      1.5,
    "diastolic_bp":     1.2,
    "respiratory_rate": 0.7,
}

# Extra noise during peak (slightly jittery but sustained)
PEAK_SIGMA = {
    "heart_rate":       2.0,
    "spo2":             0.3,
    "temperature":      0.06,
    "systolic_bp":      2.5,
    "diastolic_bp":     1.5,
    "respiratory_rate": 1.0,
}

# Normal value clamping ranges
NORMAL_CLAMP = {
    "heart_rate":       (58.0,  100.0),
    "spo2":             (95.0,  99.5),
    "temperature":      (36.1,  37.2),
    "systolic_bp":      (108.0, 130.0),
    "diastolic_bp":     (68.0,  84.0),
    "respiratory_rate": (12.0,  20.0),
}


class VitalSignGenerator:
    """
    Generates physiologically realistic vital sign readings.
    Anomalies ramp up gradually, sustain at a peak, then ramp back down.
    """

    def __init__(self):
        # Current state — start in healthy range
        self.heart_rate       = 75.0
        self.spo2             = 97.5
        self.temperature      = 36.6
        self.systolic_bp      = 120.0
        self.diastolic_bp     = 78.0
        self.respiratory_rate = 16.0

        # Anomaly state machine
        self.anomaly_active = False
        self.anomaly_type   = None
        self._phase         = AnomalyPhase.NONE
        self._peak_targets  = {}          # e.g. {"heart_rate": 145.0}
        self._peak_remaining = 0          # ticks left in PEAK phase
        self._next_anomaly_in = random.randint(40, 80)

    # ────────────────────────────────────────────
    # Utility helpers
    # ────────────────────────────────────────────

    def _clamp(self, value, lo, hi):
        return max(lo, min(hi, value))

    def _random_walk(self, current, sigma, lo, hi):
        """Small Gaussian step clamped to [lo, hi]."""
        return self._clamp(current + np.random.normal(0, sigma), lo, hi)

    def _ramp_toward(self, current, target, rate, sigma=0.3):
        """
        Move `current` toward `target` by `rate` fraction of the gap,
        plus a tiny noise term so it doesn't look mechanical.
        """
        gap  = target - current
        step = gap * rate + np.random.normal(0, abs(gap) * 0.05 + sigma)
        # Don't overshoot
        if gap > 0:
            return current + max(0.0, min(step, gap * 1.2))
        else:
            return current + min(0.0, max(step, gap * 1.2))

    # ────────────────────────────────────────────
    # Anomaly state machine
    # ────────────────────────────────────────────

    def _trigger_anomaly(self):
        """Pick a random anomaly type and set peak targets."""
        kind = random.choice(["TACHYCARDIA", "HYPOXIA", "FEVER", "HYPERTENSION"])
        self.anomaly_active = True
        self.anomaly_type   = kind
        self._phase         = AnomalyPhase.RAMP_UP

        # Pick a random target within the anomaly range for each affected vital
        targets = ANOMALY_TARGETS[kind]
        self._peak_targets = {
            param: random.uniform(lo, hi)
            for param, (lo, hi) in targets.items()
        }
        # Peak duration: how long vitals stay in the anomalous zone
        self._peak_remaining = random.randint(20, 40)

    def _advance_phase(self):
        """
        Determine if the anomaly should transition between phases.
        Called once per tick, before generating values.
        """
        if self._phase == AnomalyPhase.NONE:
            self._next_anomaly_in -= 1
            if self._next_anomaly_in <= 0:
                self._trigger_anomaly()
            return

        if self._phase == AnomalyPhase.RAMP_UP:
            # Check if all targets are "close enough" (within 3% of target)
            reached = all(
                abs(getattr(self, param) - target) < abs(target) * 0.03
                for param, target in self._peak_targets.items()
            )
            if reached:
                self._phase = AnomalyPhase.PEAK

        elif self._phase == AnomalyPhase.PEAK:
            self._peak_remaining -= 1
            if self._peak_remaining <= 0:
                self._phase = AnomalyPhase.RAMP_DOWN

        elif self._phase == AnomalyPhase.RAMP_DOWN:
            # Check if all vitals are back near normal
            reached = all(
                abs(getattr(self, param) - NORMAL_TARGETS[param]) < abs(NORMAL_TARGETS[param]) * 0.03
                for param in self._peak_targets.keys()
            )
            if reached:
                # Fully recovered
                self.anomaly_active   = False
                self.anomaly_type     = None
                self._phase           = AnomalyPhase.NONE
                self._peak_targets    = {}
                self._next_anomaly_in = random.randint(40, 80)

    # ────────────────────────────────────────────
    # Per-vital update logic
    # ────────────────────────────────────────────

    def _update_vital(self, param):
        """Update a single vital sign based on the current anomaly phase."""
        current = getattr(self, param)

        if self._phase == AnomalyPhase.NONE:
            # Normal gentle drift
            lo, hi = NORMAL_CLAMP[param]
            sigma  = NORMAL_SIGMA[param]
            return self._random_walk(current, sigma, lo, hi)

        if param in self._peak_targets:
            target = self._peak_targets[param]
            if self._phase == AnomalyPhase.RAMP_UP:
                return self._ramp_toward(current, target, RAMP_UP_RATE, NORMAL_SIGMA[param])
            elif self._phase == AnomalyPhase.PEAK:
                # Sustain near peak with small jitter
                lo_p = target * 0.96
                hi_p = target * 1.04
                return self._clamp(
                    self._random_walk(current, PEAK_SIGMA[param], lo_p, hi_p),
                    lo_p, hi_p
                )
            elif self._phase == AnomalyPhase.RAMP_DOWN:
                normal_target = NORMAL_TARGETS[param]
                return self._ramp_toward(current, normal_target, RAMP_DOWN_RATE, NORMAL_SIGMA[param])
        else:
            # Vital not directly affected — subtle secondary drift
            lo, hi = NORMAL_CLAMP[param]
            sigma  = NORMAL_SIGMA[param] * 1.3   # slightly noisier during anomaly
            return self._random_walk(current, sigma, lo, hi)

    # ────────────────────────────────────────────
    # Public interface
    # ────────────────────────────────────────────

    def generate_reading(self) -> dict:
        """Generate one vital sign reading with physiologically realistic transitions."""
        self._advance_phase()

        # Update every vital
        self.heart_rate       = round(self._update_vital("heart_rate"), 1)
        self.spo2             = round(self._update_vital("spo2"), 1)
        self.temperature      = round(self._update_vital("temperature"), 2)
        self.systolic_bp      = round(self._update_vital("systolic_bp"), 1)
        self.diastolic_bp     = round(self._update_vital("diastolic_bp"), 1)
        self.respiratory_rate = round(self._update_vital("respiratory_rate"), 1)

        return {
            "patient_id":        "P001",
            "timestamp":         datetime.utcnow().isoformat(),
            "heart_rate":        self.heart_rate,
            "spo2":              self.spo2,
            "temperature":       self.temperature,
            "systolic_bp":       int(self.systolic_bp),
            "diastolic_bp":      int(self.diastolic_bp),
            "respiratory_rate":  int(self.respiratory_rate),
            "anomaly_active":    self.anomaly_active,
            "anomaly_type":      self.anomaly_type,
        }

    def generate_batch(self, n: int) -> list[dict]:
        """Generate n sequential readings."""
        return [self.generate_reading() for _ in range(n)]


# ── Module-level singleton ──
_generator = VitalSignGenerator()


def generate_reading() -> dict:
    return _generator.generate_reading()


def generate_batch(n: int) -> list[dict]:
    return _generator.generate_batch(n)


def new_generator() -> VitalSignGenerator:
    """Create a fresh generator (for training data)."""
    return VitalSignGenerator()
