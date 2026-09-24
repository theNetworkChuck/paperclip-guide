# Routine: the daily agent standup

This is how the agents in the video hold a standup every day at 5 PM. It's a routine assigned to the CEO. The CEO turns it into one task, gives every agent a sub-task to write their brief, collects them, lets the agents ask each other questions, and posts one digest you can read in two minutes.

**Routines → Create routine.**

- **Title:** `Daily Standup`
- **Responsible:** your CEO
- **Trigger:** Schedule, every day at 17:00 (your timezone)
- **Advanced:** if a standup is still running, don't start another (coalesce / skip if active); skip missed runs

**Instructions** (edit the roster; everything else works as-is):

```
# Daily Standup: facilitator protocol

You are the CEO, facilitating today's written standup. This task IS today's standup. Work the steps in order.

Agents write on their OWN sub-tasks, never on this one. You collect and relay.

## Roster (edit this list to change who attends)
- Ron
- Fred
- George
- Mad-Eye Moody

## 0. Waiting on the team
Whenever you have to wait for sub-tasks to finish, set THIS task to `blocked` with the open sub-tasks as its blockers, in one update, and post a short checkpoint comment (which sub-tasks, which phase, how long). Paperclip wakes you when every blocker is done or cancelled. Never leave this task `blocked` without blockers: nothing will ever wake it.

## 1. Fan out
Create one sub-task per roster agent (parent = this task), assigned to that agent, titled `Standup brief: {Agent}`. Never assign one to yourself. The sub-task says:

> Post your standup brief as a COMMENT ON THIS SUB-TASK, then mark it done. No line cap: every real piece of work since your last brief gets its own line.
> Source it, don't recall it: check your runs and your tasks updated since yesterday's standup.
> **Did:** the work that mattered, in concrete terms: names, numbers, files, task ids. If nothing ran, say so.
> **Blocked:** anything stuck, what would unstick it, and who owns that.
> **Team should know:** anything a teammate would act on.
> **Lesson:** one thing you learned worth passing on.
> Save questions for your teammates for the second round.

## 2. Collect
When the briefs finish, copy each one onto THIS task as a `## Standup brief: {Agent}` comment.
A brief sub-task that isn't done 10 or more minutes after you created it is ABSENT: post `absent: {what you saw}` for that agent, cancel the sub-task, and keep going. A missing agent never stops the standup. Never write a brief for someone.

## 3. Second pass: team Q&A
Create one sub-task per agent who posted a brief, titled `Standup Q&A: {Agent}`. In it, paste every OTHER agent's brief verbatim, then ask:

> You've read your teammates' briefs. Is there anything you need to ask one of them to do your job better? Their work touching yours, something you were about to duplicate, something you're waiting on without knowing it.
> Comment `Question for {Agent}: ...` (up to 2, each with a half-line of why), or `No questions.` Zero questions is a normal, good answer. Never invent one.

Same 10-minute absence rule: an unanswered Q&A sub-task counts as `No questions`.

## 4. Gate and route
You are the gate, not a relay:
- ROUTE a question when a teammate can answer it and the answer would change what the asker does: one sub-task per question, assigned to the person asked, with the question and the asker's brief. They answer from their own work, and "I don't know" beats a guess.
- MERGE duplicates. DROP questions already answered in the briefs, with one line saying why.
- Questions for a human go in the digest for the board.
- One round per day. Answers don't spawn new questions today.

## 5. Digest
Post ONE comment on this task: `Daily Digest: {date}` with three sections:
1. **What each agent did:** a short, concrete paragraph per agent (what they did, with names, numbers and task ids). Quiet agent: one line. Absent agent: one line with the reason.
2. **Cross-team:** 2 to 6 bullets: things that cross between agents, blockers that need the board, questions routed and to whom. Nothing crossed? Say so in one line.
3. **Q&A:** one line per question: who asked whom, and the answer (or `dropped: why`, or `for the board: question`, or `pending, carried to tomorrow`).

## 6. Close
Mark this task done. Honest reporting only: a thin true digest beats a rich made-up one.
```

## Why it's built this way

- **Sub-tasks, not a group chat.** Each agent writes on its own sub-task, so every brief is traceable and the CEO relays. (On the version we tested, agents couldn't comment on the parent standup task directly.)
- **Blocked with blockers is the wait.** If the CEO ends a run while the task is `in_progress` with nothing queued, Paperclip nags it for a disposition and can park it `blocked` with no blockers, where nothing ever wakes it. That's how several early standups died with every brief finished.
- **The absence rule.** One slow or broken agent used to stop the whole standup. Now it's recorded as absent and the rest carry on.
- **The Q&A round is the good part.** In the video, one agent asked another whether footage was being backed up before recordings expired. That's a question no one would have asked in a status report.
