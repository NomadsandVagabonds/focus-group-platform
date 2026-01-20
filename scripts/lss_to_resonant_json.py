#!/usr/bin/env python3
"""
Convert LimeSurvey LSS (XML) to Resonant Survey JSON format
Preserves all conditional logic, randomization, and complex survey flow
"""

import xml.etree.ElementTree as ET
import json
from pathlib import Path

def parse_lss_to_json(lss_path: str) -> dict:
    """Parse LSS XML and convert to Resonant JSON format with full logic preservation"""
    
    tree = ET.parse(lss_path)
    root = tree.getroot()
    
    survey_data = {
        'groups': {},
        'questions': {},
        'subquestions': {},
        'answers': {},
        'answer_l10ns': {},
        'question_l10ns': {},
        'group_l10ns': {},
        'question_attributes': {},
    }
    
    # Parse groups
    groups = root.find('.//groups')
    if groups:
        for row in groups.findall('.//row'):
            gid = row.find('gid')
            if gid is not None:
                gid_val = gid.text.strip() if gid.text else ""
                group_order = row.find('group_order')
                relevance = row.find('grelevance')
                randomization_group = row.find('randomization_group')
                
                survey_data['groups'][gid_val] = {
                    'order': int(group_order.text.strip()) if group_order is not None and group_order.text else 0,
                    'relevance': relevance.text.strip() if relevance is not None and relevance.text else "1",
                    'randomization_group': randomization_group.text.strip() if randomization_group is not None and randomization_group.text else ""
                }
    
    # Parse group localization
    group_l10ns = root.find('.//group_l10ns')
    if group_l10ns:
        for row in group_l10ns.findall('.//row'):
            gid = row.find('gid')
            group_name = row.find('group_name')
            if gid is not None and group_name is not None:
                gid_val = gid.text.strip() if gid.text else ""
                survey_data['group_l10ns'][gid_val] = group_name.text.strip() if group_name.text else ""
    
    # Parse question_attributes table
    question_attributes_table = root.find('.//question_attributes')
    if question_attributes_table:
        for row in question_attributes_table.findall('.//row'):
            qid = row.find('qid')
            attribute = row.find('attribute')
            value = row.find('value')
            
            if qid is not None and attribute is not None:
                qid_val = qid.text.strip() if qid.text else ""
                attr_name = attribute.text.strip() if attribute.text else ""
                attr_value = value.text.strip() if value is not None and value.text else None
                
                if qid_val not in survey_data['question_attributes']:
                    survey_data['question_attributes'][qid_val] = {}
                
                survey_data['question_attributes'][qid_val][attr_name] = attr_value
    
    # Parse questions
    questions = root.find('.//questions')
    if questions:
        for row in questions.findall('.//row'):
            qid = row.find('qid')
            gid = row.find('gid')
            qtype = row.find('type')
            title = row.find('title')
            question_order = row.find('question_order')
            relevance = row.find('relevance')
            mandatory = row.find('mandatory')
            other = row.find('other')
            
            if qid is not None:
                qid_val = qid.text.strip() if qid.text else ""
                survey_data['questions'][qid_val] = {
                    'gid': gid.text.strip() if gid is not None and gid.text else "",
                    'type': qtype.text.strip() if qtype is not None and qtype.text else "",
                    'title': title.text.strip() if title is not None and title.text else "",
                    'order': int(question_order.text.strip()) if question_order is not None and question_order.text else 0,
                    'relevance': relevance.text.strip() if relevance is not None and relevance.text else "1",
                    'mandatory': mandatory.text.strip() if mandatory is not None and mandatory.text else "N",
                    'other': other.text.strip() if other is not None and other.text else "N"
                }
    
    # Parse question localization
    question_l10ns = root.find('.//question_l10ns')
    if question_l10ns:
        for row in question_l10ns.findall('.//row'):
            qid = row.find('qid')
            question_text = row.find('question')
            help_text = row.find('help')
            
            if qid is not None:
                qid_val = qid.text.strip() if qid.text else ""
                survey_data['question_l10ns'][qid_val] = {
                    'question': question_text.text.strip() if question_text is not None and question_text.text else "",
                    'help': help_text.text.strip() if help_text is not None and help_text.text else ""
                }
    
    # Parse subquestions
    subquestions = root.find('.//subquestions')
    if subquestions:
        for row in subquestions.findall('.//row'):
            qid = row.find('qid')
            parent_qid = row.find('parent_qid')
            title = row.find('title')
            question_order = row.find('question_order')
            
            if qid is not None and parent_qid is not None:
                qid_val = qid.text.strip() if qid.text else ""
                parent_qid_val = parent_qid.text.strip() if parent_qid.text else ""
                
                if parent_qid_val not in survey_data['subquestions']:
                    survey_data['subquestions'][parent_qid_val] = []
                
                survey_data['subquestions'][parent_qid_val].append({
                    'qid': qid_val,
                    'title': title.text.strip() if title is not None and title.text else "",
                    'order': int(question_order.text.strip()) if question_order is not None and question_order.text else 0
                })
    
    # Parse answers
    answers = root.find('.//answers')
    if answers:
        for row in answers.findall('.//row'):
            qid = row.find('qid')
            aid = row.find('aid')
            code = row.find('code')
            sortorder = row.find('sortorder')
            
            if qid is not None and aid is not None:
                qid_val = qid.text.strip() if qid.text else ""
                aid_val = aid.text.strip() if aid.text else ""
                
                if qid_val not in survey_data['answers']:
                    survey_data['answers'][qid_val] = []
                
                survey_data['answers'][qid_val].append({
                    'aid': aid_val,
                    'code': code.text.strip() if code is not None and code.text else "",
                    'order': int(sortorder.text.strip()) if sortorder is not None and sortorder.text else 0
                })
    
    # Parse answer localization
    answer_l10ns = root.find('.//answer_l10ns')
    if answer_l10ns:
        for row in answer_l10ns.findall('.//row'):
            aid = row.find('aid')
            answer_text = row.find('answer')
            
            if aid is not None and answer_text is not None:
                aid_val = aid.text.strip() if aid.text else ""
                survey_data['answer_l10ns'][aid_val] = answer_text.text.strip() if answer_text.text else ""
    
    # Convert to Resonant JSON format
    return convert_to_resonant_format(survey_data)


