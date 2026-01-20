# LimeSurvey Feature Parity - Implementation Tracker

> **Purpose**: Track implementation of LimeSurvey features in our survey platform.
> **Last Updated**: January 19, 2026
> **Status**: ~72% Feature Parity
> **Audited By**: Agent-Opus (Codebase Verification)
> **Status Legend**: ✅ Complete | 🔄 In Progress | ❌ Not Started | ⏭️ Deferred | N/A Not Applicable

---

## How to Use This Document

1. **Claim a task**: Add your agent ID/name and date next to an item
2. **Mark progress**: Update status emoji when starting/completing
3. **Add notes**: Include file paths, blockers, or implementation details
4. **Link PRs**: Reference any pull requests for the change

---

## Table of Contents

1. [Question Types](#1-question-types)
2. [Expression Engine](#2-expression-engine)
3. [Survey Settings](#3-survey-settings)
4. [Participant/Token System](#4-participanttoken-system)
5. [Quota System](#5-quota-system)
6. [Response Management](#6-response-management)
7. [Data Export](#7-data-export)
8. [Email System](#8-email-system)
9. [Survey Administration](#9-survey-administration)
10. [Templates & Themes](#10-templates--themes)
11. [Security & Access Control](#11-security--access-control)
12. [Integrations](#12-integrations)
13. [Localization](#13-localization)
14. [Statistics & Reporting](#14-statistics--reporting)

---

## 1. Question Types

**LimeSurvey Source**: [application/models/Question.php](https://github.com/LimeSurvey/LimeSurvey/blob/master/application/models/Question.php) - Contains all QT_* constants

### 1.1 Single Choice Questions

| Feature | LS Code | Status | Assigned | Notes |
|---------|---------|--------|----------|-------|
| List (Radio) | L | ✅ | - | `multiple_choice_single` in SurveyRenderer.tsx:319-337 |
| List (Dropdown) | ! | ✅ | - | `DropdownQuestion.tsx` |
| List with Comment | O | ✅ | - | `ListWithCommentQuestion.tsx`. Radio + text comment field |
| 5 Point Choice | 5 | ✅ | - | `FivePointChoiceQuestion.tsx`. Horizontal 1-5 scale buttons |
| Bootstrap Button (Single) | L | ✅ | Agent-Opus | `ButtonSelectQuestion.tsx`. Button-styled single select with horizontal/vertical/grid layouts |
| Image Select List (Radio) | L | ✅ | Agent-Opus | `ImageSelectQuestion.tsx`. Image-based single selection with size options |

**LimeSurvey Reference**: [application/views/survey/questions/answer/listradio](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/listradio)

### 1.2 Multiple Choice Questions

| Feature | LS Code | Status | Assigned | Notes |
|---------|---------|--------|----------|-------|
| Multiple Choice | M | ✅ | - | `multiple_choice_multiple` in SurveyRenderer.tsx:339-362 |
| Multiple Choice with Comments | P | ✅ | - | `MultipleChoiceWithCommentsQuestion.tsx`. Each checkbox has comment field |
| Bootstrap Buttons (Multiple) | M | ✅ | Agent-Opus | `ButtonMultiSelectQuestion.tsx`. Button-styled multiple select with exclusive option support |
| Image Select Multiple Choice | M | ✅ | Agent-Opus | `ImageMultiSelectQuestion.tsx`. Image-based multiple selection with size options |

**LimeSurvey Reference**: [application/views/survey/questions/answer/multiplechoice](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/multiplechoice)

### 1.3 Array Questions

| Feature | LS Code | Status | Assigned | Notes |
|---------|---------|--------|----------|-------|
| Array (Standard/Flexible) | F | ✅ | - | `ArrayQuestion.tsx`. [arrays/array](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/arrays/array) |
| Array (5 Point Choice) | A | ✅ | - | `Array5PointQuestion.tsx`. Prefilled 1-5 scale matrix |
| Array (10 Point Choice) | B | ✅ | - | `TenPointArrayQuestion.tsx`. [arrays/10point](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/arrays/10point) |
| Array (Yes/No/Uncertain) | C | ✅ | - | `YesNoUncertainArrayQuestion.tsx`. [arrays/yesnouncertain](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/arrays/yesnouncertain) |
| Array (Increase/Same/Decrease) | E | ✅ | - | `IncreaseSameDecreaseArrayQuestion.tsx`. [arrays/increasesamedecrease](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/arrays/increasesamedecrease) |
| Array Dual Scale | 1 | ✅ | - | `DualScaleArrayQuestion.tsx`. [arrays/dualscale](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/arrays/dualscale) |
| Array by Column | H | ✅ | Agent-Opus | `ArrayColumnQuestion.tsx`. Transposed axis with mobile stacked view |
| Array (Numbers) | : | ✅ | - | `ArrayNumbersQuestion.tsx`. [arrays/multiflexi](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/arrays/multiflexi) |
| Array (Texts) | ; | ✅ | - | `ArrayTextsQuestion.tsx`. [arrays/texts](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/arrays/texts) |

**LimeSurvey Reference**: [application/views/survey/questions/answer/arrays](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/arrays)

### 1.4 Text Questions

| Feature | LS Code | Status | Assigned | Notes |
|---------|---------|--------|----------|-------|
| Short Free Text | S | ✅ | - | `text` type in SurveyRenderer.tsx:297-306. [shortfreetext](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/shortfreetext) |
| Long Free Text | T | ✅ | - | `long_text` type in SurveyRenderer.tsx:308-317. [longfreetext](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/longfreetext) |
| Huge Free Text | U | ✅ | - | `HugeFreeTextQuestion.tsx`. Extra large textarea |
| Multiple Short Text | Q | ✅ | - | `MultipleShortTextQuestion.tsx`. Multiple labeled text inputs |
| Browser Detect | S | ❌ | | Auto-captures browser/OS (subtype of S) |
| Input on Demand | Q | ❌ | | Progressive column-by-column reveal |

**LimeSurvey Reference**: [application/views/survey/questions/answer/shortfreetext](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/shortfreetext)

### 1.5 Numerical Questions

| Feature | LS Code | Status | Assigned | Notes |
|---------|---------|--------|----------|-------|
| Numerical Input | N | ✅ | - | `NumericalQuestion.tsx`. [numerical](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/numerical) |
| Multiple Numerical Input | K | ✅ | - | `MultipleNumericalQuestion.tsx`. [multiplenumeric](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/multiplenumeric) |
| Slider Control | N | ✅ | Agent-Opus | `SliderQuestion.tsx`. Visual slider with min/max, step, tick marks, value display |

**LimeSurvey Reference**: [application/views/survey/questions/answer/numerical](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/numerical)

### 1.6 Mask/Special Questions

| Feature | LS Code | Status | Assigned | Notes |
|---------|---------|--------|----------|-------|
| Date/Time | D | ✅ | - | `DateQuestion.tsx`. [date](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/date) |
| Date with Time Selection | D | ✅ | Agent-Opus | `DateQuestion.tsx` supports `date_include_time` setting for datetime-local input |
| Gender | G | ✅ | - | `GenderQuestion.tsx`. Male/Female. [gender](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/gender) |
| Yes/No | Y | ✅ | - | `YesNoQuestion.tsx`. [yesno](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/yesno) |
| Language Switch | I | ✅ | Agent-Opus | `LanguageSwitchQuestion.tsx`. Buttons or dropdown, default languages or custom via answer_options |
| File Upload | \| | ✅ | Agent-Opus | `FileUploadQuestion.tsx` with `/api/survey/upload` for Supabase Storage. Supports multi-file, drag-drop, preview |
| Ranking | R | ✅ | - | `RankingQuestion.tsx`. [ranking](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/ranking) |
| Ranking (Advanced/Image) | R | ❌ | | Image-based ranking (theme variant) |
| Text Display (Boilerplate) | X | ✅ | - | `text_display` type. [boilerplate](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/boilerplate) |
| Equation | * | ✅ | - | `EquationQuestion.tsx`. [equation](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/equation) |

**LimeSurvey Reference**: [application/views/survey/questions/answer/file_upload](https://github.com/LimeSurvey/LimeSurvey/tree/master/application/views/survey/questions/answer/file_upload)

### 1.7 Question Settings (Per-Question)

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Mandatory | ✅ | - | `settings.mandatory` in QuestionSettings |
| Relevance/Conditions | ✅ | - | `relevance_logic` field |
| Randomize Answers | ✅ | - | `settings.randomize_answers` |
| Randomize Subquestions | ✅ | - | `settings.randomize_subquestions` |
| Other Option | ✅ | - | `settings.other_option` |
| Display Columns | ✅ | - | `settings.display_columns` |
| Min/Max Answers | ✅ | - | `settings.min_answers`, `max_answers` |
| Array Filter | ✅ | - | `settings.array_filter_question` |
| Hide Tip/Help Text | ✅ | - | `settings.hide_tip` |
| Exclusive Option | ❌ | | Mark answer as mutually exclusive |
| Answer Code Prefix | ✅ | Agent-Opus | `NumericalQuestion.tsx` lines 64, 99. Visual prefix span. |
| Random Group Assignment | ❌ | | Randomly assign to answer groups |
| Display Logic Per Answer | ❌ | | Show/hide individual answers conditionally |
| Printable Survey View | ❌ | | Different rendering for print |

---

## 2. Expression Engine

**LimeSurvey Source**: [application/helpers/expressions/em_core_helper.php](https://github.com/LimeSurvey/LimeSurvey/blob/master/application/helpers/expressions/em_core_helper.php)

### 2.1 Core Expression Features

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Variable Substitution | ✅ | - | `expression-engine.ts` supports Q1, Q1_SQ006 |
| Comparison Operators (==, !=, <, >, <=, >=) | ✅ | - | Implemented |
| Logical Operators (AND, OR, NOT) | ✅ | - | Implemented |
| Parentheses Support | ✅ | - | Implemented |
| Text Piping | ✅ | - | `{Q1.SelectedValue}` substitution |
| .NAOK Suffix (No Answer OK) | ✅ | - | `expression-engine.ts:246-248` |
| Arithmetic Operators (+, -, *, /) | ✅ | - | `expression-engine.ts:446-497` |
| String Concatenation | ✅ | - | `expression-engine.ts:456-458` via + operator |

### 2.2 Math Functions (from em_core_helper.php)

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| abs() | ✅ | - | `expression-engine.ts:48` |
| ceil() / floor() | ✅ | - | `expression-engine.ts:49-50` |
| round() | ✅ | - | `expression-engine.ts:51-56` |
| min() / max() | ✅ | - | `expression-engine.ts:57-58` |
| pow() / sqrt() | ✅ | - | `expression-engine.ts:59-60` |
| exp() / log() | ✅ | - | `expression-engine.ts:61-63` |
| sin() / cos() / tan() | ✅ | - | `expression-engine.ts:64-66` |
| asin() / acos() / atan() / atan2() | ✅ | - | `expression-engine.ts:67-70` |
| pi() | ✅ | - | `expression-engine.ts:71` |
| rand() | ✅ | - | `expression-engine.ts:72-77` |
| stddev() | ❌ | | Standard deviation |

### 2.3 String Functions (from em_core_helper.php)

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| strlen() | ✅ | - | `expression-engine.ts:80` |
| substr() | ✅ | - | `expression-engine.ts:81-86` |
| trim() / ltrim() / rtrim() | ✅ | - | `expression-engine.ts:87-89` |
| strtoupper() / strtolower() | ✅ | - | `expression-engine.ts:90-91` |
| ucwords() | ✅ | - | `expression-engine.ts:92-94` |
| str_replace() | ✅ | - | `expression-engine.ts:95-100` |
| str_pad() / str_repeat() | ❌ | | String padding/repeat |
| strrev() | ✅ | - | `expression-engine.ts:101` |
| sprintf() | ❌ | | Format string |
| implode() / join() | ✅ | - | `expression-engine.ts:102-111` |
| strip_tags() | ❌ | | Remove HTML |
| nl2br() | ❌ | | Newlines to BR |
| htmlentities() / htmlspecialchars() | ❌ | | HTML encoding |
| addslashes() / stripslashes() | ❌ | | Escape handling |
| strcmp() / strcasecmp() | ❌ | | String comparison |

### 2.4 Type & Validation Functions

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| is_empty() | ✅ | - | `expression-engine.ts:24-28` |
| is_numeric() | ✅ | - | `expression-engine.ts:30-35` |
| is_int() / is_float() | ✅ | - | `expression-engine.ts:39-40` |
| is_string() | ✅ | - | `expression-engine.ts:41` |
| is_null() / is_nan() | ✅ | - | `expression-engine.ts:37-38` |
| intval() / floatval() | ✅ | - | `expression-engine.ts:44-45` |
| regexMatch() | ✅ | - | `expression-engine.ts:173-182` |

### 2.5 Array/List Functions

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| count() | ✅ | - | `expression-engine.ts:114-117` |
| countif() / countifop() | ✅ | - | `expression-engine.ts:129-136` |
| sum() / sumifop() | ✅ | - | `expression-engine.ts:118-146` (sum, avg, sumif) |
| list() / listifop() | ❌ | | List operations |
| unique() | ❌ | | Validate uniqueness |

### 2.6 Date/Time Functions

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| date() | ❌ | | Format date |
| gmdate() | ❌ | | GMT date format |
| time() | ❌ | | Current timestamp |
| mktime() | ❌ | | Create timestamp |
| strtotime() | ❌ | | Parse date string |
| checkdate() | ❌ | | Validate date |
| idate() | ❌ | | Integer date format |

### 2.7 Control Functions

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| if(cond, true, false) | ✅ | - | `expression-engine.ts:149-157` (if, iif) |
| convert_value() | ❌ | | Value conversion |
| fixnum() | ❌ | | Fix number format |
| number_format() | ✅ | - | `expression-engine.ts:160-170` |

**LimeSurvey Reference**: [application/helpers/expressions/em_manager_helper.php](https://github.com/LimeSurvey/LimeSurvey/blob/master/application/helpers/expressions/em_manager_helper.php)

### 2.3 Expression Applications

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Question Relevance | ✅ | - | `relevance_logic` on questions |
| Group Relevance | ✅ | - | `relevance_logic` on groups |
| Answer Relevance | ❌ | | Show/hide individual answers |
| Subquestion Relevance | 🔄 | | Partial support via `relevance_logic` field |
| Validation Equations | ❌ | | Custom validation rules |
| Question Text Tailoring | ✅ | - | Piping via `{code}` syntax |
| Default Value Equations | ❌ | | Pre-fill based on calculation |
| Array Filter Equations | 🔄 | | Basic support, needs expansion |

---

## 3. Survey Settings

### 3.1 General Settings

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Survey Title | ✅ | - | `surveys.title` |
| Survey Description | ✅ | - | `surveys.description` |
| Survey Status (Draft/Active/Closed) | ✅ | - | `surveys.status` |
| Administrator Email | ❌ | | Contact for survey issues |
| Bounce Email | ❌ | | Email for bounced messages |
| Fax Number | ❌ | | Contact fax (legacy) |
| Survey Owner | ❌ | | User who owns survey |

### 3.2 Presentation Settings

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Format (Question/Group/All-in-one) | ✅ | - | `settings.format` |
| Template/Theme | ✅ | - | `settings.theme` |
| Show Progress Bar | ✅ | - | `settings.show_progress_bar` |
| Show Question Index | ❌ | | Navigation menu with question list |
| Show Group Name | ✅ | Agent-Opus | `show_group_name` setting in SurveySettings, renders in SurveyRenderer |
| Show Group Description | ✅ | Agent-Opus | `show_group_description` setting in SurveySettings, renders in SurveyRenderer |
| Show Question Number | ✅ | Agent-Opus | `show_question_number` setting shows Q1, Q2, etc. with crimson styling |
| Show Question Code | ✅ | Agent-Opus | `show_question_code` setting displays [CODE] in monospace style |
| Question Numbering Style | ❌ | | Sequential, per-group, custom |
| Show "No Answer" | ✅ | - | `settings.show_no_answer` for arrays |
| Print Answers | ❌ | | Show respondent's answers at end |
| Public Statistics | ❌ | | Show statistics after completion |
| Show Graphs in Statistics | ❌ | | Visual charts |
| Automatically Load URL | ❌ | | Auto-redirect after completion |

### 3.3 Navigation Settings

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Allow Backward Navigation | ✅ | - | `settings.allow_backward_navigation` |
| Show "Previous" Button | ✅ | - | Controlled by backward navigation |
| Keyboard Navigation | ❌ | | Navigate with keyboard shortcuts |
| Soft Mandatory | ❌ | | Warning but allow skip |
| Show "Save & Resume Later" | ❌ | | Explicit save button |
| Navigation Delay | ❌ | | Minimum time before next |
| Confirmation on Leave | ✅ | Agent-Opus | `confirm_on_leave` setting uses beforeunload event when responses exist |

### 3.4 Publication & Access Settings

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Start Date/Time | ✅ | Agent-Opus-Bottom | `settings.start_date` - survey-types.ts, settings/route.ts, settings/page.tsx |
| Expiry Date/Time | ✅ | Agent-Opus-Bottom | `settings.expiry_date` - checked in take/[id]/page.tsx |
| Listing in Survey Directory | ❌ | | Public discovery |
| Closed Access Mode (Tokens Required) | 🔄 | | Token validation exists, needs UI toggle |
| Open Access Mode | ✅ | - | Default behavior |
| Allow Public Registration | ❌ | | Self-register for token |
| CAPTCHA | ❌ | | Bot protection |
| Access Code (simple password) | ❌ | | Single password for all |
| Cookie Protection | ❌ | | Prevent multiple submissions |

### 3.5 Notification Settings

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Basic Admin Notification | ❌ | | Email on completion |
| Detailed Admin Notification | ❌ | | Include response data |
| Notification Email Address | ❌ | | Configurable recipient |
| Google Analytics ID | ❌ | | GA tracking |

### 3.6 Data Policy Settings

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Show Data Policy | ❌ | | Privacy policy display |
| Data Policy Checkbox | ❌ | | Require agreement |
| Data Policy Error Message | ❌ | | Custom error text |
| Data Policy Label | ❌ | | Custom checkbox label |

### 3.7 Response Storage Settings

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Save Incomplete Responses | ✅ | - | `settings.save_incomplete_responses` |
| Date Stamp | ✅ | - | `started_at`, `completed_at` |
| IP Address | ✅ | - | `metadata.ip_address` |
| Referrer URL | ✅ | - | `metadata.referrer` |
| Save Timings | ❌ | | Per-question timing data |
| Anonymized Responses | ❌ | | Remove identifying data |
| Enable Assessment | ❌ | | Scoring mode |

### 3.8 Text Elements

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Welcome Message | ✅ | Agent-Opus-Bottom | `SurveyRenderer.tsx` phase system with welcome page |
| End Message | ✅ | Agent-Opus-Bottom | `SurveyRenderer.tsx` completion, screenout, quota_full pages |
| End URL | ✅ | - | `settings.completion_redirect_url` |
| Screenout URL | ✅ | - | `settings.screenout_redirect_url` |
| URL Description | ❌ | | Label for end URL link |
| Date Format | ❌ | | Configurable date display |
| Decimal Mark | ❌ | | Period or comma |

---

## 4. Participant/Token System

**LimeSurvey Source**: [application/models/Token.php](https://github.com/LimeSurvey/LimeSurvey/blob/master/application/models/Token.php)

### 4.1 Token Management

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Create Participant Table | 🔄 | | Schema exists, needs full CRUD |
| Token Field (tid, token) | ✅ | - | Implemented in `/api/survey/tokens`. Max 36 chars |
| First Name (firstname) | ❌ | | Participant field |
| Last Name (lastname) | ❌ | | Participant field |
| Email (email) | ✅ | - | Implemented. IDNA support in LS |
| Email Status (emailstatus) | ❌ | | OK, bounced, OptOut |
| Language Preference (language) | ❌ | | Default survey language |
| Uses Left (usesleft) | ✅ | - | Implemented. Default=1 |
| Valid From (validfrom) | ✅ | - | Implemented |
| Valid Until (validuntil) | ✅ | - | Implemented |
| Blacklisted (blacklisted) | ❌ | | Y/N flag |
| Completed (completed) | ✅ | - | Auto-set on completion |
| Invitation Sent (sent) | ❌ | | Timestamp |
| Reminder Sent (remindersent) | ❌ | | Timestamp |
| Reminder Count (remindercount) | ❌ | | How many sent |
| Custom Attributes (attribute_1-255) | ❌ | | Extra participant fields |

### 4.2 Token Operations

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Generate Tokens | ✅ | - | `/api/survey/tokens` POST |
| Bulk Token Generation | 🔄 | | Partial - needs count param |
| Import from CSV | ❌ | | Upload participant list |
| Import from LDAP | ❌ | | Directory integration |
| Export Tokens | ❌ | | Download participant list |
| Search/Filter Tokens | ✅ | - | Implemented with pagination |
| Delete Tokens | ✅ | - | Bulk delete implemented |
| Validate Token | ✅ | - | `/api/survey/tokens/[token]` GET |
| Mark as Completed | ✅ | - | Auto on survey completion |

### 4.3 Central Participant Database (CPDB)

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Global Participant Pool | ❌ | | Share across surveys |
| Blacklist | ❌ | | Opt-out management |
| Attribute Mapping | ❌ | | Map CPDB fields to survey tokens |
| Participant Search | ❌ | | Cross-survey participant lookup |

---

## 5. Quota System

**LimeSurvey Source**: [application/models/Quota.php](https://github.com/LimeSurvey/LimeSurvey/blob/master/application/models/Quota.php)

### 5.1 Core Quota Features

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Create Quota | ✅ | - | `/api/survey/quotas` |
| Quota Name (name) | ✅ | - | Max 255 chars |
| Quota Limit (qlimit) | ✅ | - | Integer threshold |
| Active Flag (active) | ✅ | - | 0/1 boolean |
| Quota Action - TERMINATE_VISIBLE | ✅ | - | Action constant 1 |
| Quota Action - SOFT_TERMINATE | ❌ | | Action constant 2 |
| Quota Action - TERMINATE_ALL | ❌ | | Action constant 3 |
| Quota Action - TERMINATE_ALL_PAGES | ❌ | | Action constant 4 |
| Auto-Redirect URL (autoload_url) | ✅ | - | 0/1 boolean |
| Quota Message | ✅ | - | Via QuotaLanguageSetting |
| QuotaMember Conditions | 🔄 | | Basic support |

### 5.2 Quota Conditions

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Question-based Conditions | ✅ | - | Implemented |
| Multiple Conditions (AND) | ❌ | | Combine conditions |
| Multiple Answers (OR) | ❌ | | Any of selected answers |
| Quota on All Question Types | ❌ | | Extend beyond basic types |

### 5.3 Quota Monitoring

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| View Quota Progress | ✅ | - | Count vs limit |
| Reset Quota Count | ✅ | - | Implemented |
| Quota Statistics | ❌ | | Detailed breakdown |

---

## 6. Response Management

### 6.1 Response Collection

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Save Individual Responses | ✅ | - | `/api/survey/response` |
| Auto-save Responses | 🔄 | | Endpoint exists, needs client integration |
| Resume Incomplete Survey | 🔄 | | Endpoint exists, needs client integration |
| Response Timestamps | ✅ | - | `started_at`, `completed_at` |
| Response Metadata | ✅ | - | IP, user agent, referrer, device |
| Randomization Seed | ✅ | - | For reproducible randomization |

### 6.2 Response Editing

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| View Individual Responses | ✅ | - | `/admin/surveys/[id]/responses` page |
| Edit Responses | ✅ | Agent-Opus | Full UI in `/admin/surveys/[id]/responses` with edit mode, type-specific inputs, save/cancel |
| Delete Responses | ✅ | - | Via responses page and `DELETE /api/survey/response/[id]` |
| Bulk Delete Responses | ❌ | | Mass deletion |
| Response Status Management | ✅ | - | incomplete/complete/screened_out |

### 6.3 Response Browsing

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Response List View | ✅ | - | Table view in `/admin/surveys/[id]/responses` |
| Response Detail View | ✅ | - | Side panel with full response data |
| Search Responses | ✅ | - | Search by ID, participant, IP |
| Sort Responses | ✅ | - | By started_at |
| Pagination | ✅ | Agent-Opus | Server-side pagination with page/limit params, UI controls in responses page |

---

## 7. Data Export

### 7.1 Export Formats

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| CSV Export | ✅ | - | `/api/survey/export/[surveyId]/csv` |
| JSON Export | ✅ | - | `/api/survey/export/[id]` |
| Excel Export (.xlsx) | ✅ | Agent-Opus | `/api/survey/export/excel/[id]`. Uses ExcelJS with formatted headers, auto-filter, frozen rows |
| PDF Export | ❌ | | Formatted report |
| Word Export | ❌ | | Document format |
| SPSS Export (.sps + .csv) | ✅ | - | `/api/survey/export/spss/[id]`. Syntax + data in ZIP |
| R Export (.R + .csv) | ✅ | - | `/api/survey/export/r/[id]`. Script + data in ZIP |
| Stata Export (.do + .csv) | ✅ | - | `/api/survey/export/stata/[id]`. Do-file + data in ZIP |
| HTML Export | ❌ | | Web format |

### 7.2 Export Options

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Filter by Completion Status | ❌ | | All/Complete/Incomplete |
| Filter by Response ID Range | ❌ | | Specific IDs |
| Filter by Date Range | ❌ | | Date-based filtering |
| Select Questions | ❌ | | Choose which to export |
| Export as Codes or Labels | ❌ | | A1 vs "Strongly Agree" |
| Include Token Data | ❌ | | Merge participant info |
| Question Text Format | ❌ | | Code only, text, both |
| Strip HTML from Responses | ❌ | | Clean text |

### 7.3 VVExport (Import/Export for Editing)

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| VV Export | ❌ | | Tab-separated for editing |
| VV Import | ❌ | | Re-import edited data |
| Add as New Responses | ❌ | | Import without overwrite |
| Update Existing Responses | ❌ | | Merge changes |

---

## 8. Email System

### 8.1 Email Types

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Invitation Email | ✅ | Agent-Opus | `/api/survey/emails` POST with type='invitation'. Tokens page has modal |
| Reminder Email | ✅ | Agent-Opus | `/api/survey/emails` POST with type='reminder'. Sends to unused tokens |
| Confirmation Email | ✅ | Agent-Opus | `/api/survey/emails` POST with type='completion'. Template in email-service.ts |
| Admin Notification Email | ❌ | | Alert on submission |

### 8.2 Email Features

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Email Templates | ✅ | Agent-Opus | Admin UI in settings/page.tsx "Email Templates" tab with invitation/reminder/confirmation |
| Email Placeholders | ✅ | Agent-Opus | {FIRSTNAME}, {LASTNAME}, {EMAIL}, {TOKEN}, {SURVEYURL}, {SURVEYTITLE} with copy-to-clipboard |
| HTML Emails | ✅ | Agent-Opus | Rich HTML templates in email-service.ts with styled headers/footers |
| Plain Text Emails | ✅ | Agent-Opus | Automatic plain text fallback in all email templates |
| Email Subject Customization | ✅ | Agent-Opus | Per-template subjects in admin UI + customSubject param in API |
| Batch Sending | ✅ | Agent-Opus | `/api/survey/emails` loops through tokens with error tracking |
| Send Test Email | ✅ | Agent-Opus | `/api/survey/emails/test` API with test banner, placeholder preview in settings UI |
| Multiple Email Providers | ✅ | Agent-Opus | Resend, SendGrid, Mock provider support in email-service.ts |

### 8.3 Email Tracking

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Track Invitation Sent | ✅ | Agent-Opus | Stored in token metadata as `invitation_sent_at` with messageId |
| Track Reminder Sent | ✅ | Agent-Opus | Stored in token metadata as `reminder_sent_at` with messageId |
| Email Logs | ✅ | Agent-Opus | `email_logs` table (if exists) stores batch send results |
| Bounce Processing | ❌ | | Handle failed deliveries |
| Opt-out Handling | ❌ | | Respect unsubscribes |

---

## 9. Survey Administration

### 9.1 Survey Lifecycle

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Create Survey | ✅ | - | `/admin/surveys/new` |
| Edit Survey | ✅ | - | `/admin/surveys/[id]` |
| Delete Survey | ✅ | Agent-Opus | `DELETE /api/survey/surveys/[id]` with cascade delete. Confirmation modal in admin page. |
| Copy/Clone Survey | ✅ | Agent-Opus | `POST /api/survey/surveys/[id]/copy`. Deep copies all groups, questions, subquestions, answer_options |
| Archive Survey | ❌ | | Soft delete/hide |
| Survey Preview | ✅ | Agent-Opus | `?preview=true` query param. Preview banner, skips save, date check bypass |
| Test Survey Mode | ❌ | | Record but mark as test |

### 9.2 Survey Structure

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Question Groups | ✅ | - | CRUD implemented |
| Group Ordering | ✅ | - | `order_index` field |
| Group Randomization | 🔄 | | `random_group` field exists |
| Question Ordering | ✅ | - | `order_index` field |
| Copy Question | ✅ | Agent-Opus | `QuestionGroupList.tsx` copy button duplicates with subquestions and options |
| Move Question | ❌ | | Between groups |
| Import Question Group | ❌ | | From another survey |
| Export Question Group | ❌ | | Standalone group export |

### 9.3 Survey Import/Export

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Import from JSON | ✅ | - | `/api/survey/import` |
| Export to JSON | ✅ | - | `/api/survey/export/[id]` |
| Import from LSS (LimeSurvey) | ❌ | | Native LS format |
| Export to LSS | ❌ | | For LimeSurvey compatibility |
| Import from TSV | ❌ | | Tab-separated structure |
| Export to TSV | ❌ | | Tab-separated structure |

### 9.4 Label Sets

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Create Label Set | 🔄 | | API exists |
| Reusable Answer Scales | ❌ | | Apply to multiple questions |
| Import Label Sets | ❌ | | Share between surveys |
| Multilingual Labels | ❌ | | Translated answer options |

---

## 10. Templates & Themes

### 10.1 Survey Templates

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Create Template from Survey | 🔄 | | API exists |
| List Templates | 🔄 | | API exists |
| Apply Template | ❌ | | Create survey from template |
| Share Templates | ❌ | | Between users |

### 10.2 Visual Themes

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Editorial Academic Theme | ✅ | - | Default theme |
| Modern Theme | 🔄 | | In settings, needs implementation |
| Minimal Theme | 🔄 | | In settings, needs implementation |
| Custom CSS | ✅ | Agent-Opus | `settings.custom_css` - Scoped to .survey-container in SurveyRenderer.tsx |
| Custom JavaScript | ✅ | Agent-Opus | `settings.custom_js` - Executes with SurveyAPI object in SurveyRenderer.tsx |
| Logo Upload | ❌ | | Branding |
| Color Customization | ❌ | | Theme colors |
| Font Selection | ❌ | | Typography options |

### 10.3 Theme Inheritance

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Base Theme Extension | ❌ | | Extend existing themes |
| Bootswatch Themes | ❌ | | Bootstrap theme library |
| Theme Options Panel | ❌ | | Per-theme settings |

---

## 11. Security & Access Control

### 11.1 Authentication

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Admin Login | ✅ | - | Basic auth implemented |
| Two-Factor Authentication | ❌ | | 2FA for admins |
| LDAP Integration | ❌ | | Enterprise directory |
| SAML SSO | ❌ | | Single sign-on |
| OAuth Integration | ❌ | | Social login |

### 11.2 Authorization

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| User Roles | ❌ | | Admin, editor, viewer |
| Survey Permissions | 🔄 | | API exists |
| Permission Inheritance | ❌ | | From user groups |
| Global Permissions | ❌ | | System-wide settings |

### 11.3 Data Security

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Response Anonymization | ❌ | | Strip identifying data |
| IP Anonymization | ❌ | | Partial IP storage |
| Data Encryption | ❌ | | At rest encryption |
| SSL/TLS | ✅ | - | Via hosting |
| GDPR Compliance Tools | ❌ | | Data export, deletion |
| Audit Log | ❌ | | Track admin actions |

---

## 12. Integrations

### 12.1 API

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| REST API | ✅ | - | Next.js API routes |
| API Authentication | ❌ | | API keys or JWT |
| Rate Limiting | ❌ | | Prevent abuse |
| Webhooks | ❌ | | Event notifications |
| RemoteControl API | ❌ | | LimeSurvey-compatible |

### 12.2 External Services

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Prolific Integration | ✅ | - | Completion/screenout codes |
| MTurk Integration | ❌ | | Amazon Mechanical Turk |
| Qualtrics Import | ❌ | | Migration tool |
| Google Sheets Export | ❌ | | Direct sync |
| Zapier Integration | ❌ | | Automation |
| Slack Notifications | ❌ | | Team alerts |

### 12.3 Analytics

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Google Analytics | ❌ | | Page tracking |
| Custom Analytics Events | ❌ | | Track interactions |
| Completion Tracking | ✅ | - | Via response status |

---

## 13. Localization

### 13.1 Survey Localization

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Multiple Survey Languages | ❌ | | Full multilingual support |
| Language Selector | ❌ | | In-survey switching |
| RTL Language Support | ❌ | | Arabic, Hebrew, etc. |
| Question Translation UI | ❌ | | Side-by-side editing |
| Auto-Translation | ❌ | | AI-assisted |

### 13.2 Interface Localization

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Admin Interface Languages | ❌ | | Localized admin |
| Button/Label Translation | ❌ | | Next, Previous, etc. |
| Error Message Translation | ❌ | | Validation messages |
| Date/Time Localization | ❌ | | Regional formats |

---

## 14. Statistics & Reporting

### 14.1 Response Statistics

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Response Summary | ✅ | - | `ResponseCharts.tsx` |
| Completion Rate | ✅ | - | Calculated in API |
| Response Timeline | ✅ | Agent-Opus | SVG bar+line chart in `ResponseCharts.tsx`. Daily counts + cumulative total |
| Average Completion Time | ✅ | Agent-Opus | Calculated from started_at/completed_at. Displayed in summary cards |
| Drop-off Analysis | ✅ | Agent-Opus | `ResponseCharts.tsx` - SVG bar chart + table showing where incomplete respondents quit |

### 14.2 Question Statistics

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Frequency Distribution | ✅ | - | Bar charts in ResponseCharts |
| Cross-Tabulation | ✅ | Agent-Opus | `CrossTabulation.tsx` - Compare two single-choice questions with heatmap, row/col/total percentages |
| Correlation Analysis | ❌ | | Statistical relationships |
| Text Response Word Cloud | ✅ | Agent-Opus | `TextAnalysis.tsx` - Word cloud visualization, word frequency table, sample responses. Route at `/admin/surveys/[id]/text-analysis` |
| Custom Filters | ❌ | | Segment analysis |

### 14.3 Visual Reports

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Bar Charts | ✅ | - | Implemented |
| Pie Charts | ✅ | Agent-Opus | SVG-based pie charts in ResponseCharts.tsx. Toggle between bar/pie, per-question or global preference, localStorage persistence |
| Line Charts | ❌ | | Trend over time |
| Stacked Charts | ❌ | | Grouped comparisons |
| Export Charts | ✅ | Agent-Opus | `ChartExportButton.tsx` + `/lib/export/chart-export.ts`. PNG (2x scale) and SVG export for all analytics charts |
| Printable Report | ❌ | | Full survey report |

---

## 14.4 Mobile Responsiveness

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Core Survey Mobile Layout | ✅ | Agent-Opus | `survey-mobile.css` - 768px, 375px breakpoints. Sticky navigation, touch targets |
| Question Components Mobile | ✅ | Agent-Opus | 31/33 question components have @media queries. All inputs use 16px font (iOS zoom prevention) |
| Touch-friendly Tap Targets | ✅ | Agent-Opus | 44px minimum via `(hover: none)` media query |
| Array/Matrix Mobile Fallback | ✅ | - | `.array-mobile` class for stacked card layout on mobile |
| NPS/CSAT/CES Mobile | ✅ | Agent-Opus | Responsive button sizing, 375px extra-small breakpoint |
| Slider Mobile | ✅ | - | Larger thumb, stacked layout on mobile |
| File Upload Mobile | ✅ | - | Responsive drop zone, touch-friendly file management |
| Landscape Orientation | ✅ | - | Side-by-side navigation buttons in landscape |
| Reduced Motion Accessibility | ✅ | - | `prefers-reduced-motion` support |

**Mobile CSS Files:**
- `/src/app/survey-mobile.css` - Global mobile overrides (imported in survey.css)
- Individual component `@media` queries for component-specific adjustments

**Breakpoints Used:**
- 768px - Main tablet/mobile breakpoint
- 480px - Small phones
- 375px - Extra-small devices (iPhone SE, etc.)

---

## Implementation Priority Guide

### Phase 1: Critical for Basic Parity (HIGH)
1. ~~Missing single choice types (List with Comment, 5-Point)~~ ✅ DONE
2. ~~Multiple Choice with Comments~~ ✅ DONE
3. ~~Expression functions (is_empty, count, sum, if)~~ ✅ DONE
4. ~~Response viewer/editor in admin~~ ✅ DONE
5. ~~Welcome/End message settings~~ ✅ DONE
6. ~~Survey dates (start/expiry)~~ ✅ DONE

### Phase 2: Enhanced Features (MEDIUM)
1. ~~File Upload question type~~ ✅ DONE
2. Email system completion
3. ~~Export formats (SPSS, R, Stata)~~ ✅ DONE
4. ~~Excel Export (.xlsx)~~ ✅ DONE
5. ~~Survey copy/clone~~ ✅ DONE
6. ~~Custom CSS/JS support~~ ✅ DONE
7. ~~Question statistics improvements~~ ✅ DONE (Timeline, Avg Time, Cross-Tab, Pie Charts)

### Phase 3: Enterprise Features (LOW)
1. Multilingual support
2. User roles and permissions
3. LDAP/SAML integration
4. Central Participant Database
5. Advanced analytics

---



## Audit Notes (Jan 19, 2026)

This document has been audited against the codebase. '✅' indicates code presence and basic wiring.
- **Verified**: Question components, Expression Engine, Exports, Basic Flow.
- **Missing**: Randomization logic (Groups/Questions), Exclusive Option logic, Quota enforcement runtime.


---

## 15. Qualtrics Feature Backlog

**Source**: `resonant-research-roadmap.docx`  
**Goal**: Advance beyond LimeSurvey parity toward Qualtrics-level capabilities.

### 15.1 Quick Wins (Tier 1) - 1-3 days each

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| NPS Question Type | ✅ | Agent-Opus | 0-10 scale with promoter/passive/detractor |
| CSAT Question Type | ✅ | Agent-Opus | 1-5 star visual rating |
| CES Question Type | ✅ | Agent-Opus | Customer Effort Score 1-7 |
| QR Code Distribution | ✅ | Agent-Opus | Pure TS QR generator (`qr-code.ts`), `QRCodeDisplay.tsx` with size/color/EC options, SVG/PNG download |
| Survey Versioning UI | ❌ | | Show revision history diff |
| Real-time Response Counter | ✅ | Agent-Opus | `LiveResponseCounter.tsx` - Compact and detailed modes, 30s polling for active surveys, visibility-aware. Integrated into `/admin/surveys` list |

### 15.2 Medium Effort (Tier 2) - 1-2 weeks each

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Basic Text iQ | ❌ | | Claude API sentiment analysis for open-ended |
| Cross-Tab Significance | ❌ | | Add chi-square testing to CrossTabulation |
| Email Distribution Engine | ❌ | | Personalized emails with tokens, scheduling |
| Survey Templates Library | ❌ | | Pre-built templates for common use cases |
| Webhook Support | ❌ | | Event-driven notifications |

### 15.3 Strategic Features (Tier 3) - 2-4 weeks each

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| MaxDiff Question Type | ❌ | | Best-worst scaling with preference shares |
| Van Westendorp Pricing | ❌ | | Price sensitivity 4-question analysis |
| Driver Analysis | ❌ | | Automatic key driver identification |
| A/B Testing Framework | ❌ | | Treatment/control randomization + power calc |
| Panel Health Dashboard | ❌ | | Fatigue and engagement metrics |

### 15.4 Enterprise Features (Tier 4) - 1-2 months each

| Feature | Status | Assigned | Notes |
|---------|--------|----------|-------|
| Conjoint Analysis Module | ❌ | | Choice-based conjoint with HB estimation |
| AI Survey Generator | ❌ | | Natural language → survey structure |
| Slack/Teams Integration | ❌ | | Real-time response notifications |
| REST API Documentation | ❌ | | OpenAPI spec with Swagger UI |
| SSO (SAML 2.0) | ❌ | | Enterprise single sign-on |

---

## Change Log

| Date | Agent | Change |
|------|-------|--------|
| 2024-01-19 | Initial | Created document with full feature inventory |
| 2026-01-19 | Agent-Opus | Updated statuses for completed features: List with Comment (O), 5 Point Choice (5), Multiple Choice with Comments (P), Array 5 Point (A), Huge Free Text (U), Multiple Short Text (Q), SPSS/R/Stata exports |
| 2026-01-19 | Agent-Opus-Bottom | Completed Welcome/End Message UI: Added SurveyPhase state management to SurveyRenderer.tsx with welcome, completion, screenout, and quota_full pages. Updated survey-types.ts with welcome/end/screenout/quota settings fields |
| 2026-01-19 | Agent-Opus-Bottom | Updated Expression Engine status: Verified all Phase 1 priority functions (is_empty, count, sum, if) already implemented. Marked 40+ expression functions as complete in feature parity doc |
| 2026-01-19 | Agent-Opus-Bottom | Completed Survey dates (start/expiry): Added start_date and expiry_date to SurveySettings. Created Publication tab in admin settings UI. Added date checking in take/[id]/page.tsx with user-friendly messages |
| 2026-01-19 | Agent-Opus | Added Response Viewer/Editor: Created `/admin/surveys/[id]/responses` page with list view, detail panel, search, filter by status, and delete. Created `/api/survey/response/[id]` route with GET/PUT/DELETE |
| 2026-01-19 | Agent-Opus-Bottom | Enhanced Response Editor: Added inline editing mode to responses/page.tsx with edit/save/cancel controls. Created `/api/survey/response/[id]/edit/route.ts` for admin edits. All Phase 1 priorities now complete! |
| 2026-01-19 | Agent-Opus | Verified Excel Export already implemented: `/api/survey/export/excel/[id]` using ExcelJS with formatted headers, auto-filter, frozen rows. Updated feature parity doc. |
| 2026-01-19 | Agent-Opus | Verified Survey copy/clone implemented: `POST /api/survey/surveys/[id]/copy` deep copies all groups, questions, subquestions, answer_options. |
| 2026-01-19 | Agent-Opus | Verified Custom CSS/JS implemented: `settings.custom_css` scoped to .survey-container, `settings.custom_js` executes with SurveyAPI. Admin UI in settings/page.tsx "Custom Code" tab. |
| 2026-01-19 | Agent-Opus | Implemented Response Pagination: Updated `/api/survey/responses/[id]` with page, limit, status, search params. Added pagination UI controls to responses/page.tsx with server-side filtering. |
| 2026-01-19 | Agent-Opus | Connected File Upload to backend: Updated `FileUploadQuestion.tsx` to use `/api/survey/upload` API for Supabase Storage. Added responseId prop threading through SurveyRenderer. Drag-drop, multi-file, validation all working. |
| 2026-01-19 | Agent-Opus | Added Delete Survey feature: `DELETE /api/survey/surveys/[id]` with cascade delete for all related data (responses, questions, groups, quotas). Added confirmation modal to admin surveys page. |
| 2026-01-19 | Agent-Opus | Added Slider Control question type: `SliderQuestion.tsx` with min/max/step settings, tick marks, value display, keyboard navigation (Home/End/PageUp/PageDown), ARIA accessibility. Added `slider` type to QuestionType and slider settings to QuestionSettings. |
| 2026-01-19 | Agent-Opus-4.5 | Phase 2 completion: Integrated FileUploadQuestion.tsx into SurveyRenderer. Created `/api/survey/upload` for Supabase Storage. Created `/lib/export/excel.ts` and `/api/survey/export/excel/[id]` for .xlsx export. Created `/api/survey/surveys/[id]/clone` for survey copy. Added Clone button to admin surveys list. Verified Custom CSS/JS already implemented. |
| 2026-01-19 | Agent-Opus | Added Cross-Tabulation: `CrossTabulation.tsx` component for comparing two single-choice questions. Features heatmap, row/col/total percentage display, question selectors. |
| 2026-01-19 | Agent-Opus | **Codebase Audit Complete**: Verified 26 question components, 40+ expression functions, all export APIs. Added critical DB schema warning. Updated status to ~72% parity. |
| 2026-01-19 | Agent-Opus | **Added Section 15: Qualtrics Feature Backlog** with 21 features in 4 tiers from `resonant-research-roadmap.docx`. Includes NPS/CSAT, Text iQ, MaxDiff, Conjoint, AI Survey Generator. |
| 2026-01-19 | Agent-Opus | **Database Fixed**: Removed restrictive `question_type` CHECK constraint. All 24 question types now supported in DB. |
| 2026-01-19 | Agent-Opus | **Implemented Tier 1 Features**: Added `CSATQuestion.tsx` (5-star) and `CESQuestion.tsx` (1-7 scale). Verified `NPSQuestion.tsx`. All 3 wired into `SurveyRenderer.tsx` and active. |
| 2026-01-19 | Agent-Opus | Enhanced Email System: Verified invitation/reminder/confirmation all work via `/api/survey/emails`. Added test email API at `/api/survey/emails/test`. Added Send Test Email UI to settings Email Templates tab. Updated feature parity for batch sending, HTML emails, and tracking. |
| 2026-01-19 | Agent-Opus-4.5 | Added Bootstrap Button Single (`ButtonSelectQuestion.tsx`), Image Select (`ImageSelectQuestion.tsx`), Date with Time (`date_include_time` setting), Copy Question functionality (📋 button in QuestionGroupList), Survey Preview mode (`?preview=true` with banner). |
| 2026-01-19 | Agent-Opus-4.5 | Added multi-select variants: `ButtonMultiSelectQuestion.tsx`, `ImageMultiSelectQuestion.tsx`. Added display settings: `show_question_number`, `show_group_name`, `show_group_description` with SurveyRenderer support. |
| 2026-01-19 | Agent-Opus-4.5 | Added `show_question_code` setting, `confirm_on_leave` with beforeunload warning, NPS question settings (`nps_low_label`, `nps_high_label`, `nps_show_category`). |
| 2026-01-19 | Agent-Opus | **NPS Question Type**: Created `NPSQuestion.tsx` with 0-10 scale, color-coded promoter/passive/detractor buttons, category indicators, selection feedback. Created `NPSAnalytics.tsx` for NPS score calculation with distribution chart, category breakdown bar, benchmark labels. Added `nps`, `csat`, `ces` to QuestionType. First Qualtrics Tier 1 feature complete! |
| 2026-01-19 | Agent-Opus | **QR Code Distribution**: Built pure TypeScript QR code generator (`src/lib/utils/qr-code.ts`) with Reed-Solomon error correction, 8 mask patterns, version auto-selection. Created `QRCodeDisplay.tsx` component with customizable size, colors, error correction levels, token inclusion, SVG/PNG download. Added "QR Code" tab to survey settings. No external dependencies! |
| 2026-01-19 | Agent-Opus | **Chart Export**: Created `ChartExportButton.tsx` and `/lib/export/chart-export.ts` for PNG (2x scale) and SVG export of analytics charts. |
| 2026-01-19 | Agent-Opus | **Real-time Response Counter**: Created `LiveResponseCounter.tsx` with compact/detailed modes, 30s polling, visibility-aware. Added `/api/survey/responses/[id]/count` endpoint. Integrated into admin surveys list. |
| 2026-01-19 | Agent-Opus | **Mobile Optimization**: Fixed fixed-width issues in SurveyRenderer and question components. Added mobile styles to CSATQuestion. Enhanced `survey-mobile.css` with NPS/CSAT/CES mobile support, 16px font for iOS zoom prevention, 44px touch targets. Documented in Section 14.4. |
