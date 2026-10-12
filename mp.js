/* mp1 2026-10-11 (owner: "multiplayer with room codes, 6 players per table"): shared room-code multiplayer for 18 Games Casino.
   No server of our own: WebRTC through PeerJS (vendor/peerjs.min.js, local copy) with the free PeerJS cloud broker for signaling
   only; game data flows phone-to-phone. One player is HOST and is authoritative (runs the game, sends state); others are clients.
   Peer ids come from the room code: host = gc18-<game>-<code>-host, clients = gc18-<game>-<code>-<random>.

   Load:  <script src="vendor/peerjs.min.js"></script><script src="mp.js"></script>
   const room = await MP.create({ game: 'v21', name: 'Joe', max: 6 })     // host; room.code is the 5-letter code
   const room = await MP.join('ABCDE', { game: 'v21', name: 'Ann' })      // client; rejects with a friendly message on failure
   room.isHost, room.me (my key), room.players [{ key, name, on }], room.state (last host state)
   room.on('players'|'state'|'msg'|'chat'|'host'|'status'|'closed', fn)
     msg: fn(type, data, fromKey)  (host only: messages sent by clients and by itself with room.send)
     host: fn() fired when THIS device becomes host after the old host left (host migration); room.state still holds the last state
   room.send(type, data)  -> delivered to the host's 'msg' handler (the host delivers to itself)
   room.setState(obj)     -> host only: stored and pushed to everyone
   room.chat(text)        -> short emoji / quick chat to everyone (max 60 chars)
   room.leave()
   Presence: players carry on:true/false; a dropped client has ~25 s to reconnect into the same seat (same key, kept in
   sessionStorage). If the host drops, the earliest remaining player takes over the host id; if nobody can, the room closes. */