def convert_to_resonant_format(survey_data: dict) -> dict:
    """Convert parsed LimeSurvey data to Resonant JSON format"""
    
    # Type mapping
    type_map = {
        "F": "array",
        "R": "ranking",
        "M": "multiple_choice_multiple",
        "L": "multiple_choice_single",
        "T": "long_text",
        "S": "text",
        "X": "text_display",
        "*": "equation",
        "5": "multiple_choice_single",
        "!": "dropdown",
        "Y": "yes_no",
        "D": "date"
    }
    
    survey = {
        "title": "AI Safety Messaging Survey (735545) - Complete from XML",
        "description": "Full survey with all conditional logic and randomization preserved",
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
    
    # Sort groups by order
    sorted_groups = sorted(survey_data['groups'].items(), key=lambda x: x[1]['order'])
    
    for gid, group_info in sorted_groups:
        group_name = survey_data['group_l10ns'].get(gid, f"Group {gid}")
        
        group = {
            "title": group_name,
            "order_index": group_info['order'],
            "settings": {
                "relevance": group_info['relevance'],
                "randomization_group": group_info.get('randomization_group', "")
            },
            "questions": []
        }
        
        # Get questions for this group
        group_questions = [
            (qid, q) for qid, q in survey_data['questions'].items()
            if q['gid'] == gid
        ]
        group_questions.sort(key=lambda x: x[1]['order'])
        
        for qid, q_info in group_questions:
            q_l10n = survey_data['question_l10ns'].get(qid, {})
            question_text = q_l10n.get('question', '(no text)')
            help_text = q_l10n.get('help', '')
            
            # Get question attributes for this question
            q_attrs = survey_data['question_attributes'].get(qid, {})
            
            question = {
                "code": q_info['title'],
                "question_text": question_text,
                "question_type": type_map.get(q_info['type'], "text"),
                "order_index": q_info['order'],
                "settings": {
                    "mandatory": q_info['mandatory'] == "Y",
                    "other": q_info.get('other', 'N') == "Y",
                    "relevance": q_info['relevance'],
                    "help_text": help_text,
                    "limesurvey_type": q_info['type'],
                    
                    # Merge all question_attributes
                    "array_filter": q_attrs.get('array_filter'),
                    "array_filter_exclude": q_attrs.get('array_filter_exclude'),
                    "array_filter_style": q_attrs.get('array_filter_style'),
                    "display_columns": q_attrs.get('display_columns'),
                    "max_answers": q_attrs.get('max_answers'),
                    "min_answers": q_attrs.get('min_answers'),
                    "random_order": q_attrs.get('random_order'),
                    "other_replace_text": q_attrs.get('other_replace_text'),
                    "em_validation_q": q_attrs.get('em_validation_q'),
                    "em_validation_q_tip": q_attrs.get('em_validation_q_tip'),
                    "cssclass": q_attrs.get('cssclass'),
                    "exclude_all_others": q_attrs.get('exclude_all_others'),
                    "exclude_all_others_auto": q_attrs.get('exclude_all_others_auto'),
                    "hidden": q_attrs.get('hidden'),
                    "time_limit": q_attrs.get('time_limit'),
                    "time_limit_action": q_attrs.get('time_limit_action'),
                    "time_limit_message": q_attrs.get('time_limit_message'),
                    "time_limit_countdown_message": q_attrs.get('time_limit_countdown_message'),
                },
                "subquestions": [],
                "answer_options": []
            }
            
            # Add subquestions
            if qid in survey_data['subquestions']:
                subs = sorted(survey_data['subquestions'][qid], key=lambda x: x['order'])
                for sub in subs:
                    sub_l10n = survey_data['question_l10ns'].get(sub['qid'], {})
                    sub_text = sub_l10n.get('question', sub['title'])
                    
                    question["subquestions"].append({
                        "code": sub['title'],
                        "label": sub_text,
                        "order_index": sub['order']
                    })
            
            # Add "other" option if enabled
            if question["settings"].get("other"):
                other_text = question["settings"].get("other_replace_text") or "Other"
                question["subquestions"].append({
                    "code": "other",
                    "label": other_text,
                    "order_index": 999  # Always last
                })
            
            # Add answer options
            if qid in survey_data['answers']:
                answers = sorted(survey_data['answers'][qid], key=lambda x: x['order'])
                for ans in answers:
                    # Look up answer text from l10ns using aid
                    answer_text = survey_data['answer_l10ns'].get(ans['aid'], ans['code'])
                    
                    question["answer_options"].append({
                        "code": ans['code'],
                        "label": answer_text,
                        "order_index": ans['order']
                    })
            
            group["questions"].append(question)
        
        survey["question_groups"].append(group)
    
    return survey


if __name__ == "__main__":
    lss_path = "/Users/nomads/Nomads/mats-research/uploads/limesurvey_survey_735545_1_19.lss"
    output_path = "/Users/nomads/Nomads/focus-group-platform/test_surveys/survey_735545_complete.json"
    
    print(f"Parsing {lss_path}...")
    survey = parse_lss_to_json(lss_path)
    
    print(f"Found {len(survey['question_groups'])} groups")
    total_questions = sum(len(g['questions']) for g in survey['question_groups'])
    print(f"Found {total_questions} questions")
    
    with open(output_path, 'w') as f:
        json.dump(survey, f, indent=2)
    
    print(f"✅ Created {output_path}")
    print(f"\nPreserved logic:")
    print(f"  - Conditional relevance expressions")
    print(f"  - Randomization groups")
    print(f"  - Question order and dependencies")
