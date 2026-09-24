# 1. Pick a Machine

**What you'll do:** decide where Paperclip is going to run, before you install anything.

## Step 1: Decide if you're playing or committing

Paperclip needs somewhere to live: it's a small server you run yourself, plus a CLI you use to talk to it. You have two honest options.

- **Play on the computer you already have.** Mac, Linux, or WSL2 on Windows. This is the fastest way to try Paperclip out, and it's enough for most people who just want to see what it does.
- **Commit it to its own machine.** A virtual machine (something like Proxmox) or a cloud VPS. This is what the video does, because the agents need to keep running even when your own laptop is closed.

> [!TIP]
> If you're not sure yet, play first. You can always move to a dedicated server later. Nothing you build is locked to the machine it started on.

## Step 2: Check your OS is supported

Paperclip installs on:

- **macOS**
- **Linux**
- **Windows, through WSL2 only.** There's no native Windows install. If you're on Windows, install WSL2 first and run every command in this guide from inside it, not PowerShell or cmd.

## Step 3: If you're playing, that machine is your Mac, Linux box, or WSL2 install

Nothing else to decide here. Open a terminal on that machine and move on to chapter 2.

## Step 4: If you're committing, spin up a server

A couple of reasonable choices:

- A VM on your own hypervisor, something like Proxmox.
- A small cloud VPS. Any provider that gives you a plain Ubuntu or Debian box works.

Either way, give it Ubuntu or Debian, note its IP address, and make sure you can SSH into it. The rest of this guide assumes a fresh Ubuntu-style VM for the "server" path, and your own Mac, Linux, or WSL2 shell for the "play" path.

## Step 5: Confirm Node.js 24.11 or newer

Paperclip's CLI needs **Node.js 24.11 or newer**. You don't have to install it in this chapter, chapter 2 walks through that, but it's worth checking now if you already have Node on this machine:

```bash
node -v
```

- If you see `v24.11.0` or higher, you're set.
- If you see anything older, or `command not found`, chapter 2 installs the right version for you.

> [!WARNING]
> Paperclip's own installer only checks for Node 20 or newer, and will happily install Node 22 if it doesn't find anything newer on your machine. Node 22 is not enough. The real floor is 24.11.0. Chapter 2 has you install Node 24 first, on purpose, so you never hit this gap.

## Step 6: Know what this costs

Paperclip itself is free and open source. What costs money is the AI behind your agents: your Claude, OpenAI, or other provider account. Paperclip's own docs set the expectation plainly: plan on spending **$5 to $20 to play with it**, and **$20 to $100 a month** for an actively working company.

## Step 7 (optional): Kick the tires with zero commitment

If you already have Node 24.11+ and a provider API key handy, you can try Paperclip without installing anything permanent or creating a real company. `test-drive` spins up a throwaway instance, wires up one CEO agent, and opens it in your browser. Nothing it makes sticks around unless you keep the folder it used.

```bash
export ANTHROPIC_API_KEY=<your-anthropic-api-key>
npx paperclipai test-drive
```

You should see Paperclip boot a local instance and open your browser to a working company with one CEO agent already talking to Claude.

Want a different harness instead?

```bash
export OPENAI_API_KEY=<your-openai-api-key>
npx paperclipai test-drive --harness codex
```

> [!NOTE]
> `test-drive` never installs a background service and never creates a real goal, project, task, or heartbeat. It's a look, not a commitment. When you're ready to build the real thing, chapter 2 starts the install for real.

## If something goes wrong

| You see | Do |
|---|---|
| `command not found: node` | You don't have Node yet. Skip ahead to chapter 2's Node install step, then come back. |
| `node -v` shows something below `v24.11.0` | Same fix: install Node 24+ in chapter 2 before running the Paperclip installer. |
| `test-drive` complains about a missing API key | Set the env var for your chosen harness first: `ANTHROPIC_API_KEY` for Claude, `OPENAI_API_KEY` for Codex, `OPENROUTER_API_KEY` for opencode. Then re-run the command. |
| You're on Windows without WSL2 | Install WSL2 first (Microsoft's own docs walk through this), then run every command in this guide from inside your WSL2 terminal. |

[← Previous](../README.md) · [Guide home](../README.md) · [Next →](02-install-paperclip.md)
