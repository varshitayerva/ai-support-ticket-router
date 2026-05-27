# User Flow Diagram

## Complete Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOME PAGE (/)                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Gradient background with features                       │  │
│  │ • Enter support ticket textarea                           │  │
│  │ • "Analyze Ticket" button                                 │  │
│  │ • Feature cards showing capabilities                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  USER ACTION: Fill ticket + Click "Analyze Ticket"              │
│                         ↓                                         │
│  VALIDATION:                                                     │
│  ├─ POST /api/judge-relevance → Check if support issue          │
│  │  ├─ If NOT relevant: Show error, stay on home               │
│  │  └─ If relevant: Continue to next step                       │
│  └─ POST /api/analyze → Get analysis (category, urgency, etc)   │
│                         ↓                                         │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│            ANALYSIS RESULTS PAGE (/analysis-results)            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Progress Tracker: Step 1/4 [▓░░░]                         │  │
│  │                                                            │  │
│  │ ANALYSIS SUMMARY:                                          │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ Category: Billing      │ Urgency: HIGH           │   │  │
│  │ │ Sentiment: Frustrated  │ Status: ✓ Relevant       │   │  │
│  │ │ Ticket: [Original text summary...]                │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │ Optional: ANALYSIS VALIDATION                             │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ ✓ Analysis Valid                                    │   │  │
│  │ │ Confidence: 85%                                    │   │  │
│  │ │ Feedback: "Correctly identified billing issue"    │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │ BUTTONS:                                                   │  │
│  │ [Start Over] [Validate Analysis] [Next ▶]                │  │
│  │                                                            │  │
│  │ FLOW CONTROL:                                             │  │
│  │ • "Validate Analysis" triggered → API call               │  │
│  │ • "Next" disabled until validation complete              │  │
│  │ • "Next" only works if analysis is correct               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  USER ACTION: Click "Validate Analysis"                         │
│                         ↓                                         │
│  API CALL:                                                       │
│  └─ POST /api/judge-analysis → Validate analysis                │
│     Returns: { is_correct, confidence, feedback }               │
│                         ↓                                         │
│  USER ACTION: Click "Next"                                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│       TROUBLESHOOTING PAGE (/troubleshooting-results)           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Progress Tracker: Step 2/4 [▓▓░░]                         │  │
│  │                                                            │  │
│  │ TROUBLESHOOTING STEPS:                                     │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ [1] Check Payment Status          [Copy]           │   │  │
│  │ │     Verify if payment processing...                │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ [2] Review Account Settings       [Copy]           │   │  │
│  │ │     Check if account locked...                     │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ [3] Contact Support If Needed     [Copy]           │   │  │
│  │ │     If issue persists, escalate...                 │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │ BUTTONS:                                                   │  │
│  │ [Previous] [Start Over] [Copy All] [Next ▶]              │  │
│  │                                                            │  │
│  │ FLOW CONTROL:                                             │  │
│  │ • Must click "Generate Troubleshooting Steps" first       │  │
│  │ • Steps displayed after generation                       │  │
│  │ • "Next" disabled until steps generated                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  USER ACTION: Click "Generate Troubleshooting Steps"            │
│                         ↓                                         │
│  LOADING STATE: Spinner + "Generating troubleshooting steps..." │
│                         ↓                                         │
│  API CALL:                                                       │
│  └─ POST /api/guidance → Get troubleshooting steps              │
│     Returns: { guidance: "Step 1...\nStep 2..." }               │
│                         ↓                                         │
│  PARSING: Clean markdown, split into step cards                │
│                         ↓                                         │
│  USER ACTION: Click "Next"                                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│          EMAIL RESULTS PAGE (/email-results)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Progress Tracker: Step 3/4 [▓▓▓░]                         │  │
│  │                                                            │  │
│  │ EMAIL PREVIEW:                                             │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ Subject: Account Access Restored                    │   │  │
│  │ │                                                    │   │  │
│  │ │ Dear Customer,                                    │   │  │
│  │ │                                                    │   │  │
│  │ │ Thank you for contacting us. We've resolved       │   │  │
│  │ │ your billing issue. Your account access has been  │   │  │
│  │ │ restored. Please follow these steps...            │   │  │
│  │ │                                                    │   │  │
│  │ │ Best regards,                                     │   │  │
│  │ │ Support Team                                      │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │ [Edit] [Copy] [Download]                                 │  │
│  │                                                            │  │
│  │ BUTTONS:                                                   │  │
│  │ [Previous] [Start Over] [Next ▶]                         │  │
│  │                                                            │  │
│  │ FLOW CONTROL:                                             │  │
│  │ • Must click "Generate Email" first                       │  │
│  │ • Email displayed after generation                       │  │
│  │ • "Next" disabled until email generated                  │  │
│  │ • Edit mode available                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  USER ACTION: Click "Generate Email"                            │
│                         ↓                                         │
│  LOADING STATE: Spinner + "Generating email response..."       │
│                         ↓                                         │
│  API CALL:                                                       │
│  └─ POST /api/email → Get email draft                           │
│     Returns: { finalEmail: "Subject:...\n\nDear..." }           │
│                         ↓                                         │
│  RENDERING: Display in professional layout                      │
│                         ↓                                         │
│  USER ACTION: Click "Next"                                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│           QUALITY REVIEW PAGE (/quality-results)               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Progress Tracker: Step 4/4 [▓▓▓▓]                         │  │
│  │                                                            │  │
│  │ OVERALL STATUS:                                            │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ Status: ✓ Approved          Score: 8.5/10          │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │ DETAILED SCORES:                                           │  │
│  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │  │
│  │ │ Quality      │ │ Correctness  │ │ Relevance    │        │  │
│  │ │   8/10       │ │   8/10       │ │   9/10       │        │  │
│  │ │ ████████░░   │ │ ████████░░   │ │ █████████░   │        │  │
│  │ │ 80%          │ │ 80%          │ │ 90%          │        │  │
│  │ └──────────────┘ └──────────────┘ └──────────────┘        │  │
│  │                                                            │  │
│  │ FEEDBACK:                                                  │  │
│  │ ┌─────────────────────────────────────────────────────┐   │  │
│  │ │ ✓ Quality Assessment                                │   │  │
│  │ │   Clear language, good structure, addresses issue   │   │  │
│  │ │   [Show more]                                      │   │  │
│  │ └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │ PROCESS SUMMARY:                                           │  │
│  │ ✓ Step 1: Analysis      → Ticket analyzed & validated    │  │
│  │ ✓ Step 2: Troubleshooting → Guidance generated            │  │
│  │ ✓ Step 3: Email Drafting → Response created               │  │
│  │ ✓ Step 4: Quality Check → Response verified               │  │
│  │                                                            │  │
│  │ BUTTONS:                                                   │  │
│  │ [Previous] [Complete & Start Over]                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  USER ACTION: Click "Evaluate Quality"                          │
│                         ↓                                         │
│  LOADING STATE: Spinner + "Evaluating response quality..."     │
│                         ↓                                         │
│  API CALL:                                                       │
│  └─ POST /api/judge → Judge quality                             │
│     Returns: {                                                   │
│       is_approved,                                              │
│       quality_score,                                            │
│       correctness_score,                                        │
│       relevance_score,                                          │
│       overall_score,                                            │
│       feedback                                                  │
│     }                                                            │
│                         ↓                                         │
│  RENDERING: Display scores, badges, and feedback                │
│                         ↓                                         │
│  USER ACTION: Click "Complete & Start Over"                    │
│                         ↓                                         │
│  REDIRECT: Navigate back to Home Page (/)                       │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
ANY PAGE:
  └─ User triggers API call
     ├─ Network Error
     │  └─ Show snackbar: "Failed to connect. Please try again."
     │
     ├─ Validation Error
     │  └─ Show snackbar: "Validation failed: [error details]"
     │
     ├─ API Error
     │  └─ Show snackbar: "Failed to [action]. Please try again."
     │
     └─ Success
        └─ Display results & enable next action
