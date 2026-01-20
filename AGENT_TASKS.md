# Agent Task Delegation - Resonant Survey Platform

## 🎯 10 Parallel Tasks for Your Agents

Copy these tasks and assign one to each agent. They can work independently.

---

### Agent 1: Survey Builder - Create Survey Form
**File:** `/Users/nomads/Nomads/focus-group-platform/src/app/admin/surveys/new/page.tsx`

Create a form to create new surveys with:
- Title input
- Description textarea  
- Settings (format dropdown, theme dropdown, show_progress_bar checkbox)
- Submit button that POSTs to `/api/survey/surveys`
- Redirect to `/admin/surveys/{id}` on success
- Use Editorial Academic styling (Cream #f5f3ef, Crimson #c94a4a)

---

### Agent 2: Question Editor Component
**File:** `/Users/nomads/Nomads/focus-group-platform/src/components/survey/builder/QuestionEditor.tsx`

Create a question editor component with:
- Question type selector (dropdown)
- Question text input
- Help text textarea
- Code input (e.g., Q1, Q2)
- Settings panel (mandatory checkbox, display_columns input)
- Relevance logic textarea
- Subquestion editor (for Array/Ranking types)
- Answer option editor (for Multiple Choice/Array types)
- Save button

---

### Agent 3: Dropdown Question Component
**File:** `/Users/nomads/Nomads/focus-group-platform/src/components/survey/questions/DropdownQuestion.tsx`

Create dropdown (select) question component:
- Render `<select>` with answer options
- Handle onChange to call `onAnswer(questionCode, value)`
- Match Editorial Academic styling
- Props: `question`, `responseData`, `onAnswer`

---

### Agent 4: Yes/No Question Component  
**File:** `/Users/nomads/Nomads/focus-group-platform/src/components/survey/questions/YesNoQuestion.tsx`

Create Yes/No question component:
- Two large buttons: "Yes" and "No"
- Highlight selected button
- Call `onAnswer(questionCode, 'Y' or 'N')`
- Props: `question`, `responseData`, `onAnswer`

---

### Agent 5: Date Question Component
**File:** `/Users/nomads/Nomads/focus-group-platform/src/components/survey/questions/DateQuestion.tsx`

Create date picker question component:
- Use HTML5 `<input type="date">`
- Handle onChange to call `onAnswer(questionCode, value)`
- Props: `question`, `responseData`, `onAnswer`

---

### Agent 6: Equation Question Component
**File:** `/Users/nomads/Nomads/focus-group-platform/src/components/survey/questions/EquationQuestion.tsx`

Create equation (hidden calculation) component:
- Evaluate expression from `question.help_text` using ExpressionEngine
- Auto-save calculated value
- Don't render anything visible (hidden question)
- Props: `question`, `responseData`, `onAnswer`, `expressionEngine`

---

### Agent 7: CSV Export API Route
**File:** `/Users/nomads/Nomads/focus-group-platform/src/app/api/survey/export/[surveyId]/csv/route.ts`

Create CSV export endpoint:
- Fetch survey with all responses
- Convert to CSV format (columns: response_id, participant_id, Q1, Q2, Q3, etc.)
- Return as downloadable file with proper headers
- Use Supabase client to query data

---

### Agent 8: Response Analytics Component
**File:** `/Users/nomads/Nomads/focus-group-platform/src/components/survey/analytics/ResponseCharts.tsx`

Create response analytics dashboard:
- Fetch response data for a survey
- Show total responses, completion rate
- Bar charts for multiple choice questions (use Recharts or D3)
- Props: `surveyId`

---

### Agent 9: Survey Settings Editor
**File:** `/Users/nomads/Nomads/focus-group-platform/src/components/survey/builder/SurveySettings.tsx`

Create survey settings editor component:
- Format selector (question_by_question, group_by_group, all_in_one)
- Theme selector (editorial_academic, modern, minimal)
- Progress bar toggle
- Backward navigation toggle
- Prolific integration section (completion code, screenout code)
- Save button
- Props: `survey`, `onSave`

---

### Agent 10: Mobile Optimization CSS
**File:** `/Users/nomads/Nomads/focus-group-platform/src/app/survey-mobile.css`

Create mobile-specific CSS overrides:
- Media queries for screens < 768px
- Stack ranking columns vertically on mobile
- Larger touch targets (min 44px)
- Reduce font sizes appropriately
- Optimize array table for mobile (horizontal scroll or stack)
- Import this in `globals.css`

---

## 📋 Instructions for Agents

1. **Read the existing code** in `/src/components/survey/` to match the style
2. **Use TypeScript** with proper types from `/src/lib/supabase/survey-types.ts`
3. **Match the design system:** Cream (#f5f3ef), Crimson (#c94a4a), Charcoal (#1a1d24)
4. **Test your component** before marking complete
5. **Report back** when done with file path and brief description

---

**Deadline:** Tonight (next 2-3 hours)  
**Coordination:** I'll integrate all components tomorrow morning
