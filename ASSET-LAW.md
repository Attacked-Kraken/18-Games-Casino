# THE LAW OF CREATION — assets (owner's law, 2026-10-14)

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
