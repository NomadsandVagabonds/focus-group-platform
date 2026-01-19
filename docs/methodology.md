# Perception Tracking Methodology

## Overview

The Resonant platform captures continuous participant reactions during focus group sessions using a real-time perception slider. This document outlines the data collection methodology and advanced analytical techniques enabled by engagement tracking.

## Data Collection

### Core Data Points

Each perception data point contains:

```typescript
{
  userId: string;           // Participant identifier
  sessionId: string;        // Session identifier
  timestamp: number;        // When data was captured (ms)
  value: number;            // Perception value (0-100)
  lastInteractionTime: number; // When user last moved slider (ms)
  mediaTimestamp?: number;  // Optional: timestamp in media playback
}
```

### Sampling Rate

- **Frequency:** 250ms (4 samples/second)
- **Method:** Interval-based reporting with interaction tracking
- **Persistence:** Values saved to localStorage for session continuity

### Interaction Tracking

The `lastInteractionTime` field records when the participant last actively moved the slider via:
- Mouse/touch drag
- Keyboard controls (Arrow keys, A/D)
- Emoji preset buttons

This enables distinction between **active ratings** (user just moved slider) and **passive ratings** (slider hasn't been touched).

---

## Analytical Frameworks

### 1. Engagement as Signal

**Flat-line segments aren't noise—they're data:**

- **Message Salience:** Content that doesn't prompt slider movement isn't emotionally resonant
- **Cognitive Load:** Extended flat-lines may indicate participant overwhelm or disengagement
- **Polarization Detection:** Universal movement = divisive topic; no movement = boring consensus
- **Attention Tracking:** More reliable than eye-tracking for measuring "does this matter?"

### 2. Temporal Decay Weighting

Weight perception values based on recency of interaction to prioritize fresh, active ratings over stale ones.

#### Formula

```python
time_since_interaction = timestamp - lastInteractionTime
freshness_weight = exp(-decay_rate * time_since_interaction)
weighted_value = value * freshness_weight
```

#### Decay Rate Presets

**Conservative (λ = 0.05/sec):**
```
0s:  weight = 1.00 (100%)
5s:  weight = 0.78 (78%)
10s: weight = 0.61 (61%)
20s: weight = 0.37 (37%)
```

**Moderate (λ = 0.1/sec):**
```
0s:  weight = 1.00
5s:  weight = 0.61
10s: weight = 0.37
20s: weight = 0.14
```

**Aggressive (λ = 0.2/sec):**
```
0s:  weight = 1.00
5s:  weight = 0.37
10s: weight = 0.14
20s: weight = 0.02
```

#### Weighted Mean Calculation

```python
weighted_mean = sum(value * weight) / sum(weight)
```

### 3. Engagement Scoring

Quantify participant engagement throughout the session:

```python
# Per-participant engagement score
staleness_values = [timestamp - lastInteractionTime for each datapoint]
avg_staleness = mean(staleness_values)
max_staleness = max(staleness_values)
engagement_score = 1 - (avg_staleness / max_staleness)
```

**Interpretation:**
- **High score (>0.8):** Active, engaged participant
- **Medium score (0.5-0.8):** Moderate engagement
- **Low score (<0.5):** Passive, disengaged participant

### 4. Message Salience Analysis

Compare weighted vs. unweighted means to detect engagement patterns:

```python
unweighted_mean = mean(values)
weighted_mean = sum(value * weight) / sum(weight)
salience_divergence = abs(weighted_mean - unweighted_mean)
```

**Interpretation:**
- **High divergence:** People "set and forget" (low salience)
- **Low divergence:** Continuous engagement (high salience)

---

## Research Applications

### Messaging Testing

**High Engagement Segments:**
- Emotionally charged content
- Worth A/B testing and iteration
- Likely to drive behavior change

**Flat Segments:**
- Low emotional resonance
- Candidates for rewriting or removal
- Not "moving the needle" (literally)

### Audience Segmentation

**Active Raters:**
- Engaged, strong opinions
- Likely voters/activists
- High mobilization potential

**Passive Raters:**
- Disengaged, apathetic
- Unlikely to mobilize
- May need different messaging approach

### Content Optimization

Compare engagement across different framings of the same policy:

**Example:**
- "AI job displacement" → 80% active rating
- "AI innovation opportunity" → 40% active rating

The first framing generates more emotional engagement, suggesting higher salience for advocacy campaigns.

---

## Data Quality Considerations

### Staleness Thresholds

Flag data points as "stale" when `timestamp - lastInteractionTime > threshold`:

- **15 seconds:** Moderate staleness (participant may be processing)
- **30 seconds:** High staleness (likely disengaged)
- **60 seconds:** Extreme staleness (exclude from active analysis)

### Post-Hoc Filtering

Rather than auto-reverting sliders to neutral (which injects synthetic data), preserve raw values and apply filters in analysis:

```python
# Filter for active ratings only
active_ratings = [d for d in data if d.timestamp - d.lastInteractionTime < 15]

# Compare active vs. passive patterns
passive_ratings = [d for d in data if d.timestamp - d.lastInteractionTime >= 15]
```

This approach:
- ✅ Preserves scientific integrity
- ✅ Allows flexible post-hoc analysis
- ✅ Studies *why* people stop rating (valuable insight)

---

## Ethical Considerations

### Participant Autonomy

- **No forced reversion:** Slider values are never automatically changed
- **Transparent tracking:** Participants are informed they should "rate continuously"
- **Honest data:** Captures actual behavior, not idealized engagement

### Data Interpretation

- **Apathy is signal:** Low engagement indicates content failure, not participant failure
- **Context matters:** Flat-lines during complex policy explanations may reflect cognitive processing, not disinterest
- **Avoid over-weighting:** Aggressive decay can artificially inflate neutral sentiment

---

## Technical Implementation

### Client-Side Tracking

Interaction time is updated on:
- `handlePointerDown` / `handlePointerMove` (drag)
- `handleEmojiClick` (preset buttons)
- `handleKeyDown` (keyboard controls)

### Data Transmission

Sent via LiveKit data channel every 250ms:
- Reliable delivery guaranteed
- Low latency (<100ms typical)
- Scales to 50+ participants per session

### Storage Format

Exported as JSON with full temporal metadata for offline analysis in Python/R.

---

## Future Enhancements

### Potential Additions

1. **Velocity tracking:** Rate of slider movement as engagement metric
2. **Directional analysis:** Positive vs. negative movement patterns
3. **Cross-participant synchrony:** Measure collective "aha moments"
4. **Adaptive sampling:** Increase frequency during high-volatility periods

### Research Questions

- Does decay weighting improve prediction of post-session survey responses?
- Can engagement patterns identify "opinion leaders" in real-time?
- How does staleness correlate with self-reported attention/interest?

---

## References

- Exponential decay weighting: Standard time-series analysis technique
- Engagement scoring: Adapted from click-stream analysis in UX research
- Salience detection: Novel application of divergence metrics to dial testing

---

**Last Updated:** January 19, 2026  
**Version:** 1.0
