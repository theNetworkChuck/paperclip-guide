# Routine: daily storage check

The routine from the video. **Routines → Create routine.**

- **Title:** `Check storage`
- **Responsible:** your storage engineer
- **Project:** none is fine
- **Trigger:** Schedule, every day at 10:00 (your timezone)

**Instructions:**

```
Every day: check the storage on [server name] and look for any health issues (failed or degraded disks, pools, full volumes). Report how much storage is left on each volume. If anything is low or unhealthy, create a decision for the board with what you found and what you recommend. If everything is fine, say so in one line.
```

Click **Run now** once to test it before you trust the schedule.
