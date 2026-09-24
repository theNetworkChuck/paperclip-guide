# 2. Install Paperclip

**What you'll do:** get Node.js 24+ in place, install the Paperclip CLI, and bring your instance up for the first time.

## Step 1: Check your shell for a leftover database variable

> [!WARNING]
> Before you touch the installer, check whether your shell already has a database connection string sitting in its environment. Paperclip's onboarding wizard silently adopts a `DATABASE_URL` (or a similar Postgres or Supabase variable) if it finds one already exported, and points your new Paperclip instance at that database instead of its own. Run this first:
>
> ```bash
> env | grep -iE 'database_url|postgres|supabase'
> ```
>
> If anything shows up that you didn't set up on purpose for Paperclip, `unset` it in this terminal before continuing:
>
> ```bash
> unset DATABASE_URL SUPABASE_URL SUPABASE_DB_URL POSTGRES_URL
> ```

## Step 2: Install Node.js 24.11 or newer

Pick your platform.

**Linux or WSL2 (Ubuntu/Debian):**

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x -o /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
sudo apt-get install -y nodejs
node -v
```

You should see `v24.x.x`.

**Mac:** either install the Node.js 24 LTS package from [nodejs.org](https://nodejs.org), or:

```bash
brew install node
node -v
```

Either way, confirm the version printed is `24.11.0` or higher.

## Step 3: Download and run the installer

The install path differs on Mac versus Linux/WSL2, because of a bug in the installer's default shell on stock macOS. Pick yours.

**Linux or WSL2, the video's two commands:**

```bash
curl -fsSLO https://paperclip.ing/install.sh
curl -fsSLO https://paperclip.ing/install.sh.sha256
sha256sum -c install.sh.sha256
```

You should see `install.sh: OK`. Then run it, in a real terminal, not piped through another command:

```bash
bash install.sh
```

> [!WARNING]
> Don't run this as `curl ... | bash`. On 2026.916.1, a non-interactive run passes a flag the CLI no longer accepts, and installs nothing. Download it first, then run it directly, as shown above.

It'll ask once whether to add `~/.local/bin` to your `PATH`. Say **Yes**. Then:

```bash
source ~/.bashrc
```

> [!NOTE]
> `install.sh` may chain straight into the onboarding wizard once it finishes installing. If that happens, you're already at Step 4 below, just follow along.

**Mac:**

```bash
npx -y paperclipai@latest install
```

> [!NOTE]
> `bash install.sh` fails on the bash Apple ships by default (version 3.2), with `install.sh: line 57: ${value,,}: bad substitution`. The install script's real work is this one `npx` command anyway, so Mac users can just run it directly and skip the shell script entirely.

Say **Yes** to the PATH prompt, then:

```bash
source ~/.zshrc
```

Either way, confirm it worked:

```bash
paperclipai --version
```

## Step 4: Onboard, Quickstart or Advanced

```bash
paperclipai onboard
```

The first screen asks: **Quickstart** or **Advanced setup**.

- **Quickstart** is for playing on your own machine. Local only, no login, at `http://localhost:3100`. This is what most people want. `paperclipai onboard --yes` does the same thing without the questions and starts the server right away.
- **Advanced setup** is for a server you'll reach from other machines. That's the video's path, since it runs on a VM.

> [!WARNING]
> In Advanced setup, the grey text in each box is a placeholder, not a default. Pressing Enter on an empty box fails with errors like "Backup directory is required" or "Interval must be a positive integer". Type the value you see.

Answer the Advanced screens like this (walked end to end on 2026.916.1):

| # | Screen | Answer |
|---|---|---|
| 1 | Choose setup path | **Advanced setup** |
| 2 | Database mode | Embedded PostgreSQL |
| 3 | Embedded PostgreSQL data directory | type the path shown |
| 4 | Embedded PostgreSQL port | `54329` |
| 5 | Enable automatic database backups? | Yes |
| 6 | Backup directory | type the path shown |
| 7 | Backup interval (minutes) | `60` |
| 8 | Backup retention (days) | `30` |
| 9 | Configure an LLM provider now? | **No** (your agents sign in later) |
| 10 | Logging mode | File-based logging |
| 11 | Log directory | type the path shown |
| 12 | Reachability | **Private network** |
| 13 | Server port | `3100` |
| 14 | Allowed private hostnames | your server's IP, for example `192.168.1.50` (the grey text there is only an example) |
| 15 | Storage provider | Local disk |
| 16 | Local storage base directory | type the path shown |
| 17 | Install Paperclip as a background service? | Yes (keeps it running, see Step 5) |
| 18 | Start Paperclip now? | Yes |

It saves a summary that ends with `Server: authenticated/private @ lan (0.0.0.0):3100`. That's what Private network means: login required, listening on every network interface of the server instead of only on itself.

> [!TIP]
> Want the same result without the eighteen screens? The docs' shortcut is `paperclipai onboard --yes --bind lan`, Quickstart defaults with network reachability. It saves and starts the server right away in that terminal. Then add your server's IP with `paperclipai allowed-hostname` (Step 6).

## Step 5: Keep it running

If you said Yes at screen 17, Paperclip is already installed as a service. If not, or if you used Quickstart:

```bash
paperclipai service install
paperclipai service status
```

On a Linux VM you only reach over SSH, make sure it survives logging out: answer **Yes** if it asks about running without an active login session, or run `paperclipai service install --enable-linger`. Useful companions: `paperclipai service restart` and `paperclipai service logs --follow`.

> [!NOTE]
> Windows, WSL1, and containers without systemd don't support the service. Run `paperclipai run` in a terminal instead, and keep that terminal open. On a Mac the service is a launchd agent; on Linux it's a systemd user service.

## Step 6: Open the UI

Quickstart: `http://localhost:3100`. Advanced: `http://<server-ip>:3100`, or whatever domain you pointed at it.

If the browser says the hostname isn't allowed, add it and restart (the setting only takes effect after a restart):

```bash
paperclipai allowed-hostname <server-ip>
paperclipai service restart
```

## Step 7: Claim the instance (Private network only)

Quickstart needs none of this; it has no login. On a Private network install, someone has to become the first admin.

Open your Paperclip URL in a browser, create an account, and click **Claim this instance**. This browser claim is new since the video was filmed.

> [!NOTE]
> The terminal way still works, and it's what the wizard itself suggests at the end:
> ```bash
> paperclipai auth bootstrap-ceo
> ```
> It prints a one-time invite URL that says `localhost`. Swap in your server's IP before opening it.

## If something goes wrong

| You see | Do |
|---|---|
| `install.sh: line 57: ${value,,}: bad substitution` | You're on a Mac running stock bash. Use the `npx -y paperclipai@latest install` path instead (Step 3). |
| `error: unknown option '--no-prompt'` | You piped `install.sh` into bash, or ran it non-interactively. Download it and run `bash install.sh` directly, in a real terminal. |
| Onboarding used a database you didn't expect | You skipped Step 1. Stop the server, `unset` the stray variable, and re-run `paperclipai onboard`. |
| Browser says the hostname isn't allowed | Run the two commands in Step 6, then reload. |
| `paperclipai --version` still says `command not found` | Your PATH update didn't take. Run `source ~/.bashrc` (Linux/WSL2) or `source ~/.zshrc` (Mac) again, or open a new terminal. |

[← Previous](01-pick-a-machine.md) · [Guide home](../README.md) · [Next →](03-first-company-and-ceo.md)