(function () {
  const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const mkCode = () => Array.from({ length: 5 }, () => ABC[Math.floor(Math.random() * ABC.length)]).join('');
  const rid = () => Math.random().toString(36).slice(2, 10);
  const pid = (g, c, s) => ('gc18-' + g + '-' + c + '-' + s).toLowerCase();
  const OPTS = { debug: 0, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] } };
  const clean = (s, n) => String(s == null ? '' : s).replace(/[<>]/g, '').slice(0, n);
  function keyFor(game, code) { const k = 'mp_key_' + game + '_' + code; try { let v = sessionStorage.getItem(k); if (!v) { v = rid(); sessionStorage.setItem(k, v); } return v; } catch (e) { return rid(); } }
  function openPeer(id) { return new Promise((res, rej) => { if (!window.Peer) return rej(new Error('Multiplayer files did not load.'));
    const p = id ? new Peer(id, OPTS) : new Peer(OPTS); let done = false;
    const t = setTimeout(() => { if (!done) { done = true; try { p.destroy(); } catch (e) {} rej(new Error('timeout')); } }, 12000);
    p.on('open', () => { if (done) return; done = true; clearTimeout(t); res(p); });
    p.on('error', (e) => { if (done) return; done = true; clearTimeout(t); try { p.destroy(); } catch (er) {} rej(e); }); }); }
  const FRIENDLY = (e) => { const t = e && e.type; if (t === 'peer-unavailable') return 'No table found with that code. Check the code and try again.';
    if (t === 'unavailable-id') return 'That table code is busy. Try again.'; if (t === 'browser-incompatible') return 'This browser can’t do live tables.';
    return 'Couldn’t connect to the table. Some Wi-Fi or mobile networks block live play; try another network, or play solo.'; };

  class Room {
    constructor(game, code, name, max) { this.game = game; this.code = code; this.name = clean(name, 16) || 'Player'; this.max = max || 6; this.me = keyFor(game, code);
      this.players = []; this.state = null; this.isHost = false; this.h = {}; this.conns = new Map(); this.peer = null; this.hostConn = null; this.closed = false; this.order = 0;
      /* heartbeat: WebRTC 'close' can take a long time to fire when a phone just vanishes, so both sides ping every 3 s */
      this.hb = setInterval(() => this.beat(), 3000); }
    beat() { if (this.closed) { clearInterval(this.hb); return; } const now = Date.now();
      if (this.isHost) { this.bcast({ t: 'ping' }); this.conns.forEach(c => { if (now - (c._seen || now) > 10000) this.dropConn(c); }); }
      else if (this.hostConn && !this._lost) { try { this.hostConn.send({ t: 'ping' }); } catch (e) {} if (now - (this.hostSeen || now) > 10000) { const c = this.hostConn; this.hostConn = null; try { c.close(); } catch (e) {} this.lostHost(); } } }
    dropConn(c) { try { c.close(); } catch (e) {} if (c._key && this.conns.get(c._key) === c) { this.conns.delete(c._key); const p = this.players.find(x => x.key === c._key); if (p) { p.on = false; this.pushPlayers(); this.graceDrop(p.key); } } }
    on(t, f) { (this.h[t] = this.h[t] || []).push(f); return this; }
    emit(t, ...a) { (this.h[t] || []).forEach(f => { try { f(...a); } catch (e) { console.warn(e); } }); }
    status(s) { this.emit('status', s); }
    /* ---------------- host side ---------------- */
    async becomeHost(fresh) {
      let last; for (let i = 0; i < (fresh ? 1 : 8); i++) { try { this.peer = await openPeer(pid(this.game, this.code, 'host')); break; } catch (e) { last = e; if (fresh) throw e; await new Promise(r => setTimeout(r, 1500)); } }
      if (!this.peer) throw last || new Error('host');
      this.isHost = true; this.hostConn = null; this.order = this.players.reduce((m, p) => Math.max(m, (p.n || 0) + 1), this.order);
      if (!this.players.find(p => p.key === this.me)) this.players.push({ key: this.me, name: this.name, on: true, n: this.order++ });
      this.players.forEach(p => { if (p.key !== this.me) { p.on = false; this.graceDrop(p.key); } else p.on = true; });
      this.peer.on('connection', c => this.accept(c));
      this.peer.on('disconnected', () => { if (!this.closed) try { this.peer.reconnect(); } catch (e) {} });
      this.pushPlayers();
    }
    accept(c) {
      c._seen = Date.now();
      c.on('data', d => { if (!d || typeof d !== 'object') return; c._seen = Date.now(); if (d.t === 'ping') return;
        if (d.t === 'hello') { const key = clean(d.key, 20); let p = this.players.find(x => x.key === key);
          if (!p) { if (this.players.filter(x => x.on).length >= this.max) { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); return; }
            p = { key, name: clean(d.name, 16) || 'Player', on: true, n: this.order++ }; this.players.push(p); }
          p.on = true; c._key = key; const old = this.conns.get(key); if (old && old !== c) try { old.close(); } catch (e) {} this.conns.set(key, c);
          c.send({ t: 'welcome', players: this.players, state: this.state, code: this.code }); this.pushPlayers(); return; }
        if (!c._key) return;
        if (d.t === 'msg') this.emit('msg', clean(d.type, 20), d.data, c._key);
        else if (d.t === 'chat') this.relayChat(c._key, d.text); });
      c.on('close', () => this.dropConn(c));
    }
    graceDrop(key) { setTimeout(() => { const p = this.players.find(x => x.key === key); if (p && !p.on && this.isHost) { this.players = this.players.filter(x => x.key !== key); this.pushPlayers(); } }, 25000); }
    bcast(o) { this.conns.forEach(c => { try { if (c.open) c.send(o); } catch (e) {} }); }
    pushPlayers() { this.bcast({ t: 'players', players: this.players }); this.emit('players', this.players); }
    setState(s) { if (!this.isHost) return; this.state = s; this.bcast({ t: 'state', state: s }); this.emit('state', s); }
    relayChat(key, text) { const p = this.players.find(x => x.key === key); const m = { t: 'chat', from: key, name: p ? p.name : '?', text: clean(text, 60) }; this.bcast(m); this.emit('chat', m); }
    /* ---------------- client side ---------------- */
    async connectHost(tries) {
      if (!this.peer || this.peer.destroyed) this.peer = await openPeer(pid(this.game, this.code, rid()));
      return new Promise((res, rej) => { const c = this.peer.connect(pid(this.game, this.code, 'host'), { reliable: true }); let ok = false;
        const t = setTimeout(() => { if (!ok) { try { c.close(); } catch (e) {} rej({ type: 'timeout' }); } }, 10000);
        const onErr = (e) => { if (!ok && e && e.type === 'peer-unavailable') { clearTimeout(t); rej(e); } }; this.peer.on('error', onErr);
        c.on('open', () => c.send({ t: 'hello', key: this.me, name: this.name }));
        c.on('data', d => { if (!d) return; if (c === this.hostConn || !this.hostConn) this.hostSeen = Date.now(); if (d.t === 'ping') return;
          if (d.t === 'full') { clearTimeout(t); rej({ type: 'full' }); return; }
          if (d.t === 'welcome') { ok = true; clearTimeout(t); this.peer.off('error', onErr); this.hostConn = c; this.hostSeen = Date.now(); this.players = d.players; this.state = d.state; this.emit('players', this.players); if (d.state) this.emit('state', d.state); this.status('online'); res(); }
          else if (d.t === 'players') { this.players = d.players; this.emit('players', d.players); }
          else if (d.t === 'state') { this.state = d.state; this.emit('state', d.state); }
          else if (d.t === 'chat') this.emit('chat', d); });
        c.on('close', () => { if (ok && !this.closed && !this.isHost && c === this.hostConn) { this.hostConn = null; this.lostHost(); } }); });
    }
    async lostHost() {
      if (this._lost) return; this._lost = true; this.status('reconnecting');
      /* first try the same host (it may just be reconnecting), then migrate: earliest remaining player hosts */
      const others = this.players.filter(p => p.on);
      const oldHost = this.players.slice().sort((a, b) => a.n - b.n)[0];
      const heirs = this.players.filter(p => p !== oldHost && p.on !== false).sort((a, b) => a.n - b.n);
      const heir = heirs[0];
      const deadline = Date.now() + 30000;
      while (!this.closed && Date.now() < deadline) {
        if (heir && heir.key === this.me && Date.now() > deadline - 26000) {
          try { this.players = this.players.filter(p => p !== oldHost); try { this.peer.destroy(); } catch (e) {} this.peer = null;
            await this.becomeHost(false); this._lost = false; this.status('host'); this.emit('host'); return; } catch (e) {} }
        try { await this.connectHost(); this._lost = false; return; } catch (e) { await new Promise(r => setTimeout(r, 2000)); }
      }
      if (!this.closed) { this.closed = true; this.status('closed'); this.emit('closed', 'The table closed: the host left and nobody could take over.'); }
      void others;
    }
    /* ---------------- both ---------------- */
    send(type, data) { if (this.isHost) this.emit('msg', type, data, this.me); else if (this.hostConn && this.hostConn.open) this.hostConn.send({ t: 'msg', type, data }); }
    chat(text) { if (this.isHost) this.relayChat(this.me, text); else if (this.hostConn && this.hostConn.open) this.hostConn.send({ t: 'chat', text: clean(text, 60) }); }
    leave() { this.closed = true; clearInterval(this.hb); try { this.peer && this.peer.destroy(); } catch (e) {} this.emit('closed', ''); }
    shareLink() { const u = new URL(location.href); u.search = '?room=' + this.code; u.hash = ''; return u.toString(); }
  }
  async function create(o) { o = o || {}; let last;
    for (let i = 0; i < 4; i++) { const r = new Room(o.game || 'g', mkCode(), o.name, o.max); try { await r.becomeHost(true); r.status('host'); return r; } catch (e) { last = e; if (!(e && e.type === 'unavailable-id')) break; } }
    const err = new Error(FRIENDLY(last)); err.cause = last; throw err; }
  async function join(code, o) { o = o || {}; code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) throw new Error('Enter the table code.');
    const r = new Room(o.game || 'g', code, o.name, o.max);
    try { await r.connectHost(); return r; } catch (e) { try { r.peer && r.peer.destroy(); } catch (er) {} const err = new Error(e && e.type === 'full' ? 'That table is full.' : FRIENDLY(e)); err.cause = e; throw err; } }
  function codeFromUrl() { const m = location.search.match(/[?&]room=([A-Za-z0-9]{4,8})/); return m ? m[1].toUpperCase() : ''; }
  async function share(room, title) { const url = room.shareLink(), text = (title || 'Join my table') + ' · code ' + room.code;
    try { if (navigator.share) { await navigator.share({ title: title || '18 Games Casino', text, url }); return 'shared'; } } catch (e) { if (e && e.name === 'AbortError') return ''; }
    try { await navigator.clipboard.writeText(url); return 'copied'; } catch (e) { return ''; } }
  window.MP = { create, join, codeFromUrl, share, available: () => !!window.Peer };
})();
