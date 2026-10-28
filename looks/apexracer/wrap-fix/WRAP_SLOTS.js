const WRAP_SLOTS = { none: () => {} };
for (const k of ['name','stripes','flames','shards','bolt','checker','race','apex','camo','split','neon']) WRAP_SLOTS[k] = () => applyRealCarWrap(model, bodyMat, cfg);
const wrapSlot = WRAP_SLOTS[cfg.wrap] || (() => {});
wrapSlot(); /* ONE wrap path: paint the wrap on the car's own bodyMat. addPanelWrap / addNameWrap / addStripeWrap are no longer called. */
