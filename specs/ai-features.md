# Spec: AI Features

## Goal
Surface AI-powered actions on every email using Claude claude-sonnet-4-6.

## Features

### 1. Email Summary
- Trigger: "Summarize" button in AI panel
- Backend: `POST /api/v1/ai/summarize` (SSE stream)
- Output: 2-3 sentence summary displayed below button
- UX: Streams in word by word with blinking cursor

### 2. Draft Reply
- Trigger: "Draft Reply" button in AI panel
- Backend: `POST /api/v1/ai/draft-reply` (SSE stream)
- Output: Professional reply draft with "Use Draft" button
- UX: Streams in, then "Use Draft" opens ComposeModal pre-filled

### 3. Priority Score
- Trigger: "Prioritize" button in AI panel
- Backend: `POST /api/v1/ai/prioritize`
- Output: Score 1-10 + label (Low/Medium/High/Critical) + color badge
- Score ≥7 shows colored dot in email list item

## UI
- AI panel toggled by ✨ button in EmailDetail toolbar
- Panel appears at bottom of email detail view
- Three action buttons side by side
- Results appear below buttons with fade-in animation
- Streaming text uses cursor animation

## Error Handling
- If AI unavailable: show "AI unavailable — check API key" message
- Never block email reading if AI fails
