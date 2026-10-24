# PLAN B - the robot's own runner (NOT switched on)

Owner Oct 23 2026 6:40 PM: prepared, not turned on. It is new infrastructure; it starts only with the owner's OK.
Trigger: the board line "Robot setup failures: N of last 20 play runs" stays over 2% after Microsoft's Playwright image
(#1374, merged 6:44 PM) - the Mac sends one phone alert a day when that happens. An alert, never an action.

## What it is
A GitHub "self-hosted runner" = a small program on a machine the owner owns that picks up robot jobs instead of
GitHub's rented machines. No queue for a rented machine, no browser install (the browsers live on the disk).

## Which machine
The retired 2015 MacBook Pro (8 GB, 2 cores, idle since Oct 20). NOT the Mac mini (10 Muse windows + the local AI models).
- Expected time per game: 2-4x slower than a rented machine. A one-game PR check today takes 2-10 min there -> about
  5-25 min on the MacBook; Hockey (the slowest, 56 tests, now capped at 20 min of tests) about 25 min.
- So it takes ONLY single-game PR checks (one robot per game, one at a time). Full 11-game main runs stay on the rented
  machines.

## How it works when it is on
- The runner gets the label `apex-own`. Only the PR play job may ask for it, and only for one game:
  `runs-on: ${{ (guard says ok && one game) && 'apex-own' || 'ubuntu-24.04' }}`.
- Asleep / off / busy: a job is never left waiting for it. The plan step checks the runner is online and idle
  (GET /repos/.../actions/runners, status online + busy false) BEFORE choosing it; otherwise the job goes to a
  rented machine as today.

## SECURITY - all of these before it is switched on (the repo is public)
1. Only OUR branches: the plan step allows `apex-own` only when the PR's head repo is THIS repo
   (`github.event.pull_request.head.repo.full_name == github.repository`) AND the branch starts with
   `build/`, `test/`, `robot/` or `vp-`. A fork or a stranger's PR can never reach the machine:
   ```yaml
   OWN: ${{ github.event.pull_request.head.repo.full_name == github.repository &&
            (startsWith(github.head_ref, 'build/') || startsWith(github.head_ref, 'test/') ||
             startsWith(github.head_ref, 'robot/') || startsWith(github.head_ref, 'vp-')) }}
   ```
   and the play job re-checks the same thing as its first step and stops (`exit 1`) if it is false.
2. Repo setting "Require approval for all outside collaborators" stays ON (fork PR workflows wait for the owner).
3. A dedicated macOS user `apexrunner`, standard (not admin), no Apple ID, no keychain items, no SSH keys, no tokens,
   no PINs, nothing from the Mac mini. The runner registration token is used once and thrown away.
4. The runner runs as that user only, in "ephemeral" mode (`--ephemeral`): one job, then it is wiped and re-registered,
   so nothing one job leaves behind reaches the next.
5. Firewall: outgoing only (GitHub + npm); the machine's file sharing / screen sharing off.

## Owner switch from the phone
- ON / OFF = one repo variable `OWN_RUNNER` (`on` / `off`); the plan step only offers `apex-own` when it is `on`.
  The controller gets a button "🤖 Own robot runner: ON/OFF" that writes it (a commands/ order, like Pause).
- OFF = every job on rented machines at once; nothing to uninstall.

## Steps to set it up (when the owner says go)
1. On the MacBook: create user `apexrunner` (standard), log in as it.
2. Download GitHub's runner for macOS x64, `./config.sh --url https://github.com/Attacked-Kraken/18-Games-Casino
   --labels apex-own --ephemeral` (token from the repo's Settings > Actions > Runners > New runner).
3. `npx playwright@1.48.2 install chromium webkit` once (browsers on disk).
4. Start it as a launch agent (keeps itself running, restarts after sleep).
5. Turn `OWN_RUNNER` to `on`; watch 10 single-game checks; compare with the board line.
