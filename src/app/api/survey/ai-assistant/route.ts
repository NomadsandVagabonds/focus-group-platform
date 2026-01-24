'use server';

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt with survey schema knowledge
const SYSTEM_PROMPT = `You are an AI assistant embedded in the Resonant Survey Builder. You DIRECTLY MODIFY surveys by outputting JSON.

## YOUR ROLE - READ THIS CAREFULLY

You are NOT just an advisor. You DIRECTLY EDIT the survey. When you output JSON, the frontend IMMEDIATELY applies it. This is how editing works:

1. User asks for a change
2. You output JSON with the change
3. Frontend shows "Apply" button
4. User clicks Apply
5. Survey is modified

You MUST output JSON for EVERY request. NEVER say "I can't modify the file" - you CAN and you MUST.

## ABSOLUTE RULES

- **ALWAYS output valid JSON** with action, target, changes, explanation
- **NEVER ask for clarification** - make your best guess
- **NEVER say you can't edit files** - your JSON output IS the edit
- **NEVER suggest manual changes** - output the JSON instead

## Survey JSON Structure

A survey contains \`question_groups\`, each with questions. Each question has:
- \`code\`: Question code (Q1, Q2, Q3a, etc.)
- \`question_text\`: The question text
- \`question_type\`: "text", "textarea", "list_radio", "list_dropdown", "multiple_choice", "ranking", "array", "5_point_choice", "equation"
- \`settings\`: { relevance, mandatory, hidden, random_order, etc. }
- \`subquestions\`: For array questions, list of { code, label }
- \`answer_options\`: List of { code, label }

## Expression Engine (LimeSurvey-compatible)

- Array subquestion: \`Q1_SQ006.NAOK\`
- Simple question: \`Q2.NAOK\`  
- Answer codes: A1, A2, A3, A4, A5 (left-to-right on scale)
- Operators: ==, !=, <, >, <=, >=
- Logic: && (and), || (or)

## Response Format

ALWAYS respond with valid JSON (no markdown):
{
  "action": "modify_settings" | "modify_question" | "add_question" | "add_group" | "multi_action",
  "target": "Q3",
  "changes": { ... },
  "explanation": "Brief explanation",
  "follow_up": "Optional: ask about customization ONLY for complex new questions"
}

For multi_action, use:
{
  "action": "multi_action",
  "actions": [
    { "action": "modify_settings", "target": "Q3", "changes": {...} },
    { "action": "modify_settings", "target": "Q4", "changes": {...} }
  ],
  "explanation": "Applied relevance to Q3, Q4, Q5..."
}

---

## FEW-SHOT EXAMPLES

### Example 1: Simple Relevance (Just Do It)
USER: "Only show Q3 if they selected A1, A2, or A3 for Q1_SQ006"
{
  "action": "modify_settings",
  "target": "Q3",
  "changes": { "settings": { "relevance": "(Q1_SQ006.NAOK == \\"A1\\" || Q1_SQ006.NAOK == \\"A2\\" || Q1_SQ006.NAOK == \\"A3\\")" }},
  "explanation": "Q3 will only show if respondent selected high concern (A1/A2/A3) for that item in Q1."
}

### Example 2: Screener Logic (Apply to Multiple)
USER: "If they don't select top 3 concern for AI (SQ006), skip to ScreenOut"
{
  "action": "multi_action",
  "actions": [
    { "action": "modify_settings", "target": "Q3", "changes": { "settings": { "relevance": "(Q1_SQ006.NAOK == \\"A1\\" || Q1_SQ006.NAOK == \\"A2\\" || Q1_SQ006.NAOK == \\"A3\\")" }}},
    { "action": "modify_settings", "target": "Q4", "changes": { "settings": { "relevance": "(Q1_SQ006.NAOK == \\"A1\\" || Q1_SQ006.NAOK == \\"A2\\" || Q1_SQ006.NAOK == \\"A3\\")" }}}
  ],
  "explanation": "Applied screener logic: Q3 and subsequent questions only show if respondent selected high AI concern. Others skip to ScreenOut."
}

### Example 3: Creating Array Question (Create with Defaults, Offer Customization)
USER: "Create an array question about global warming concerns"
{
  "action": "add_question",
  "target": "Screener",
  "changes": {
    "code": "Q5",
    "question_text": "How concerned are you about each of the following aspects of global warming?",
    "question_type": "array",
    "settings": { "mandatory": true, "random_order": false },
    "subquestions": [
      { "code": "SQ001", "label": "Rising sea levels" },
      { "code": "SQ002", "label": "Extreme weather events" },
      { "code": "SQ003", "label": "Loss of biodiversity" },
      { "code": "SQ004", "label": "Impact on food production" },
      { "code": "SQ005", "label": "Public health effects" }
    ],
    "answer_options": [
      { "code": "A1", "label": "Extremely concerned" },
      { "code": "A2", "label": "Very concerned" },
      { "code": "A3", "label": "Somewhat concerned" },
      { "code": "A4", "label": "Not very concerned" },
      { "code": "A5", "label": "Not at all concerned" }
    ]
  },
  "explanation": "Created array question Q5 about global warming with 5 concern areas and 5-point scale.",
  "follow_up": "Would you like to: (1) change the items/subquestions, (2) use a different answer scale, (3) randomize the order, or (4) make it optional?"
}

### Example 4: Make Question Mandatory
USER: "Make Q2 required"
{
  "action": "modify_settings",
  "target": "Q2",
  "changes": { "settings": { "mandatory": true }},
  "explanation": "Q2 is now mandatory - respondents must answer before proceeding."
}

---

## REMEMBER
- For EDITS: Just do it, no questions
- For NEW complex questions: Create working version with good defaults, then offer to customize
- Use the survey structure provided to find question codes, group names, subquestion codes
- Trust user when they tell you specific codes like "SQ006 is AI"
- A1/A2/A3 are typically "high" end of scale, A4/A5 are "low" end
`;


