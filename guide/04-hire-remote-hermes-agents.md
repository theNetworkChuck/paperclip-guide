# 4. Hire Remote Hermes Agents

**What you'll do:** bring an already-running Hermes agent on another machine into your company, and give it its first real task.

This chapter assumes you already have Hermes installed and running somewhere, on its own machine (a VM, a homelab box, whatever you've got). If you haven't set Hermes up yet, [this video](https://www.youtube.com/watch?v=QQEgIo4Juxg) walks through installing it. Everything below picks up from there.

Two machines in the examples: Paperclip at `192.168.1.50`, and the Hermes agent at `192.168.1.60`. Swap in your real addresses.

## Step 1: Turn on Hermes's API server

By default, a stock Hermes install has its API server switched off. Paperclip talks to Hermes through this server, so it has to be on. On the Hermes machine, generate a random key:

```bash
openssl rand -hex 32
```

Then add these lines to `~/.hermes/.env` on that machine, using the key you just generated:

```
API_SERVER_ENABLED=true
API_SERVER_KEY=<the-random-string-you-just-generated>
API_SERVER_HOST=0.0.0.0
API_SERVER_PORT=8642
```

> [!NOTE]
> `API_SERVER_HOST` defaults to `127.0.0.1`, which only listens locally. Setting it to `0.0.0.0` is what lets Paperclip, on a different machine, reach it at all.

## Step 2: Restart the gateway

```bash
hermes gateway restart
```

If that doesn't pick up the new settings, force it:

```bash
hermes gateway run --replace --accept-hooks
```

If you run Hermes as a background service (systemd, launchd, or similar), restart that service instead. Confirm it's listening:

```bash
ss -ltnp | grep 8642                       # Linux
lsof -nP -iTCP:8642 -sTCP:LISTEN            # Mac
```

## Step 3: Generate the onboarding prompt in Paperclip

Back in Paperclip: **Agents → New Agent → Invite an external agent**. The panel explains itself: "Generate a one-time onboarding prompt for an external agent. An organization admin must approve its join request before it can claim an API key."

In **Optional message for the agent**, tell it the two things it can't guess (the second line is explained in Step 5):

```
Your gateway URL is http://192.168.1.60:8642. We're on a private home network, so put "dangerouslyAllowInsecureRemoteHttp": true inside agentDefaultsPayload in your join request.
```

Click **Generate onboarding prompt**. It copies a whole onboarding letter to your clipboard. One invite per agent: they're single-use.

CLI equivalent:

```bash
paperclipai invite create --company-id <company-id> --payload-json '{"requestType":"agent"}'
paperclipai invite onboarding:text <token>
```

## Step 4: Paste the prompt into the Hermes agent's chat

Paste the whole letter into a chat with your Hermes agent. It reads the letter itself and submits its own join request, something shaped like this:

```json
{
  "requestType": "agent",
  "agentName": "My Hermes Gateway Agent",
  "adapterType": "hermes_gateway",
  "capabilities": "Hermes gateway agent",
  "agentDefaultsPayload": {
    "apiBaseUrl": "http://192.168.1.60:8642",
    "apiKey": "<same-value-as-API_SERVER_KEY>",
    "paperclipApiUrl": "http://192.168.1.50:3100",
    "dangerouslyAllowInsecureRemoteHttp": true
  }
}
```

You don't type this yourself. The agent builds it from the letter, but it's worth knowing what it's actually sending.

## Step 5: The plain-HTTP rule

If your Hermes agent is on a different machine than Paperclip, which it is here, plain HTTP between them is refused by default:

```
agentDefaultsPayload.apiBaseUrl uses remote plain HTTP; use HTTPS or set
dangerouslyAllowInsecureRemoteHttp=true for unsafe local development
```

For a home lab on your own private network, the second line of your optional message (Step 3) handles it: `"dangerouslyAllowInsecureRemoteHttp": true` inside `agentDefaultsPayload` is Paperclip's documented switch for exactly this case (it's in the example above).

> [!WARNING]
> This is a private-LAN-only shortcut. For anything reachable outside your own network, use HTTPS (a reverse proxy with TLS) or a private overlay like Tailscale, not this flag. Loopback traffic, where the agent and Paperclip are on the same machine, never needs it either way.

## Step 6: Approve the hire

The join request lands as a hire approval, in your Approvals page and your Inbox. This is the "board approval" you turned on in the last chapter. Open it and approve it.

```bash
paperclipai join list --company-id <company-id> --status pending_approval
paperclipai join approve <request-id> --company-id <company-id>
```

## Step 7: The agent claims its key

Once approved, the Hermes agent claims its one-time Paperclip API key. The letter tells it how, using `join claim-key`, or the claim endpoint directly, and it stores the result as `PAPERCLIP_API_KEY`.

## Step 8: The step people actually miss

> [!WARNING]
> Claiming the key isn't enough by itself. Skip this step and the agent will do real work and report it to nobody, because it has no way to call back into Paperclip.

The running Hermes gateway only sees the key once these four lines are in `~/.hermes/.env` on the Hermes machine, and the gateway has been restarted:

```
PAPERCLIP_API_URL=http://192.168.1.50:3100
PAPERCLIP_API_KEY=<the key it just claimed>
PAPERCLIP_AGENT_ID=<this agent's id, returned with the claimed key>
PAPERCLIP_COMPANY_ID=<your company id>
```

```bash
hermes gateway restart
```

## Step 9: Three keys, never crossed

It's easy to mix these up. They're not interchangeable.

| Key | What it's for | Where it's set |
|---|---|---|
| Hermes's model-provider key (for example `OPENROUTER_API_KEY`) | Powers Hermes's own thinking | On Hermes |
| `API_SERVER_KEY`, the gateway key | Lets Paperclip call Hermes | Set on Hermes, used by Paperclip |
| `PAPERCLIP_API_KEY`, claimed after approval | Lets Hermes call Paperclip | Set on Hermes, used to call Paperclip |

## Step 10: The first test task

Create a task assigned to your CEO:

```
Talk to Ron, our CTO, and make sure he can take work. Give him a small test task (have him report his hostname and what tools he has), wait for his answer, and tell me on this ticket whether he's good to go.
```

You don't need to do anything after assigning it, assignment wakes the agent by itself. Your CEO creates a small task for the Hermes agent, waits for its answer, and reports back on your original ticket once it's confirmed working. This is the first time you'll watch two agents actually talk to each other, instead of just you talking to one of them.

## Step 11: Bring in the rest of your Hermes agents

In the video, Ron is the first hire and then Fred (network engineer) and George (storage engineer) join the same way. For each extra Hermes agent, repeat Steps 1 to 8 on its own machine with a **new** invite (they're single-use).

Then set the reporting line, so the org chart matches the video (Fred and George report to Ron): open the agent → **Harness / Runtime** → **Reports to** → pick Ron → **Save changes**.

## If something goes wrong

| You see | Do |
|---|---|
| `agentDefaultsPayload.apiBaseUrl uses remote plain HTTP...` | Put `"dangerouslyAllowInsecureRemoteHttp": true` inside `agentDefaultsPayload` of the join request (Step 5, private LAN only), or switch to HTTPS or an overlay network. |
| The Hermes agent seems to finish work but never reports back | You skipped Step 8. Check `~/.hermes/.env` for all four `PAPERCLIP_*` lines and restart the gateway. |
| Nothing shows up under Approvals | Check the Hermes machine can reach Paperclip at all: `curl http://192.168.1.50:3100/api/health` from the Hermes machine should answer `"status":"ok"`. In Private network mode, the address it uses must be an allowed hostname (Chapter 2). |
| The join request never appears | Double check `API_SERVER_HOST=0.0.0.0` on the Hermes machine, not `127.0.0.1`. Paperclip can't reach a loopback-only server from another machine. |

[← Previous](03-first-company-and-ceo.md) · [Guide home](../README.md) · [Next →](05-build-the-team.md)