```

## State Flow

```
HomePage
  ├─ State: {ticket, loading, error}
  ├─ Success → Pass analysis via location.state
  └─ Navigate to /analysis-results

AnalysisResultsPage
  ├─ State: {analysisJudge, loading, error}
  ├─ Success → Pass analysisJudge via location.state
  └─ Navigate to /troubleshooting-results

TroubleshootingPage
  ├─ State: {guidance, loading, error}
  ├─ Success → Pass guidance via location.state
  └─ Navigate to /email-results

EmailResultsPage
  ├─ State: {finalEmail, loading, error}
  ├─ Success → Pass finalEmail via location.state
  └─ Navigate to /quality-results

QualityJudgePage
  ├─ State: {judgeResult, loading, error}
  ├─ Display final results
  └─ Option to start over → Navigate to /
```

## Component Communication

```
App.jsx (Theme Provider)
  └─ Routing (5 Routes)
     ├─ HomePage
     │  ├─ LoadingButton
     │  ├─ SnackbarAlert
     │  └─ LoadingOverlay
     │
     ├─ AnalysisResultsPage
     │  ├─ ProgressTracker
     │  ├─ StatusBadge
     │  ├─ ScoreCard
     │  ├─ FeedbackAccordion
     │  ├─ LoadingButton
     │  ├─ SnackbarAlert
     │  └─ LoadingOverlay
     │
     ├─ TroubleshootingPage
     │  ├─ ProgressTracker
     │  ├─ StepCard (multiple)
     │  ├─ LoadingButton
     │  ├─ SkeletonLoader
     │  ├─ SnackbarAlert
     │  └─ LoadingOverlay
     │
     ├─ EmailResultsPage
     │  ├─ ProgressTracker
     │  ├─ EmailPreview
     │  ├─ LoadingButton
     │  ├─ SkeletonLoader
     │  ├─ SnackbarAlert
     │  └─ LoadingOverlay
     │
     └─ QualityJudgePage
        ├─ ProgressTracker
        ├─ StatusBadge
        ├─ ScoreCard (multiple)
        ├─ FeedbackAccordion
        ├─ LoadingButton
        ├─ SkeletonLoader
        ├─ SnackbarAlert
        └─ LoadingOverlay
```

## Loading State Indicators

```
During API Call:
├─ LoadingOverlay: Full-screen backdrop with spinner
├─ Button: Disabled with spinner
├─ Input: Disabled
├─ Navigation: Disabled
└─ Progress: "Generating..."

After Success:
├─ Content: Fades in
├─ Button: Re-enabled
├─ Next Step: Available
└─ Message: Optional success snackbar

After Error:
├─ Content: Unchanged
├─ Error Message: Snackbar (red)
├─ Button: Re-enabled
└─ Retry: Available
```

---

**Visual Flow Chart Last Updated**: 2024
**Page Routes**: 5
**Component Layers**: 10
**API Endpoints**: 6
**State Passes**: Via React Router location.state
