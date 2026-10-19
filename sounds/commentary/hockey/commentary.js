// Hockey commentary helper. Usage:
//   const c = new Commentary(); await c.load('manifest.json');
//   c.say('goal'); c.dialogue(); c.dialogue('d03'); c.setVolume(0.8); c.mute(true)
class Commentary {
  constructor(opts = {}) {
    this.base = opts.base || '';           // folder containing manifest.json
    this.cooldown = opts.cooldown ?? 600;  // ms gap after a line finishes
    this.volume = opts.volume ?? 1; this.muted = false;
    this.useOgg = opts.ogg ?? false;
    this.busy = false; this.lastEnd = 0; this.bag = {}; this.cur = null; this.queue = [];
  }
  async load(url = 'manifest.json') {
    const m = await (await fetch(this.base + url)).json();
    this.byEvent = {}; this.dialogues = {};
    for (const c of m.clips) {
      if (c.dialogue_id) (this.dialogues[c.dialogue_id] ||= []).push(c);
      else (this.byEvent[c.event] ||= []).push(c);
    }
    for (const d of Object.values(this.dialogues)) d.sort((a, b) => a.order - b.order);
    return this;
  }
  events() { return Object.keys(this.byEvent); }
  _pick(key, list) { // shuffle bag: no repeats until all used, never same line twice in a row
    let b = this.bag[key];
    if (!b || !b.length) {
      b = list.slice().sort(() => Math.random() - 0.5);
      if (this.bag['last_' + key] && b.length > 1 && b[b.length - 1] === this.bag['last_' + key]) b.unshift(b.pop());
      this.bag[key] = b;
    }
    const c = b.pop(); this.bag['last_' + key] = c; return c;
  }
  _ready() { return !this.busy && performance.now() - this.lastEnd >= this.cooldown; }
  _play(clips) {
    if (this.muted || !clips.length) return false;
    this.busy = true;
    const next = (i) => {
      if (i >= clips.length) { this.busy = false; this.lastEnd = performance.now(); return; }
      const c = clips[i], f = this.useOgg ? c.file_ogg : c.file;
      const a = new Audio(this.base + f); a.volume = this.volume; this.cur = a;
      const done = () => setTimeout(() => next(i + 1), i + 1 < clips.length ? 250 : 0);
      a.onended = done; a.onerror = done;
      a.play().catch(done);
    };
    next(0); return true;
  }
  // priority:true interrupts the current line (use for goals)
  say(event, { priority = false } = {}) {
    const list = this.byEvent[event]; if (!list) return false;
    if (priority) this.stop(); else if (!this._ready()) return false;
    return this._play([this._pick(event, list)]);
  }
  dialogue(id, { priority = false } = {}) {
    const ids = Object.keys(this.dialogues); if (!ids.length) return false;
    if (priority) this.stop(); else if (!this._ready()) return false;
    const d = this.dialogues[id] || this.dialogues[this._pick('__dlg', ids)];
    return this._play(d);
  }
  stop() { if (this.cur) { this.cur.pause(); this.cur.onended = null; } this.busy = false; }
  setVolume(v) { this.volume = v; if (this.cur) this.cur.volume = v; }
  mute(m = true) { this.muted = m; if (m) this.stop(); }
}
if (typeof module !== 'undefined') module.exports = Commentary; else window.Commentary = Commentary;
