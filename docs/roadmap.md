# Platform Roadmap & Future Features

## Current Status
The Resonant focus group platform is production-ready with:
- ✅ Real-time perception tracking with continuous slider
- ✅ Live video/audio with moderator controls
- ✅ Media playback (video/audio) with synchronized perception data
- ✅ AI-assisted transcription
- ✅ Engagement tracking (lastInteractionTime)
- ✅ Keyboard controls (arrows + A/D keys)
- ✅ Mobile-responsive design

---

## Planned Features

### High Priority

#### Quick Poll / Choice Buttons
**Status:** Planned  
**Use Case:** Moderator-triggered voting during sessions

**Description:**
Add lightweight polling capability for forced-choice questions during focus groups. Participants vote using keyboard shortcuts (1-5 or A-E), results display live to moderator as springboard for discussion.

**Key Requirements:**
- Moderator-triggered only (not always-on)
- Time-limited voting window (15-30 seconds)
- Keyboard shortcuts for quick response
- Live results visualization for moderator
- Limited to 2-5 options per poll
- Used sparingly (2-3 times per session max)

**Benefits:**
- Captures individual preferences before groupthink
- Quantitative validation of qualitative insights
- Prevents dominant voices from biasing responses
- Creates discussion prompts ("I see most chose B—why?")

**Applications:**
- Message testing (which framing is most compelling?)
- Messenger credibility (who do you trust most?)
- Policy trade-offs (which approach do you prefer?)
- Opinion shift tracking (re-poll after discussion)

**Technical Notes:**
- New data type: `PollResponse { pollId, userId, choice, timestamp }`
- Moderator UI: Poll creation modal with options
- Participant UI: Button grid or numbered choices
- Results: Real-time bar chart or percentage display

**Estimated Effort:** 2-3 days

---

### Medium Priority

#### Enhanced Analytics Dashboard
**Status:** Backlog  
**Use Case:** Post-session analysis and reporting

**Features:**
- Temporal decay weighting visualization
- Engagement scoring by participant
- Message salience heatmaps
- Export to CSV/JSON for Python/R analysis

**Estimated Effort:** 3-5 days

---

#### Session Templates
**Status:** Backlog  
**Use Case:** Standardize common session formats

**Features:**
- Pre-configured scripts for common research questions
- Media playlists for message testing
- Automated timing and transitions
- Reusable session structures

**Estimated Effort:** 2-3 days

---

### Low Priority / Research Ideas

#### Velocity Tracking
Track rate of slider movement as additional engagement metric

#### Directional Analysis
Analyze positive vs. negative movement patterns for sentiment shifts

#### Cross-Participant Synchrony
Detect collective "aha moments" when multiple participants move simultaneously

#### Adaptive Sampling
Increase data capture frequency during high-volatility periods

---

## Recently Completed

- ✅ Mobile responsiveness fixes (Jan 2026)
- ✅ Keyboard arrow controls for perception slider (Jan 2026)
- ✅ Engagement tracking with lastInteractionTime (Jan 2026)
- ✅ A/D keys for left-hand control (Jan 2026)
- ✅ BeeswarmStory mobile scrollytelling (Jan 2026)

---

## Not Planned (Out of Scope)

- ❌ Full survey functionality (use LimeSurvey integration)
- ❌ Complex branching logic (focus groups are linear)
- ❌ Demographic collection (use pre-screener)
- ❌ Automated moderation (requires human facilitator)

---

**Last Updated:** January 19, 2026
