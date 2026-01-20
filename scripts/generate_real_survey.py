#!/usr/bin/env python3
"""
Quick script to generate Resonant Survey JSON from the generate_limesurvey.py structure
This reads the MESSAGES dict and creates a minimal but accurate survey
"""

import json

# Copy the MESSAGES from generate_limesurvey.py
MESSAGES = {
    "A": {
        "title": "Mainstream Regulation",
        "text": "AI technology is advancing rapidly and affecting more areas of our lives—from hiring decisions to medical diagnoses to what we see online. Like other powerful technologies, AI needs clear rules and oversight to make sure it's developed safely and benefits everyone, not just tech companies. We need commonsense regulations that protect people while allowing innovation to continue."
    },
    "B": {
        "title": "Consumer Protection",
        "text": "AI companies are rushing products to market without adequate testing. AI systems are already making mistakes that affect real people—wrongly denying loans, making errors in medical settings, and spreading false information. Just as we require safety testing for cars and drugs, we need independent testing and safety standards for AI before these systems are used in high-stakes decisions about people's lives."
    },
    "C": {
        "title": "Jobs & Economic",
        "text": "AI is projected to affect millions of jobs in the coming years. Without proper planning, this could devastate communities across America. We need policies that ensure AI benefits workers, not just shareholders—including job transition programs, education investments, and rules that prevent AI from being used to exploit workers or drive down wages."
    },
    "D": {
        "title": "Technical Safety",
        "text": "Leading AI researchers, including many who built these systems, are warning that current AI development practices are inadequate. These systems are becoming more powerful but we don't fully understand how they work or how to ensure they behave as intended. Before deploying AI in critical areas, we need better testing methods and safety standards—the same way we'd want safety testing before a new aircraft carries passengers."
    },
    "E": {
        "title": "Democratic Control",
        "text": "Decisions about AI's role in society shouldn't be made by a handful of tech executives in Silicon Valley. AI affects all of us, so the public should have a voice in how it's developed and deployed. We need democratic oversight—not just industry self-regulation—to ensure AI serves the common good and doesn't concentrate power in the hands of a few corporations."
    },
    "F": {
        "title": "Existential Risk",
        "text": "Many leading AI scientists believe advanced AI could pose catastrophic risks to humanity if developed without adequate safeguards. Some compare it to nuclear weapons—a technology so powerful that getting it wrong could be irreversible. We may only have a few years to establish effective global safety measures before AI systems become too powerful to control. The stakes couldn't be higher."
    },
    "G": {
        "title": "Children & Family",
        "text": "AI is already affecting our children—through social media algorithms, AI tutors, chatbots they interact with, and decisions that affect their futures. Kids are particularly vulnerable to manipulation and harms from these systems. Parents deserve the right to know how AI is being used with their children, and we need strong protections to keep young people safe from AI-related harms."
    }
}

# Create survey structure
survey = {
    "title": "AI Safety Messaging Survey (735545) - Real",
    "description": "Current Issues and Policy Attitudes - Imported from LimeSurvey",
    "status": "draft",
    "settings": {
        "format": "question_by_question",
        "theme": "editorial_academic",
        "show_progress_bar": True,
        "allow_backward_navigation": False,
        "prolific_integration": {
            "enabled": True,
            "completion_code": "CLLV7C0K",
            "screenout_code": "SCREENOUT"
        }
    },
    "question_groups": []
}

# Screener Group
screener_group = {
    "title": "Screener",
    "order_index": 0,
    "questions": [
        {
            "code": "Q1",
            "question_text": "How concerned are you about each of the following issues facing the country today?",
            "question_type": "array",
            "order_index": 0,
            "settings": {"mandatory": True},
            "subquestions": [
                {"code": "SQ001", "label": "The economy and jobs", "order_index": 0},
                {"code": "SQ002", "label": "Healthcare", "order_index": 1},
                {"code": "SQ003", "label": "Immigration", "order_index": 2},
                {"code": "SQ004", "label": "Crime and public safety", "order_index": 3},
                {"code": "SQ005", "label": "Climate change", "order_index": 4},
                {"code": "SQ006", "label": "Artificial intelligence", "order_index": 5},
                {"code": "SQ007", "label": "Terrorism and war", "order_index": 6},
                {"code": "SQ008", "label": "Housing costs", "order_index": 7}
            ],
            "answer_options": [
                {"code": "A1", "label": "Extremely concerned", "order_index": 0},
                {"code": "A2", "label": "Very concerned", "order_index": 1},
                {"code": "A3", "label": "Somewhat concerned", "order_index": 2},
                {"code": "A4", "label": "Not too concerned", "order_index": 3},
                {"code": "A5", "label": "Not at all concerned", "order_index": 4},
                {"code": "A6", "label": "Not sure", "order_index": 5}
            ]
        }
    ]
}

survey["question_groups"].append(screener_group)

# Message Groups (A through G)
for idx, (msg_key, msg_data) in enumerate(MESSAGES.items()):
    group = {
        "title": f"Message {msg_key} - {msg_data['title']}",
        "order_index": idx + 1,
        "questions": [
            {
                "code": f"Q10a_{msg_key}",
                "question_text": msg_data["text"],
                "question_type": "text_display",
                "order_index": 0
            },
            {
                "code": f"Q10b_{msg_key}",
                "question_text": "After reading this message, how do you feel about AI?",
                "question_type": "multiple_choice_single",
                "order_index": 1,
                "settings": {"mandatory": True},
                "answer_options": [
                    {"code": "A1", "label": "More worried about AI", "order_index": 0},
                    {"code": "A2", "label": "No change", "order_index": 1},
                    {"code": "A3", "label": "Less worried about AI", "order_index": 2}
                ]
            },
            {
                "code": f"Q10c_{msg_key}",
                "question_text": "How credible or believable do you find this message?",
                "question_type": "multiple_choice_single",
                "order_index": 2,
                "settings": {"mandatory": True},
                "answer_options": [
                    {"code": "A1", "label": "Very credible", "order_index": 0},
                    {"code": "A2", "label": "Somewhat credible", "order_index": 1},
                    {"code": "A3", "label": "Not very credible", "order_index": 2},
                    {"code": "A4", "label": "Not at all credible", "order_index": 3}
                ]
            },
            {
                "code": f"Q10d_{msg_key}",
                "question_text": "How likely would you be to support policies based on this message?",
                "question_type": "multiple_choice_single",
                "order_index": 3,
                "settings": {"mandatory": True},
                "answer_options": [
                    {"code": "A1", "label": "Very likely", "order_index": 0},
                    {"code": "A2", "label": "Somewhat likely", "order_index": 1},
                    {"code": "A3", "label": "Not very likely", "order_index": 2},
                    {"code": "A4", "label": "Not at all likely", "order_index": 3}
                ]
            }
        ]
    }
    survey["question_groups"].append(group)

# Save to file
output_file = "/Users/nomads/Nomads/focus-group-platform/test_surveys/survey_735545_real.json"
with open(output_file, 'w') as f:
    json.dump(survey, f, indent=2)

print(f"✅ Created {output_file}")
print(f"   Groups: {len(survey['question_groups'])}")
total_questions = sum(len(g['questions']) for g in survey['question_groups'])
print(f"   Questions: {total_questions}")
