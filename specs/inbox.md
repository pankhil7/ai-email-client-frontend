# Spec: Unified Inbox

## Goal
Display emails from all connected accounts in a single sorted list.

## Behavior
- On load, fetch emails from all connected accounts via `GET /api/v1/emails`
- Sort all emails by date descending (newest first)
- Each email item shows: sender name, subject, preview text, date/time, provider color dot
- Unread emails shown with bold text and slightly highlighted background
- Clicking an email marks it as read and opens EmailDetail

## Account Filtering
- Default: show all accounts (unified inbox)
- Clicking an account in sidebar: filter to that account only
- "All Accounts" option to return to unified view

## Loading State
- Show shimmer skeleton rows while fetching
- Refresh button with spin animation while loading

## Empty States
- No emails: show icon + "No emails" message
- No accounts connected: show "Add an account to get started"
