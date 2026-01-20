#!/usr/bin/env python3
"""
Parse LimeSurvey XML (LSS) and convert to Resonant Survey JSON format
This reads the actual XML structure to get the complete survey
"""

import xml.etree.ElementTree as ET
import json
import sys

def parse_lss_to_json(lss_file):
    """Parse LSS XML file and convert to Resonant JSON format"""
    
    tree = ET.parse(lss_file)
    root = tree.getroot()
    
    # Initialize survey structure
    survey = {
        "title": "AI Safety Messaging Survey (735545) - Complete",
        "description": "Current Issues and Policy Attitudes - Full Survey from LimeSurvey",
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
    
    # Parse groups
    groups_elem = root.find('.//groups')
    if groups_elem is None:
        print("No groups found in XML")
        return survey
    
    group_rows = groups_elem.findall('.//row')
    groups_dict = {}
    
    for row in group_rows:
        gid = row.find('gid').text
        group_name = row.find('group_name').text
        group_order = int(row.find('group_order').text)
        grelevance = row.find('grelevance').text if row.find('grelevance') is not None else "1"
        
        groups_dict[gid] = {
            "title": group_name,
            "order_index": group_order,
            "relevance": grelevance,
            "questions": []
        }
    
    # Parse questions
    questions_elem = root.find('.//questions')
    if questions_elem is None:
        print("No questions found in XML")
        return survey
    
    question_rows = questions_elem.findall('.//row')
    questions_dict = {}
    
    for row in question_rows:
        qid = row.find('qid').text
        gid = row.find('gid').text
        title = row.find('title').text
        question_text_elem = row.find('question')
        question_text = question_text_elem.text if question_text_elem is not None and question_text_elem.text else ""
        qtype = row.find('type').text
        question_order = int(row.find('question_order').text)
        mandatory = row.find('mandatory').text if row.find('mandatory') is not None else "N"
        relevance = row.find('relevance').text if row.find('relevance') is not None else "1"
        
        # Map LimeSurvey types to our types
        type_map = {
            "F": "array",
            "R": "ranking",
            "M": "multiple_choice_multiple",
            "L": "multiple_choice_single",
            "T": "long_text",
            "S": "text",
            "X": "text_display",
            "*": "equation",
            "5": "multiple_choice_single",  # 5-point choice
            "!": "dropdown",
            "Y": "yes_no",
            "D": "date"
        }
        
        question_type = type_map.get(qtype, "text")
        
        questions_dict[qid] = {
            "code": title,
            "question_text": question_text,
            "question_type": question_type,
            "order_index": question_order,
            "settings": {
                "mandatory": mandatory == "Y",
                "relevance": relevance
            },
            "subquestions": [],
            "answer_options": [],
            "gid": gid
        }
    
    # Parse subquestions
    subquestions_elem = root.find('.//questions')
    if subquestions_elem:
        for row in subquestions_elem.findall('.//row'):
            parent_qid = row.find('parent_qid')
            if parent_qid is not None and parent_qid.text and parent_qid.text != "0":
                parent_id = parent_qid.text
                if parent_id in questions_dict:
                    sq_title = row.find('title').text
                    sq_text_elem = row.find('question')
                    sq_text = sq_text_elem.text if sq_text_elem is not None and sq_text_elem.text else sq_title
                    sq_order = int(row.find('question_order').text)
                    
                    questions_dict[parent_id]["subquestions"].append({
                        "code": sq_title,
                        "label": sq_text,
                        "order_index": sq_order
                    })
    
    # Parse answer options
    answers_elem = root.find('.//answers')
    if answers_elem:
        answer_rows = answers_elem.findall('.//row')
        for row in answer_rows:
            qid = row.find('qid').text
            if qid in questions_dict:
                code = row.find('code').text
                answer_text_elem = row.find('answer')
                answer_text = answer_text_elem.text if answer_text_elem is not None and answer_text_elem.text else code
                sort_order = int(row.find('sortorder').text)
                
                questions_dict[qid]["answer_options"].append({
                    "code": code,
                    "label": answer_text,
                    "order_index": sort_order
                })
    
    # Organize questions into groups
    for qid, question in questions_dict.items():
        gid = question.pop("gid")
        if gid in groups_dict:
            groups_dict[gid]["questions"].append(question)
    
    # Sort groups and add to survey
    sorted_groups = sorted(groups_dict.values(), key=lambda g: g["order_index"])
    survey["question_groups"] = sorted_groups
    
    # Sort questions within each group
    for group in survey["question_groups"]:
        group["questions"].sort(key=lambda q: q["order_index"])
        # Sort subquestions and answer options
        for question in group["questions"]:
            question["subquestions"].sort(key=lambda sq: sq["order_index"])
            question["answer_options"].sort(key=lambda ao: ao["order_index"])
    
    return survey

if __name__ == "__main__":
    input_file = "/Users/nomads/Nomads/mats-research/uploads/limesurvey_survey_735545_1_19.lss"
    output_file = "/Users/nomads/Nomads/focus-group-platform/test_surveys/survey_735545_complete.json"
    
    print(f"Parsing {input_file}...")
    survey = parse_lss_to_json(input_file)
    
    print(f"Found {len(survey['question_groups'])} groups")
    total_questions = sum(len(g['questions']) for g in survey['question_groups'])
    print(f"Found {total_questions} questions")
    
    with open(output_file, 'w') as f:
        json.dump(survey, f, indent=2)
    
    print(f"✅ Created {output_file}")