interface AIAssistantRequest {
    survey: any;
    message: string;
    messageHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    contextQuestion?: {
        code: string;
        question_text: string;
        question_type: string;
    } | null;
}

export async function POST(request: NextRequest) {
    try {
        const body: AIAssistantRequest = await request.json();
        const { survey, message, messageHistory, contextQuestion } = body;

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json(
                { error: 'Anthropic API key not configured' },
                { status: 500 }
            );
        }

        // Build context message
        let userMessage = message;
        if (contextQuestion) {
            userMessage = `[Context: Currently editing ${contextQuestion.code} - "${contextQuestion.question_text}" (type: ${contextQuestion.question_type})]\n\n${message}`;
        }

        // Build detailed survey structure
        const buildQuestionDetail = (q: any) => {
            let detail = `    ${q.code} (${q.question_type}): "${q.question_text?.substring(0, 60)}..."`;
            if (q.subquestions?.length) {
                detail += `\n      Subquestions: ${q.subquestions.map((sq: any) => `${sq.code}="${sq.label}"`).join(', ')}`;
            }
            if (q.answer_options?.length) {
                detail += `\n      Answer options: ${q.answer_options.map((ao: any) => `${ao.code}="${ao.label}"`).join(', ')}`;
            }
            if (q.settings?.relevance) {
                detail += `\n      Current relevance: ${q.settings.relevance}`;
            }
            return detail;
        };

        const surveyContext = `
FULL SURVEY STRUCTURE:
${survey.question_groups?.map((g: any) =>
            `GROUP: "${g.title}"
${g.questions?.map(buildQuestionDetail).join('\n') || '  (empty group)'}`
        ).join('\n\n') || 'No groups yet'}

USER REQUEST: ${userMessage}`;

        // Build messages array with conversation history
        const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        // Add survey context as first message
        apiMessages.push({ role: 'user', content: surveyContext });
        apiMessages.push({ role: 'assistant', content: 'I understand the survey structure. Ready to make changes.' });

        // Add conversation history (last 6 exchanges to avoid token overflow)
        if (messageHistory && messageHistory.length > 0) {
            const recentHistory = messageHistory.slice(-12);
            for (const msg of recentHistory) {
                apiMessages.push({ role: msg.role, content: msg.content });
            }
        }

        // Add current user message
        apiMessages.push({ role: 'user', content: userMessage });

        const response = await anthropic.messages.create({
            model: 'claude-opus-4-5-20251101',
            max_tokens: 16384,
            system: SYSTEM_PROMPT,
            messages: apiMessages,
        });

        // Extract text content from response
        const textContent = response.content.find((block) => block.type === 'text');
        if (!textContent || textContent.type !== 'text') {
            return NextResponse.json(
                { error: 'Unexpected response format from Claude' },
                { status: 500 }
            );
        }

        // Parse Claude's JSON response - extract JSON from anywhere in the text
        let parsedResponse;
        try {
            const rawText = textContent.text.trim();

            // Try to find JSON in markdown code block first
            const jsonBlockMatch = rawText.match(/```json?\s*([\s\S]*?)```/);
            if (jsonBlockMatch) {
                parsedResponse = JSON.parse(jsonBlockMatch[1].trim());
            } else {
                // Try to find raw JSON object
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedResponse = JSON.parse(jsonMatch[0]);
                } else {
                    // No JSON found, treat as clarification
                    parsedResponse = {
                        action: 'clarify',
                        explanation: rawText,
                    };
                }
            }
        } catch (parseError) {
            // If parsing fails, return the raw text as a clarification
            parsedResponse = {
                action: 'clarify',
                explanation: textContent.text,
            };
        }

        return NextResponse.json(parsedResponse);
    } catch (error: any) {
        console.error('AI Assistant error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process request' },
            { status: 500 }
        );
    }
}
