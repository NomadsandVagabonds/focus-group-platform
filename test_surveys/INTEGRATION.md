# Numerical Question Types - Integration Guide

## Overview

This document provides instructions for integrating the 4 new numerical question types into the survey platform.

## New Components

| Component | File | Question Type | Description |
|-----------|------|---------------|-------------|
| NumericalQuestion | `NumericalQuestion.tsx` | `numerical` | Single number input with validation |
| MultipleNumericalQuestion | `MultipleNumericalQuestion.tsx` | `multiple_numerical` | Multiple labeled number inputs |
| ArrayNumbersQuestion | `ArrayNumbersQuestion.tsx` | `array_numbers` | Table with number inputs per row |
| ArrayTextsQuestion | `ArrayTextsQuestion.tsx` | `array_texts` | Table with text inputs per row |

## Integration Steps

### Step 1: Update Type Definitions

Add the new question types to `/src/lib/supabase/survey-types.ts`:

```typescript
export type QuestionType =
    | 'text'
    | 'long_text'
    | 'multiple_choice_single'
    | 'multiple_choice_multiple'
    | 'array'
    | 'ranking'
    | 'equation'
    | 'text_display'
    | 'dropdown'
    | 'yes_no'
    | 'date'
    | 'numerical'           // NEW
    | 'multiple_numerical'  // NEW
    | 'array_numbers'       // NEW
    | 'array_texts';        // NEW
```

Add new settings to `QuestionSettings`:

```typescript
export interface QuestionSettings {
    // ... existing settings ...

    // Numerical settings (NEW)
    min_value?: number;
    max_value?: number;
    decimal_places?: number;
    prefix?: string;
    suffix?: string;
}
```

### Step 2: Update SurveyRenderer.tsx

Add imports at the top of the file:

```typescript
import NumericalQuestion from './questions/NumericalQuestion';
import MultipleNumericalQuestion from './questions/MultipleNumericalQuestion';
import ArrayNumbersQuestion from './questions/ArrayNumbersQuestion';
import ArrayTextsQuestion from './questions/ArrayTextsQuestion';
```

Add cases to the `renderQuestionInput` function switch statement:

```typescript
case 'numerical':
    return (
        <NumericalQuestion
            question={question}
            responseData={responseData}
            onAnswer={onAnswer}
        />
    );

case 'multiple_numerical':
    return (
        <MultipleNumericalQuestion
            question={question}
            responseData={responseData}
            onAnswer={onAnswer}
        />
    );

case 'array_numbers':
    return (
        <ArrayNumbersQuestion
            question={question}
            responseData={responseData}
            onAnswer={onAnswer}
        />
    );

case 'array_texts':
    return (
        <ArrayTextsQuestion
            question={question}
            responseData={responseData}
            onAnswer={onAnswer}
        />
    );
```

### Step 3: Update QuestionEditor.tsx (Optional)

Add the new question types to the question type selector dropdown:

```typescript
<option value="numerical">Numerical Input</option>
<option value="multiple_numerical">Multiple Numerical</option>
<option value="array_numbers">Array (Numbers)</option>
<option value="array_texts">Array (Texts)</option>
```

Update the `needsSubquestions` check:

```typescript
const needsSubquestions = ['array', 'ranking', 'multiple_numerical', 'array_numbers', 'array_texts'].includes(question.question_type);
```

## Question Settings Reference

### NumericalQuestion Settings

| Setting | Type | Description |
|---------|------|-------------|
| `min_value` | number | Minimum allowed value |
| `max_value` | number | Maximum allowed value |
| `decimal_places` | number | Number of decimal places |
| `prefix` | string | Text before input (e.g., "$") |
| `suffix` | string | Text after input (e.g., "years") |
| `placeholder` | string | Input placeholder text |
| `mandatory` | boolean | Whether answer is required |

### MultipleNumericalQuestion Settings

Same as NumericalQuestion, plus uses `subquestions` for each input field.

### ArrayNumbersQuestion Settings

Same as NumericalQuestion, plus uses `subquestions` for row labels.

### ArrayTextsQuestion Settings

| Setting | Type | Description |
|---------|------|-------------|
| `max_answers` | number | Maximum character length |
| `placeholder` | string | Input placeholder text |
| `mandatory` | boolean | Whether answer is required |

## Data Storage Format

### Single Numerical
- Key: `{question_code}`
- Value: `string` (number as string)

### Multiple Numerical / Array Questions
- Key: `{question_code}_{subquestion_code}`
- Value: `string` (number or text as string)

## Testing

1. Import the test survey from `/test_surveys/numerical_test.json`
2. Navigate to the survey preview
3. Test each question type:
   - Enter valid numbers within range
   - Test min/max validation
   - Test decimal places formatting
   - Test mandatory validation
   - Test on mobile viewport

## LimeSurvey Type Mapping

| LimeSurvey Type | Our Type |
|-----------------|----------|
| N (Numerical) | `numerical` |
| K (Multiple Numerical) | `multiple_numerical` |
| F (Array) with numbers | `array_numbers` |
| F (Array) with text | `array_texts` |
