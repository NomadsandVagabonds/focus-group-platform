# Data Visualization Inspiration

## Bump Charts for Group Comparison

**Source:** Country-Level Trend of Geography of Researcher Affiliations  
**Reference Image:** `/Users/nomads/.gemini/antigravity/brain/a8e61fc6-90e2-4580-ab88-9f26b7609343/uploaded_image_1768866140473.png`

### Why This Works

**Visual Technique:**
- Colored lines track rank position over time
- Crossing lines show dramatic shifts in relative standing
- Right-side labels with current share percentages
- Clean, minimal design with strategic color use

**Perfect for Focus Group Data:**

#### 1. **Message Performance Over Time**
Track how different policy framings perform across session segments:
```
Time →  Intro | Context | Evidence | Conclusion
Msg A:  Rank 1 → 3 → 2 → 1  (wins overall)
Msg B:  Rank 3 → 1 → 1 → 2  (strong middle, fades)
Msg C:  Rank 2 → 2 → 3 → 3  (consistent mediocre)
```

#### 2. **Demographic Group Trajectories**
Show how different audiences react to same content:
```
Time →  0:00 | 2:00 | 4:00 | 6:00
Dems:   High → High → Med → High
Reps:   Low → Med → High → Med  (crossover at 4:00!)
Inds:   Med → Low → Low → High
```

#### 3. **Concern Type Salience**
Track which AI concerns dominate at different moments:
```
Segment →    Jobs | Privacy | Control | Safety
Job Loss:    #1     #3        #4        #2
Privacy:     #3     #1        #2        #3
Autonomy:    #2     #2        #1        #1  (rises to top)
Existential: #4     #4        #3        #4
```

### Implementation Notes

**Data Requirements:**
- Multiple groups/messages to compare (3-10 ideal)
- Time-series data with consistent intervals
- Ranking or relative performance metric

**D3.js Approach:**
```javascript
// Use D3 line generator with custom interpolation
const line = d3.line()
  .x(d => xScale(d.time))
  .y(d => yScale(d.rank))
  .curve(d3.curveMonotoneX); // Smooth curves

// Color by group, not by rank
.attr('stroke', d => colorScale(d.group))
```

**Design Principles:**
- ✅ Use color strategically (highlight key groups)
- ✅ Show final values/percentages on right
- ✅ Keep lines smooth but not overly curved
- ✅ Label crossing points if dramatic
- ✅ Use opacity to de-emphasize less important lines

### When to Use Bump Charts

**Good Fit:**
- Comparing 3-10 groups over time
- Rank/position matters more than absolute values
- Dramatic shifts tell the story (crossovers)
- Audience cares about "who's winning"

**Bad Fit:**
- Only 2 groups (use line chart)
- Absolute values matter (use area chart)
- Too many groups (>15, becomes spaghetti)
- No clear ranking (use heatmap instead)

### Resonant-Specific Applications

#### Post-Session Analysis Dashboard
**"Message Performance Across Session"**
- X-axis: Session timeline (0-60 minutes)
- Y-axis: Rank (1-5)
- Lines: Different message framings
- Insight: "Message B started weak but won by the end"

#### Demographic Comparison View
**"Group Reactions to Policy Proposal"**
- X-axis: Video timestamp
- Y-axis: Average perception (0-100)
- Lines: Age groups, party ID, or concern types
- Insight: "Republicans warmed up after evidence section"

#### Longitudinal Study Tracking
**"Concern Evolution Across Sessions"**
- X-axis: Session number (1-10)
- Y-axis: Rank of concern
- Lines: Job loss, privacy, autonomy, etc.
- Insight: "Privacy concerns rose after Cambridge Analytica"

### Technical Stack

**Recommended:**
- D3.js for rendering
- React for component wrapper
- Framer Motion for smooth transitions
- Visx for React-friendly D3 utilities

**Color Palette:**
- Use existing Resonant brand colors
- Ensure WCAG AA contrast for accessibility
- Consider colorblind-safe palettes (Okabe-Ito)

### Future Enhancement Ideas

1. **Interactive hover:** Show exact values on mouseover
2. **Animated transitions:** Smoothly animate rank changes
3. **Filtering:** Toggle groups on/off
4. **Annotations:** Mark key moments (e.g., "Evidence presented")
5. **Export:** Download as PNG/SVG for reports

---

**Inspiration Source:** Academic publication visualization  
**Added:** January 19, 2026  
**Status:** Design reference for future analytics dashboard
