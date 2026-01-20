#!/usr/bin/env python3
"""
Convert LimeSurvey TSV to Resonant Survey JSON

Usage:
    python convert_limesurvey_to_json.py input.tsv output.json
"""

import sys
import json
import csv
from typing import Dict, List, Any

def parse_limesurvey_tsv(filename: str) -> Dict[str, Any]:
    """Parse LimeSurvey TSV file into Resonant JSON format"""
    
    survey = {
        "title": "Imported Survey",
        "description": "",
        "status": "draft",
        "settings": {
            "format": "group_by_group",
            "theme": "editorial_academic",
            "show_progress_bar": True,
            "allow_backward_navigation": False
        },
        "question_groups": []
    }
    
    groups: Dict[str, Any] = {}
    questions: Dict[str, Any] = {}
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        
        for row in reader:
            row_class = row.get('class', '')
            
            # Survey settings
            if row_class == 'S':
                if row['name'] == 'surveyls_title':
                    survey['title'] = row['text']
                elif row['name'] == 'surveyls_description':
                    survey['description'] = row['text']
            
            # Question groups
            elif row_class == 'G':
                group_id = row['id']
                groups[group_id] = {
                    "title": row['text'],
                    "description": row.get('help', ''),
                    "order_index": len(groups),
                    "relevance_logic": row.get('relevance', ''),
                    "questions": []
                }
            
            # Questions
            elif row_class == 'Q':
                question_id = row['id']
                related_id = row.get('related_id', '')
                
                question = {
                    "code": row['name'],
                    "question_text": row['text'],
                    "help_text": row.get('help', ''),
                    "question_type": map_question_type(row['type']),
                    "settings": {
                        "mandatory": row.get('mandatory', 'N') == 'Y',
                        "other_option": row.get('other', 'N') == 'Y'
                    },
                    "relevance_logic": row.get('relevance', ''),
                    "order_index": len(questions),
                    "subquestions": [],
                    "answer_options": []
                }
                
                questions[question_id] = question
                
                # Add to appropriate group
                if related_id in groups:
                    groups[related_id]['questions'].append(question)
            
            # Subquestions
            elif row_class == 'SQ':
                related_id = row.get('related_id', '')
                if related_id in questions:
                    questions[related_id]['subquestions'].append({
                        "code": row['name'],
                        "label": row['text'],
                        "order_index": len(questions[related_id]['subquestions'])
                    })
            
            # Answer options
            elif row_class == 'A':
                related_id = row.get('related_id', '')
                if related_id in questions:
                    questions[related_id]['answer_options'].append({
                        "code": row['name'],
                        "label": row['text'],
                        "order_index": len(questions[related_id]['answer_options']),
                        "scale_id": int(row.get('scale_id', 0))
                    })
    
    # Convert groups dict to list
    survey['question_groups'] = list(groups.values())
    
    return survey

def map_question_type(limesurvey_type: str) -> str:
    """Map LimeSurvey question type to Resonant type"""
    type_map = {
        'T': 'long_text',
        'S': 'text',
        'L': 'multiple_choice_single',
        'M': 'multiple_choice_multiple',
        'F': 'array',
        'R': 'ranking',
        '5': 'multiple_choice_single',  # 5-point choice
        'D': 'date',
        'Y': 'yes_no',
        'X': 'text_display',
        '*': 'equation',
        '!': 'dropdown'
    }
    return type_map.get(limesurvey_type, 'text')

def main():
    if len(sys.argv) != 3:
        print("Usage: python convert_limesurvey_to_json.py input.tsv output.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    print(f"Converting {input_file} to Resonant Survey JSON...")
    
    survey = parse_limesurvey_tsv(input_file)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(survey, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Converted successfully to {output_file}")
    print(f"   Title: {survey['title']}")
    print(f"   Groups: {len(survey['question_groups'])}")
    total_questions = sum(len(g['questions']) for g in survey['question_groups'])
    print(f"   Questions: {total_questions}")

if __name__ == '__main__':
    main()
