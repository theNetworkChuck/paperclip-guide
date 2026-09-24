# 11. Troubleshooting

Every problem this guide's steps can produce, in one place, grouped by the stage you hit it.

## Install and first run

| You see | Do |
|---|---|
| `install.sh: line 57: ${value,,}: bad substitution` on a Mac | Apple ships Bash 3.2 as `/bin/bash` by default; that syntax needs Bash 4+. Run `npx -y paperclipai@latest install` directly instead, or install a newer bash first and invoke the script with that. |
| Piping `install.sh` into `bash` (or any non-interactive run) seems to install nothing | It auto-detects the missing terminal and passes `--no-prompt` to the real installer, which doesn't accept that flag, so the install silently fails at the last step. Run it in a real interactive terminal. |
| `node --version` is under 24.11.0 | A managed install refuses to run on an older Node. An npx run or a foreground server on Node 22-23 only warns and keeps going, a warning is not support. Update Node first. |
| Onboarding says "Environment-aware defaults active" and you didn't expect that | It silently picked up something like `DATABASE_URL` from your shell. Run `env \| grep -iE 'database_url\|postgres\|supabase'` before `paperclipai onboard`, and `unset` anything that shows up. |
| A hostname gets rejected in authenticated/private mode | `paperclipai allowed-hostname <host>`, then `paperclipai service restart` (or stop and re-run `paperclipai run`). Changes only take effect after a restart. |

## Onboarding and connecting a model

| You see | Do |
|---|---|
| The CEO's first run fails: "ACP agent reported a terminal access failure." | Claude Code isn't installed, or isn't signed in, on the Paperclip machine itself. |
| Claude or Codex sign-in looks different than the video | On 2026.916 each agent's **Harness / Runtime** tab shows how it signs in: "Existing authentication" (the CLI login already on the Paperclip machine, which is what the video uses) or **Choose a managed connection**. Managed connections are created on the **Connectors** page (Anthropic, OpenAI and so on) with an API key or a subscription; the agent's tab picks one. |

## Hiring and approvals

| You see | Do |
|---|---|
| `409: Direct agent creation requires board approval` | Expected once the approval wall is on (Chapter 5). Go to Approvals and approve the hire, or file a hire ticket to the CEO instead of creating the agent directly. |
| An agent's hire sits in Pending forever | Someone needs to open Approvals and Approve, Reject, or Request Revision it. |

## Codex and Pi agents

| You see | Do |
|---|---|
| A Codex agent fails to sign in or run | Confirm `codex` is installed and signed in on the Paperclip machine, not your own laptop (`codex login`, or `codex login --with-api-key` on a server with no browser). |
| A Pi agent fails with `Command not found in PATH: "pi"` | Install `@earendil-works/pi-coding-agent` on the Paperclip machine. |
| A Pi agent never reaches your local model | Check Ollama answers (`curl http://localhost:11434/v1/models`), then recheck `~/.pi/agent/models.json` on the Paperclip machine (or the agent's `PAPERCLIP_PI_PROVIDERS` variable on its Harness / Runtime tab, if you set one). |
| A newly hired agent fails on its very first run with a sandbox-related error | The trust preset gotcha (Chapter 5): the agent → **Permissions / Trust** → Trust preset → **Standard**. |

## Tasks, Cases, and Decisions

| You see | Do |
|---|---|
| A task sits `blocked` and never wakes back up | A free-text "blocked by X" comment does nothing. Set the `blockedByIssueIds` field explicitly. |
| You can't find Cases or Decisions anywhere | Both are experimental and off by default on 916.1. The account menu (**Board**) → **Settings** → **Experimental**. |
| You can't find "Task Watchdogs" in Experimental settings | That flag doesn't exist on 916.1. Open any task's Properties panel and set a Watchdog directly (Chapter 7). |
| A watchdog never fires | It only wakes once every leaf in the watched subtree has stopped with nothing else queued. |
| You can't find a report an agent made | Check Artifacts, not the task's comments. |

## Routines

| You see | Do |
|---|---|
| A routine fires at the wrong time | Schedule triggers save the timezone from your browser at creation time. Re-save the trigger from the timezone you actually want. |
| Runs stack up while you're testing "Run now" | Set concurrency policy to `skip_if_active` or leave it at `coalesce_if_active`, not `always_enqueue`. |
| A multi-agent routine (like the daily standup) dies with every sub-task finished but the parent never closes | The facilitator agent left the parent `in_progress` with nothing queued, instead of `blocked` with blockers listed. Nothing will ever wake a `blocked` task with no blockers. |
| A missed nightly run never caught up after downtime | Default catch-up policy is `skip_missed`. Use `enqueue_missed_with_cap` if you want it to catch up instead. |

## Flare and secrets

| You see | Do |
|---|---|
| Filch reports the Flare key was refused | API tokens expire hourly and the skill mints a fresh one every run. A refusal means the key value itself is wrong, not stale. |
| A ticket shows a raw email, password, or file name | That's not the shipped flare skill running. The real one hides those fields at the source. |
| Filch asks for `FLARE_TENANT_ID` in Decisions | Expected if you only created `FLARE_API_KEY`. Create the second secret and bind it the same way. |
| The skill import only shows `SKILL.md`, no script | You imported from the skill's own folder. Point the import source at its parent folder instead. |
| Import fails with "outside approved company workspace roots" | Local skill imports only work from inside a Paperclip-managed folder. Copy the skill folder into your company's managed-skills directory first, then import from there. |
| A GitHub-sourced skill with a script gets rejected outright | Only a local-path import can carry executable scripts; a GitHub source can't, full stop. |

## Remote Hermes agents

| You see | Do |
|---|---|
| A Hermes join is refused for a remote gateway over plain HTTP | Use HTTPS or a private overlay network such as Tailscale, or (private LAN only) put `"dangerouslyAllowInsecureRemoteHttp": true` inside `agentDefaultsPayload` of the join request (Chapter 4, Step 5). |
| A Hermes agent runs fine but never reports back to Paperclip | Check the four `PAPERCLIP_*` lines in `~/.hermes/.env` on that agent's own box, then restart its gateway. |
| `paperclipai agent delete <id>` returns a 500 | Happens for an agent that joined through an invite request. Use `paperclipai agent terminate <id>` instead, it works and marks the agent terminated. |

## Export and import

| You see | Do |
|---|---|
| Import fails with `422: Secret must belong to same company` | An agent in the export has a secret bound to its environment. Remove those rows before exporting, then re-create and re-bind the secrets after import (Chapter 10). |
| Import stops with "requires --yes" | You ran it non-interactively. Preview with `--dry-run`, then re-run with `--yes`. |
| Every bundled skill in the new company got a `-2` suffix | The default collision strategy renames instead of skipping. Re-import with `--collision skip`. |
| Approvals, cost history, or activity are missing after import | Expected. Those never travel with an export, by design. |

[← Previous](10-export-your-company.md) · [Guide home](../README.md) · [Next →](../README.md)
