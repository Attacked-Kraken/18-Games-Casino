# THE LAW OF CREATION — assets (owner's law, 2026-10-14; CC-BY added 2026-10-16 — see Part III)

Every model, texture and asset used in these games comes from the
owner's approved list of FREE sources below. This is the law for every
worker on this repo, for every game, no exceptions. If it is not on
this list, do not use it.

## Approved sources (all free, CC0)

- **Quaternius** — our core library: characters, rigs, animations,
  props. (Already in this repo under `characters/`; full packs live in
  the team's asset warehouse, Attacked-Kraken/3D-Assests-for-Arcade.)
- **Kenney** (kenney.nl) — thousands of 3D and 2D game assets, plus UI
  and sounds. All CC0.
- **Poly Pizza** (poly.pizza) — thousands of low-poly models, many
  CC0, including Quaternius'. Take the CC0 ones.
- **Poly Haven** (polyhaven.com) — realistic textures, HDRI skies and
  3D models. All CC0.
- **ambientCG** (ambientcg.com) — CC0 materials and textures.
- **KayKit by Kay Lousberg** — character and themed packs. The FREE
  packs are CC0; take only those, never the paid ones.
- **OpenGameArt** (opengameart.org) — a big mixed library. ONLY the
  items marked CC0; anything needing credit or carrying other terms
  is out.

CC0 means the asset is free to use even inside a paid app. That is the
whole point of the list.

## No copyrights

**No copyrighted material goes into these games. Ever.** Every asset
must be copyright-free — CC0 / public domain, where the creator has
given up the copyright entirely. If an asset carries a copyright (a ©
notice, "all rights reserved", an attribution-required license, a
"free download" that keeps the creator's rights), it does not go in,
whatever it looks like. When in doubt, leave it out and pick the CC0
equivalent from the approved list.

## NOT approved

- **Sketchfab, Mixamo, TurboSquid** — skipped. License terms vary per
  model there and some forbid use inside a paid app. Do not pull from
  them, even when a single model looks "free".
- Anything ripped, leaked, scraped or paid. Anything whose license you
  have not actually read.

## The style law — realistic, and true to the game

- **Realistic style models** are the standard: real proportions, real
  materials, real textures (see also the ASSETS RULE in CLAIMS.md).
- **Models and clothing must match the game and the style of play it
  mimics.** A hockey player wears hockey gear — helmet, pads, skates,
  team kit. A basketball player wears a basketball kit. A race driver
  wears a race suit and drives a proper race car. Environments dress
  the same way: an arena looks like the real arena for that sport.
  Generic outfits on athletes are a defect, not a style choice.
- If the approved libraries have the right realistic asset, use it
  instead of building placeholder geometry.

## Working rules

- Pull shared models from the warehouse repo
  (Attacked-Kraken/3D-Assests-for-Arcade) when they are already there;
  add new downloads there first so the whole team reuses them.
- Credit sources in the repo (CREDITS.txt / the asset folder README)
  even though CC0 does not require it — we keep the paper trail.
- Optimize for the store-ready budget (STORE-READY.md): GLB format,
  sane poly counts, textures <= 2048px, animations included when the
  asset has to move. Best-looking AND fast.
- When you use an asset, name it in your PR: what it is, which
  approved source, what license.

---

# Part II — the music & sound law (owner, 2026-10-14)

**Every game must have home-page music, in-game music, and game
sounds.** A silent game is an unfinished game.

- **Home page / menu music** — every game's menu (its home page)
  plays its own music track: calm, welcoming, looped.
- **In-game music** — a second, distinct track drives the gameplay:
  more energy, matched to the game's pace.
- **Game sounds** — real sound effects for the game's core actions
  and events (hits, scores, whistles, engines, UI taps — whatever the
  game is about). No silent actions.
- **Original audio only** — music and sounds are made for the game
  (procedural WebAudio composition is the house method: no audio
  files, zero download weight, and it can never be anybody's
  copyright — Part I's no-copyrights law covers sound too). No ripped
  tracks, no copyrighted music, no stock audio off the approved list.
- **Player control** — a working mute toggle on every game, and the
  choice persists between visits. Audio starts on the player's first
  interaction (mobile autoplay rules) — never blast sound uninvited.
- Music and sound are part of "done": a game does not get stamped
  DONE without all three (menu music, game music, sounds) working.

---

# Part III — real 3D models with credit (CC-BY) (owner, 2026-10-16)

The owner now allows **CC-BY** models as well as CC0, so the games can use real-looking 3D models (bikes, cars, gear,
stadium props) instead of shapes built in code. This **replaces** the "no attribution-required license" line in Part I
for 3D models and textures only. Everything else in Part I and II still stands (no brands, music stays original).

**Allowed licenses — nothing else:** CC0 · CC-BY 3.0 · CC-BY 4.0.
**Never:** NC (non-commercial — we sell these games), ND (no changes), SA (share-alike), "personal use only",
"editorial", Standard/Royalty-free shop licenses, or any model whose license you have not read on its own page.

**Allowed places to get CC-BY models:** Poly Pizza (poly.pizza — filter by license), and Sketchfab ONLY for models whose
page shows the "CC Attribution" license AND a Download button from the maker. Everything in Part I stays approved.

**The 6 rules for every CC-BY model (the robot checks 1–3):**
1. **Ledger first.** Add it to `ASSETS.md` before (or in the same PR as) the file: title, maker, exact source page,
   license, date, who downloaded it, which game, and what you changed.
2. **Credit in the game.** Every game that uses a CC-BY model has a **Credits** screen (reachable from its menu) that
   lists each one: *"Title" by Maker, CC-BY 4.0, source link, changes made.* The robot fails the game if a CC-BY
   maker's name is missing from the game's files.
3. **Allowed license only** (list above). The robot fails anything else.
4. **Trusted makers only.** Pick makers with many uploads and their own style. Skip anything that looks ripped from
   another game, says "ripped / from <game name> / fan art", or that only one upload exists for. Keep the source link —
   it is our proof of where it came from.
5. **No brands, ever.** No model that copies a real product (a Ducati, a Nike shoe, a real team's kit), no logos.
   A license from an uploader cannot give us a brand's permission. Generic designs only.
6. **Lessons.** If the owner rejects a model, add the reason to LESSONS.md like every other 👎.

Why this is safe: CC-BY is free for paid apps, has no fees or royalties, the maker is not involved, and the license
cannot be taken back. All it asks is credit — which rules 1–2 make automatic.
