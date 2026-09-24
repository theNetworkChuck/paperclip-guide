---
name: flare
description: Check Flare (flare.io) for what has leaked about this company: infected devices carrying our logins, leaked credentials, look-alike domains, ransomware mentions. Use when asked what is out there about us, what Flare found, what is new in Flare, to check exposure, or to turn Flare findings into tickets. Never prints credentials.
---

# Flare exposure check

Flare is an identity threat intelligence platform. It watches stealer logs, Telegram, dark web forums and breach dumps and matches them against your identifiers (your domains and your people's emails). This skill reads that feed and turns it into plain counts you can act on.

## What you need (already in your environment when this skill is attached properly)

- `FLARE_API_KEY`: a Flare API key (Flare app → Profile → API Keys). It is bound to a Paperclip secret and arrives in your environment when you run. **Never print it, never write it into a ticket, comment, or file.**
- `FLARE_TENANT_ID`: the numeric Flare tenant id (Flare app → Profile → Tenants). Optional; without it the key's default tenant is used.

API tokens last one hour; the script mints a fresh one on every run, so you never handle tokens. If a run says the key was refused, report that in one line and stop.

## How to run

Run these from inside the skill's folder (the one holding this SKILL.md). All commands print plain text. Add `--json` for machine-readable output. The script has no dependencies and runs directly on the Node.js 24 that Paperclip already needs.

```bash
node scripts/flare.ts check                      # proves the key works
node scripts/flare.ts identifiers                # what is plugged in, with all-time event counts
node scripts/flare.ts summary --days 7           # open events from the last N days by type, severity, identifier
node scripts/flare.ts summary --days 7 --type stealer_log
node scripts/flare.ts new --since 24h            # what matched in the last 24 hours (or 3d, or an ISO date)
node scripts/flare.ts event <uid>                # one event, safe fields only
node scripts/flare.ts lookalikes                 # look-alike domains seen, one line per domain
```

`summary` and `new` page through the feed ten events at a time and stop at `--max-pages` (default 50, so 500 events). When the cap is hit the output says **"at least"**. For all-time totals use `identifiers`; the per-domain event count there is the real number.

## Event types you will see

- `stealer_log`, `bot`: **infected device**. One machine with infostealer malware whose stolen-password dump includes a login for one of our domains. The identifier tells you which domain (for example `app.example.com` means a customer's login to that app). These are sold on stealer-log markets and Telegram.
- `leak`, `leaked_credential`: **leaked credential**. An email/password pair for one of our domains or people in a breach dump or combolist.
- `chat_message`: a Telegram message that matched us; usually a stealer-log bot posting cookie files that include our session cookies.
- `domain`, `domain_screenshot`, `domain_title`, `domain_favicon`: **look-alike domain** activity.
- `ransomleak`: a ransomware group's post mentioning one of our identifiers.

## Your standing rules

1. **Counts, domains, sources, dates and the fix. Never an email address, never a password, never a cookie, never a file name from a stealer log.** The script already hides them; do not go around it.
2. Every report answers four questions: how many, on which of our domains, from where, how old. Then what to do about it.
3. What to do about it, by type:
   - Infected devices with our logins → a ticket to the engineer who owns that system: force a password reset and revoke active sessions for the affected accounts. Say how many accounts, not who.
   - Leaked credentials on our own domain → same: reset and revoke, plus turn on MFA where it is missing.
   - Look-alike domain → a ticket to the security reviewer: is it phishing us or innocent? Include the domain name; that is public.
   - Ransomware mention → escalate to the CEO the same hour.
4. If `check` fails, say exactly that and stop. Do not guess numbers.
5. A quiet night is a quiet night. If `new` returns nothing, report nothing new in one line.

## Report shape (paste into the ticket)

```
Flare exposure report: <date>
Infected devices with our logins: <N> (<domain>: <n>, <domain>: <n>), sources: <...>, newest <date>, oldest <date>
Leaked credentials on our domains: <N>, sources: <...>
Look-alike domains: <domain>, <domain>
Ransomware mentions: <N>
Action: <one line per ticket you filed, with the ticket id>
```
