# Spec: Compose / Reply / Forward

## Goal
Allow users to write and send emails from any connected account.

## Compose Modal
- Triggered by: "Compose" button in sidebar
- Appears as: bottom-right floating panel (Gmail-style)
- Can be minimized to a tab at the bottom
- Can be closed (discard)

## Fields
- From: dropdown of connected accounts
- To: text input (email address)
- Cc: hidden by default, shown via "Cc" toggle button
- Subject: text input
- Body: textarea (supports plain text, HTML via reply/forward)

## Reply
- Pre-fills: To (original sender), Subject (Re: ...), Body (original quoted)
- Account: same account the email was received on

## Forward
- Pre-fills: Subject (Fwd: ...), Body (original quoted)
- User fills in To field

## Use AI Draft
- Opens compose modal with AI-generated draft pre-filled in body
- User can edit before sending

## Send
- Calls `POST /api/v1/emails/send`
- Shows "Sending..." state on button
- On success: closes modal
- On error: shows error message, keeps modal open
