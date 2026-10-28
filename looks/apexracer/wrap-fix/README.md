# Racer wrap fix (VP, Oct 28 2026) - paste EXACTLY, change nothing else
1. Insert applyRealCarWrap.js as a new top-level function right after wrapMats().
2. Replace the two lines `const WRAP_SLOTS = {...};` and `const wrapSlot = ...;` (just above `if (wrapSlot) wrapSlot();` in the car builder) with WRAP_SLOTS.js (drop the old `if (wrapSlot) wrapSlot();` line - the new text already calls it).
3. Do NOT edit wrapTex, WRAPS, wrapMats, the mock-up, rims, tyres, suspension or prices. Leave addPanelWrap/addNameWrap/addStripeWrap defined (uncalled).
PR title: "BUILD: Racer wrap on bodyMat PART: wraps". Proof: pictures of all 12 wraps (side, front, top); mesh count and bounding box equal No wrap.
