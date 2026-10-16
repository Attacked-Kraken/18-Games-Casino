# 18 Games Casino

**Every helper: read AGENTS.md first** (it lists the laws: CLAIMS, FAMILY-RULES, ASSET-LAW, STORE-READY).

Two separate worlds live in this repo. Keep them separate.

**The casino** (index.html): the entrance hides a secret door. Behind it
are the hallways, the casino floor with its 19 games (Velvet 21 blackjack,
Steelfront, slots, roulette, poker and more - fun chips only), and the
vault. The casino is finished and sealed: do not add games to it.

**Game Development** (sports.html - "Apex Arcade Game Development"):
where every new game we build and upgrade lives. It is reached from the
red GAME DEVELOPMENT circle on the entrance and holds the sports titles:
27Hoops basketball, Apex Ice Hockey, Apex Baseball, Apex Soccer, Apex
Flight, Apex Monster Truck, Apex F1 and more as they ship.
**Every Game Development title is a full 3D game** (real-time 3D,
Three.js) - 3D players, 3D arenas, 3D worlds. New titles are built 3D
from the start; that is the standard for this library.

## Where new games go

New built games go on the Game Development page (sports.html) - NOT the
casino floor. Add the game's tab + ALL TITLES card to sports.html and point its
PLAY button at the game's .html. Never register a new game in
games.json, the lobby registry in index.html, or the hallway tabs.
A game's back button returns to sports.html. See CLAIMS.md for the
full rule and the claims board every worker must check before building.

Plain static files. Saves stay on the player's device.

## Store-ready rule

Every game in this repo is built to ship as an Apple App Store /
Google Play app for iPhone and Android: phone performance first,
landscape, touch-first, fully bundled and offline. The checklist lives
in STORE-READY.md — a game that breaks it is not done.
