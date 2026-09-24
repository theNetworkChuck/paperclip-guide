# 7. Approvals and watchdogs

Two different guardrails: who gets to become an agent, and who double-checks that a "done" task is actually done.

## 1. The hiring approval wall, recapped

Chapter 5 already covered this: **Bottom-left "Board" menu → Settings → General → HIRING → "Require board approval for new hires,"** every hire lands on **Approvals** instead of going live. If you skipped it, go turn it on now, everything else in this chapter assumes it's already on.

## 2. Add reviewers and approvers to a task

Beyond who's assigned, a task can carry collaborators who never do the work but weigh in on it. Open a task → **Properties** panel → **EXECUTION** section: **Reviewers**, **Approvers**, **Monitor**, and **Watchdog** all live there together.

In the video, this is the shape of the Security Reviewer's whole job (Chapter 5): every proposed machine change gets reviewed before it runs, approve it or send it back.

## 3. Hire a Watchdog

A watchdog is a separate agent whose only job is to independently re-check a claim, not fix anything.

```
Hire a Watchdog. Run them on Pi with my local model, ollama/qwen2.5-coder:7b, same as the scanner. Their job: verify. When a task they're attached to stops (marked done, or blocked), they independently re-check the claim: re-scan the target, re-read the file, re-run the test. If it doesn't hold, they send it back with exactly what they found. They never fix anything themselves. Submit it as a hire request and tell me when it's waiting for my approval.
```

(Full copy: [`prompts/hire/watchdog.md`](../prompts/hire/watchdog.md).) Approve it the same way as any other hire (Chapter 5, step 4).

## 4. Attach the watchdog to a task

Open the task → **Properties** panel → **EXECUTION → Watchdog** → pick the agent, and optionally give it instructions.

Or through the API (verified on a 2026.916.1 Quickstart install, where it works as-is from the Paperclip machine); on a server in Private network mode, add `-H "Authorization: Bearer <board-token>"` using a token from `paperclipai token board create --company-id <company-id> --name watchdog --ttl-days 1`:

```bash
curl -X PUT "http://localhost:3100/api/issues/<issue-id>/watchdog" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"<watchdog-agent-id>","instructions":"Re-check the claim before accepting the stop."}'
```

**What you should see:** the task's Properties panel now shows a Watchdog row with that agent's name.

## 5. What actually makes it fire

A watchdog doesn't watch continuously. It wakes only once **every leaf task in the watched subtree has stopped** (done, blocked, or waiting on something) with no live path forward. It then reads the evidence on the task, and either accepts the stop or puts work back in motion by reopening or reassigning it. It fingerprints the stopped state, so it reviews each distinct outcome once, not on every idle scan.

> [!NOTE]
> On 2026.831.1 (the video), Task Watchdogs lived behind a toggle in Settings → Experimental. On 2026.916.1 that toggle is gone entirely. A watchdog is just a property you set on any task, step 4 above, no flag to flip first.

## 6. One watchdog per task, and how to remove one

A task can only carry one watchdog at a time; re-assigning it resets its memory of what it already checked. To remove one, use the same Properties row, or:

```bash
curl -X DELETE "http://localhost:3100/api/issues/<issue-id>/watchdog"
```

(Same rule: add the `Authorization: Bearer <board-token>` header on a Private network install.)

This soft-disables it. History stays for audit, but it stops reviewing that task.

## If something goes wrong

| You see | Do |
|---|---|
| You can't find "Task Watchdogs" in Experimental settings | It's not a flag anymore on 916.1. Open any task's Properties panel and set a Watchdog directly. |
| A watchdog never fires | It only wakes once every leaf in the watched subtree has stopped with nothing else queued. A task still `in_progress` somewhere won't trigger it. |
| You reassigned the watchdog and it re-reviewed everything from scratch | Expected. Reassigning a watchdog resets its memory of what it already checked. |
| An agent's hire never leaves Pending | That's the approval wall from Chapter 5, not a watchdog. Go to Approvals. |

[← Previous](06-give-them-work.md) · [Guide home](../README.md) · [Next →](08-routines-and-standups.md)
