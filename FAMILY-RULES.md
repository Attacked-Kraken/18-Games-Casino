# FAMILY RULES — every Game Development title (owner's law, 2026-10-15)

Game Development titles (sports.html and anything new) are upgraded here and then moved into the
**Apex Arcade**, a family arcade with kids as young as 4. The Apex Arcade reviewer checks every game
before it goes live, and anything that breaks these rules is sent back. Build it right the first time.

These rules are on top of ASSET-LAW.md, STORE-READY.md and CLAIMS.md. The sealed casino behind the
entrance is the only place gambling content exists; none of it may leak into a Game Development title.

## Never in a Game Development title

1. **No casino or gambling anything.** No casino, gamble, bet, wager, odds, jackpot, slots, roulette,
   blackjack, poker chips, payouts, "cash out", house edge, loot boxes or paid spins, in words, art or
   features. Rewards are coins, tickets or prizes that can't be bought or cashed out.
2. **No real money.** No prices, no buying coins, no payment screens. (The arcade handles its own plan.)
3. **No real brands, people or licensed characters.** No real teams, leagues, players, coaches,
   nicknames of real players, celebrities, car makers, car models, gun models, sponsors or famous
   characters, and nothing made to look like them (logos, liveries, uniforms, faces). Original names
   and art only. Apex Arcade is the only sponsor.
4. **No personal info.** Never ask for a real name, email, phone, address, birthday, location, camera,
   microphone or photos. A name box says **"Player nickname"**.
5. **No chat** and no way to send free text to other players.
6. **No ads, no analytics, no tracking.**
7. **No internet** (also in STORE-READY): no CDNs, no outside links, no outside servers or APIs.
8. **No passwords, keys or tokens** in any file, ever.
9. **Nothing above the game's age.** 4+ and 9+ games: no blood, gore, horror, swearing, crude jokes,
   alcohol, tobacco or drugs, and no realistic violence against people. 13+ games may have action and
   fighting, still no blood or gore. If you're not sure of a game's age, treat it as 4+.

## Always

1. **Keep saves working.** Never rename or remove a save name (localStorage key) a game already uses,
   or players lose their progress. Add new keys if you need them.
2. **Keep the arcade hooks** if a game has them: `ArcadeShell.init`, `ArcadeShell.frame`,
   `ArcadeShell.submit(game, score, level)`, and the Back button.
3. **Keep the game's file name and icon file name** so it can be matched to its arcade version.
4. **Phone first:** works upright and sideways with touch (see STORE-READY).
5. **Say what changed** in plain words in your pull request: what's new, how to see it, anything
   you weren't sure about.

## Working safely with other helpers

1. Read CLAIMS.md and claim the game before you start. One helper per game.
2. Work on your own branch and open a pull request. Never push straight to main.
3. Pull the latest main before you push. Never force-push, never undo or overwrite someone else's work.
4. Only change your own game's files. Shared files (`three.module.min.js`, `characters/`, shared
   `.js`) only with a clear reason written in your pull request.
5. Don't delete anything you didn't make unless the owner asks.
6. **Apex Arcade code never goes in this repo.** Don't copy files from the arcade or from other
   private repos here.

## Handing a game to the Apex Arcade

When a game is finished and merged, tell the owner which game and what changed. The Apex Arcade
reviewer pulls it from this repo, checks it against these rules, fixes what's needed, tests it on a
phone screen and moves it in. Nothing in this repo goes live in the arcade by itself.
