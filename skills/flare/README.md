# flare: a Paperclip skill for Flare

This is the skill the exposure analyst (Filch) uses in the video. It gives an agent read-only access to your [Flare](https://ntck.co/flare) feed and turns it into plain counts: infected devices carrying your logins, leaked credentials, look-alike domains, ransomware mentions. It never prints an email address, password, cookie or stealer-log file name.

- `SKILL.md`: what the agent reads. The rules it follows and the report shape it files.
- `scripts/flare.ts`: the script it runs. No dependencies; runs on the Node.js 24 that Paperclip already needs.

**Install it:** [Chapter 9](../../guide/09-plug-in-flare.md) of the guide. It has to be imported from a local folder (Paperclip refuses skills with scripts from GitHub), and the import must point at the folder that *contains* `flare/`.

**Needs:** a Flare API key (Flare app → Profile → API Keys) in `FLARE_API_KEY`, and optionally your tenant id (Profile → Tenants) in `FLARE_TENANT_ID`, both bound to the agent as secrets.

**Try it by hand** (from this folder):

```bash
read -rs FLARE_API_KEY && export FLARE_API_KEY
node scripts/flare.ts check
node scripts/flare.ts summary --days 7
```

It authenticates the way [Flare's API docs](https://api.docs.flare.io/concepts/authentication) describe: the API key is traded for a one-hour token on every run. If Flare changes its response format and a command misbehaves, `check` still tells you whether your key works. Issues and fixes welcome.
